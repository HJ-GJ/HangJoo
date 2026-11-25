# HangJoo's Lab — Editorial Pipeline Runbook v1.0

> **목적:** Google Drive 5개 편집 폴더와 GitHub Draft PR, Gemini(제나)·Codex(`gpt-6.2-sol`) 이중 검수를 연결하는 **HangJoo 블로그 글 검증·운영 표준 절차**입니다.  
> **원칙:** Standalone First · Append-only(원본 삭제·덮어쓰기 금지) · **Founder 명시적 승인 전 자동 게시 금지**

---

## 1. 전체 흐름 (Drive 5폴더 ↔ GitHub Draft PR)

| 단계 | 위치 (Drive / GitHub) | 역할 | 금지 사항 |
| :--- | :--- | :--- | :--- |
| 1 | Drive `01_INBOX_Drafts` | 새 초안 입고 (`DRAFT`), Job ID 및 `SHA-256` 기록 | 기존 원고 덮어쓰기 금지 |
| 2 | Drive `02_SOURCE_Evidence` | 출처(교재/Colab/GitHub) ID, 열람 범위, 확인 시각 기록 | 비공개·유료 원문 외부 공개 금지 |
| 3 | Drive `03_REVIEW_Jena_Codex` | 6단계 검증 통합 보고서(`{JOB_ID}_review_report.md`) 저장 | `NOT RUN`을 `PASS`로 위장 금지 |
| 4 | Drive `04_FOUNDER_Approval` + GitHub **Draft PR** | 모든 필수 게이트 `PASS` 시 변경 전후 비교 + 시각 QA + 승인 요청 | `main` 직접 푸시·자동 병합 금지 |
| 5 | Drive `05_APPROVED_Archive` + GitHub `main` | Founder 승인 후 게시, 승인일·commit·URL 아카이브 | 이전 승인본 삭제·덮어쓰기 금지 |

---

## 2. 블로그 글 6단계 검증 체계 (Quality Gates)

새 글이나 수정 글은 아래 **6개 게이트**를 모두 통과해야 `04_FOUNDER_Approval` 및 Draft PR 승인 요청 단계로 넘어갈 수 있습니다.

| Gate | 검증 영역 | 담당 / 도구 | 주요 점검 항목 | 차단 조건 (`FAIL`) |
| :--- | :--- | :--- | :--- | :--- |
| **Gate 1** | **중복·스키마·보안 경계** | `run_review.py` | 공개 10편·로컬 초안·Drive 아카이브와 제목/해시 중복 대조, Frontmatter 필수값, 금지 표현(`완벽 정복`, `초보자 가이드`, `~ 이해하기`), API 키·비공개 Drive URL 유출 스캔 | 중복 원고 발견 또는 민감정보/비공개 URL 검출 |
| **Gate 2** | **4단계 구조·시각 에셋** | `run_review.py` | `1. 개념 / 2. 실습 / 3. 확인 / 4. 정리` 구조, `:::visual` SVG 파일 실존 여부, 복습 질문 존재 여부 | 참조된 SVG 에셋 누락 |
| **Gate 3** | **Python 코드 실측 실행** | `python3` | 본문 내 모든 `python` 코드 블록 격리 실행, 런타임 오류 검출, `예상 출력`과 실제 `stdout` 비교 *(의도적 오류·`input()` 예제는 `SKIP` 명시)* | 실행 오류(`rc != 0`) 또는 출력 불일치 1건 이상 |
| **Gate 4** | **Gemini(제나) 내용·한국어 검수** | 독립 Gemini 서브에이전트 | 개념 정확성, `왜 → 무엇 → 어떻게 → 확인 → 응용` 흐름, 한국어 자연스러움(번역투·AI투·띄어쓰기·경어체 통일), 허위 경험 창작 여부 | P0 개념 오류 또는 허위 경험 발견 |
| **Gate 5** | **Codex 기술·엣지케이스 검수** | OpenAI Codex (`gpt-6.2-sol`, `read-only`) | Python 문법·타입·경계값(예: `0`은 양수 아님, 빈 `range`, `ZeroDivisionError`), 코드-설명 불일치, 시리즈 간 상호참조 정합성 | P0 기술/출력 오류 1건 이상 |
| **Gate 6** | **Astro 빌드 & 모바일 시각 QA** | `npm run build`, `check:output`, `visual-qa.mjs` | 20개 정적 페이지 빌드, 기존 URL·아카이브 보존, 데스크톱·모바일·Galaxy Fold 가로 오버플로·가독성 점검 | 빌드/출력 검증 실패 또는 레이아웃 깨짐 |

### 판정 표기 규칙
- **`PASS`**: 실제 명령/검수를 수행하고 차단 사유가 0건인 상태
- **`WARN`**: 차단 사유(P0)는 없으나 P1/P2 다듬기 권장 항목이 있는 상태
- **`FAIL`**: P0 오류·실행 실패·보안 경계 위반이 1건 이상 발견된 상태 (**승격 즉시 차단**)
- **`NOT RUN`**: 해당 단계를 이번 실행에서 수행하지 않은 상태 (**절대 `PASS`로 표기하지 않으며, 미실행 상태에서는 `READY_FOR_FOUNDER_APPROVAL` 불가**)

---

## 3. 실행 방법 (`scripts/editorial-pipeline/run_review.py`)

```bash
# 1) Drive 01_INBOX_Drafts 새 원고 확인
python3 scripts/editorial-pipeline/run_review.py --list-inbox

# 2) 로컬 원고 정적+실행 검증 (드라이런, Drive 미변경)
python3 scripts/editorial-pipeline/run_review.py \
  --draft astro-preview/editorial/series/2026-11-24-python-series-01-01.md

# 3) Drive 원고 다운로드 + Python 실행 + Codex(gpt-6.2-sol) 독립 검수 + 03_REVIEW 업로드
python3 scripts/editorial-pipeline/run_review.py \
  --drive-id <DRIVE_FILE_ID> \
  --gemini-report /tmp/<JOB_ID>_gemini_review.md \
  --run-codex \
  --upload-review
```

- 모든 실행 로그(`{JOB_ID}_run_log.json`)와 통합 보고서(`{JOB_ID}_review_report.md`)는 `/tmp/hangjoo_pipeline/{JOB_ID}/`에 저장되므로 Git 작업 트리를 오염시키지 않습니다.

---

## 4. 안전 경계 (절대 규칙)
1. `main` 브랜치 및 공개 GitHub Pages 사이트 직접 수정 금지 (항상 리뷰 브랜치 + Draft PR).
2. `01_INBOX_Drafts` – `05_APPROVED_Archive` 원본 파일 삭제·덮어쓰기 금지 (`append-only`).
3. 비공개 교육자료(`Nvidia AI Campus` PDF/Colab 원문), API 키, 토큰 외부 공개 금지.
4. `PASS` 판정이더라도 **Founder 명시적 승인 전에는 자동 게시·병합 금지**.
