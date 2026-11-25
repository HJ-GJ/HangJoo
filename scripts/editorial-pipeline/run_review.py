#!/usr/bin/env python3
"""
HangJoo's Lab — Editorial Pipeline Runner (v1.2 Hardened after Codex Cross-Review)
Standalone Python 3 (stdlib-only) orchestrator for:
  - Drive 01_INBOX_Drafts inspection & read-back SHA-256 verification
  - Gate 1: Deduplication (title + raw/body SHA-256 against published, drafts, and prior run logs),
            frontmatter schema, secret/private-link leak scan (blocks external AI/Drive transmission on hit)
  - Gate 2: 4-stage editorial structure & visual asset check
  - Gate 3: Sandboxed Python code-block execution via hardened Docker container
            (--network=none --read-only --cap-drop=ALL --shm-size=1m --user 65534:65534, clean env,
             named container with guaranteed cleanup on timeout); NEVER falls back to host execution.
  - Gate 4: Gemini(Jena) independent review ingestion with strict structured verdict parsing
  - Gate 5: OpenAI Codex (gpt-6.2-sol, read-only) independent technical review (strict JSON schema required)
  - Gate 6: Astro build + check:output + Playwright visual QA (ALL required for PASS; partial run => NOT RUN)
  - Fail-closed gate aggregation: requires all 6 mandatory gate keys; 0 FAIL & 0 NOT RUN for READY_FOR_FOUNDER_APPROVAL
  - Append-only report & full structured evidence log preservation (no Job ID overwrite; log written before upload)
"""

import argparse
import datetime
import glob
import hashlib
import json
import os
import re
import subprocess
import sys
import uuid
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DRIVE_FOLDERS = {
    "01_INBOX_Drafts": "17wx0TaVSjfAkdMiSM9CJGuygGR6S5RzU",
    "02_SOURCE_Evidence": "1Yf77OpJhoZLqRgX7Ciiv81mxgcMB_pD7",
    "03_REVIEW_Jena_Codex": "1JCx-pDASPRjrA7RwJSllCop04Ztu9fkd",
    "04_FOUNDER_Approval": "1KIbNMclESF_0mrttpQdWphR0VcTHHqrg",
    "05_APPROVED_Archive": "1wMtLS_eImtb8IhHQRhSbw3Y39ySMXCoR",
}
CODEX_WRAPPER = Path("/home/antigravity/.gemini/codex/run-codex.sh")
SANDBOX_IMAGE = os.environ.get("HANGJOO_PYTHON_SANDBOX_IMAGE", "python:3.12-alpine")
VALID_VERDICTS = {"PASS", "WARN", "FAIL"}
REQUIRED_GATE_KEYS = {
    "gate1_dedup_safety",
    "gate2_structure_assets",
    "gate3_python_exec",
    "gate4_gemini_content",
    "gate5_codex_tech",
    "gate6_astro_visual",
}
MAX_CAPTURE_CHARS = 65536

FORBIDDEN_TITLE_PHRASES = ["완벽 정복", "초보자 가이드", "이해하기"]
SECRET_PATTERNS = [
    (r"sk-[A-Za-z0-9]{20,}", "Possible OpenAI API key"),
    (r"ghp_[A-Za-z0-9]{20,}", "Possible GitHub PAT"),
    (r"AIza[0-9A-Za-z\-_]{30,}", "Possible Google API key"),
    (r"https://drive\.google\.com/(?:drive/folders|file/d)/", "Private Google Drive URL"),
    (r"https://docs\.google\.com/document/d/", "Private Google Docs URL"),
]


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def clean_docker_env():
    """Minimal environment for Docker CLI to prevent proxy/token leakage."""
    return {"PATH": os.environ.get("PATH", "/usr/local/bin:/usr/bin:/bin")}


def atomic_write_json(path: Path, data):
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(tmp, path)


def run_cmd(cmd, stdin_text=None, timeout=90, cwd=None, env=None):
    started = utc_now()
    try:
        res = subprocess.run(
            cmd,
            input=stdin_text,
            text=True,
            capture_output=True,
            timeout=timeout,
            cwd=cwd,
            env=env,
        )
        return {
            "command": cmd,
            "exit_code": res.returncode,
            "stdout": res.stdout[:MAX_CAPTURE_CHARS],
            "stderr": res.stderr[:MAX_CAPTURE_CHARS],
            "stdout_truncated": len(res.stdout) > MAX_CAPTURE_CHARS,
            "stderr_truncated": len(res.stderr) > MAX_CAPTURE_CHARS,
            "started_utc": started,
            "finished_utc": utc_now(),
        }
    except FileNotFoundError:
        return {
            "command": cmd,
            "exit_code": 127,
            "stdout": "",
            "stderr": f"Command not found: {cmd[0]}",
            "stdout_truncated": False,
            "stderr_truncated": False,
            "started_utc": started,
            "finished_utc": utc_now(),
        }
    except subprocess.TimeoutExpired:
        return {
            "command": cmd,
            "exit_code": 124,
            "stdout": "",
            "stderr": f"Timed out after {timeout}s",
            "stdout_truncated": False,
            "stderr_truncated": False,
            "started_utc": started,
            "finished_utc": utc_now(),
        }


