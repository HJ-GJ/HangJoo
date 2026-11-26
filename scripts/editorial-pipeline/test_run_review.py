#!/usr/bin/env python3
"""
Unit & Integration Test Suite for HangJoo Editorial Pipeline (run_review.py v1.2).
Covers:
  1. Gate 6 fail-closed (NOT RUN, partial visual-only run, FAIL, missing gate keys)
  2. Untrusted Python code sandboxed in Docker (blocks file writes, network, all-skip NOT RUN)
  3. Unavailable sandbox refuses host execution (NOT RUN / strict FAIL)
  4. Structured AI review parsing (empty, ambiguous, conflicting JSON, WARN+P0, missing JSON keys, valid JSON)
  5. Secret/private URL detection blocks external Codex transmission
  6. Deduplication by title, body SHA-256, and prior run logs (both hash and title)
"""

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import run_review as rr


CLEAN_DRAFT = """---
title: "파이썬 기초 공부: 유니크 테스트 튜플"
date: "2026-11-25"
category: "Python"
section: "study"
readTime: ""
---

## 1. 개념 · 튜플 기초

튜플은 불변 시퀀스입니다.

```python
pair = (10, 20)
print(pair[0] + pair[1])
```

**예상 출력**

```text
30
```

## 2. 확인 · 복습 질문

1. 튜플은 요소를 변경할 수 있나요?
"""

FAULTY_DRAFT = """---
title: "파이썬 기초 공부: 유니크 오류 테스트"
date: "2026-11-25"
category: "Python"
section: "study"
readTime: ""
---

## 1. 개념 · 문자열

```python
s = "abc"
s[0] = "A"
print(s)
```

**예상 출력**

```text
Abc
```
"""


