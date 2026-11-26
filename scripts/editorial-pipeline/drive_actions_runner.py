#!/usr/bin/env python3
"""
HangJoo's Lab — GitHub Actions Drive Poller, Date/Series Organizer & Discord Notifier

Auth modes (auto-selected):
  1. GOOGLE_OAUTH_TOKEN_JSON (Recommended for personal Google Drive):
     JSON containing client_id, client_secret, refresh_token (and optional token_uri).
     Uses the owner's Drive storage quota -> supports creating YYYY-MM-DD / series subfolders & uploading reports.
  2. GOOGLE_SERVICE_ACCOUNT_JSON (Fallback / Read-only on personal Drive):
     Can read 01_INBOX_Drafts; on personal Drive, upload may hit storageQuotaExceeded (handled gracefully
     so Discord notification + GitHub Actions artifact backup still succeed).

Folder organization inside 03_REVIEW_Jena_Codex:
  03_REVIEW_Jena_Codex / <YYYY-MM-DD> / <seriesKey or draft-slug> / <draft>__<sha8>_review_report.md
"""

import argparse
import datetime
import io
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import run_review as rr

INBOX_FOLDER_ID = rr.DRIVE_FOLDERS["01_INBOX_Drafts"]
REVIEW_FOLDER_ID = rr.DRIVE_FOLDERS["03_REVIEW_Jena_Codex"]


def build_drive_service():
    """Build Google Drive v3 client from OAuth refresh token (preferred) or Service Account."""
    oauth_json = os.environ.get("GOOGLE_OAUTH_TOKEN_JSON", "").strip()
    sa_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip()
    if not oauth_json and not sa_json:
        return None, "none"

    from googleapiclient.discovery import build

    if oauth_json:
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials

        info = json.loads(oauth_json)
        creds = Credentials(
            token=info.get("token"),
            refresh_token=info["refresh_token"],
            token_uri=info.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id=info["client_id"],
            client_secret=info["client_secret"],
            scopes=["https://www.googleapis.com/auth/drive"],
        )
        if not creds.valid:
            creds.refresh(Request())
        return build("drive", "v3", credentials=creds, cache_discovery=False), "oauth"

    sa_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip()
    if sa_json:
        from google.oauth2 import service_account

        info = json.loads(sa_json)
        creds = service_account.Credentials.from_service_account_info(
            info,
            scopes=["https://www.googleapis.com/auth/drive"],
        )
        return build("drive", "v3", credentials=creds, cache_discovery=False), "service_account"

    return None, "none"


def list_folder_items(service, folder_id, recursive_md=False):
    q = f"'{folder_id}' in parents and trashed = false"
    resp = (
        service.files()
        .list(q=q, fields="files(id, name, mimeType, modifiedTime, size)", pageSize=200)
        .execute()
    )
    items = resp.get("files", [])
    if not recursive_md:
        return items

    results = list(items)
    for it in items:
        if it.get("mimeType") == "application/vnd.google-apps.folder":
            results.extend(list_folder_items(service, it["id"], recursive_md=True))
    return results


def ensure_subfolder(service, parent_id: str, folder_name: str) -> str:
    """Find an existing non-trashed subfolder by name or create one."""
    safe_name = folder_name.replace("'", "\\'")
    q = (
        f"'{parent_id}' in parents and trashed = false "
        f"and mimeType = 'application/vnd.google-apps.folder' and name = '{safe_name}'"
    )
    resp = service.files().list(q=q, fields="files(id, name)", pageSize=10).execute()
    existing = resp.get("files", [])
    if existing:
        return existing[0]["id"]

    created = (
        service.files()
        .create(
            body={
                "name": folder_name,
                "mimeType": "application/vnd.google-apps.folder",
                "parents": [parent_id],
            },
            fields="id, name",
        )
        .execute()
    )
    return created["id"]


def derive_folder_path(meta: dict, draft_name: str, now_utc: datetime.datetime) -> tuple[str, str]:
    """
    Determine (date_folder, topic_folder) for 03_REVIEW_Jena_Codex.
    - date_folder: frontmatter `date` if YYYY-MM-DD, else UTC today
    - topic_folder: `seriesKey` / `seriesTitle` if part of a series, else clean stem slug
    """
    raw_date = str(meta.get("date", "")).strip()
    date_folder = raw_date if re.match(r"^\d{4}-\d{2}-\d{2}$", raw_date) else now_utc.strftime("%Y-%m-%d")

    series_key = str(meta.get("seriesKey", "")).strip()
    series_title = str(meta.get("seriesTitle", "")).strip()
    if series_key and series_title:
        topic_folder = f"{series_key}_{re.sub(r'[\\\\/:*?\"<>|]', '-', series_title)}"
    elif series_key:
        topic_folder = series_key
    else:
        stem = Path(draft_name).stem
        topic_folder = re.sub(r"^(HJ-TEST-\d{8}-\d{4}-|\d{4}-\d{2}-\d{2}-)", "", stem) or stem
    return date_folder, topic_folder


