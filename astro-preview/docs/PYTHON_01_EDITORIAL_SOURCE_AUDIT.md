# HangJoo Python NO. 01 — Editorial source and preservation audit

Date: 2026-11-22

## Requested owner feedback

- Remove the numeric reading-time estimate (`15분`).
- Fix article header tags and study badges wrapping on tablet/mobile.
- On closed HJ notebook, replace the written “Click to open / 펼쳐보기” with a subtle SVG/CSS affordance.
- On opened HJ notebook, hide the overlapping notebook glyph and use the panel to link to an author introduction, instead of duplicating the “Recent Posts” list already on Home.
- Make the first Python post a genuine entry point for an absolute beginner. Do not mix in advanced exercises identified in feedback as “Day 03” traces.
- Preserve original published URL and original markdown, even while improving the Astro presentation.

## Primary learning evidence actually inspected

- Owner's connected Drive file: **[python] 01. 파이썬 기초.pdf** (Google Drive PDF; accessed via connected Drive and extracted text).
- Contents observed: programming language introduction, Python description/uses and installation, VS Code setup and first `.py` / Hello World execution, `print` with `end` and `sep`, `input`, variables, `int/float/str/bool`, casting, arithmetic/comparison/logical/membership operators, `if/else/elif`, and further loops.
- The first post uses the **introductory subset only**, arranged for a complete novice. Loops and advanced time/leap-year/triangle tasks are set aside for later articles.
- Wording and code examples in `editorial/python-day1-from-zero.md` are original explanatory rewrites. **Examples are labeled with expected outputs**, not unverified claims of actual execution.
- The PDF file itself is not added to this public repository, and no private connected-Drive link is published.

## Expanded reference universe — PR #7 follow-up

The owner requested **more than the Python 01 PDF** as the editorial reference basis. The source pool now encompasses **the full connected Google Drive `Nvidia AI Campus/Colab Notebooks/` tree** (all root notebooks and nested topic folders) **and the owner's private NVIDIA AI Campus GitHub learning repository**, alongside the matching lecture handouts. Operational scope and handling rules are documented in `docs/NVIDIA_CAMPUS_SOURCE_POLICY.md`.

What was actually verified for this update:
- Google Drive `Colab Notebooks` root and its topic folders (data analysis/visualization, ML, DL/PyTorch, RNN/NLP, CNN/CV, project and root-level notebooks) were discovered and listed. Selected notebook contents were checked: NumPy practice (arrays, dimensions, indexing), ML day-one notes (linear-model basics and examples), OpenCV basics (BGR vs RGB, pixels), Attention/Transformer summary (Seq2Seq limitations).
- The **private** GitHub learning repository's `README.md`, `python-learning/README.md`, `data-analysis/README.md` and `CURRICULUM_SYNC.md` were opened. The curriculum index maps the 2026-10-13 Python basics to the corresponding date folder and extends through ML, DL, NLP and CV. The index reports a **2026-11-16** synchronization check and requires reinspection for later changes.
- Notebook titles and examples are not proof of complete personal execution or verification. We have **not exhaustively read or run the entire Colab notebook tree**; it is registered as a reference universe that must be filtered and actually read article by article.

For **this first Python post**, keep the real introductory PDF as the primary topic source. The corresponding Python 2026-10-13 GitHub folder is a supporting practice reference whose file-level content must be reopened before quoting or claiming outcomes. The broader Colab notebook tree is particularly relevant to **future data analysis, ML, DL, NLP and CV posts**, and must not be forced into a Python Day 01 beginner article.

The source pool expansion **does not change** the public post's introductory scope, original permalink, original archival Markdown, output labels or no-republication policy.

## Source and publication boundaries

- **Canonical historical markdown, retained unchanged:** `content/posts/2026-10-13-python-day1-basics-and-conditionals.md`.
- **New owner-reviewed Astro editorial source:** `astro-preview/editorial/python-day1-from-zero.md`.
- **Published permalink, unchanged:** `/HangJoo/posts/2026-10-13-python-day1-basics-and-conditionals.html`.
- **Astro content ingestion:** `astro-preview/scripts/sync-content.mjs` loads the editorial Markdown, preserves original file and copying of the original SVG assets.
- **Public content scope:** Only the approved Python NO. 01; drafts not published.
- **Illustrations shown in the new article:** input conversion and branching flow diagrams. The historical time-flow SVG is preserved as an asset but no longer embedded in this introductory article.
- Keep source-referenced claims precise: the lecture's simplified descriptions are treated as pedagogical summaries, and any technical refinement (e.g. CPython bytecode and floor-division behavior) is presented as an explanatory clarification, not a claim that the lecture made those exact statements.

## Acceptance criteria

- Four article sections in order: `개념 / 실습 / 확인 / 정리`.
- Genuine first-principles orientation (what programming is, Python, editor and environment, Hello World) before variables and conditions.
- Copyable complete examples with distinguished expected outputs and no fabricated personal testing or results.
- No visible numeric reading-time estimate on article or All Posts listing.
- Tags and badges wrap coherently on 360/412/768/1024px layouts.
- Closed notebook retains HJ + SVG affordance; opened notebook includes owner name/AI bio, close control and an About navigation.
- Existing Python post URL stable; historical source preserved, other drafts unpublished.
- CI build and regression tests pass; real-device validation is a separate acceptance step.

## Owner follow-up — explanation depth & paragraph rhythm

- The owner reviewed the rendered Markdown and specifically requested removing article-facing process/attribution paragraphs (the "이 글은 수업 자료..." opening note and "참고 자료와 설명 범위" closing block). **Keep this evidence register in the repository, not in the study article.**
- The conceptual narrative now starts with a concrete human instruction ("3과 5를 더한 결과를 화면에 보여 줘") and distinguishes everyday language, the need for precise computer instructions, Python syntax, interpreter/execution environment and resulting output.
- Explain each part of the first `print(3 + 5)` example before introducing later abstractions.
- Editorial spacing: keep **related sentences in one Markdown paragraph** (usually 2–3 sentences), use **exactly one empty Markdown source line** when the topic/step changes, and use article CSS margins/line-height for visual spacing. No repeated spaces, manual double line breaks, or one-sentence-per-line formatting.
- No change to the real first-day lecture basis, four-part TOC, expected-output labels for code examples, or historical post URL.
