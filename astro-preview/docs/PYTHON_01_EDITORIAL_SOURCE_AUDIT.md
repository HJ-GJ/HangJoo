# HangJoo Python NO. 01 — Editorial source and preservation audit

Date: 2026-11-22

## Requested owner feedback

- Remove the numeric reading-time estimate (`15분`).
- Fix article header tags and study badges wrapping on tablet/mobile.
- On closed HJ notebook, replace the written “Click to open / 펼쳐보기” with a subtle SVG/CSS affordance.
- On opened HJ notebook, hide the overlapping notebook glyph and use the panel to link to an author introduction, instead of duplicating the “Recent Posts” list already on Home.
- Make the first Python post a genuine entry point for an absolute beginner. Do not mix in advanced exercises identified in feedback as “Day 03” traces.
- Preserve original published URL and original markdown, even while improving the Astro presentation.

## Primary learning evidence actually inspected

- Owner's connected Drive file: **[python] 01. 파이썬 기초.pdf** (Google Drive PDF; accessed via connected Drive and extracted text).
- Contents observed: programming language introduction, Python description/uses and installation, VS Code setup and first `.py` / Hello World execution, `print` with `end` and `sep`, `input`, variables, `int/float/str/bool`, casting, arithmetic/comparison/logical/membership operators, `if/else/elif`, and further loops.
- The first post uses the **introductory subset only**, arranged for a complete novice. Loops and advanced time/leap-year/triangle tasks are set aside for later articles.
- Wording and code examples in `editorial/python-day1-from-zero.md` are original explanatory rewrites. **Examples are labeled with expected outputs**, not unverified claims of actual execution.
- The PDF file itself is not added to this public repository, and no private connected-Drive link is published.

## Source and publication boundaries

- **Canonical historical markdown, retained unchanged:** `content/posts/2026-10-13-python-day1-basics-and-conditionals.md`.
- **New owner-reviewed Astro editorial source:** `astro-preview/editorial/python-day1-from-zero.md`.
- **Published permalink, unchanged:** `/HangJoo/posts/2026-10-13-python-day1-basics-and-conditionals.html`.
- **Astro content ingestion:** `astro-preview/scripts/sync-content.mjs` loads the editorial Markdown, preserves original file and copying of the original SVG assets.
- **Public content scope:** Only the approved Python NO. 01; drafts not published.
- **Illustrations shown in the new article:** input conversion and branching flow diagrams. The historical time-flow SVG is preserved as an asset but no longer embedded in this introductory article.
- Keep source-referenced claims precise: the lecture's simplified descriptions are treated as pedagogical summaries, and any technical refinement (e.g. CPython bytecode and floor-division behavior) is presented as an explanatory clarification, not a claim that the lecture made those exact statements.

## Acceptance criteria

- Four article sections in order: `개념 / 실습 / 확인 / 정리`.
- Genuine first-principles orientation (what programming is, Python, editor and environment, Hello World) before variables and conditions.
- Copyable complete examples with distinguished expected outputs and no fabricated personal testing or results.
- No visible numeric reading-time estimate on article or All Posts listing.
- Tags and badges wrap coherently on 360/412/768/1024px layouts.
- Closed notebook retains HJ + SVG affordance; opened notebook includes owner name/AI bio, close control and an About navigation.
- Existing Python post URL stable; historical source preserved, other drafts unpublished.
- CI build and regression tests pass; real-device validation is a separate acceptance step.
