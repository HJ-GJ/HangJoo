# HangJoo — Personal Journal Titles & TOC v1
Status: approved direction for Astro review branch, not yet deployed.
Owner feedback: share **what was studied and tried** rather than presenting the blog as an authoritative tutorial.

## Positioning
HangJoo can publish study notes, engineering/project notes, reviews, hobbies and useful finds. The author is sharing a personal record, not promising a comprehensive course. Preserve authentic facts, sources and dates.

## Titles: learning record, not lecture
Use short, topic-specific natural Korean. Site UI displays category separately, so avoid repeating `[Python] -` in the visible article title.

| Type | Good pattern | Avoid |
|---|---|---|
| Study log | 파이썬 공부 첫날: 변수와 조건문 / 반복문과 리스트를 공부하며 정리한 것들 | 파이썬 완벽 마스터 / 초보자를 위한 필수 강의 |
| Project log | ASCEND의 보상 처리 방식을 설계하며 고민한 점 | 절대 오류가 나지 않는 보상 시스템 |
| Review | 직접 사용한 OO의 장단점 / OO 플레이 기록 | 최고의 제품 TOP 1 (without evidence) |
| Finds | 최근 읽고 메모해 둔 OO 관련 자료 | 세상을 바꿀 새로운 기술 |

A first-person tone is allowed **only where supported by author notes or real evidence**. Never fabricate experiments, problems experienced, personal preferences, benchmarks, screenshots or opinions. Mark illustrative code outputs as `예상 출력` unless actually verified.

## Study-post organization
**Four clear major sections** are the recommended default for learning journal entries, not mandatory for reviews or project posts.

1. `## 개념 · 파이썬 실행 과정과 자료형` — what the author studied; concise explanations, concepts, and clearly labeled small demonstrations.
2. `## 실습 · 코드로 직접 확인한 것들` — illustrative runnable exercises, input, expected or observed output, and how it works.
3. `## 확인 · 실수하기 쉬운 부분` — verified issues if available; otherwise clearly labeled general cautions and boundary cases.
4. `## 정리 · 실제 어디에 활용할까?` — how the learned ideas connect to other work, review questions and non-fabricated takeaways.

Do not force exactly four sections if the post's topic demands a different structure. Avoid converting historical project records and reviews into this learning schema.

## TOC design
- Show only **목차** as the toggle label (never the heading count such as `5개 절`).
- Display small `개념` / `실습` / `확인` / `정리` tags only when corresponding major-section headings explicitly carry these prefixes.
- No unnecessary `1.`, `2.` prefixes or repeated `이론 —` nomenclature in the TOC.
- Desktop TOC begins expanded. Mobile TOC begins collapsed with a native `<details>` toggle, accessible from keyboard.
- Keep TOC links anchored to actual Markdown headings, not a separate hardcoded list.
- On posts without the explicit four prefixes, render ordinary headings without false categorical labels.

## Implementation scope
- Current preview source of truth is the existing published Markdown in `content/posts/`, unchanged.
- `astro-preview/scripts/sync-content.mjs` transforms the **single** Python Day 1 post for the Astro POC: visible title and major section headings only, plus existing custom-block adaptations.
- Existing article URL `/HangJoo/posts/2026-10-13-python-day1-basics-and-conditionals.html` and SVGs must be preserved.
- Future approved publishing should migrate the canonical article title/frontmatter and headings without changing the slug, **only after QA and owner approval**.
- Do not automatically publish drafts.

## Quality gate
Run Astro build and `npm run check:output`; verify desktop/mobile TOC, actual anchors, label clarity and no accidental new published articles. An unexecuted build must be reported as unverified.