def download_drive_file(service, file_id, dest_path: Path):
    from googleapiclient.http import MediaIoBaseDownload

    req = service.files().get_media(fileId=file_id)
    buf = io.BytesIO()
    downloader = MediaIoBaseDownload(buf, req)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    dest_path.write_bytes(buf.getvalue())


def upload_markdown_file(service, local_path: Path, folder_id: str):
    from googleapiclient.http import MediaFileUpload

    metadata = {"name": local_path.name, "parents": [folder_id]}
    media = MediaFileUpload(str(local_path), mimetype="text/markdown", resumable=False)
    return (
        service.files()
        .create(body=metadata, media_body=media, fields="id, name, webViewLink")
        .execute()
    )


def expected_report_name(draft_name: str, short_sha: str) -> str:
    stem = Path(draft_name).stem
    return f"{stem}__{short_sha}_review_report.md"


def is_already_reviewed(existing_review_names, draft_name: str, short_sha: str) -> bool:
    return expected_report_name(draft_name, short_sha) in existing_review_names


def build_discord_payload(
    *,
    job_id: str,
    draft_name: str,
    draft_drive_id: str,
    report_drive_id: str | None,
    folder_label: str,
    final_gate: str,
    gates: dict,
    secret_detected: bool = False,
    upload_note: str = "",
):
    """Build a safe Discord Webhook embed payload (metadata + Drive links only; zero body/secret leak)."""
    if "FAIL" in final_gate:
        color = 0xE74C3C
    elif "READY_FOR_FOUNDER_APPROVAL" in final_gate:
        color = 0x2ECC71
    else:
        color = 0xF39C12

    draft_url = f"https://drive.google.com/file/d/{draft_drive_id}/view"
    report_url = (
        f"https://drive.google.com/file/d/{report_drive_id}/view"
        if report_drive_id
        else f"https://drive.google.com/drive/folders/{REVIEW_FOLDER_ID}"
    )

    gate_lines = [
        f"- Gate 1 (중복·보안): **{gates.get('gate1_dedup_safety', 'NOT RUN')}**",
        f"- Gate 2 (구조·에셋): **{gates.get('gate2_structure_assets', 'NOT RUN')}**",
        f"- Gate 3 (Docker Python): **{gates.get('gate3_python_exec', 'NOT RUN')}**",
        f"- Gate 4 (Gemini 검수): **{gates.get('gate4_gemini_content', 'NOT RUN')}**",
        f"- Gate 5 (Codex 검수): **{gates.get('gate5_codex_tech', 'NOT RUN')}**",
        f"- Gate 6 (Astro/시각 QA): **{gates.get('gate6_astro_visual', 'NOT RUN')}**",
    ]

    description = (
        f"**최종 판정:** `{final_gate}`\n"
        + (f"**저장 위치:** `03_REVIEW_Jena_Codex/{folder_label}`\n" if folder_label else "")
        + ("⚠️ **보안 경고:** 민감정보 또는 비공개 링크가 검출되어 Drive 보고서 업로드를 차단했습니다.\n" if secret_detected else "")
        + (f"ℹ️ **업로드 참고:** {upload_note}\n" if upload_note else "")
        + "\n".join(gate_lines)
    )

    return {
        "username": "HangJoo Editorial Bot",
        "embeds": [
            {
                "title": f"[HangJoo 검수 알림] {draft_name}",
                "description": description,
                "color": color,
                "fields": [
                    {"name": "Job ID", "value": f"`{job_id}`", "inline": True},
                    {"name": "원본 원고 (Drive)", "value": f"[01_INBOX 열기]({draft_url})", "inline": True},
                    {"name": "검수 보고서 (Drive)", "value": f"[03_REVIEW 열기]({report_url})", "inline": True},
                ],
                "footer": {"text": "실 파일·내용 검수는 Google Drive에서 진행 · 자동 게시 금지 (Founder 승인 필수)"},
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            }
        ],
    }


def send_discord_webhook(webhook_url: str, payload: dict, timeout: int = 15):
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        webhook_url,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "HangJoo-Editorial-Pipeline/1.0"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return {"ok": 200 <= resp.status < 300, "status": resp.status}
    except urllib.error.HTTPError as exc:
        return {"ok": False, "status": exc.code, "error": str(exc)}
    except Exception as exc:
        return {"ok": False, "status": 0, "error": str(exc)}