def parse_frontmatter(text):
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        return {}, text
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip().strip('"').strip("'")
    return meta, text[m.end():]


def normalize_title(t):
    t = re.sub(r"^(\[Python\]|파이썬 기초 공부:)\s*", "", t or "").strip()
    return re.sub(r"\s+", " ", t).lower()


def compute_hashes(text):
    _, body = parse_frontmatter(text)
    raw_sha = hashlib.sha256(text.encode("utf-8")).hexdigest()
    norm_body = "\n".join(line.rstrip() for line in body.strip().splitlines())
    body_sha = hashlib.sha256(norm_body.encode("utf-8")).hexdigest()
    return raw_sha, body_sha


def _extract_json_objects(text):
    """Extract all valid JSON dict objects from text (fenced or raw)."""
    objs = []
    decoder = json.JSONDecoder()
    idx = 0
    n = len(text)
    while idx < n:
        pos = text.find("{", idx)
        if pos == -1:
            break
        try:
            obj, end = decoder.raw_decode(text, pos)
            if isinstance(obj, dict) and "verdict" in obj:
                objs.append(obj)
            idx = end
        except json.JSONDecodeError:
            idx = pos + 1
    return objs


def parse_structured_review(raw_text, require_json=False):
    """
    Strictly parse Gemini/Codex review output into PASS | WARN | FAIL.
    Fail-closed:
      - Empty response -> FAIL
      - Multiple conflicting JSON verdicts -> FAIL
      - Missing required fields when require_json=True -> FAIL
      - PASS or WARN with non-empty p0 list -> FAIL (P0_INCONSISTENCY)
      - Ambiguous/unstructured prose -> FAIL
    """
    if not raw_text or not raw_text.strip():
        return {
            "status": "FAIL",
            "reason": "EMPTY_RESPONSE",
            "p0": ["Reviewer returned an empty response."],
            "p1": [],
            "p2": [],
            "summary": "빈 검수 응답 — fail-closed 정책에 따라 FAIL 처리",
        }

    text = raw_text.strip()
    objs = _extract_json_objects(text)

    if objs:
        parsed_verdicts = []
        last_valid = None
        for obj in objs:
            if require_json and not {"verdict", "p0", "p1", "p2", "summary"}.issubset(obj.keys()):
                return {
                    "status": "FAIL",
                    "reason": "MISSING_REQUIRED_JSON_FIELDS",
                    "p0": ["Structured JSON missing required keys (verdict, p0, p1, p2, summary)."],
                    "p1": [],
                    "p2": [],
                    "summary": "필수 JSON 필드 누락 — FAIL 처리",
                }
            verdict = obj.get("verdict")
            if not isinstance(verdict, str) or verdict.upper() not in VALID_VERDICTS:
                return {
                    "status": "FAIL",
                    "reason": "INVALID_VERDICT_VALUE",
                    "p0": [f"Invalid structured verdict value: {verdict!r}"],
                    "p1": [],
                    "p2": [],
                    "summary": f"유효하지 않은 구조화 판정값({verdict!r}) — FAIL 처리",
                }
            verdict = verdict.upper()
            p0 = obj.get("p0", [])
            p1 = obj.get("p1", [])
            p2 = obj.get("p2", [])
            if not isinstance(p0, list) or not isinstance(p1, list) or not isinstance(p2, list):
                return {
                    "status": "FAIL",
                    "reason": "INVALID_FINDINGS_SCHEMA",
                    "p0": ["Structured review fields p0/p1/p2 must be lists."],
                    "p1": [],
                    "p2": [],
                    "summary": "구조화 결과 스키마 오류(p0/p1/p2 배열 아님) — FAIL 처리",
                }
            if verdict in {"PASS", "WARN"} and len(p0) > 0:
                return {
                    "status": "FAIL",
                    "reason": "P0_INCONSISTENCY",
                    "p0": [str(x) for x in p0],
                    "p1": [str(x) for x in p1],
                    "p2": [str(x) for x in p2],
                    "summary": f"verdict={verdict}이지만 P0 오류가 존재함 — fail-closed 정책에 따라 FAIL 처리",
                }
            parsed_verdicts.append(verdict)
            last_valid = (verdict, p0, p1, p2, obj.get("summary", ""))

        if len(set(parsed_verdicts)) > 1:
            return {
                "status": "FAIL",
                "reason": "CONFLICTING_VERDICTS",
                "p0": [f"Conflicting structured verdicts found: {parsed_verdicts}"],
                "p1": [],
                "p2": [],
                "summary": f"상충하는 복수 JSON 판정({parsed_verdicts}) — FAIL 처리",
            }

        verdict, p0, p1, p2, summary = last_valid
        return {
            "status": verdict,
            "reason": "STRUCTURED_JSON_OK",
            "p0": [str(x) for x in p0],
            "p1": [str(x) for x in p1],
            "p2": [str(x) for x in p2],
            "summary": str(summary).strip() or f"Structured verdict: {verdict}",
        }

    if not require_json:
        matches = re.findall(r"(?m)^\s*VERDICT\s*:\s*(PASS|WARN|FAIL)\s*$", text)
        if len(matches) == 1:
            verdict = matches[0]
            return {
                "status": verdict,
                "reason": "EXPLICIT_HEADER_OK",
                "p0": [],
                "p1": [],
                "p2": [],
                "summary": f"Explicit VERDICT header: {verdict}",
            }

    return {
        "status": "FAIL",
        "reason": "AMBIGUOUS_OR_UNSTRUCTURED_RESPONSE",
        "p0": ["Reviewer output lacked a single unambiguous valid structured verdict."],
        "p1": [],
        "p2": [],
        "summary": "모호하거나 비구조화된 검수 응답 — fail-closed 정책에 따라 FAIL 처리",
    }


