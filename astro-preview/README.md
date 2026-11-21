# HangJoo Astro prototype (not deployed)

An independent **Astro 7** experiment inside the existing `HJ-GJ/HangJoo` repository.
It is intentionally nested in `astro-preview/` so the current hand-built Pages site, article URL, assets and all unpublished drafts remain untouched.

## Local validation

Node.js >= 22.23.4:

```bash
cd astro-preview
npm install
npm run build
npm run check:output
npm run dev
```

Local dev uses the configured GitHub Pages base path `/HangJoo/`. Do not point GitHub Pages at `astro-preview/dist` until Founder approval and compatibility review.

## What is actually implemented

- Astro static build, MDX integration available, content collection schema validation
- Warm Editorial-inspired responsive styling, post index/search/category filter
- Original published Python Day 1 title/date/content and exact `posts/slug.html` URL target
- Three SVG diagrams from the existing repository, synchronized at build time
- Post table of contents (from Markdown h2/h3 headings)
- Existing source `content/posts/*.md` stays authoritative; migration conversion is limited to the first post
- Drafts are not loaded or published

## Clean Mint v3 design pass (approved direction, unverified prototype)

The owner selected **A · Clean Mint** from design concepts. See `docs/CLEAN_MINT_DESIGN_V3.md`.

This branch now includes:
- light mint/white design tokens, responsive article cards and semantic navigation
- original home content reorganized into **Study Notes / Projects / Library / About**
- truthful published-Python-post count (not a claimed learner completion rate)
- accessible focus skip link and reduced-motion preferences
- collapsible post table of contents and three existing article diagrams

These are **source changes only**. Node/Astro build, real-device rendering, and Pages deployment have **not** been verified from this conversation environment. Preserve the existing production site.

## Journal-style post titles and TOC

The first approved Python article has a **preview-only title**: `파이썬 기초 공부: 변수와 조건문`. Category is displayed separately. The historical Markdown, published URL and title in production remain unchanged.

Its headings are mapped in the prototype to **개념 / 실습 / 확인 / 정리** with a clean collapsible `목차` (no section count); mobile initially collapses. Other post genres are not forced to use this four-part structure.

Authoring rules for future study notes, project logs, reviews and finds: [`docs/JOURNAL_TITLES_TOC_V1.md`](docs/JOURNAL_TITLES_TOC_V1.md).

## Not implemented / pending

- Fully faithful replacement of the existing `:::formula`, `:::compare`, `:::finding` UI (the POC converts these into standard Markdown)
- Series progress, RSS, complex scraps, MDX interactive charts, full design parity
- Real device visual QA; deployed Pages QA; complete automated code execution of Python snippets
- All other posts and original drafts migration

## Copyright and provenance

The reference `smalljiny/github_blog` was **studied for architecture**, not copied; current repo's Warm Editorial palette and original article/SVG are used. Reference repository root `LICENSE` was not found when inspected. All code in `astro-preview/` is newly authored for this prototype.
