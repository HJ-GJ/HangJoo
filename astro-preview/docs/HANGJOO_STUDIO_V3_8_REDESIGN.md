# HangJoo's Lab — Wide Study Studio v3.8

**Decision date:** 2026-11-22  
**Status:** Owner-directed redesign implemented on a review branch; merge/deploy require separate review.  
**Existing production baseline:** v3.7, public NO.01 and NO.02 only.  
**Priority:** Wide workspace, calm personal identity, a notebook with a meaningful page-turn cue, authentic beginner-friendly study sharing.

## 1. Positioning

**HangJoo's Lab is a reflective personal learning archive, not an expert course platform.** The reader should encounter: what was learned in class → what needed re-study → what was researched independently → where AI helped clarify things → the resulting explanation in the author's own words. Don't assert actual personal experiments or discoveries without underlying evidence. Each article should feel like sharing a notebook with a fellow learner.

Keep the approved hero headline exactly:

> 새로 배운 것들을  
> 차근차근 모아두는 공간

New compact hero lead:

> 배운 것을 다시 찾아보고, 질문하며, 조금씩 내 것으로 만들어 가는 기록입니다.

Home section heading: **공부 기록** (not “최근 글”). Up to six actual public notes, newest-first, with **전체 글 보기** linking to the complete archive. No placeholders disguised as articles.

## 2. Information architecture and layout

### Desktop (>1160px)

```text
┌──────────────┬────────────────────────────────────────────────────────────────────┐
│ HJ.          │ HangJoo's Lab              All Posts · GitHub · Search             │
│ Cho Hyeong…  ├────────────────────────────────────────────────────────────────────┤
│              │ Home: heading and notebook, followed by 공부 기록 / projects / About│
│ EXPLORE      │                                                                    │
│ Home         │ Article: header + two-column reading region                      │
│ Study Notes  │ ┌────────────────────────────────────┬───────────────────────┐    │
│ Projects     │ │ Readable prose / code / diagrams   │ Sticky section TOC    │    │
│ Reviews      │ │ Wider than original site           │ 개념/실습/확인/정리   │    │
│ Library      │ └────────────────────────────────────┴───────────────────────┘    │
│ About        │                                                                    │
│              │ Archive: published list and topic filters                          │
│ STUDY TOPICS │                                                                    │
│ Python       │                                                                    │
└──────────────┴────────────────────────────────────────────────────────────────────┘
```

- Left rail: 208–252px with **HJ. symbol** (not a personal photo), factual name, short learning statement, main sections, and **data-derived actual public categories**.
- Top bar: functional **All Posts, GitHub, Search** only; no duplicating the full section navigation.
- Main workspace: full available width with a comfortable gutter; no 1050px site-wide cap.
- Article reading: flexible prose with an adjacent **230–260px** sticky TOC, larger gaps, active-section highlight. Content paragraph line-length remains readable rather than stretching text edge-to-edge.
- Archive: global sidebar is shared; its redundant page-local sidebar is replaced by compact topic filters.
- Projects / Reviews / Library currently point to their existing truthful informational sections on Home, **not fictitious published pages**.

### Tablet, Fold and mobile

- At **≤1160px**, sidebar becomes a keyboard/touch-friendly collapsible global menu bar; top search stays available.
- At **≤900px**, notebook hero stacks vertically and article TOC moves above content.
- At **≤600px**, narrow margins, responsive heading sizes, compact buttons, scrollable code and no horizontal overflow.
- Test at **1440, 1180, 1024, 820, 768, 412, 360px**. Real-device owner inspection is the final visual acceptance check.

## 3. Notebook interaction

- Same **outer height and width both closed and open**, with a stable page/frame position.
- Closed state: HJ mark and small SVG notebook icon only; two slightly tilted paper layers and a visible but gentle **CSS perspective page-turn** every ~7 seconds. No “Click to open” caption.
- Open state: the same cover object; the paper layers disappear and content is revealed **within that same frame**, with a small close button and About link. No second overlapping rectangular panel, no sudden grow/shrink.
- Accessible native `details/summary` toggling and focusable close control. Honor `prefers-reduced-motion` by disabling the animations.

## 4. Editorial and About voice

### About

> 안녕하세요, Cho Hyeong Joo입니다. 수업에서 새롭게 배운 내용을 그대로 지나치지 않고, 혼자 다시 공부하고 자료를 찾아보며 하나씩 이해해 나가고 있습니다. 어렵거나 헷갈리는 부분은 AI에게 다시 질문하면서 제 말로 설명할 수 있을 때까지 살펴보려고 합니다.
>
> 이 블로그에는 그렇게 배우고 확인한 과정을 차근차근 남깁니다. 처음 읽는 분도 함께 따라올 수 있도록 개념이 필요한 이유부터 코드와 예상 출력, 실수하기 쉬운 부분까지 풀어 쓰고, 더 알아본 내용은 공부 기록으로 나누고 싶습니다.

### Authoring tone rules

1. Speak as a fellow learner sharing **what was re-studied or clarified**, not as a flawless instructor. Prefer “다시 살펴보니 이런 순서로 이해하기 쉬웠습니다” over “반드시 이렇게 외워야 합니다”.
2. First introduce **why the idea matters**, then walk through a small example line-by-line, label expected/observed output correctly, then common errors and connections.
3. Preserve human narrative naturally: 2–3 related sentences per paragraph, one empty Markdown source line only for real paragraph changes; visual spacing belongs in CSS.
4. Do not manufacture emotions, difficulties, execution results or external quotes. Claims about “직접 실행했다”, “헷갈렸다”, “AI가 고쳐줬다” require grounded evidence.
5. Check lesson PDFs + topic-relevant **full Colab Notebooks tree** + the actual private NVIDIA AI Campus repository; do **not** copy private course material or notebook answers into the public site.
6. Automation drafts may run on the agreed 06:30 and 18:00 schedules but **do not publicly publish without separate owner approval**.

## 5. Phase boundary

**This PR v3.8:** shared global sidebar, wide article/home layout, notebook frame consistency and page-flip motion, section name, About and future editorial tone, responsive QA.

**Follow-on experimental work (not silently released here):** review-question hint/answer/code reveal and user-controlled animation for diagrams/tables. Build these as a separate tested PR rather than bundling them with layout changes.

## 6. Release gates

- [ ] Astro build and existing output checks pass.
- [ ] Public articles remain exactly NO.01 and NO.02 with their original URL paths.
- [ ] Desktop sidebar and article reading TOC are visible with no overlap or horizontal overflow.
- [ ] 1024/820/768/412/360px: menu toggles and TOC work with taps and keyboard; no overlapping cards.
- [ ] Notebook frame is same dimensions before/after click at desktop, tablet and mobile widths.
- [ ] Notebook page-turn is noticeable in normal motion; disabled in reduced-motion preference.
- [ ] Search, category filters, About link, original article URLs and top navigation still work.
- [ ] No private data, unapproved posts or unrelated repository contents changed.
- [ ] Actual owner reviews the device screenshots before the PR is merged and deployed.