def gate1_dedup_and_safety(draft_text, meta, source_path, state_dir=None, check_drive=True):
    findings_p0 = []
    findings_p1 = []
    secret_findings = []
    raw_sha, body_sha = compute_hashes(draft_text)

    for req in ["title", "date", "category", "section"]:
        if not meta.get(req):
            findings_p1.append(f"Frontmatter 필수 항목 누락: `{req}`")

    if meta.get("readTime", "").strip():
        findings_p1.append(
            f"AGENTS.md 19번 위반: 숫자 읽기 시간(`readTime: {meta['readTime']}`)은 비워 두어야 합니다."
        )

    title = meta.get("title", "")
    for phrase in FORBIDDEN_TITLE_PHRASES:
        if phrase in title:
            findings_p1.append(f"제목 비권장 표현 포함 (`AGENTS.md` 3번): `{phrase}` in `{title}`")

    for pat, label in SECRET_PATTERNS:
        if re.search(pat, draft_text):
            msg = f"보안/비공개 경계 위반 의심: {label}"
            secret_findings.append(msg)
            findings_p0.append(msg)

    norm_target = normalize_title(title)
    src_real = os.path.realpath(source_path) if source_path else ""
    checked_files = 0
    title_dups = []
    hash_dups = []

    scan_paths = sorted(
        set(
            glob.glob(str(REPO_ROOT / "astro-preview/editorial/series/*.md"))
            + glob.glob(str(REPO_ROOT / "astro-preview/editorial/*.md"))
            + glob.glob(str(REPO_ROOT / "content/posts/*.md"))
            + glob.glob(str(REPO_ROOT / "content/drafts/*.md"))
        )
    )
    for p in scan_paths:
        if src_real and os.path.realpath(p) == src_real:
            continue
        checked_files += 1
        other_text = Path(p).read_text(encoding="utf-8")
        other_meta, _ = parse_frontmatter(other_text)
        other_title = other_meta.get("title", "")
        other_raw_sha, other_body_sha = compute_hashes(other_text)
        if norm_target and normalize_title(other_title) == norm_target:
            title_dups.append(f"{os.path.basename(p)} ({other_title})")
        if other_raw_sha == raw_sha or other_body_sha == body_sha:
            hash_dups.append(f"{os.path.basename(p)} (sha match)")

    checked_logs = 0
    corrupt_logs = []
    if state_dir and Path(state_dir).exists():
        for log_file in sorted(Path(state_dir).glob("*/*_run_log.json")):
            try:
                prev = json.loads(log_file.read_text(encoding="utf-8"))
            except Exception as exc:
                corrupt_logs.append(f"{log_file.name}: {exc}")
                continue
            if not isinstance(prev, dict):
                corrupt_logs.append(f"{log_file.name}: non-object JSON")
                continue
            checked_logs += 1
            if prev.get("sha256") == raw_sha or prev.get("body_sha256") == body_sha:
                hash_dups.append(f"run_log:{prev.get('job_id', log_file.name)}")
            prev_title = prev.get("title", "")
            if norm_target and prev_title and normalize_title(prev_title) == norm_target:
                title_dups.append(f"run_log:{prev.get('job_id', log_file.name)} ({prev_title})")

    if corrupt_logs:
        findings_p1.append(f"손상된 이전 실행 로그 {len(corrupt_logs)}건 감지: {', '.join(corrupt_logs[:3])}")
    if title_dups:
        findings_p0.append(f"기존 원고/이력과 제목 중복: {', '.join(title_dups)}")
    if hash_dups:
        findings_p0.append(f"기존 원고/이력과 해시(SHA-256) 중복: {', '.join(hash_dups)}")

    drive_archive_checked = False
    if check_drive:
        res = run_cmd(["gdrive", "readonly", "ls", DRIVE_FOLDERS["05_APPROVED_Archive"], "--json"], timeout=15)
        drive_archive_checked = res["exit_code"] == 0
        if not drive_archive_checked:
            findings_p1.append(f"Drive 05_APPROVED_Archive 조회 실패 (rc={res['exit_code']})")
        elif norm_target:
            try:
                items = json.loads(res["stdout"]) if res["stdout"].strip() else []
                names = [str(it.get("name", "")).lower() for it in items if isinstance(it, dict)]
                if any(norm_target in nm for nm in names):
                    findings_p0.append("Drive 05_APPROVED_Archive 파일명과 제목 중복 의심")
            except json.JSONDecodeError:
                findings_p1.append("Drive 05_APPROVED_Archive JSON 파싱 실패")

    status = "FAIL" if findings_p0 else ("WARN" if findings_p1 else "PASS")
    return {
        "status": status,
        "secret_detected": len(secret_findings) > 0,
        "checked_local_files": checked_files,
        "checked_run_logs": checked_logs,
        "drive_archive_checked": drive_archive_checked,
        "raw_sha256": raw_sha,
        "body_sha256": body_sha,
        "p0": findings_p0,
        "p1": findings_p1,
    }


