# HangJoo Editorial Standard v2.0
Status: proposed (review branch; not yet released). Owner sign-off required for public migration.

## Positioning
One home for **deep study notes** and **evidence-backed development project journals**. An elegant editorial reading experience, not a sparse summary board.

### Design A: Warm Editorial
- Palette: ivory `#FFFEF2`, forest `#285E4F`, brown `#6D5B39`, charcoal text.
- Use generous spacing, calm typography, legible code, readable measure, mobile-friendly margins and horizontal scrolling for long code.
- Homepage future direction: Home / Study Notes / Projects / About. **This document does not implement these UI changes.**
- Avoid decorative cover-card overload; preserve current published page until a separate visual review PR.

## Article quality bar
- Typical study post: **2,500–4,500+ Korean characters**, flexible and content-driven. No unnecessary filler.
- First explain *why it matters*, then *what it means*, *how it works*, and *how to test it*.
- Every meaningful code sample: prerequisite/input → code → expected output → explanation of key lines and behavior.
- Include at least one applied case and one common mistake or boundary case when relevant.
- Put unfamiliar terms in plain Korean with English term in parentheses on first use.
- Provide factual references (official docs/version where feasible) for non-trivial or version-sensitive claims; don't fabricate citations.
- Distinguish author-observed outcomes, reproduced tests, and illustrative examples.
- Never turn speculation into evidence. Do not invent the author's reflections; label suggested reflection prompts if the author has not supplied one.
- Refactor long blocks into meaningful sections; do not remove core material just to shorten a post.
- Keep `readTime`, `summary`, `tags`, `category` accurate. Updating `readTime` is required when article length changes substantially.

## Study article outline
1. Introduction: learning objective and why it is relevant.
2. `## 1. 이론 — 핵심 개념과 작동 원리`: definition, underlying logic, comparison, and intuition.
3. `## 2. 기초 실습 — 따라 해보기`: executable input/code/output and line-by-line explanation.
4. `## 3. 응용 실습 — 문제 해결`: combine concepts, explain decisions.
5. `## 4. 자주 하는 실수와 디버깅`: failure mode, cause, remedy.
6. `## 5. 실제 활용과 확장`: when/where the ideas matter, no exaggerated project claims.
7. `## 6. 핵심 정리와 복습`: summary, check-your-understanding prompts.
8. `:::finding`: evidence-backed takeaway; if personal learning is unknown, use neutral language rather than attributing feelings to the author.

## Project article outline
1. Context and concrete problem.
2. Requirements and constraints (including sensitive/data boundaries).
3. Design decisions and alternatives.
4. Implementation details with relevant code/architecture.
5. Verification: test environment, command, expected/observed results, limitations.
6. Trade-offs and next steps.
7. `:::finding`: source-grounded takeaways.
Always separate **implemented**, **reported**, **planned**, and **unverified**.

## Frontmatter contract
Existing renderer expects: `issue`, `title`, `date`, `category`, `readTime`, `tags`, `summary`, `coverType`, `takeaway`. Keep a compatible category and publication metadata. Current verification expects a title in `[Category] - Title` form, the phrase `1. 이론`, and a rendered finding box. These are **temporary legacy constraints**, not a reason to compromise readability.

## Review checklist
- [ ] All claims and code reviewed; version-specific behavior and edge cases verified
- [ ] No invented authorship, project achievements, results, screenshots, or sources
- [ ] Long-form substance: concept / example / output / explanation / pitfall / recap
- [ ] Category, metadata, title, links, and any references correct
- [ ] No accidental posting of draft/private material
- [ ] Existing published URL and article count unchanged unless explicitly approved
- [ ] `npm run build` + `npm test` executed (or honestly marked not run)
- [ ] Desktop/mobile visual review completed before UI change
- [ ] Separate review PR and owner publication approval

## Release sequence
**Phase 1:** rules + long-form templates + draft generator (this PR).
**Phase 2:** revise public Day 1 post in review branch, show before/after and technical correction notes.
**Phase 3:** migrate unpublished drafts one by one, fact-check and approve independently.
**Phase 4:** implement Design A visual components and homepage navigation, conduct mobile/desktop visual QA.
No automatic merge or deployment.