def process_inbox(*, dry_run: bool = False, max_files: int = 1, state_dir: str = "/tmp/hangjoo_actions_pipeline"):
    webhook_url = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
    service, auth_mode = build_drive_service()

    if not service:
        print(
            json.dumps(
                {
                    "status": "NOT_CONFIGURED",
                    "reason": "Neither GOOGLE_OAUTH_TOKEN_JSON nor GOOGLE_SERVICE_ACCOUNT_JSON is set.",
                    "processed": [],
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 0

    inbox_files = [
        f for f in list_folder_items(service, INBOX_FOLDER_ID, recursive_md=False)
        if f.get("name", "").lower().endswith(".md")
    ]
    existing_reviews = {
        f.get("name", "")
        for f in list_folder_items(service, REVIEW_FOLDER_ID, recursive_md=True)
        if f.get("mimeType") != "application/vnd.google-apps.folder"
    }

    processed = []
    state_root = Path(state_dir)
    state_root.mkdir(parents=True, exist_ok=True)
    had_upload_error = False

    for item in inbox_files:
        if len(processed) >= max_files:
            break
        file_id = item["id"]
        name = item["name"]
        now = datetime.datetime.now(datetime.timezone.utc)
        job_id = f"HJ-ACT-{now.strftime('%Y%m%d-%H%M%S')}-{file_id[:6]}"
        out_dir = state_root / job_id
        out_dir.mkdir(parents=True, exist_ok=True)

        local_draft = out_dir / name
        download_drive_file(service, file_id, local_draft)
        draft_text = local_draft.read_text(encoding="utf-8")
        raw_sha, body_sha = rr.compute_hashes(draft_text)
        short_sha = raw_sha[:8]

        if is_already_reviewed(existing_reviews, name, short_sha):
            processed.append({"name": name, "file_id": file_id, "status": "SKIPPED_ALREADY_REVIEWED", "sha": short_sha})
            continue

        meta, body = rr.parse_frontmatter(draft_text)
        date_folder, topic_folder = derive_folder_path(meta, name, now)
        folder_label = f"{date_folder}/{topic_folder}"

        g1 = rr.gate1_dedup_and_safety(draft_text, meta, "", state_dir=state_root, check_drive=False)
        g2 = rr.gate2_structure_and_assets(body)
        g3 = rr.gate3_python_exec_sandboxed(draft_text, strict_sandbox=False)
        g4 = {"status": "NOT RUN", "reason": "MANUAL_OR_SESSION_GEMINI_PENDING", "short": "Antigravity 세션/Gemini 검수 대기", "parsed": None, "body": ""}
        g5 = {"status": "NOT RUN", "reason": "MANUAL_OR_SESSION_CODEX_PENDING", "summary": "Antigravity 세션/Codex 검수 대기", "exit_code": None, "parsed": None}
        g6 = rr.gate6_astro_and_visual(run_astro=False, run_visual=False)

        report_md, final_gate, gate_statuses = rr.build_report(
            job_id, now.isoformat(), name, file_id, raw_sha, body_sha, g1, g2, g3, g4, g5, g6
        )
        report_filename = expected_report_name(name, short_sha)
        report_path = out_dir / report_filename
        report_path.write_text(report_md, encoding="utf-8")

        uploaded_id = None
        upload_note = ""
        if not dry_run and not g1["secret_detected"]:
            try:
                date_id = ensure_subfolder(service, REVIEW_FOLDER_ID, date_folder)
                topic_id = ensure_subfolder(service, date_id, topic_folder)
                created = upload_markdown_file(service, report_path, topic_id)
                uploaded_id = created.get("id")
            except Exception as exc:
                had_upload_error = True
                upload_note = (
                    "Service Account는 개인 Drive 저장 용량이 없어 파일 업로드가 제한됨 "
                    "(GOOGLE_OAUTH_TOKEN_JSON 등록 필요). 보고서는 Actions 아티팩트에 백업됨."
                    if "storageQuotaExceeded" in str(exc)
                    else f"Drive 업로드 실패: {str(exc)[:120]}"
                )

        discord_res = {"ok": False, "skipped": True}
        if webhook_url and not dry_run:
            payload = build_discord_payload(
                job_id=job_id,
                draft_name=name,
                draft_drive_id=file_id,
                report_drive_id=uploaded_id,
                folder_label=folder_label,
                final_gate=final_gate,
                gates=gate_statuses,
                secret_detected=g1["secret_detected"],
                upload_note=upload_note,
            )
            discord_res = send_discord_webhook(webhook_url, payload)

        processed.append({
            "job_id": job_id,
            "auth_mode": auth_mode,
            "name": name,
            "file_id": file_id,
            "sha": short_sha,
            "folder_path": folder_label,
            "final_gate": final_gate,
            "gates": gate_statuses,
            "uploaded_review_id": uploaded_id,
            "upload_note": upload_note,
            "discord": discord_res,
            "dry_run": dry_run,
        })

    print(json.dumps({"status": "OK" if not had_upload_error else "PARTIAL_UPLOAD_ERROR", "auth_mode": auth_mode, "processed": processed}, ensure_ascii=False, indent=2))
    return 0


def main():
    parser = argparse.ArgumentParser(description="HangJoo GitHub Actions Drive Poller & Discord Notifier")
    parser.add_argument("--dry-run", action="store_true", help="Do not upload to Drive or post to Discord")
    parser.add_argument("--max-files", type=int, default=1, help="Max new drafts to process per scheduled run")
    args = parser.parse_args()
    sys.exit(process_inbox(dry_run=args.dry_run, max_files=args.max_files))


if __name__ == "__main__":
    main()