def gate2_structure_and_assets(body):
    h2s = re.findall(r"^##\s+(.+)$", body, re.M)
    stages = ["개념", "실습", "확인", "정리"]
    found_stages = [s for s in stages if any(s in h for h in h2s)]

    notes = []
    if not h2s:
        notes.append("H2(`##`) 장 제목이 없습니다.")
    if not re.search(r"(복습|확인할|풀어 볼|질문)", body):
        notes.append("독자 자가 점검용 복습 질문 섹션이 확인되지 않습니다.")

    missing_visuals = []
    visuals = re.findall(r"^:::visual\s+([a-zA-Z0-9._-]+)\s*\|", body, re.M)
    for svg in visuals:
        p1 = REPO_ROOT / "assets/visuals" / svg
        p2 = REPO_ROOT / "astro-preview/public/assets/visuals" / svg
        if not (p1.exists() or p2.exists()):
            missing_visuals.append(svg)

    status = "FAIL" if missing_visuals else ("WARN" if notes else "PASS")
    return {
        "status": status,
        "h2_count": len(h2s),
        "found_stages": found_stages,
        "visuals": visuals,
        "missing_visuals": missing_visuals,
        "notes": notes,
    }


def check_docker_sandbox(image=SANDBOX_IMAGE):
    """Verify Docker daemon and sandbox image are usable without network/host access."""
    env = clean_docker_env()
    info = run_cmd(["docker", "image", "inspect", image], timeout=10, env=env)
    if info["exit_code"] != 0:
        return False, f"Docker sandbox image unavailable ({image}): {info['stderr'].strip()[:160]}"
    cname = f"hj-probe-{uuid.uuid4().hex[:10]}"
    probe = run_cmd(
        [
            "docker",
            "run",
            "--rm",
            "--name",
            cname,
            "--network=none",
            "--read-only",
            "--shm-size=1m",
            "--cap-drop=ALL",
            "--security-opt=no-new-privileges:true",
            "--pids-limit=32",
            "--memory=128m",
            "--cpus=0.5",
            "--user",
            "65534:65534",
            image,
            "python3",
            "-I",
            "-c",
            "print('OK')",
        ],
        timeout=15,
        env=env,
    )
    if probe["exit_code"] == 124:
        run_cmd(["docker", "rm", "-f", cname], timeout=10, env=env)
    if probe["exit_code"] != 0 or probe["stdout"].strip() != "OK":
        return False, f"Docker sandbox probe failed (rc={probe['exit_code']}): {probe['stderr'].strip()[:160]}"
    return True, f"docker:{image} (--network=none --read-only --shm-size=1m --cap-drop=ALL --user 65534:65534)"


def gate3_python_exec_sandboxed(text, strict_sandbox=False, sandbox_checker=check_docker_sandbox, image=SANDBOX_IMAGE):
    pattern = re.compile(r"(?:~~~|```)python\n(.*?)\n(?:~~~|```)", re.S)
    matches = list(pattern.finditer(text))
    if not matches:
        return {
            "status": "NOT RUN",
            "sandbox": "none",
            "reason": "No Python code blocks found in draft",
            "total": 0,
            "passed": 0,
            "skipped": 0,
            "failed": 0,
            "details": [],
        }

    ok, sandbox_info = sandbox_checker(image)
    if not ok:
        return {
            "status": "FAIL" if strict_sandbox else "NOT RUN",
            "sandbox": "UNAVAILABLE",
            "reason": f"Verified isolated sandbox unavailable (host execution refused): {sandbox_info}",
            "total": len(matches),
            "passed": 0,
            "skipped": 0,
            "failed": 0,
            "details": [],
        }

    env = clean_docker_env()
    results = []
    passed = failed = skipped = 0

    for idx, m in enumerate(matches, 1):
        code = m.group(1)
        if any(k in code for k in ["잘못된 예시", "무한 반복", "input("]):
            skipped += 1
            reason = "input() interactive" if "input(" in code else "intentional error/infinite example"
            results.append({"block": idx, "status": "SKIP", "reason": reason})
            continue

        cname = f"hj-py-{uuid.uuid4().hex[:10]}"
        exec_res = run_cmd(
            [
                "docker",
                "run",
                "--rm",
                "-i",
                "--name",
                cname,
                "--network=none",
                "--read-only",
                "--shm-size=1m",
                "--cap-drop=ALL",
                "--security-opt=no-new-privileges:true",
                "--pids-limit=32",
                "--memory=128m",
                "--cpus=0.5",
                "--user",
                "65534:65534",
                image,
                "python3",
                "-I",
                "-",
            ],
            stdin_text=code,
            timeout=10,
            env=env,
        )
        if exec_res["exit_code"] == 124:
            run_cmd(["docker", "rm", "-f", cname], timeout=10, env=env)

        after = text[m.end(): m.end() + 400]
        exp_block = re.search(r"\*\*예상 출력.*?\*\*\s*\n\s*(?:~~~|```)text\n(.*?)\n(?:~~~|```)", after, re.S)
        exp_inline = re.search(r"\*\*예상 출력.*?:\*\*\s*`([^`]+)`", after)
        expected = exp_block.group(1) if exp_block else (exp_inline.group(1) if exp_inline else None)

        actual = exec_res["stdout"].rstrip("\n")
        if exec_res["exit_code"] != 0:
            failed += 1
            err_line = exec_res["stderr"].strip().splitlines()[-1] if exec_res["stderr"].strip() else "runtime error"
            results.append({
                "block": idx,
                "status": "FAIL",
                "exit_code": exec_res["exit_code"],
                "stdout": actual[:500],
                "stderr": exec_res["stderr"].strip()[:500],
                "error": err_line,
            })
        elif expected is not None and actual.rstrip() != expected.rstrip():
            failed += 1
            results.append({
                "block": idx,
                "status": "FAIL",
                "exit_code": exec_res["exit_code"],
                "stdout": actual[:500],
                "stderr": exec_res["stderr"].strip()[:500],
                "error": f"Output mismatch: expected={expected!r}, actual={actual!r}",
            })
        else:
            passed += 1
            results.append({"block": idx, "status": "PASS", "exit_code": 0, "stdout": actual[:500]})

    # If every block was skipped (0 actually executed), do NOT falsely claim PASS.
    if failed > 0:
        status = "FAIL"
    elif passed > 0:
        status = "PASS"
    else:
        status = "NOT RUN"

    return {
        "status": status,
        "sandbox": sandbox_info,
        "total": len(results),
        "passed": passed,
        "skipped": skipped,
        "failed": failed,
        "details": results,
    }


