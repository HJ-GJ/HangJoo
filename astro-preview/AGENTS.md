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

9. Home and All Posts are separate. Homepage is a short introduction, an HJ notebook and the latest published entries; the archive is at `/HangJoo/writing.html` and owns an English left sidebar (`BROWSE / CATEGORIES / EXPLORE`) with real data-derived counts.
10. The header magnifying-glass search uses vector SVG and forwards `q` to the archive. On mobile, the archive sidebar is a collapsible native details panel. Keep category links functional and keyboard accessible.
11. The owner's mobile visual complaint was **emoji-style rendering** of a notebook ornament, not overlapping badges. Use inline SVG or CSS-drawn decoration instead of emoji, dingbats or colored platform glyphs. Preserve reduced-motion behavior.
12. Do not recreate demo entries in production: only `getCollection('blog')` approved published posts can populate home, notebook and archive.

13. Owner-approved homepage v3.3: Projects = `직접 만든 것과 개발 기록`; Reviews = `게임과 도구 사용 기록`; Library = `참고 자료와 링크 모음`. Do not reintroduce `모을 예정입니다` filler on these cards.
14. On the animated notebook cover, use the public nickname `HangJoo` and short introduction `AI와 함께 배우고, 만들고, 일합니다.`. Animate only the decorative HJ mark, never the actual text; preserve `prefers-reduced-motion` and mobile readability.
