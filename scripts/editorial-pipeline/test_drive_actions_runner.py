#!/usr/bin/env python3
"""Unit tests for drive_actions_runner.py (OAuth/SA, date+series folder organization, Discord Webhook)."""

import datetime
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

    def test_derive_folder_path_date_and_series_or_slug(self):
        now = datetime.datetime(2026, 11, 26, 15, 0, 0, tzinfo=datetime.timezone.utc)
        # Standalone draft -> (2026-11-26, list-comprehension)
        d1, t1 = dar.derive_folder_path(
            {"date": "2026-11-26"},
            "HJ-TEST-20261126-0830-list-comprehension.md",
            now,
        )
        self.assertEqual((d1, t1), ("2026-11-26", "list-comprehension"))

        # Series draft -> (2026-11-24, python-01_Python 처음 시작하기)
        d2, t2 = dar.derive_folder_path(
            {"date": "2026-11-24", "seriesKey": "python-01", "seriesTitle": "Python 처음 시작하기"},
            "2026-11-24-python-series-01-01.md",
            now,
        )
        self.assertEqual((d2, t2), ("2026-11-24", "python-01_Python 처음 시작하기"))

    def test_discord_payload_contains_drive_links_and_folder_label(self):
        payload = dar.build_discord_payload(
            job_id="HJ-ACT-001",
            draft_name="sample.md",
            draft_drive_id="DRAFT_ID_123",
            report_drive_id="REPORT_ID_456",
            folder_label="2026-11-26/list-comprehension",
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
        self.assertIn("03_REVIEW_Jena_Codex/2026-11-26/list-comprehension", raw)
        self.assertIn("https://drive.google.com/file/d/DRAFT_ID_123/view", raw)
        self.assertIn("https://drive.google.com/file/d/REPORT_ID_456/view", raw)
        self.assertIn("자동 게시 금지", raw)

    def test_unconfigured_secret_exits_gracefully(self):
        with mock.patch.dict(
            os.environ,
            {"GOOGLE_OAUTH_TOKEN_JSON": "", "GOOGLE_SERVICE_ACCOUNT_JSON": "", "DISCORD_WEBHOOK_URL": ""},
            clear=False,
        ):
            rc = dar.process_inbox(dry_run=True)
            self.assertEqual(rc, 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
