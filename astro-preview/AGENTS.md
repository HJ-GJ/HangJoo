# HangJoo Astro — Contribution Rules

Follow the repository root `AGENTS.md` first, then these **Astro-preview-specific** rules.

1. Read `docs/CLEAN_MINT_DESIGN_V3.md` and `docs/JOURNAL_TITLES_TOC_V1.md` before touching homepage, article titles, templates or TOC.
2. The owner chose **Clean Mint** and the homepage headline **새로 배운 것들을 / 차근차근 모아두는 공간**. Do not rewrite them without approval.
3. This is a **personal learning and experience journal**, not a tutorial academy. Prefer concise, factual study-log titles. Avoid repetitive `완벽 정복`, `초보자 가이드`, `~ 이해하기` formulations.
4. For study notes, visibly distinguish **개념 / 실습 / 확인 / 정리**. The TOC toggle label is exactly **목차**; do not add a section count. Reviews and project logs may use their own natural structures.
5. Never fabricate personal experiences, errors, measured results, outcomes, screenshots, or preferences. Distinguish illustrative code and expected output from observed runs.
6. Preserve the archived original Markdown under `../content/posts/` and the NO.01 permalink. `scripts/sync-content.mjs` publishes only explicitly approved editorial Markdown from `editorial/`: NO.01 and, following the owner's 2026-11-22 direct publication request, NO.02. Do not automatically migrate any other drafts.
7. Verify `npm run build && npm run check:output`, and check the rendered UI on mobile/desktop before requesting release. If validation was not executed, say so.
8. Do not merge to `main` or switch GitHub Pages without separate Founder approval.

9. Home and All Posts are separate. Homepage is a short introduction, an HJ notebook and the latest published entries; the archive is at `/HangJoo/writing.html` and owns an English left sidebar (`BROWSE / CATEGORIES / EXPLORE`) with real data-derived counts.
10. The header magnifying-glass search uses vector SVG and forwards `q` to the archive. On mobile, the archive sidebar is a collapsible native details panel. Keep category links functional and keyboard accessible.
11. The owner's mobile visual complaint was **emoji-style rendering** of a notebook ornament, not overlapping badges. Use inline SVG or CSS-drawn decoration instead of emoji, dingbats or colored platform glyphs. Preserve reduced-motion behavior.
12. Do not recreate demo entries in production: only `getCollection('blog')` approved published posts can populate home, notebook and archive.

13. Owner-approved homepage v3.3: Projects = `직접 만든 것과 개발 기록`; Reviews = `게임과 도구 사용 기록`; Library = `참고 자료와 링크 모음`. Do not reintroduce `모을 예정입니다` filler on these cards.
14. On the animated notebook cover, use the public nickname `HangJoo` and short introduction `AI와 함께 배우고, 만들고, 일합니다.`. Animate only the decorative HJ mark, never the actual text; preserve `prefers-reduced-motion` and mobile readability.

15. Owner-approved v3.4 overrides rule 14: the **closed notebook cover** displays only the HJ central mark, SVG affordance and small open hint; do not display the person's name/intro on the closed cover. Only upon opening show the exact public name `Cho Hyeong Joo`, then `AI와 함께 배우고, 만들고, 일합니다.`, followed by real recent post links. Preserve mobile legibility, keyboard accessibility, and motion reduction.

16. v3.5 tablet guidance: an **opened notebook is one normal-flow panel**; never reintroduce an absolutely positioned, separately bordered/shadowed rectangle over the cover. Use one-column hero at <=1080px and visually inspect Fold/iPad 768/820/1024/1180 widths. Keep the HJ-only closed cover, opened Cho Hyeong Joo profile, and reduced-motion support. Do not claim a specific device bug fixed until tested on actual owner screenshots/device.

17. Owner-approved Python first-post revision (2026-11-22): absolute-beginner progression from programming language to Python/VS Code, Hello World/print, input, variables and types, operators, then conditions. Cross-check this article against the matching Python 01 class PDF and date-specific source history in the owner's NVIDIA AI Campus learning portfolio. The entire Colab Notebooks folder is a reference candidate pool; do NOT indiscriminately mix advanced ML/DL/CV notebooks into this first-day post. See docs/PYTHON_01_EDITORIAL_SOURCE_AUDIT.md and docs/NVIDIA_CAMPUS_SOURCE_POLICY.md. Never publish private class/Colab materials or invent personally executed results.
18. The historical source under ../content/posts/ remains unchanged; the revised Astro-only source is editorial/python-day1-from-zero.md, ingested by scripts/sync-content.mjs. Preserve permalink, SVGs and unpublished drafts. Keep advanced Day-03-style exercises for a later post.
19. No numeric reading-time estimate in article or All Posts listing. Topic tags and format badges share one responsive article-labels group.
20. Closed HJ notebook: no written "Click to open" hint; use gentle SVG animation with reduced-motion behavior. On opening, the top-right glyph must not overlap the close button; About link replaces redundant recent-post list.

21. For every *future* NVIDIA AI Campus learning post, use the **complete** connected Google Drive folder `Nvidia AI Campus/Colab Notebooks/` (including nested topic folders and root notebooks) and the owner's **private** NVIDIA AI Campus GitHub learning repository as eligible references in addition to the relevant lecture material. Select and reopen only topic-relevant actual files, and preserve original course sequence and first-hand vs AI-assisted authorship distinctions. Source inventory and routing: `docs/NVIDIA_CAMPUS_SOURCE_POLICY.md`.
22. Do not copy personal/connected Drive file URLs, private GitHub source code, instructor answers or copyrighted notebooks into the public blog. Do not claim every notebook has been read, executed or tested. Keep reference inventories and citation checks in internal editorial docs instead of cluttering public post prose.

23. The second approved article is `editorial/python-day2-loops-for-while.md` (NO.02, learning date 2026-10-14). Its verified class references are Python 01 repetition and Python 02 iterable/list iteration, cross-checked against dated private GitHub learning artifacts. Scope remains for/range/while/break/continue; do not copy private source code or misstate execution results. Details: `docs/PYTHON_02_EDITORIAL_AUDIT.md`. For future posts obtain new approval before publicly publishing; automation only prepares drafts.

24. Owner-directed 2026-11-22 v3.8 wide layout supersedes earlier narrow-home/sidebar-only-in-archive assumptions: one shared site-wide HJ symbol/profile rail for Home, archive and articles; top bar has All Posts/GitHub/Search, while category links derive only from approved published articles. See `docs/HANGJOO_STUDIO_V3_8_REDESIGN.md`.
25. Article view has a wider reading surface and a spacious sticky right TOC on desktop. On ≤1160px show collapsible global menu; on ≤900px place the TOC above prose. Do not duplicate navigation across archive and global rail or fabricate destination pages.
26. The HJ notebook has the same external frame dimensions open/closed; a visibly tilted CSS paper-turn effect lives inside the closed cover, with no written open hint. Keep native details/summary controls, open-panel About link, accessibility/focus and reduced-motion disabling.
27. Homepage list label is `공부 기록`, not `최근 글`; the list may show the latest six publicly approved notes while `전체 글 보기` opens the complete archive. Introduction and future posts should describe re-studying, independently searching and asking AI to understand ideas in the author's own words; do not invent personal first-hand experiences, online test results or difficulties.
28. Review-question answer/code disclosure and guided animated flow diagrams are a separate next-stage proposal, not automatically introduced or published by v3.8. Keep this PR unmerged until the owner reviews the UI and separately approves release.
