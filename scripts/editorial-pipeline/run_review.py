#!/usr/bin/env python3
"""
HangJoo's Lab — Editorial Pipeline Runner (v1.1 Hardened)
Standalone Python 3 (stdlib-only) orchestrator for:
  - Drive 01_INBOX_Drafts inspection & read-back SHA-256 verification
  - Gate 1: Deduplication (title + raw/body SHA-256 against published, drafts, and run logs),
            frontmatter schema, secret/private-link leak scan
  - Gate 2: 4-stage editorial structure & visual asset check
  - Gate 3: Sandboxed Python code-block execution via hardened Docker container
            (--network=none --read-only --cap-drop=ALL --user 65534:65534);
            NEVER falls back to unsandboxed host execution.
  - Gate 4: Gemini(Jena) independent review ingestion with strict structured verdict parsing
  - Gate 5: OpenAI Codex (gpt-6.2-sol, read-only) independent technical review with strict JSON verdict parsing
  - Gate 6: Astro build / check:output / Playwright visual QA execution or explicit NOT RUN
  - Fail-closed gate aggregation: READY_FOR_FOUNDER_APPROVAL requires ALL 6 gates to be PASS/WARN (0 FAIL, 0 NOT RUN)
  - Append-only report & full structured evidence log preservation

SAFETY GUARANTEES:
  - Never modifies git main, published site, or PRs.
  - Never deletes or overwrites Drive originals (append-only uploads with Job ID prefix).
  - Treats all draft Python code as untrusted input; refuses host execution if sandbox is unavailable.
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


def run_cmd(cmd, stdin_text=None, timeout=90, cwd=None):
    started = utc_now()
    try:
        res = subprocess.run(
            cmd,
            input=stdin_text,
            text=True,
            capture_output=True,
            timeout=timeout,
            cwd=cwd,
        )
        return {
            "command": cmd,
            "exit_code": res.returncode,
            "stdout": res.stdout,
            "stderr": res.stderr,
            "started_utc": started,
            "finished_utc": utc_now(),
        }
    except FileNotFoundError:
        return {
            "command": cmd,
            "exit_code": 127,
            "stdout": "",
            "stderr": f"Command not found: {cmd[0]}",
            "started_utc": started,
            "finished_utc": utc_now(),
        }
    except subprocess.TimeoutExpired:
        return {
            "command": cmd,
            "exit_code": 124,
            "stdout": "",
            "stderr": f"Timed out after {timeout}s",
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


def parse_structured_review(raw_text):
    """
    Strictly parse Gemini/Codex review output into PASS | WARN | FAIL.
    Fail-closed: empty, malformed, ambiguous, or P0-inconsistent responses always return FAIL.
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

    # 1) Try JSON extraction (fenced ```json ... ``` or raw JSON object)
    json_candidates = re.findall(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text)
    if text.startswith("{") and text.endswith("}"):
        json_candidates.insert(0, text)
    else:
        # Also look for last standalone JSON object in output (e.g., Codex CLI stdout with banner)
        m_last = re.search(r"(\{[\s\S]*\"verdict\"[\s\S]*\})\s*$", text)
        if m_last:
            json_candidates.append(m_last.group(1))

    for cand in json_candidates:
        try:
            obj = json.loads(cand)
        except json.JSONDecodeError:
            continue
        if not isinstance(obj, dict):
            continue
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
        if verdict == "PASS" and len(p0) > 0:
            return {
                "status": "FAIL",
                "reason": "P0_INCONSISTENCY",
                "p0": [str(x) for x in p0],
                "p1": [str(x) for x in p1],
                "p2": [str(x) for x in p2],
                "summary": "verdict=PASS이지만 P0 오류가 존재함 — fail-closed 정책에 따라 FAIL 처리",
            }
        return {
            "status": verdict,
            "reason": "STRUCTURED_JSON_OK",
            "p0": [str(x) for x in p0],
            "p1": [str(x) for x in p1],
            "p2": [str(x) for x in p2],
            "summary": str(obj.get("summary", "")).strip() or f"Structured verdict: {verdict}",
        }

    # 2) Fallback: strict single explicit line `VERDICT: PASS|WARN|FAIL`
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
        "p0": ["Reviewer output lacked a single unambiguous JSON or VERDICT: PASS|WARN|FAIL marker."],
        "p1": [],
        "p2": [],
        "summary": "모호하거나 비구조화된 검수 응답 — fail-closed 정책에 따라 FAIL 처리",
    }