def gate4_gemini_review(gemini_report_path):
    if not gemini_report_path:
        return {
            "status": "NOT RUN",
            "reason": "NOT_PROVIDED",
            "short": "독립 Gemini 검수 리포트 미제공 (--gemini-report 미지정)",
            "parsed": None,
            "body": "",
        }
    p = Path(gemini_report_path)
    if not p.exists():
        return {
            "status": "FAIL",
            "reason": "FILE_NOT_FOUND",
            "short": f"지정된 Gemini 리포트 파일 없음: {gemini_report_path}",
            "parsed": None,
            "body": "",
        }
    raw = p.read_text(encoding="utf-8")
    parsed = parse_structured_review(raw, require_json=False)
    return {
        "status": parsed["status"],
        "reason": parsed["reason"],
        "short": f"{parsed['reason']} · {parsed['summary'][:120]}",
        "parsed": parsed,
        "body": raw.strip(),
    }


def gate5_codex_review(draft_text, job_id, out_dir, secret_detected=False):
    if secret_detected:
        return {
            "status": "FAIL",
            "reason": "BLOCKED_BY_SECRET_SCAN",
            "summary": "Gate 1에서 민감정보/비공개 링크가 검출되어 외부 Codex API 전송을 차단했습니다.",
            "exit_code": None,
            "parsed": None,
        }
    if not CODEX_WRAPPER.exists():
        return {
            "status": "NOT RUN",
            "reason": "CODEX_WRAPPER_MISSING",
            "summary": "Codex wrapper not installed (~/.gemini/codex/run-codex.sh)",
            "exit_code": None,
            "parsed": None,
        }

    prompt_path = out_dir / f"{job_id}_codex_prompt.txt"
    numbered = "".join(f"{i:3d}: {line}" for i, line in enumerate(draft_text.splitlines(True), 1))
    prompt = (
        f"You are Codex (gpt-6.2-sol) performing an independent technical & code review "
        f"for HangJoo Editorial Pipeline (Job ID: {job_id}).\n"
        "STRICT RULES:\n"
        "- Do NOT invoke bash/shell, file, or web tools. Analyze ONLY the markdown below.\n"
        "- Respond ONLY with a single valid JSON object matching this exact schema:\n"
        '  {"verdict": "PASS" | "WARN" | "FAIL", "p0": ["..."], "p1": ["..."], "p2": ["..."], "summary": "Korean summary"}\n'
        "- Use FAIL if any technical/code/output P0 error exists.\n\n"
        "=== DRAFT ===\n"
        + numbered
    )
    prompt_path.write_text(prompt, encoding="utf-8")

    res = run_cmd(
        [
            "bash",
            str(CODEX_WRAPPER),
            "exec",
            "-m",
            "gpt-6.2-sol",
            "-s",
            "read-only",
            "-c",
            'model_reasoning_effort="low"',
            "-c",
            'web_search="disabled"',
            "--ephemeral",
            "-",
        ],
        stdin_text=prompt,
        timeout=120,
    )
    raw_out_path = out_dir / f"{job_id}_codex_raw.txt"
    raw_out_path.write_text(res["stdout"] + ("\n" + res["stderr"] if res["stderr"] else ""), encoding="utf-8")

    if res["exit_code"] != 0:
        return {
            "status": "FAIL",
            "reason": "EXECUTION_ERROR",
            "summary": f"Codex CLI 실행 실패 (rc={res['exit_code']}): {res['stderr'].strip()[:200]}",
            "exit_code": res["exit_code"],
            "parsed": None,
        }
    if res.get("stdout_truncated"):
        return {
            "status": "FAIL",
            "reason": "OUTPUT_TRUNCATED",
            "summary": f"Codex 응답이 {MAX_CAPTURE_CHARS}자를 초과해 절단됨 — fail-closed 정책에 따라 FAIL 처리",
            "exit_code": res["exit_code"],
            "parsed": None,
        }

    parsed = parse_structured_review(res["stdout"], require_json=True)
    return {
        "status": parsed["status"],
        "reason": parsed["reason"],
        "summary": parsed["summary"],
        "exit_code": res["exit_code"],
        "parsed": parsed,
    }


