# HangJoo — AI Writer / Reviewer Contract v2.0

This file applies to all AI contributors, including Antigravity, Gemini, Codex, and ChatGPT.

## Mission and ownership
HangJoo is both (1) a long-form learning journal for Python, data science, and AI, and (2) a developer-project portfolio. Preserve the author's learning history and voice. Do not invent personal experiences, experiment outcomes, screenshots, dates, credentials, or project accomplishments.

## Mandatory process
1. Inspect the latest `main`, existing drafts, `README.md`, `scripts/build.mjs`, `scripts/verify.mjs` and `docs/EDITORIAL_STANDARD_V2.md` before substantive changes.
2. Draft in `content/drafts/` using `content/templates/study-post.md` or `content/templates/project-post.md`. Use `npm run new -- "제목" "Python"` (or another supported category) for a new draft.
3. Follow the long-form editorial contract. Explain **why → how → runnable example → output → interpretation → pitfalls → recap**. No padding or fabricated evidence.
4. Preserve original learning facts and code. Make technical corrections only with verification. Distinguish the author's original observation from the editor's explanatory addition.
5. Respect existing custom Markdown blocks: `:::formula`, `:::compare`, `:::finding`. Keep a `## 1. 이론` heading and `:::finding` takeaway block until the renderer and tests are deliberately migrated.
6. Do not silently alter the public site, published URLs, `main`, release settings, or existing drafts. For meaningful edits create a review branch / draft PR and include a before/after review and test evidence.
7. Run `npm run build` and `npm test` if local execution is available. Report **not run** otherwise; never claim passing tests without evidence. Confirm output before publishing.
8. Publishing or merging requires the owner's explicit approval. Drafts are not published by default.

## Visual learning standard
- Follow `docs/VISUAL_LEARNING_STANDARD_V1.md` for thumbnails, concept diagrams, captions, responsive design and review. Prefer 2–3 genuinely useful diagrams per learning article, not decorative overload.
- Keep the article slightly shorter by removing repeated explanations. Preserve learning goals, conceptual accuracy, code, output, common mistakes and recap.
- When placing a new visual, create the SVG under `assets/visuals/` and use `:::visual filename.svg | 한국어 캡션` in the Markdown. Test the generated HTML and accessibility before publication.

## Style
- **Design:** Warm Editorial A — ivory canvas `#FFFEF2`, forest `#285E4F`, brown `#6D5B39`; generous whitespace, readable typography, restrained UI.
- **Language:** natural, precise Korean; explain terms before using abbreviations. Friendly but not promotional.
- **Length:** learning article typically 2,500–4,500+ Korean characters of substantive content, adjusted to topic; depth beats word count.
- **Titles:** short reader-friendly title. Avoid overpacked lists of concepts, artificial clickbait, and unsupported claims.
- **Code:** language-tagged fenced blocks, self-contained runnable examples where possible, expected output, input assumptions, boundary cases, and clear commentary. Never present pseudocode as tested implementation.
- **Categories:** keep existing category compatibility with current build; proposal to add categories belongs in a separately verified implementation.
- **Audience:** newcomers should understand the concept; experienced readers should be able to verify examples.

Use `docs/EDITORIAL_STANDARD_V2.md` as the detailed checklist and source of truth for this editorial change. When a rule conflicts with renderer capabilities, preserve build compatibility and document the gap.
