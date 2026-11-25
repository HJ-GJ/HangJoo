#!/usr/bin/env python3
"""
Unit & Integration Test Suite for HangJoo Editorial Pipeline (run_review.py).
Covers:
  1. Gate 6 fail-closed (NOT RUN / FAIL never yields READY_FOR_FOUNDER_APPROVAL)
  2. Untrusted Python code sandboxed in Docker (blocks file writes & network)
  3. Unavailable sandbox refuses host execution (NOT RUN / strict FAIL)
  4. Structured AI review parsing (empty, ambiguous, P0-inconsistent, valid JSON, explicit VERDICT)
  5. Deduplication by title, body SHA-256 (even with renamed title), and prior run logs
  6. Secret / private Drive URL leak blocking
  7. End-to-end clean draft vs faulty draft evidence preservation
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
    def test_gate6_not_run_blocks_approval(self):
        statuses = {
            "gate1_dedup_safety": "PASS",
            "gate2_structure_assets": "PASS",
            "gate3_python_exec": "PASS",
            "gate4_gemini_content": "PASS",
            "gate5_codex_tech": "PASS",
            "gate6_astro_visual": "NOT RUN",
        }
        final = rr.compute_final_gate(statuses)
        self.assertNotIn("READY_FOR_FOUNDER_APPROVAL", final)
        self.assertIn("PENDING", final)

    def test_gate6_fail_blocks_approval(self):
        statuses = {
            "gate1_dedup_safety": "PASS",
            "gate2_structure_assets": "PASS",
            "gate3_python_exec": "PASS",
            "gate4_gemini_content": "PASS",
            "gate5_codex_tech": "PASS",
            "gate6_astro_visual": "FAIL",
        }
        final = rr.compute_final_gate(statuses)
        self.assertNotIn("READY_FOR_FOUNDER_APPROVAL", final)
        self.assertIn("FAIL", final)

    def test_all_six_gates_pass_allows_approval(self):
        statuses = {
            "gate1_dedup_safety": "PASS",
            "gate2_structure_assets": "WARN",
            "gate3_python_exec": "PASS",
            "gate4_gemini_content": "PASS",
            "gate5_codex_tech": "PASS",
            "gate6_astro_visual": "PASS",
        }
        final = rr.compute_final_gate(statuses)
        self.assertIn("READY_FOR_FOUNDER_APPROVAL", final)

    def test_structured_review_fail_closed_cases(self):
        # Empty response -> FAIL
        r_empty = rr.parse_structured_review("   \n ")
        self.assertEqual(r_empty["status"], "FAIL")
        self.assertEqual(r_empty["reason"], "EMPTY_RESPONSE")

        # Ambiguous prose without structured verdict -> FAIL
        r_ambig = rr.parse_structured_review("전반적으로 괜찮아 보입니다. 문제 없어 보입니다.")
        self.assertEqual(r_ambig["status"], "FAIL")
        self.assertEqual(r_ambig["reason"], "AMBIGUOUS_OR_UNSTRUCTURED_RESPONSE")

        # Conflicting VERDICT lines -> FAIL
        r_conflict = rr.parse_structured_review("VERDICT: PASS\nVERDICT: FAIL")
        self.assertEqual(r_conflict["status"], "FAIL")

        # PASS with non-empty P0 -> FAIL
        r_inconsistent = rr.parse_structured_review(json.dumps({
            "verdict": "PASS",
            "p0": ["Critical error on line 10"],
            "p1": [],
            "p2": [],
            "summary": "bad",
        }))
        self.assertEqual(r_inconsistent["status"], "FAIL")
        self.assertEqual(r_inconsistent["reason"], "P0_INCONSISTENCY")

        # Valid JSON PASS / WARN / FAIL
        for v in ("PASS", "WARN", "FAIL"):
            res = rr.parse_structured_review(json.dumps({
                "verdict": v,
                "p0": [] if v != "FAIL" else ["err"],
                "p1": [],
                "p2": [],
                "summary": f"ok {v}",
            }))
            self.assertEqual(res["status"], v)

        # Valid explicit header
        res_hdr = rr.parse_structured_review("VERDICT: WARN\nMinor style suggestion.")
        self.assertEqual(res_hdr["status"], "WARN")

    def test_missing_gemini_file_fails(self):
        res = rr.gate4_gemini_review("/tmp/definitely_nonexistent_gemini_report_99999.md")
        self.assertEqual(res["status"], "FAIL")
        self.assertEqual(res["reason"], "FILE_NOT_FOUND")

    def test_dedup_by_title_and_body_hash_and_run_log(self):
        # 1) Title duplicate against existing published post
        dup_title_draft = CLEAN_DRAFT.replace(
            "파이썬 기초 공부: 유니크 테스트 튜플",
            "파이썬 기초 공부: 리스트·인덱싱·슬라이싱",
        )
        meta, _ = rr.parse_frontmatter(dup_title_draft)
        g1 = rr.gate1_dedup_and_safety(dup_title_draft, meta, "", check_drive=False)
        self.assertEqual(g1["status"], "FAIL")
        self.assertTrue(any("제목 중복" in x for x in g1["p0"]))

        # 2) Body SHA-256 duplicate against prior run log even with completely different title
        with tempfile.TemporaryDirectory() as tmp:
            state = Path(tmp)
            prev_dir = state / "PREV-JOB-001"
            prev_dir.mkdir()
            raw_sha, body_sha = rr.compute_hashes(CLEAN_DRAFT)
            (prev_dir / "PREV-JOB-001_run_log.json").write_text(
                json.dumps({"job_id": "PREV-JOB-001", "sha256": "other", "body_sha256": body_sha}),
                encoding="utf-8",
            )
            renamed_draft = CLEAN_DRAFT.replace("유니크 테스트 튜플", "완전히 다른 제목의 복붙 글")
            meta2, _ = rr.parse_frontmatter(renamed_draft)
            g1_hash = rr.gate1_dedup_and_safety(renamed_draft, meta2, "", state_dir=state, check_drive=False)
            self.assertEqual(g1_hash["status"], "FAIL")
            self.assertTrue(any("해시(SHA-256) 중복" in x for x in g1_hash["p0"]))

    def test_secret_and_private_url_blocked(self):
        leaked = CLEAN_DRAFT + "\nhttps://drive.google.com/file/d/1234567890/view\n"
        meta, _ = rr.parse_frontmatter(leaked)
        g1 = rr.gate1_dedup_and_safety(leaked, meta, "", check_drive=False)
        self.assertEqual(g1["status"], "FAIL")
        self.assertTrue(any("Private Google Drive URL" in x for x in g1["p0"]))

    def test_unavailable_sandbox_refuses_host_execution(self):
        fake_unavailable = lambda _img: (False, "docker daemon offline")
        g3_not_run = rr.gate3_python_exec_sandboxed(CLEAN_DRAFT, strict_sandbox=False, sandbox_checker=fake_unavailable)
        self.assertEqual(g3_not_run["status"], "NOT RUN")
        self.assertEqual(g3_not_run["sandbox"], "UNAVAILABLE")

        g3_fail = rr.gate3_python_exec_sandboxed(CLEAN_DRAFT, strict_sandbox=True, sandbox_checker=fake_unavailable)
        self.assertEqual(g3_fail["status"], "FAIL")

    def test_docker_sandbox_executes_clean_and_blocks_faulty_and_malicious(self):
        ok, info = rr.check_docker_sandbox()
        if not ok:
            self.skipTest(f"Docker sandbox unavailable in this environment: {info}")

        # Clean draft -> PASS
        g3_clean = rr.gate3_python_exec_sandboxed(CLEAN_DRAFT)
        self.assertEqual(g3_clean["status"], "PASS", g3_clean)
        self.assertEqual(g3_clean["passed"], 1)

        # Faulty draft -> FAIL
        g3_faulty = rr.gate3_python_exec_sandboxed(FAULTY_DRAFT)
        self.assertEqual(g3_faulty["status"], "FAIL", g3_faulty)
        self.assertEqual(g3_faulty["failed"], 1)

        # Malicious draft attempting filesystem write + network access -> blocked inside read-only/network=none container
        malicious_fs = """```python
open("/tmp/escape_test.txt", "w").write("pwned")
```"""
        g3_fs = rr.gate3_python_exec_sandboxed(malicious_fs)
        self.assertEqual(g3_fs["status"], "FAIL", g3_fs)
        self.assertFalse(Path("/tmp/escape_test.txt").exists())

        malicious_net = """```python
import urllib.request
urllib.request.urlopen("https://example.com", timeout=2)
```"""
        g3_net = rr.gate3_python_exec_sandboxed(malicious_net)
        self.assertEqual(g3_net["status"], "FAIL", g3_net)


if __name__ == "__main__":
    unittest.main(verbosity=2)
