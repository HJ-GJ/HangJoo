# NO. 02 — Repetition with for, range, while: editorial audit

**Created:** 2026-11-22 (publication planning)  
**Learning record date:** 2026-10-14  
**Proposed permalink:** `/HangJoo/posts/2026-10-14-python-day2-loops-for-while.html`

## Evidence actually examined

1. Connected course handout **[python] 01. 파이썬 기초.pdf**, especially its section on repetition: `for`, `range(end / start,end / start,end,step)`, `while`, `break`, `continue`, and the warning that a `continue` before a `while` counter increment can cause an endless loop.
2. Connected **[python] 02. iterables.pdf**: iterable objects, `for` over list elements, and the follow-on lessons for lists, strings and their operations. This second post introduces only list iteration, leaving list slicing, mutability/copy, nested loops, comprehension and strings for later lessons.
3. Private NVIDIA AI Campus GitHub training repo: dated 2026-10-14 loop practice scripts and curriculum timeline. Actual files checked include `python-learning/2026-10-14/loops/practice_part_01_01.py`, `practice_part_03.py`, `practice_part_07.py`, `practice_part_10.py`, plus `python-learning/REVIEW_NOTES.md` and `CURRICULUM_SYNC.md`.
   - The early `while True` guessing-game code is unfinished, so it was not copied or presented as a correct finished exercise.
   - An input-driven total-until-zero loop and an input-driven `while` until reaching a threshold are present as study artifacts. The public article uses new, simpler illustrative code, **not** republished private solutions.
   - `REVIEW_NOTES.md` flags original bugs and indicates not all dated code is validated.
4. Connected Google Drive `Nvidia AI Campus/Colab Notebooks/` root was listed. The root notebooks mainly cover later CV/AI topics; no notebook dedicated to the Python Day 02 loop basics was located by title. This article does **not** claim to be derived from Colab execution.

## Scope and originality

- **Reader-first flow:** why repeated code is useful → `for` → `range` end-exclusion → `while` → list traversal → `break` / `continue` → common pitfalls.
- The article uses independently written examples with **expected output** rather than claims of personal trial or successful online judging.
- One new self-authored SVG diagram compares for and while flows; no lecture slides or private notebook graphics are reproduced.
- The historical NO.02 draft at `content/drafts/2026-10-14-python-day2-loops-lists-and-strings.md` remains preserved unchanged. Its more advanced shallow/deep copy and string examples will be handled separately.
- The editorial post has exactly four large sections (**개념 / 실습 / 확인 / 정리**) and is part of the existing reader-focused Clean Mint Astro UI.
- Original NO.01 permalink, approved content and visual assets stay unchanged; no other draft is published.
- Public source files include the new editorial article and independent SVG only. **Never include protected course handouts or private GitHub training code in the public repository.**

## Acceptance checks

- [ ] Astro build and output checks succeed.
- [ ] Exactly two published post HTML files, with NO.01 original URL preserved.
- [ ] Home and All Posts list NO.02 and category count updates automatically.
- [ ] NO.02 has four TOC sections, working diagram path and no reading-time badge.
- [ ] Desktop, Fold, iPad, 360px and 412px visual QA passes.
- [ ] Release on main happens only after user-approved publish request and CI results.
