# HangJoo — Clean Mint Learning Studio v3

**Decision:** User selected the bright **A / Clean Mint** palette and approved the proposed Home → Study Notes → Projects → Library → About organization.  
**State:** Design direction approved; Astro implementation on Draft PR #3 remains a prototype, **not** a production release.

## Approved homepage headline

- Hero title: **새로 배운 것들을 차근차근 모아두는 공간** (exact wording chosen by the owner, 2026-11-20)
- This is the hero headline, **not** the blog's brand name. Brand naming and article titles remain separate decisions.
- Keep the phrasing simple; a visual line break on wide screens is acceptable, but do not rewrite its words without owner approval.

## Purpose

Create a distinctive personal engineering journal and educational reference: a pleasant bright interface with meaningful learning diagrams, readable code, structured series, and transparent project evidence. Inspiration for features may come from public blogs, but do not copy their visual identity or source code.

## Tokens

| Use | Color |
|---|---|
| Canvas | `#F7FAF9` |
| Cards, article surfaces | `#FFFFFF` |
| Brand / focus cues | `#168574` |
| Primary text | `#202B2A` |
| Secondary text | `#64736E` |
| Soft supporting surface | `#E6F5F0` |
| Dividers | `#DFE9E5` |
| Dark code background | `#202B2A` |

Use a strong accessible contrast for small text and controls. Do not depend solely on green color to convey state.

## Information architecture

- **Home:** short hero, direct study/project links, a truthful summary of published learning content, recent article cards.
- **Study Notes:** searchable category list and later series navigation. Display **published counts**, not a fabricated user's learning completion metric.
- **Projects:** separate narrative for verified engineering work; until published articles exist, only a descriptive placeholder.
- **Library:** future curated official documentation / verified articles / notebook files; until published sources exist, display a transparent placeholder.
- **About:** factual author/profile text only, no invented qualifications or achievements.

## Article page

1. Breadcrumb/back link, category, original article date and read time.
2. Prominent title and concise lead; keep article prose, examples, outputs and diagrams intact.
3. Collapsible TOC with linked section headings. Mobile TOC appears before body; desktop TOC in a side rail.
4. Diagram adjacent to relevant theory; simple borders and responsive SVG.
5. Code blocks with readable dark background. Copy controls, downloadable notebooks, series progress and reading progress are optional later phases and require actual implementation/testing.
6. Recap + relevant next article after additional articles exist.

## Rules for new content

- Keep first Python post in the existing Markdown source as the single source of truth.
- Do not silently publish other drafts, invent measured values or produce fake project statuses.
- Existing public post URL `/HangJoo/posts/2026-10-13-python-day1-basics-and-conditionals.html` must remain stable in migration.
- Preserve all original 3 SVGs and semantic accessible text.
- Preserve current Pages site until an isolated POC is proven good and Founder approves the switch.
- This spec describes the desired design, **not proof of device QA or CI success**.

## Journal content direction (review branch)

- The author prefers personal learning records and shared experience over comprehensive tutorial or instructional titles.
- Python Day 1 is previewed as **파이썬 기초 공부: 변수와 조건문**. Original source markdown, date, article URL and SVGs remain unchanged.
- Article major sections and TOC are labeled **개념 / 실습 / 확인 / 정리**. Toggle simply reads **목차**, not `N개 절`.
- See [`JOURNAL_TITLES_TOC_V1.md`](JOURNAL_TITLES_TOC_V1.md). Avoid inventing first-hand troubleshooting or executed results.

## Verification gate before merge or switching GitHub Pages

- [ ] `cd astro-preview && npm install && npm run build && npm run check:output`
- [ ] Native or browser visual comparison at widths 360, 412, 768, and desktop 1440px
- [ ] Home category search, links, keyboard navigation and TOC expand/collapse work
- [ ] All three diagrams fit without overlap or clipping
- [ ] Existing first article stays on the same URL and authoring Markdown remains unchanged
- [ ] No unpublished posts were exposed
- [ ] Contrast/focus state/alt captions checked
- [ ] External deployment and `main` merge require separate Founder approval
