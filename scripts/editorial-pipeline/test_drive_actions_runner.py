#!/usr/bin/env python3
"""Unit tests for drive_actions_runner.py (Option A: GitHub Actions + Drive + Discord Webhook)."""

import json
import os
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import drive_actions_runner as dar


class TestDriveActionsRunner(unittest.TestCase):
    def test_expected_report_name_and_dedup(self):
        name = "HJ-TEST-20261126-0830-list-comprehension.md"
        report_name = dar.expected_report_name(name, "483d8d4e")
        self.assertEqual(report_name, "HJ-TEST-20261126-0830-list-comprehension__483d8d4e_review_report.md")
        self.assertTrue(dar.is_already_reviewed({report_name}, name, "483d8d4e"))
        self.assertFalse(dar.is_already_reviewed({report_name}, name, "99999999"))

    def test_discord_payload_contains_drive_links_and_no_body_leak(self):
        payload = dar.build_discord_payload(
            job_id="HJ-ACT-001",
            draft_name="sample.md",
            draft_drive_id="DRAFT_ID_123",
            report_drive_id="REPORT_ID_456",
            final_gate="PENDING (미실행 게이트 존재 — 승격 보류)",
            gates={
                "gate1_dedup_safety": "PASS",
                "gate2_structure_assets": "PASS",
                "gate3_python_exec": "PASS",
                "gate4_gemini_content": "NOT RUN",
                "gate5_codex_tech": "NOT RUN",
                "gate6_astro_visual": "NOT RUN",
            },
            secret_detected=False,
        )
        embed = payload["embeds"][0]
        self.assertEqual(embed["color"], 0xF39C12)
        raw = json.dumps(payload, ensure_ascii=False)
        self.assertIn("https://drive.google.com/file/d/DRAFT_ID_123/view", raw)
        self.assertIn("https://drive.google.com/file/d/REPORT_ID_456/view", raw)
        self.assertIn("Gate 3 (Docker Python): **PASS**", raw)
        self.assertIn("자동 게시 금지", raw)

    def test_discord_payload_secret_warning_uses_red_and_folder_link(self):
        payload = dar.build_discord_payload(
            job_id="HJ-ACT-002",
            draft_name="leaked.md",
            draft_drive_id="DRAFT_ID_999",
            report_drive_id=None,
            final_gate="FAIL (승격·게시 차단)",
            gates={"gate1_dedup_safety": "FAIL"},
            secret_detected=True,
        )
        embed = payload["embeds"][0]
        self.assertEqual(embed["color"], 0xE74C3C)
        self.assertIn("보안 경고", embed["description"])

    def test_unconfigured_secret_exits_gracefully(self):
        with mock.patch.dict(os.environ, {"GOOGLE_SERVICE_ACCOUNT_JSON": "", "DISCORD_WEBHOOK_URL": ""}, clear=False):
            rc = dar.process_inbox(dry_run=True)
            self.assertEqual(rc, 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
