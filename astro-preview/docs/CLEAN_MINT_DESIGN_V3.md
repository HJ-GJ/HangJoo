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

## Differentiation experiment — HangJoo Notebook & Workshop (v3.1)

**Reason:** The owner liked Clean Mint but felt the preceding two-column learning cards, series/progress layout and generic tech-blog rhythm were too similar to a reference blog. This is a **proposed variant for owner visual review**, not an approved production redesign.

- Keep approved canvas, mint/charcoal palette and exact Korean hero headline. Split the headline into two lines; use mint only on the second line.
- Brand header as `HangJoo's Lab`, reflecting the owner's nickname and notebook/workshop identity.
- Homepage becomes an asymmetric **personal notebook cover** composition with a simple bespoke CSS 'HJ' mark rather than a stock image or borrowed screenshot.
- Replace series progress and photo-based card grid with **기록의 서랍** (배운 것들 / 만든 것들 / 써본 것들) and a dated **journal index** containing only actually published entries.
- Keep searchable categories, deep links, and existing article URLs. Do not display fake progress or invented portfolio achievements.
- Make Reviews & Finds and Library transparent placeholders until the owner publishes something in those sections.
- Existing article TOC remains short and functional, with concept/practice/check/summary labels. Functional ideas are not exclusive to any one reference site; the layout identity is distinct.
- Header and footer use personalized notebook language rather than impersonating a tutorial platform.
- New styles live in `src/styles/notebook.css`; the legacy `global.css` supports current article pages and is not wholesale replaced.

### Visual acceptance to decide with the owner

- Is the home page recognizable as **their own personal journal** and not as a series-course dashboard?
- Does the bespoke notebook motif add personality without making the page overly decorative?
- Are log rows easy to scan on phone / fold / desktop, with real publication dates?
- Are the empty Projects / Reviews / Library areas honest and visually quiet?
- No physical deployment, main merge, or fabricated content before owner review.

## Approved UX change — Home / All Posts separation (v3.2)

The owner confirmed that the earlier screenshot note was **not a badge overlap**: the circled notebook ornament looked like a native **emoji on mobile**. Do not describe this as a positioning defect. Replace any emoji-like decorative glyph with consistently rendered **inline SVG**.

- **Home**: keep the selected Clean Mint colors and two-line hero. Remove two redundant CTA buttons; show a locally designed, expandable HJ notebook with actual published post links. Only the three most recent published articles plus succinct Projects / Reviews / Library placeholders should appear below.
- **All Posts**: a separate static route `/HangJoo/writing.html`; dated article list and an English **left sidebar** (`BROWSE`, `CATEGORIES`, `EXPLORE`). Counts derive from published content only, not invented entries.
- **Mobile**: the left menu becomes a native collapsible `<details>` panel. No emoji decorations; vector controls and keyboard-visible focus outlines.
- **Header search**: a small magnifier SVG and accessible search panel live in the global header. Searches use a normal GET request to `writing.html?q=...` and the list filters by title, summary, category, and tags. Category sidebar links use `?category=...`.
- **Labels**: simple `최근 글` and `프로젝트와 자료` on the home page replace the more abstract earlier headings. The main post heading remains `파이썬 기초 공부: 변수와 조건문` in the Astro preview.
- Keep the article's four-part TOC and existing Python article permalink, preserve source markdown/drafts and original published site.
- This is the implementation in **Draft PR #3**. A successful build is not equivalent to a mobile visual review, accessibility audit, or production deployment.

### Gate

- [ ] All Posts page and links generated in Astro output
- [ ] Search `q`, sidebar category and result-count interactions verified on a browser
- [ ] Mobile 360/412px notebook SVG and collapsible sidebar inspected
- [ ] No unwanted horizontal scrolling at 360/412/768/1440px
- [ ] Intro headline keeps the owner-approved words and two-line treatment
- [ ] Existing article URL and three visual assets remain intact
- [ ] Founder approval before merge or Pages deployment

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