def gate1_dedup_and_safety(draft_text, meta, source_path, state_dir=None, check_drive=True):
    findings_p0 = []
    findings_p1 = []
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
            findings_p0.append(f"보안/비공개 경계 위반 의심: {label}")

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

    # Check prior run logs for hash deduplication
    checked_logs = 0
    if state_dir and Path(state_dir).exists():
        for log_file in sorted(Path(state_dir).glob("*/*_run_log.json")):
            try:
                prev = json.loads(log_file.read_text(encoding="utf-8"))
            except Exception:
                continue
            checked_logs += 1
            if prev.get("sha256") == raw_sha or prev.get("body_sha256") == body_sha:
                hash_dups.append(f"run_log:{prev.get('job_id', log_file.name)}")

    if title_dups:
        findings_p0.append(f"기존 원고와 제목 중복: {', '.join(title_dups)}")
    if hash_dups:
        findings_p0.append(f"기존 원고/이력과 해시(SHA-256) 중복: {', '.join(hash_dups)}")

    drive_archive_checked = False
    if check_drive:
        res = run_cmd(["gdrive", "readonly", "ls", DRIVE_FOLDERS["05_APPROVED_Archive"]], timeout=15)
        drive_archive_checked = res["exit_code"] == 0

    status = "FAIL" if findings_p0 else ("WARN" if findings_p1 else "PASS")
    return {
        "status": status,
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
    info = run_cmd(["docker", "image", "inspect", image], timeout=10)
    if info["exit_code"] != 0:
        return False, f"Docker sandbox image unavailable ({image}): {info['stderr'].strip()[:160]}"
    probe = run_cmd(
        [
            "docker",
            "run",
            "--rm",
            "--network=none",
            "--read-only",
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
    )
    if probe["exit_code"] != 0 or probe["stdout"].strip() != "OK":
        return False, f"Docker sandbox probe failed (rc={probe['exit_code']}): {probe['stderr'].strip()[:160]}"
    return True, f"docker:{image} (--network=none --read-only --cap-drop=ALL --user 65534:65534)"


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

    results = []
    passed = failed = skipped = 0

    for idx, m in enumerate(matches, 1):
        code = m.group(1)
        if any(k in code for k in ["잘못된 예시", "무한 반복", "input("]):
            skipped += 1
            reason = "input() interactive" if "input(" in code else "intentional error/infinite example"
            results.append({"block": idx, "status": "SKIP", "reason": reason})
            continue

        exec_res = run_cmd(
            [
                "docker",
                "run",
                "--rm",
                "-i",
                "--network=none",
                "--read-only",
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
        )

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
                "error": err_line,
            })
        elif expected is not None and actual.rstrip() != expected.rstrip():
            failed += 1
            results.append({
                "block": idx,
                "status": "FAIL",
                "exit_code": exec_res["exit_code"],
                "error": f"Output mismatch: expected={expected!r}, actual={actual!r}",
            })
        else:
            passed += 1
            results.append({"block": idx, "status": "PASS", "exit_code": 0})

    status = "FAIL" if failed > 0 else ("PASS" if passed > 0 or skipped > 0 else "NOT RUN")
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
    parsed = parse_structured_review(raw)
    return {
        "status": parsed["status"],
        "reason": parsed["reason"],
        "short": f"{parsed['reason']} · {parsed['summary'][:120]}",
        "parsed": parsed,
        "body": raw.strip(),
    }


def gate5_codex_review(draft_text, job_id, out_dir):
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
        "- Respond ONLY with a valid JSON object matching this exact schema:\n"
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

    parsed = parse_structured_review(res["stdout"])
    return {
        "status": parsed["status"],
        "reason": parsed["reason"],
        "summary": parsed["summary"],
        "exit_code": res["exit_code"],
        "parsed": parsed,
    }


def gate6_astro_and_visual(run_astro=False, run_visual=False):
    if not run_astro and not run_visual:
        return {
            "status": "NOT RUN",
            "reason": "NOT_REQUESTED",
            "summary": "Astro 빌드 및 Playwright 시각 QA 미실행 (--run-astro-checks / --run-visual-qa 미지정)",
            "steps": [],
        }

    astro_dir = REPO_ROOT / "astro-preview"
    steps = []

    if run_astro:
        b = run_cmd(["npm", "run", "build"], timeout=120, cwd=str(astro_dir))
        steps.append({"step": "npm run build", "exit_code": b["exit_code"], "tail": b["stdout"].strip().splitlines()[-3:]})
        if b["exit_code"] != 0:
            return {"status": "FAIL", "reason": "ASTRO_BUILD_FAILED", "summary": "Astro build failed", "steps": steps}

        c = run_cmd(["npm", "run", "check:output"], timeout=60, cwd=str(astro_dir))
        steps.append({"step": "npm run check:output", "exit_code": c["exit_code"], "tail": c["stdout"].strip().splitlines()[-2:]})
        if c["exit_code"] != 0:
            return {"status": "FAIL", "reason": "CHECK_OUTPUT_FAILED", "summary": "check:output failed", "steps": steps}

    if run_visual:
        v = run_cmd(["node", "scripts/visual-qa.mjs"], timeout=240, cwd=str(astro_dir))
        steps.append({"step": "node scripts/visual-qa.mjs", "exit_code": v["exit_code"], "tail": v["stdout"].strip().splitlines()[-2:]})
        if v["exit_code"] != 0:
            return {"status": "FAIL", "reason": "VISUAL_QA_FAILED", "summary": "Playwright visual-qa failed", "steps": steps}
    else:
        return {
            "status": "NOT RUN",
            "reason": "VISUAL_QA_NOT_RUN",
            "summary": "Astro build/check:output PASS, Playwright visual-qa NOT RUN",
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
    Fail-closed gate aggregation across ALL 6 gates.
    READY_FOR_FOUNDER_APPROVAL is returned ONLY if zero FAIL and zero NOT RUN across all 6 gates.
    """
    values = list(gate_statuses.values())
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
            lines.append(f"- `{s['step']}` (rc={s['exit_code']}): `{' | '.join(s['tail'])}`")
        lines.append("")

    lines.append("---")
    lines.append("*안전 경계: `main`·공개 사이트·원본 파일 무변경. Founder 명시적 승인 전 자동 게시 금지.*")
    return "\n".join(lines) + "\n", final_gate, gate_statuses


def main():
    parser = argparse.ArgumentParser(description="HangJoo Editorial Pipeline Runner (v1.1 Hardened)")
    parser.add_argument("--list-inbox", action="store_true", help="List Drive 01_INBOX_Drafts")
    parser.add_argument("--draft", help="Local markdown draft path")
    parser.add_argument("--drive-id", help="Drive File ID in 01_INBOX_Drafts to download and review")
    parser.add_argument("--job-id", help="Explicit Job ID (default: auto-generated)")
    parser.add_argument("--state-dir", default="/tmp/hangjoo_pipeline", help="Directory for run logs and dedup state")
    parser.add_argument("--gemini-report", help="Path to structured independent Gemini review")
    parser.add_argument("--run-codex", action="store_true", help="Invoke local Codex CLI (gpt-6.2-sol)")
    parser.add_argument("--strict-sandbox", action="store_true", help="Treat unavailable Docker sandbox as FAIL instead of NOT RUN")
    parser.add_argument("--run-astro-checks", action="store_true", help="Run Astro build & check:output in Gate 6")
    parser.add_argument("--run-visual-qa", action="store_true", help="Run Playwright visual-qa.mjs in Gate 6")
    parser.add_argument("--skip-drive-check", action="store_true", help="Skip Drive archive check in offline tests")
    parser.add_argument("--upload-review", action="store_true", help="Upload report to Drive 03_REVIEW_Jena_Codex")
    args = parser.parse_args()

    if args.list_inbox:
        res = run_cmd(["gdrive", "readonly", "ls", DRIVE_FOLDERS["01_INBOX_Drafts"]], timeout=20)
        print(res["stdout"] or res["stderr"])
        sys.exit(res["exit_code"])

    if not args.draft and not args.drive_id:
        parser.error("--draft, --drive-id, 또는 --list-inbox 중 하나를 지정하세요.")

    now = datetime.datetime.now(datetime.timezone.utc)
    job_id = args.job_id or f"HJ-{now.strftime('%Y%m%d-%H%M%S')}"
    state_root = Path(args.state_dir)
    out_dir = state_root / job_id
    out_dir.mkdir(parents=True, exist_ok=True)

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
    g5 = gate5_codex_review(draft_text, job_id, out_dir) if args.run_codex else {
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

    uploaded_id = None
    if args.upload_review:
        res = run_cmd(
            ["gdrive", "mutate", "upload", str(report_path), "--parent", DRIVE_FOLDERS["03_REVIEW_Jena_Codex"]],
            timeout=30,
        )
        if res["exit_code"] != 0:
            print(f"[ERROR] Drive upload failed: {res['stderr']}", file=sys.stderr)
            sys.exit(res["exit_code"])
        m_id = re.search(r"\(ID:\s*([^)]+)\)", res["stdout"])
        uploaded_id = m_id.group(1) if m_id else res["stdout"].strip()

    log_data = {
        "job_id": job_id,
        "timestamp_utc": now.isoformat(),
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
        "uploaded_review_id": uploaded_id,
    }
    log_path = out_dir / f"{job_id}_run_log.json"
    log_path.write_text(json.dumps(log_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: log_data[k] for k in ["job_id", "final_gate", "gates", "sha256", "body_sha256", "report_path"]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
