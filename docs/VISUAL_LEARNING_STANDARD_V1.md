# HangJoo — Visual Learning Standard v1.0

Status: review branch. Editorial A (Warm Editorial) is the baseline.

## Goal
A visual should teach one concept and reduce explanation burden, not merely decorate the page. Keep written explanation, runnable code, actual/expected outputs, and recap.

## Default density
- **Thumbnail:** one conceptual visual per published article (reusable cover illustration is acceptable), preferably a clean 16:9 or 3:2 composition and readable at mobile size.
- **Body:** normally 2–3 visual aids for a medium-length learning post, add a fourth only if it materially explains another concept.
- **Length:** concise but substantive; aim roughly 2,500–4,000 Korean characters for common single-topic notes, allowing longer articles when many distinct exercises require it. Do not mechanically cut essential facts or code. Remove repetition before removing examples.
- Show a visual close to the concept it explains; never create a separate image-only section.
- Preferred sequence: concept → small diagram → runnable code → observed/expected output → explanation.
- Use real graphs when showing **quantitative relationships**. Do not use a line graph for a purely categorical/flow relationship.

## Design requirements
- Accessible SVG is preferred for deterministic flows, diagrams, formulas, or editable line art; charts should have trustworthy underlying data.
- Warm Editorial palette: canvas `#FFFEF2`, forest `#285E4F`, muted brown `#6D5B39`, dark text `#242823`.
- Use restrained borders, simple straight or curved connectors, legible Korean labels, generous whitespace.
- Embed a meaningful `<title>` and `<desc>` in each SVG, with a Korean caption in the post. Never rely on color alone to encode meaning.
- Keep diagrams simple at 320px mobile width and test contrast, text overlap, sizing, and dark-mode behavior if supported.
- All diagrams must be original or appropriately licensed; no copied figures without attribution.

## How to place a diagram in a post
Add a single-line directive near the relevant explanatory passage:

```text
:::visual python-day1-input-flow.svg | 입력값은 문자열에서 정수로 변환한 뒤 계산합니다.
```

The generator accepts filenames consisting only of lowercase ASCII letters, digits, and hyphens ending in `.svg`. Assets live in `assets/visuals/`, and are referenced from generated `posts/*.html` as `../assets/visuals/FILE.svg`. This keeps existing post URLs unchanged.

## First article — Python Day 1
1. **Input type conversion** (`python-day1-input-flow.svg`): directly after the `input()` introduction. Follow with the conversion example and its output.
2. **24-hour arithmetic** (`python-day1-time-flow.svg`): immediately below the time arithmetic subsection, before example code.
3. **Branch selection** (`python-day1-branch-flow.svg`): adjacent to the `if / elif / else` explanation, before the grade example.
The existing subject illustration can serve as a compact list thumbnail. Avoid adding unrelated stock graphics.

## Quality and review checklist
- [ ] Every diagram conveys a correct relation and matches the article code
- [ ] Text alternative and visible caption are meaningful
- [ ] Source files exist in `assets/visuals/`, link paths resolve
- [ ] Generated article and thumbnail are readable on mobile and desktop
- [ ] No content omitted merely to make room for graphics
- [ ] Build and test with `npm run build && npm test`; report evidence
- [ ] Do not publish existing unpublished drafts
- [ ] Owner reviews before merging a visual change
