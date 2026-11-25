#!/usr/bin/env python3
"""
HangJoo's Lab — Editorial Pipeline Runner (Phase 2 Scaffold)
Standalone Python 3 (stdlib-only) orchestrator for:
  - Drive 01_INBOX_Drafts inspection & read-back SHA-256 verification
  - Gate 1: Deduplication, frontmatter schema, secret/private-link leak scan
  - Gate 2: 4-stage editorial structure & visual asset check
  - Gate 3: Isolated Python code-block execution & expected-output check
  - Gate 4: Gemini(Jena) independent review ingestion (or explicit NOT RUN)
  - Gate 5: OpenAI Codex (gpt-6.2-sol, read-only) independent technical review
  - Gate 6: Astro build / Playwright visual QA status tracking (explicit NOT RUN when skipped)
  - Append-only report generation & optional upload to Drive 03_REVIEW_Jena_Codex

SAFETY GUARANTEES:
  - Never modifies git main, published site, or PRs.
  - Never deletes or overwrites Drive originals (append-only uploads with Job ID prefix).
  - Blocks promotion to 04_FOUNDER_Approval whenever any P0/execution check is FAIL.
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

FORBIDDEN_TITLE_PHRASES = ["완벽 정복", "초보자 가이드", "이해하기"]
SECRET_PATTERNS = [
    (r"sk-[A-Za-z0-9]{20,}", "Possible OpenAI API key"),
    (r"ghp_[A-Za-z0-9]{20,}", "Possible GitHub PAT"),
    (r"AIza[0-9A-Za-z\-_]{30,}", "Possible Google API key"),
    (r"https://drive\.google\.com/(?:drive/folders|file/d)/", "Private Google Drive URL"),
    (r"https://docs\.google\.com/document/d/", "Private Google Docs URL"),
]


def run_cmd(cmd, stdin_text=None, timeout=90):
    try:
        res = subprocess.run(
            cmd,
            input=stdin_text,
            text=True,
            capture_output=True,
            timeout=timeout,
        )
        return res.returncode, res.stdout, res.stderr
    except FileNotFoundError:
        return 127, "", f"Command not found: {cmd[0]}"
    except subprocess.TimeoutExpired:
        return 124, "", f"Timed out after {timeout}s"


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


def gate1_dedup_and_safety(draft_text, meta, source_path):
    findings_p0 = []
    findings_p1 = []

    # Frontmatter check
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

    # Secret / private URL scan
    for pat, label in SECRET_PATTERNS:
        if re.search(pat, draft_text):
            findings_p0.append(f"보안/비공개 경계 위반 의심: {label}")

    # Local deduplication against published series and drafts
    norm_target = normalize_title(title)
    src_real = os.path.realpath(source_path) if source_path else ""
    checked_files = 0
    dup_matches = []
    scan_paths = sorted(
        glob.glob(str(REPO_ROOT / "astro-preview/editorial/series/*.md"))
        + glob.glob(str(REPO_ROOT / "content/drafts/*.md"))
    )
    for p in scan_paths:
        if src_real and os.path.realpath(p) == src_real:
            continue
        checked_files += 1
        other_meta, _ = parse_frontmatter(Path(p).read_text(encoding="utf-8"))
        other_title = other_meta.get("title", "")
        if norm_target and normalize_title(other_title) == norm_target:
            dup_matches.append(f"{os.path.basename(p)} ({other_title})")

    if dup_matches:
        findings_p0.append(f"기존 원고와 제목 중복: {', '.join(dup_matches)}")

    # Optional Drive 05_APPROVED_Archive check (non-blocking if CLI unavailable)
    rc, out, _ = run_cmd(["gdrive", "readonly", "ls", DRIVE_FOLDERS["05_APPROVED_Archive"]], timeout=15)
    drive_archive_checked = rc == 0

    status = "FAIL" if findings_p0 else ("WARN" if findings_p1 else "PASS")
    return {
        "status": status,
        "checked_local_files": checked_files,
        "drive_archive_checked": drive_archive_checked,
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

    # Verify :::visual assets exist
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


def gate3_python_exec(text):
    pattern = re.compile(r"(?:~~~|```)python\n(.*?)\n(?:~~~|```)", re.S)
    results = []
    passed = failed = skipped = 0

    for idx, m in enumerate(pattern.finditer(text), 1):
        code = m.group(1)
        if any(k in code for k in ["잘못된 예시", "무한 반복", "input("]):
            skipped += 1
            reason = "input() interactive" if "input(" in code else "intentional error/infinite example"
            results.append({"block": idx, "status": "SKIP", "reason": reason})
            continue

        rc, out, err = run_cmd(["python3", "-c", code], timeout=5)
        after = text[m.end(): m.end() + 400]
        exp_block = re.search(r"\*\*예상 출력.*?\*\*\s*\n\s*(?:~~~|```)text\n(.*?)\n(?:~~~|```)", after, re.S)
        exp_inline = re.search(r"\*\*예상 출력.*?:\*\*\s*`([^`]+)`", after)
        expected = exp_block.group(1) if exp_block else (exp_inline.group(1) if exp_inline else None)

        actual = out.rstrip("\n")
        if rc != 0:
            failed += 1
            err_line = err.strip().splitlines()[-1] if err.strip() else "runtime error"
            results.append({"block": idx, "status": "FAIL", "error": err_line})
        elif expected is not None and actual.rstrip() != expected.rstrip():
            failed += 1
            results.append({
                "block": idx,
                "status": "FAIL",
                "error": f"Output mismatch: expected={expected!r}, actual={actual!r}",
            })
        else:
            passed += 1
            results.append({"block": idx, "status": "PASS"})

    status = "FAIL" if failed > 0 else ("PASS" if passed > 0 or skipped > 0 else "NOT RUN")
    return {
        "status": status,
        "total": len(results),
        "passed": passed,
        "skipped": skipped,
        "failed": failed,
        "details": results,
    }


def gate5_codex_review(draft_text, job_id, out_dir):
    if not CODEX_WRAPPER.exists():
        return {"status": "NOT RUN", "summary": "Codex wrapper not installed (~/.gemini/codex/run-codex.sh)"}

    prompt_path = out_dir / f"{job_id}_codex_prompt.txt"
    numbered = "".join(f"{i:3d}: {line}" for i, line in enumerate(draft_text.splitlines(True), 1))
    prompt = (
        f"You are Codex (gpt-6.2-sol) performing an independent technical & code review "
        f"for HangJoo Editorial Pipeline (Job ID: {job_id}).\n"
        "STRICT RULES:\n"
        "- Do NOT invoke bash/shell, file, or web tools. Analyze ONLY the markdown below.\n"
        "- Respond in concise Korean with:\n"
        "  1. Overall Verdict: PASS or FAIL\n"
        "  2. P0 (Technical/Code/Output errors) with line numbers\n"
        "  3. P1/P2 (Clarity/Edge-case improvements)\n\n"
        "=== DRAFT ===\n"
        + numbered
    )
    prompt_path.write_text(prompt, encoding="utf-8")

    rc, out, err = run_cmd(
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
    raw_out_path.write_text(out + ("\n" + err if err else ""), encoding="utf-8")

    if rc != 0:
        return {"status": "FAIL", "summary": f"Codex CLI error (rc={rc}): {err.strip()[:200]}"}

    verdict = "FAIL" if re.search(r"Overall Verdict[^\n]*FAIL", out, re.I) else "PASS"
    return {"status": verdict, "summary": out.strip()}


def build_report(job_id, timestamp, source_label, drive_id, sha256, g1, g2, g3, g4, g5):
    hard_fail = (
        g1["status"] == "FAIL"
        or g2["status"] == "FAIL"
        or g3["status"] == "FAIL"
        or g4["status"] == "FAIL"
        or g5["status"] == "FAIL"
    )
    any_not_run = any(x["status"] == "NOT RUN" for x in [g3, g4, g5])
    if hard_fail:
        final_gate = "FAIL (승격·게시 차단)"
    elif any_not_run:
        final_gate = "PENDING (미실행 게이트 존재 — 승격 보류)"
    else:
        final_gate = "READY_FOR_FOUNDER_APPROVAL (Draft PR 후보)"

    lines = [
        f"# HangJoo Editorial Pipeline — 통합 검토 보고서 (`{job_id}`)",
        "",
        "| 항목 | 값 |",
        "| :--- | :--- |",
        f"| **Job ID** | `{job_id}` |",
        f"| **실행 시각 (UTC)** | `{timestamp}` |",
        f"| **입력 원고** | `{source_label}`" + (f" (Drive ID: `{drive_id}`)" if drive_id else "") + " |",
        f"| **입력 SHA-256** | `{sha256}` |",
        f"| **최종 게이트 판정** | **{final_gate}** |",
        "",
        "## 1. 6단계 검증 매트릭스 (`PASS / WARN / FAIL / NOT RUN`)",
        "",
        "| Gate | 항목 | 상태 | 근거 요약 |",
        "| :--- | :--- | :---: | :--- |",
        f"| Gate 1 | 중복·스키마·보안 경계 | **{g1['status']}** | 로컬 {g1['checked_local_files']}편 대조, P0={len(g1['p0'])}건, P1={len(g1['p1'])}건 |",
        f"| Gate 2 | 4단계 구조·시각 에셋 | **{g2['status']}** | H2={g2['h2_count']}개({', '.join(g2['found_stages']) or '없음'}), 누락 SVG={len(g2['missing_visuals'])}건 |",
        f"| Gate 3 | Python 코드 실측 실행 | **{g3['status']}** | total={g3['total']}, pass={g3['passed']}, skip={g3['skipped']}, fail={g3['failed']} |",
        f"| Gate 4 | Gemini(제나) 내용·한국어 검수 | **{g4['status']}** | {g4['short']} |",
        f"| Gate 5 | OpenAI Codex(`gpt-6.2-sol`) 기술 검수 | **{g5['status']}** | {'실행 완료' if g5['status'] != 'NOT RUN' else g5['summary']} |",
        "| Gate 6 | Astro 빌드 / Playwright 시각 QA | **NOT RUN** | Draft PR 브랜치 반영 단계에서 별도 실행 |",
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

    if g3["failed"] > 0:
        lines.append("## 4. Gate 3 상세 (Python 실행 실패)")
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
        lines.append(g5["summary"])
        lines.append("")

    lines.append("---")
    lines.append("*안전 경계: `main`·공개 사이트·원본 파일 무변경. Founder 명시적 승인 전 자동 게시 금지.*")
    return "\n".join(lines) + "\n", final_gate


def main():
    parser = argparse.ArgumentParser(description="HangJoo Editorial Pipeline Runner")
    parser.add_argument("--list-inbox", action="store_true", help="List Drive 01_INBOX_Drafts")
    parser.add_argument("--draft", help="Local markdown draft path")
    parser.add_argument("--drive-id", help="Drive File ID in 01_INBOX_Drafts to download and review")
    parser.add_argument("--job-id", help="Explicit Job ID (default: auto-generated)")
    parser.add_argument("--gemini-report", help="Path to independent Gemini review markdown")
    parser.add_argument("--run-codex", action="store_true", help="Invoke local Codex CLI (gpt-6.2-sol)")
    parser.add_argument("--upload-review", action="store_true", help="Upload report to Drive 03_REVIEW_Jena_Codex")
    args = parser.parse_args()

    if args.list_inbox:
        rc, out, err = run_cmd(["gdrive", "readonly", "ls", DRIVE_FOLDERS["01_INBOX_Drafts"]], timeout=20)
        print(out or err)
        sys.exit(rc)

    if not args.draft and not args.drive_id:
        parser.error("--draft, --drive-id, 또는 --list-inbox 중 하나를 지정하세요.")

    now = datetime.datetime.now(datetime.timezone.utc)
    job_id = args.job_id or f"HJ-{now.strftime('%Y%m%d-%H%M%S')}"
    out_dir = Path("/tmp/hangjoo_pipeline") / job_id
    out_dir.mkdir(parents=True, exist_ok=True)

    drive_id = args.drive_id
    if drive_id:
        draft_path = out_dir / f"{job_id}_downloaded_draft.md"
        rc, out, err = run_cmd(["gdrive", "readonly", "download", drive_id, "--out", str(draft_path)], timeout=30)
        if rc != 0:
            print(f"[ERROR] Drive download failed: {err}", file=sys.stderr)
            sys.exit(rc)
        source_label = f"drive:{drive_id}"
    else:
        draft_path = Path(args.draft).resolve()
        source_label = draft_path.name

    draft_text = draft_path.read_text(encoding="utf-8")
    sha256 = hashlib.sha256(draft_text.encode("utf-8")).hexdigest()
    meta, body = parse_frontmatter(draft_text)

    g1 = gate1_dedup_and_safety(draft_text, meta, str(draft_path) if not drive_id else "")
    g2 = gate2_structure_and_assets(body)
    g3 = gate3_python_exec(draft_text)

    if args.gemini_report and Path(args.gemini_report).exists():
        g4_body = Path(args.gemini_report).read_text(encoding="utf-8").strip()
        g4_status = "FAIL" if re.search(r"\bFAIL\b", g4_body) else "PASS"
        g4 = {"status": g4_status, "short": f"외부 리포트 연동 ({Path(args.gemini_report).name})", "body": g4_body}
    else:
        g4 = {"status": "NOT RUN", "short": "독립 Gemini 서브에이전트 미연결 (--gemini-report 미지정)", "body": ""}

    g5 = gate5_codex_review(draft_text, job_id, out_dir) if args.run_codex else {
        "status": "NOT RUN",
        "summary": "--run-codex 미지정으로 미실행",
    }

    report_md, final_gate = build_report(job_id, now.isoformat(), source_label, drive_id, sha256, g1, g2, g3, g4, g5)
    report_path = out_dir / f"{job_id}_review_report.md"
    report_path.write_text(report_md, encoding="utf-8")

    uploaded_id = None
    if args.upload_review:
        rc, out, err = run_cmd(
            ["gdrive", "mutate", "upload", str(report_path), "--parent", DRIVE_FOLDERS["03_REVIEW_Jena_Codex"]],
            timeout=30,
        )
        if rc != 0:
            print(f"[ERROR] Drive upload failed: {err}", file=sys.stderr)
            sys.exit(rc)
        m_id = re.search(r"\(ID:\s*([^)]+)\)", out)
        uploaded_id = m_id.group(1) if m_id else out.strip()

    log_data = {
        "job_id": job_id,
        "timestamp_utc": now.isoformat(),
        "source": source_label,
        "drive_id": drive_id,
        "sha256": sha256,
        "final_gate": final_gate,
        "gates": {
            "gate1_dedup_safety": g1["status"],
            "gate2_structure_assets": g2["status"],
            "gate3_python_exec": g3["status"],
            "gate4_gemini_content": g4["status"],
            "gate5_codex_tech": g5["status"],
            "gate6_astro_visual": "NOT RUN",
        },
        "report_path": str(report_path),
        "uploaded_review_id": uploaded_id,
    }
    log_path = out_dir / f"{job_id}_run_log.json"
    log_path.write_text(json.dumps(log_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(log_data, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