def gate6_astro_and_visual(run_astro=False, run_visual=False, cmd_runner=run_cmd):
    """
    Gate 6 requires BOTH Astro build/check:output AND Playwright visual QA to PASS.
    Running only one subset returns NOT RUN (never PASS).
    """
    if not run_astro and not run_visual:
        return {
            "status": "NOT RUN",
            "reason": "NOT_REQUESTED",
            "summary": "Astro 빌드 및 Playwright 시각 QA 미실행 (--run-astro-checks --run-visual-qa 미지정)",
            "steps": [],
        }

    astro_dir = str(REPO_ROOT / "astro-preview")
    steps = []

    if run_astro:
        b = cmd_runner(["npm", "run", "build"], timeout=120, cwd=astro_dir)
        steps.append({
            "step": "npm run build",
            "exit_code": b["exit_code"],
            "stdout_tail": b["stdout"].strip().splitlines()[-5:],
            "stderr_tail": b["stderr"].strip().splitlines()[-5:],
        })
        if b["exit_code"] != 0:
            return {"status": "FAIL", "reason": "ASTRO_BUILD_FAILED", "summary": "Astro build failed", "steps": steps}

        c = cmd_runner(["npm", "run", "check:output"], timeout=60, cwd=astro_dir)
        steps.append({
            "step": "npm run check:output",
            "exit_code": c["exit_code"],
            "stdout_tail": c["stdout"].strip().splitlines()[-3:],
            "stderr_tail": c["stderr"].strip().splitlines()[-3:],
        })
        if c["exit_code"] != 0:
            return {"status": "FAIL", "reason": "CHECK_OUTPUT_FAILED", "summary": "check:output failed", "steps": steps}

    if run_visual:
        v = cmd_runner(["node", "scripts/visual-qa.mjs"], timeout=240, cwd=astro_dir)
        steps.append({
            "step": "node scripts/visual-qa.mjs",
            "exit_code": v["exit_code"],
            "stdout_tail": v["stdout"].strip().splitlines()[-3:],
            "stderr_tail": v["stderr"].strip().splitlines()[-3:],
        })
        if v["exit_code"] != 0:
            return {"status": "FAIL", "reason": "VISUAL_QA_FAILED", "summary": "Playwright visual-qa failed", "steps": steps}

    if not (run_astro and run_visual):
        missing = "Astro build/check:output" if not run_astro else "Playwright visual-qa"
        return {
            "status": "NOT RUN",
            "reason": "PARTIAL_GATE6_EXECUTION",
            "summary": f"{missing} 미실행 — Gate 6 전체 통과 필요",
            "steps": steps,
        }

    return {
        "status": "PASS",
        "reason": "ASTRO_AND_VISUAL_PASS",
        "summary": "Astro build + check:output + Playwright visual-qa PASS",
        "steps": steps,
    }


def compute_final_gate(gate_statuses):
    """
    Fail-closed gate aggregation across ALL 6 mandatory gates.
    READY_FOR_FOUNDER_APPROVAL is returned ONLY if all 6 keys are present with zero FAIL and zero NOT RUN.
    """
    if not isinstance(gate_statuses, dict) or not REQUIRED_GATE_KEYS.issubset(gate_statuses.keys()):
        return "FAIL (필수 게이트 키 누락 — 승격 차단)"
    values = [gate_statuses[k] for k in REQUIRED_GATE_KEYS]
    if any(v == "FAIL" for v in values):
        return "FAIL (승격·게시 차단)"
    if any(v == "NOT RUN" for v in values):
        return "PENDING (미실행 게이트 존재 — 승격 보류)"
    if all(v in {"PASS", "WARN"} for v in values):
        return "READY_FOR_FOUNDER_APPROVAL (Draft PR 후보)"
    return "FAIL (알 수 없는 게이트 상태 — 승격 차단)"