class TestEditorialPipeline(unittest.TestCase):
    def test_gate6_not_run_and_partial_and_fail_block_approval(self):
        # Empty dict or missing required keys -> FAIL
        self.assertIn("FAIL", rr.compute_final_gate({}))
        self.assertIn("FAIL", rr.compute_final_gate({"gate1_dedup_safety": "PASS"}))

        # Gate 6 partial execution (visual-qa only, without astro build) -> NOT RUN
        ok_runner = lambda cmd, **kw: {"command": cmd, "exit_code": 0, "stdout": "PASS", "stderr": ""}
        g6_partial = rr.gate6_astro_and_visual(run_astro=False, run_visual=True, cmd_runner=ok_runner)
        self.assertEqual(g6_partial["status"], "NOT RUN")
        self.assertEqual(g6_partial["reason"], "PARTIAL_GATE6_EXECUTION")

        # Gate 6 both astro + visual PASS -> PASS
        g6_full = rr.gate6_astro_and_visual(run_astro=True, run_visual=True, cmd_runner=ok_runner)
        self.assertEqual(g6_full["status"], "PASS")

        base = {
            "gate1_dedup_safety": "PASS",
            "gate2_structure_assets": "PASS",
            "gate3_python_exec": "PASS",
            "gate4_gemini_content": "PASS",
            "gate5_codex_tech": "PASS",
            "gate6_astro_visual": "NOT RUN",
        }
        self.assertNotIn("READY_FOR_FOUNDER_APPROVAL", rr.compute_final_gate(base))

        base["gate6_astro_visual"] = "FAIL"
        self.assertIn("FAIL", rr.compute_final_gate(base))

        base["gate6_astro_visual"] = "PASS"
        self.assertIn("READY_FOR_FOUNDER_APPROVAL", rr.compute_final_gate(base))

    def test_structured_review_fail_closed_cases(self):
        # Empty response -> FAIL
        self.assertEqual(rr.parse_structured_review("   \n ")["status"], "FAIL")

        # Ambiguous prose -> FAIL
        self.assertEqual(rr.parse_structured_review("괜찮아 보입니다.")["status"], "FAIL")

        # Conflicting JSON verdicts -> FAIL
        conflicting = (
            '{"verdict":"PASS","p0":[],"p1":[],"p2":[],"summary":"a"}\n'
            '{"verdict":"FAIL","p0":["bug"],"p1":[],"p2":[],"summary":"b"}'
        )
        r_conf = rr.parse_structured_review(conflicting, require_json=True)
        self.assertEqual(r_conf["status"], "FAIL")
        self.assertEqual(r_conf["reason"], "CONFLICTING_VERDICTS")

        # WARN with non-empty P0 -> FAIL
        r_warn_p0 = rr.parse_structured_review(
            json.dumps({"verdict": "WARN", "p0": ["Critical"], "p1": [], "p2": [], "summary": "x"}),
            require_json=True,
        )
        self.assertEqual(r_warn_p0["status"], "FAIL")
        self.assertEqual(r_warn_p0["reason"], "P0_INCONSISTENCY")

        # Missing required JSON fields when require_json=True -> FAIL
        r_missing = rr.parse_structured_review('{"verdict":"PASS"}', require_json=True)
        self.assertEqual(r_missing["status"], "FAIL")
        self.assertEqual(r_missing["reason"], "MISSING_REQUIRED_JSON_FIELDS")

        # Explicit VERDICT line rejected when require_json=True (Codex)
        self.assertEqual(rr.parse_structured_review("VERDICT: PASS", require_json=True)["status"], "FAIL")
        self.assertEqual(rr.parse_structured_review("VERDICT: WARN", require_json=False)["status"], "WARN")

        # Valid complete JSON PASS / WARN / FAIL
        for v in ("PASS", "WARN", "FAIL"):
            res = rr.parse_structured_review(
                json.dumps({"verdict": v, "p0": [] if v != "FAIL" else ["err"], "p1": [], "p2": [], "summary": "ok"}),
                require_json=True,
            )
            self.assertEqual(res["status"], v)

    def test_secret_detection_blocks_codex_transmission(self):
        leaked = CLEAN_DRAFT + "\nhttps://drive.google.com/file/d/1234567890/view\n"
        meta, _ = rr.parse_frontmatter(leaked)
        g1 = rr.gate1_dedup_and_safety(leaked, meta, "", check_drive=False)
        self.assertEqual(g1["status"], "FAIL")
        self.assertTrue(g1["secret_detected"])

        with tempfile.TemporaryDirectory() as tmp:
            g5 = rr.gate5_codex_review(leaked, "TEST-SECRET", Path(tmp), secret_detected=g1["secret_detected"])
            self.assertEqual(g5["status"], "FAIL")
            self.assertEqual(g5["reason"], "BLOCKED_BY_SECRET_SCAN")

    def test_missing_gemini_file_fails(self):
        res = rr.gate4_gemini_review("/tmp/definitely_nonexistent_gemini_report_99999.md")
        self.assertEqual(res["status"], "FAIL")
        self.assertEqual(res["reason"], "FILE_NOT_FOUND")

    def test_dedup_by_title_body_hash_and_prior_run_log(self):
        dup_title_draft = CLEAN_DRAFT.replace(
            "파이썬 기초 공부: 유니크 테스트 튜플",
            "파이썬 기초 공부: 리스트·인덱싱·슬라이싱",
        )
        meta, _ = rr.parse_frontmatter(dup_title_draft)
        g1 = rr.gate1_dedup_and_safety(dup_title_draft, meta, "", check_drive=False)
        self.assertEqual(g1["status"], "FAIL")

        with tempfile.TemporaryDirectory() as tmp:
            state = Path(tmp)
            prev_dir = state / "PREV-JOB-001"
            prev_dir.mkdir()
            _, body_sha = rr.compute_hashes(CLEAN_DRAFT)
            (prev_dir / "PREV-JOB-001_run_log.json").write_text(
                json.dumps({"job_id": "PREV-JOB-001", "title": "과거 제목", "sha256": "x", "body_sha256": body_sha}),
                encoding="utf-8",
            )
            renamed_draft = CLEAN_DRAFT.replace("유니크 테스트 튜플", "완전히 다른 제목의 복붙 글")
            meta2, _ = rr.parse_frontmatter(renamed_draft)
            g1_hash = rr.gate1_dedup_and_safety(renamed_draft, meta2, "", state_dir=state, check_drive=False)
            self.assertEqual(g1_hash["status"], "FAIL")
            self.assertTrue(any("해시(SHA-256) 중복" in x for x in g1_hash["p0"]))

    def test_unavailable_sandbox_and_all_skipped_blocks(self):
        fake_unavailable = lambda _img: (False, "docker daemon offline")
        self.assertEqual(
            rr.gate3_python_exec_sandboxed(CLEAN_DRAFT, strict_sandbox=False, sandbox_checker=fake_unavailable)["status"],
            "NOT RUN",
        )
        self.assertEqual(
            rr.gate3_python_exec_sandboxed(CLEAN_DRAFT, strict_sandbox=True, sandbox_checker=fake_unavailable)["status"],
            "FAIL",
        )

        all_skip_draft = "```python\nname = input('name: ')\n```"
        fake_ok = lambda _img: (True, "mock-docker")
        g3_skip = rr.gate3_python_exec_sandboxed(all_skip_draft, sandbox_checker=fake_ok)
        self.assertEqual(g3_skip["status"], "NOT RUN")

    def test_docker_sandbox_executes_clean_and_blocks_faulty_and_malicious(self):
        ok, info = rr.check_docker_sandbox()
        if not ok:
            self.skipTest(f"Docker sandbox unavailable: {info}")

        self.assertEqual(rr.gate3_python_exec_sandboxed(CLEAN_DRAFT)["status"], "PASS")
        self.assertEqual(rr.gate3_python_exec_sandboxed(FAULTY_DRAFT)["status"], "FAIL")

        malicious_fs = '```python\nopen("/tmp/escape_test.txt", "w").write("pwned")\n```'
        self.assertEqual(rr.gate3_python_exec_sandboxed(malicious_fs)["status"], "FAIL")
        self.assertFalse(Path("/tmp/escape_test.txt").exists())

        malicious_net = '```python\nimport urllib.request\nurllib.request.urlopen("https://example.com", timeout=2)\n```'
        self.assertEqual(rr.gate3_python_exec_sandboxed(malicious_net)["status"], "FAIL")


if __name__ == "__main__":
    unittest.main(verbosity=2)
