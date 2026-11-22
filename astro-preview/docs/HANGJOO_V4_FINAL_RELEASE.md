# HangJoo's Lab v4.0 — Final Compact Learning Archive

**Owner approval:** 2026-11-23 · User requested implementation and public release once validated.

## Design decisions

1. One global **English left menu**. Centered HJ icon, clickable HangJoo's Lab brand (Home), Cho Hyeong Joo, All Posts, CATEGORIES (Study Notes, Projects, Useful Info, Reviews), OTHER (About, GitHub profile, Search). Remove top-header navigation, Latest/Recent sidebar shortcut, and needless prose. Four categories use distinct **18px icons with consistent outline weight**.
2. Use a **smaller sticky white rounded sidebar card** on desktop rather than a full-height grey panel. On phone/Fold widths the navigation collapses into a summary bar. Search goes to the real All Posts search form.
3. Explicit visitor statistics: the sidebar displays a neutral **—** until a real visitor analytics provider is connected. No fabricated counts or background tracking.
4. Return to a quieter reading size: Home width ~1060px, article width ~1080px, right TOC ~210px, body text line length ~76ch. Responsive for PC, iPad, Fold and phone.
5. Keep 3D **hinged-cover book** (from owner-provided `HangJoo_Lab_Interactive_Concept(2).html`) with original subtle orbital decoration and two tiny stickers, `LITTLE DISCOVERIES` and `KEEP LEARNING`. Reduced-motion and existing click/keyboard behaviors stay intact.
6. Render original editorial issue IDs in lists: **NO.01 remains 01**, **NO.02 remains 02**, even when newest post sorts first.
7. Number every editorial main chapter `1.`, `2.`, etc., and subordinate topics `1-1.`, `1-2.`, etc. The actual Markdown file includes this numbering, suitable for note taking. Legacy section anchor aliases are included to reduce broken deep links; titles, publication dates and article permalinks are unchanged.
8. Fix `for/while` flowchart by rearranging arrows, boxes and the **아니오 / 거짓** labels within the 940×485 SVG viewBox instead of shrinking text or altering illustration semantics.

## Safety / verification

- Retain both approved posts and their original URL filenames. Keep all original archived Markdown, private course documents, Colab notebooks and unapproved drafts intact.
- Keep a maximum of exactly 2 published Astro article HTML routes. Do not invent new content.
- Run Astro build/output validation plus Playwright at 1440, 1180, 1024, 820, 768, 412, 360 widths. Test category search, reader TOC, no horizontal overflow, book open/close, reduced motion and heading-number generation.
- Existing static GitHub Pages does **not** provide dependable visitor analytics. Until a provider is approved and installed, no invented visitor count.
- Approve merging to main and GitHub Pages deployment only after automated tests pass.