def build_report(job_id, timestamp, source_label, drive_id, raw_sha, body_sha, g1, g2, g3, g4, g5, g6):
    gate_statuses = {
        "gate1_dedup_safety": g1["status"],
        "gate2_structure_assets": g2["status"],
        "gate3_python_exec": g3["status"],
        "gate4_gemini_content": g4["status"],
        "gate5_codex_tech": g5["status"],
        "gate6_astro_visual": g6["status"],
    }
    final_gate = compute_final_gate(gate_statuses)

    lines = [
        f"# HangJoo Editorial Pipeline — 통합 검토 보고서 (`{job_id}`)",
        "",
        "| 항목 | 값 |",
        "| :--- | :--- |",
        f"| **Job ID** | `{job_id}` |",
        f"| **실행 시각 (UTC)** | `{timestamp}` |",
        f"| **입력 원고** | `{source_label}`" + (f" (Drive ID: `{drive_id}`)" if drive_id else "") + " |",
        f"| **원고 SHA-256 (Raw / Body)** | `{raw_sha[:16]}...` / `{body_sha[:16]}...` |",
        f"| **최종 게이트 판정** | **{final_gate}** |",
        "",
        "## 1. 6단계 검증 매트릭스 (`PASS / WARN / FAIL / NOT RUN`)",
        "",
        "| Gate | 항목 | 상태 | 근거 요약 |",
        "| :--- | :--- | :---: | :--- |",
        f"| Gate 1 | 중복·스키마·보안 경계 | **{g1['status']}** | 로컬 {g1['checked_local_files']}편 + 로그 {g1['checked_run_logs']}건 대조, P0={len(g1['p0'])}, P1={len(g1['p1'])} |",
        f"| Gate 2 | 4단계 구조·시각 에셋 | **{g2['status']}** | H2={g2['h2_count']}개({', '.join(g2['found_stages']) or '없음'}), 누락 SVG={len(g2['missing_visuals'])} |",
        f"| Gate 3 | Python 격리 실행 (Docker) | **{g3['status']}** | sandbox={g3.get('sandbox')}, total={g3['total']}, pass={g3['passed']}, skip={g3['skipped']}, fail={g3['failed']} |",
        f"| Gate 4 | Gemini(제나) 구조화 검수 | **{g4['status']}** | {g4['short']} |",
        f"| Gate 5 | OpenAI Codex(`gpt-6.2-sol`) 구조화 검수 | **{g5['status']}** | {g5['summary']} |",
        f"| Gate 6 | Astro 빌드 / Playwright 시각 QA | **{g6['status']}** | {g6['summary']} |",
        "",
    ]

    if g1["p0"] or g1["p1"]:
        lines.append("## 2. Gate 1 상세 (중복·스키마·보안)")
        for item in g1["p0"]:
            lines.append(f"- **[P0]** {item}")
        for item in g1["p1"]:
            lines.append(f"- **[P1]** {item}")
        lines.append("")

    if g2["missing_visuals"] or g2["notes"]:
        lines.append("## 3. Gate 2 상세 (구조·에셋)")
        for svg in g2["missing_visuals"]:
            lines.append(f"- **[P0]** 누락된 시각 에셋: `{svg}`")
        for note in g2["notes"]:
            lines.append(f"- **[P1]** {note}")
        lines.append("")

    if g3["status"] in {"FAIL", "NOT RUN"} and (g3["failed"] > 0 or g3.get("reason")):
        lines.append("## 4. Gate 3 상세 (격리 Python 실행)")
        if g3.get("reason"):
            lines.append(f"- **상태 사유:** {g3['reason']}")
        for d in g3["details"]:
            if d["status"] == "FAIL":
                lines.append(f"- **[P0 · Block {d['block']}]** `{d['error']}`")
        lines.append("")

    if g4["body"]:
        lines.append("## 5. Gate 4 · Gemini(제나) 독립 검수 결과")
        lines.append(g4["body"])
        lines.append("")

    if g5["status"] != "NOT RUN":
        lines.append("## 6. Gate 5 · OpenAI Codex (`gpt-6.2-sol`) 독립 검수 결과")
        lines.append(json.dumps(g5.get("parsed") or {"summary": g5["summary"]}, ensure_ascii=False, indent=2))
        lines.append("")

    if g6["steps"]:
        lines.append("## 7. Gate 6 · Astro 빌드 / Playwright QA 증거")
        for s in g6["steps"]:
            lines.append(f"- `{s['step']}` (rc={s['exit_code']}): `{' | '.join(s['stdout_tail'])}`")
        lines.append("")

    lines.append("---")
    lines.append("*안전 경계: `main`·공개 사이트·원본 파일 무변경. Founder 명시적 승인 전 자동 게시 금지.*")
    return "\n".join(lines) + "\n", final_gate, gate_statuses


