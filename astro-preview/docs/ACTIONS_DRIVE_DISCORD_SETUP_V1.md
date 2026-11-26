# HangJoo's Lab — GitHub Actions + Google Drive + Discord 연동 설정 가이드 v1.0

> **역할 분리:**
> - **Google Drive:** 실 파일 보관 및 내용·수정본 검수 공간 (`01_INBOX_Drafts` → `03_REVIEW_Jena_Codex` → `04_FOUNDER_Approval`)
> - **GitHub Actions (방안 A):** 매일 **06:30 / 18:00 KST** 자동 실행 → 새 원고 감지 → Gate 1(중복·보안) + Gate 2(구조) + Gate 3(Docker 완전 격리 Python 실행) → `03_REVIEW_Jena_Codex`에 보고서 업로드
> - **Discord Webhook:** 검수 완료 시 **알림 카드(Job ID, 게이트 판정, Drive 바로가기 링크)** 즉시 푸시 *(원고 전문·비밀정보는 디스코드로 전송하지 않음)*

---

## 활성화 4단계 (Founder 전용 승인·설정)

### 1단계. Google Cloud Service Account 생성
1. Google Cloud Console에서 프로젝트 선택(또는 신규 생성) → **Google Drive API** 사용 설정.
2. **IAM 및 관리자 → 서비스 계정** → 새 서비스 계정 생성 (예: `hangjoo-editorial-bot@...iam.gserviceaccount.com`).
3. 해당 서비스 계정의 **키 → 새 키 추가 → JSON** 다운로드.

### 2단계. Drive 폴더 최소 권한 공유
아래 폴더에만 서비스 계정 이메일을 공유합니다(Drive 전체 공유 금지):
- `01_INBOX_Drafts` (`17wx0TaVSjfAkdMiSM9CJGuygGR6S5RzU`): **뷰어(Viewer)**
- `03_REVIEW_Jena_Codex` (`1JCx-pDASPRjrA7RwJSllCop04Ztu9fkd`): **편집자(Editor)** *(보고서 신규 업로드 전용)*
- *(참고: `04_FOUNDER_Approval`, `05_APPROVED_Archive`는 쓰기 권한을 주지 않음)*

### 3단계. Discord Webhook URL 발급
1. 알림을 받을 Discord 서버의 채널 설정 → **연동(Integrations) → 웹후크(Webhooks) → 새 웹후크**.
2. 이름을 `HangJoo Editorial Bot`으로 지정하고 **웹후크 URL 복사**.

### 4단계. GitHub Repository Secrets 등록
`HJ-GJ/HangJoo` 저장소 → **Settings → Secrets and variables → Actions → New repository secret**:
1. `GOOGLE_SERVICE_ACCOUNT_JSON`: 1단계에서 다운로드한 JSON 파일 내용 전체
2. `DISCORD_WEBHOOK_URL`: 3단계에서 복사한 웹후크 URL

> **안전 보장:**
> - 두 Secret이 등록되기 전에는 워크플로우가 오류를 내지 않고 `NOT_CONFIGURED`로 안전 종료합니다.
> - 워크플로우 권한은 `contents: read`뿐이므로 **`main` 수정, PR 자동 병합, 공개 배포는 구조적으로 불가능**합니다.
> - 수동 테스트 시 GitHub Actions 탭 → `HangJoo Editorial Pipeline — Scheduled Drive Check & Discord Notify` → **Run workflow** (`dry_run: true`로 먼저 확인 후 `false`로 실전 테스트).
