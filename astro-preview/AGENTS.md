# HangJoo Astro — Contribution Rules

Follow the repository root `AGENTS.md` first, then these **Astro-preview-specific** rules.

1. Read `docs/CLEAN_MINT_DESIGN_V3.md` and `docs/JOURNAL_TITLES_TOC_V1.md` before touching homepage, article titles, templates or TOC.
2. The owner chose **Clean Mint** and the homepage headline **새로 배운 것들을 / 차근차근 모아두는 공간**. Do not rewrite them without approval.
3. This is a **personal learning and experience journal**, not a tutorial academy. Prefer concise, factual study-log titles. Avoid repetitive `완벽 정복`, `초보자 가이드`, `~ 이해하기` formulations.
4. For study notes, visibly distinguish **개념 / 실습 / 확인 / 정리**. The TOC toggle label is exactly **목차**; do not add a section count. Reviews and project logs may use their own natural structures.
5. Never fabricate personal experiences, errors, measured results, outcomes, screenshots, or preferences. Distinguish illustrative code and expected output from observed runs.
6. The public source `../content/posts/` and historical URL are preserved during this POC; `scripts/sync-content.mjs` adapts only the one approved Python Day 1 article. Do not migrate other drafts by default.
7. Verify `npm run build && npm run check:output`, and check the rendered UI on mobile/desktop before requesting release. If validation was not executed, say so.
8. Do not merge to `main` or switch GitHub Pages without separate Founder approval.
