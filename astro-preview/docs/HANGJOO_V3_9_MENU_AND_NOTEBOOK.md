# HangJoo's Lab v3.9 — Clean Menu and Original Hinged Notebook

**Date:** 2026-11-22  
**State:** Owner-requested changes on review branch, not automatically merged or published.  
**Reference:** User-uploaded local file `HangJoo_Lab_Interactive_Concept(1).html` and three annotated screenshots in conversation.

## 1. Requirements, mapping and source fidelity

### User screenshot #3 — clean menu

- The screenshot shows a compact left rail with a simple HangJoo's Lab title, grouped rows, fine dividers, category counts and a minimal About section.
- Keep global rail width and responsive native mobile menu introduced in v3.8, but simplify its content to:
  - **바로가기:** 홈, Recent · 최신 글, 전체 글
  - **카테고리:** 공부 기록, 프로젝트, 유용한 정보, 리뷰 (counts from approved public `getCollection('blog')` only)
  - **기타:** 소개
- Small outline icons accompany navigation labels; avoid extra ornamental elements and long filler messages.
- Remove the unnecessary bottom quote/note `배우고, 다시 찾아보고, 내 말로 정리하는 공간.`.
- `GitHub` in the top menu points to **https://github.com/HJ-GJ** (account profile), not the `HJ-GJ/HangJoo` repository; align footer destination.
- Keep search, Recent anchor, section filters and published post URLs unchanged.

### User screenshot #2 and uploaded original interactive notebook

The v3.8 notebook approximated a page flip using multiple overlapping `summary::before`/`::after` rectangles. The screenshot revealed misaligned stacked squares. The user asked to **replace**, not layer over, the effect with the earliest interactive concept.

The uploaded file's core motion (CSS near the HERO section) is:

- A `scene` with `perspective:900px`.
- A single `book` transformed slightly by `rotate(-6deg)`.
- Separate `book-pages` and `book-cover` actual elements, **not pseudo-sheets**.
- The front cover has `transform-origin:left center`, `transform-style:preserve-3d`, `backface-visibility:hidden`.
- On opening: `.book.open .book-cover {transform:rotateY(-154deg)}`. The actual paper underneath becomes visible.
- The background blob breathes slowly. Provide a real touch/click interaction with safe content, rather than decorative automatic layers.

The v3.9 component implements this as `hj-book-scene / hj-book / hj-book-pages / hj-book-cover`, with isolated CSS names. The notebook's containing scene stays the same size across closed/open states. On small screens, the cover opens to `rotateY(-132deg)` to avoid extending too far past the viewport.

## 2. Functional and accessibility constraints

- The closed cover visibly shows the approved HJ mark and a vector notebook symbol, **no written "Click to open" overlay**.
- On click, the cover rotates toward the left, exposing About content and a functional `소개글 보기` link.
- Pages are `inert` and `aria-hidden=true` while closed; the button advertises its state using `aria-expanded`. Opening transfers keyboard focus to the close button, closing returns focus to the front cover.
- Native `Escape` closes an open notebook when focus remains in the scene.
- CSS `prefers-reduced-motion` disables decorative breathing and transition motion while leaving the content accessible.
- Do not put overlays or full-surface buttons on top of open links/buttons.
- Remove `notebook-interactive` from the new component so legacy CSS rules with that selector cannot alter the cover.
- Original two published posts, permalink paths, private notebook corpus and draft content must remain intact.

## 3. QA / release gate

- [ ] Astro build and output validation succeed.
- [ ] Desktop and mobile sidebar groups, accurate 2/0/0/0 counts, header GitHub profile link.
- [ ] Open and close book on desktop, iPad (768,820,1024,1180), Fold/mobile (412,360).
- [ ] No layered square notebook effects or accidental horizontal overflow.
- [ ] 3D cover transform happens in browser without reduced motion; reduced-motion preference disables its animation.
- [ ] Both existing public posts and navigation/search/TOC remain unchanged.
- [ ] Owner checks final screenshots or preview before any release to main.