def main():
    parser = argparse.ArgumentParser(description="HangJoo Editorial Pipeline Runner (v1.2 Hardened)")
    parser.add_argument("--list-inbox", action="store_true", help="List Drive 01_INBOX_Drafts")
    parser.add_argument("--draft", help="Local markdown draft path")
    parser.add_argument("--drive-id", help="Drive File ID in 01_INBOX_Drafts to download and review")
    parser.add_argument("--job-id", help="Explicit Job ID (must be unique; overwrite prohibited)")
    parser.add_argument("--state-dir", default="/tmp/hangjoo_pipeline", help="Directory for run logs and dedup state")
    parser.add_argument("--gemini-report", help="Path to structured independent Gemini review")
    parser.add_argument("--run-codex", action="store_true", help="Invoke local Codex CLI (gpt-6.2-sol)")
    parser.add_argument("--strict-sandbox", action="store_true", help="Treat unavailable Docker sandbox as FAIL instead of NOT RUN")
    parser.add_argument("--run-astro-checks", action="store_true", help="Run Astro build & check:output in Gate 6")
    parser.add_argument("--run-visual-qa", action="store_true", help="Run Playwright visual-qa.mjs in Gate 6")
    parser.add_argument("--skip-drive-check", action="store_true", help="Skip Drive archive check in offline tests")
    parser.add_argument("--upload-review", action="store_true", help="Upload report to Drive 03_REVIEW_Jena_Codex (blocked on secret leak)")
    args = parser.parse_args()

    if args.list_inbox:
        res = run_cmd(["gdrive", "readonly", "ls", DRIVE_FOLDERS["01_INBOX_Drafts"]], timeout=20)
        print(res["stdout"] or res["stderr"])
        sys.exit(res["exit_code"])

    if not args.draft and not args.drive_id:
        parser.error("--draft, --drive-id, 또는 --list-inbox 중 하나를 지정하세요.")

    now = datetime.datetime.now(datetime.timezone.utc)
    job_id = args.job_id or f"HJ-{now.strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}"
    state_root = Path(args.state_dir)
    out_dir = state_root / job_id
    if out_dir.exists():
        print(f"[ERROR] Job ID directory already exists (append-only evidence protection): {out_dir}", file=sys.stderr)
        sys.exit(2)
    out_dir.mkdir(parents=True, exist_ok=False)

    drive_id = args.drive_id
    if drive_id:
        draft_path = out_dir / f"{job_id}_downloaded_draft.md"
        res = run_cmd(["gdrive", "readonly", "download", drive_id, "--out", str(draft_path)], timeout=30)
        if res["exit_code"] != 0:
            print(f"[ERROR] Drive download failed: {res['stderr']}", file=sys.stderr)
            sys.exit(res["exit_code"])
        source_label = f"drive:{drive_id}"
    else:
        draft_path = Path(args.draft).resolve()
        source_label = draft_path.name

    draft_text = draft_path.read_text(encoding="utf-8")
    raw_sha, body_sha = compute_hashes(draft_text)
    meta, body = parse_frontmatter(draft_text)

    g1 = gate1_dedup_and_safety(
        draft_text, meta, str(draft_path) if not drive_id else "", state_dir=state_root, check_drive=not args.skip_drive_check
    )
    g2 = gate2_structure_and_assets(body)
    g3 = gate3_python_exec_sandboxed(draft_text, strict_sandbox=args.strict_sandbox)
    g4 = gate4_gemini_review(args.gemini_report)
    g5 = gate5_codex_review(draft_text, job_id, out_dir, secret_detected=g1["secret_detected"]) if args.run_codex else {
        "status": "NOT RUN",
        "reason": "NOT_REQUESTED",
        "summary": "--run-codex 미지정으로 미실행",
        "exit_code": None,
        "parsed": None,
    }
    g6 = gate6_astro_and_visual(run_astro=args.run_astro_checks, run_visual=args.run_visual_qa)

    report_md, final_gate, gate_statuses = build_report(
        job_id, now.isoformat(), source_label, drive_id, raw_sha, body_sha, g1, g2, g3, g4, g5, g6
    )
    report_path = out_dir / f"{job_id}_review_report.md"
    report_path.write_text(report_md, encoding="utf-8")

    # Always persist execution log BEFORE attempting any external Drive upload
    log_data = {
        "job_id": job_id,
        "timestamp_utc": now.isoformat(),
        "title": meta.get("title", ""),
        "source": source_label,
        "drive_id": drive_id,
        "sha256": raw_sha,
        "body_sha256": body_sha,
        "final_gate": final_gate,
        "gates": gate_statuses,
        "evidence": {
            "gate1": g1,
            "gate2": g2,
            "gate3": g3,
            "gate4": {"status": g4["status"], "reason": g4["reason"], "parsed": g4["parsed"]},
            "gate5": {"status": g5["status"], "reason": g5["reason"], "exit_code": g5["exit_code"], "parsed": g5["parsed"]},
            "gate6": g6,
        },
        "report_path": str(report_path),
        "uploaded_review_id": None,
        "upload_status": "NOT_REQUESTED",
    }
    log_path = out_dir / f"{job_id}_run_log.json"
    atomic_write_json(log_path, log_data)

    if args.upload_review:
        if g1["secret_detected"]:
            log_data["upload_status"] = "BLOCKED_BY_SECRET_SCAN"
            atomic_write_json(log_path, log_data)
            print("[BLOCKED] Secret/private URL detected in Gate 1; Drive upload refused.", file=sys.stderr)
            sys.exit(3)
        res = run_cmd(
            ["gdrive", "mutate", "upload", str(report_path), "--parent", DRIVE_FOLDERS["03_REVIEW_Jena_Codex"]],
            timeout=30,
        )
        if res["exit_code"] != 0:
            log_data["upload_status"] = f"FAILED (rc={res['exit_code']})"
            atomic_write_json(log_path, log_data)
            print(f"[ERROR] Drive upload failed (local log preserved): {res['stderr']}", file=sys.stderr)
            sys.exit(res["exit_code"])
        m_id = re.search(r"\(ID:\s*([^)]+)\)", res["stdout"])
        log_data["uploaded_review_id"] = m_id.group(1) if m_id else res["stdout"].strip()
        log_data["upload_status"] = "UPLOADED"
        atomic_write_json(log_path, log_data)

    print(json.dumps({k: log_data[k] for k in ["job_id", "final_gate", "gates", "sha256", "body_sha256", "report_path", "upload_status"]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
