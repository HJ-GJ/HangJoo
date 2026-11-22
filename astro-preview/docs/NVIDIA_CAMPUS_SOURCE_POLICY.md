# NVIDIA AI Campus — blog source coverage and evidence rules

**Updated:** 2026-11-22  
**Purpose:** Define the complete **candidate reference pool** for HangJoo's Lab learning posts, rather than relying on only the "[python] 01. 파이썬 기초.pdf" lecture handout.

> This is an editorial source registry, **not a claim that every notebook was read, executed, approved for republication, or written solely by the learner**. Each published article must select and review relevant individual sources before making claims.

## 1. Source pool

| Priority | Source | Coverage | Access/handling |
| --- | --- | --- | --- |
| 1. Course topic | Google Drive: `Nvidia AI Campus/교재/` | Topic-specific PDF/HTML handouts, including Python 01, later Python, data analysis, ML, DL, CV and LLM | Read only for research; do not upload or reproduce whole course handouts |
| 2. Learning notebooks | Google Drive: `Nvidia AI Campus/Colab Notebooks/` **including all nested folders** | All available study, practice, answer, project and summary notebooks across the curriculum | Private reference pool; do not publish Notebook files, hidden outputs, answers, Drive IDs or access links by default |
| 3. Versioned portfolio | GitHub: the owner's **private NVIDIA AI Campus learning repository** (currently named `NVIDIA-AI-Agent-Project`) | Date-based Python practice, data-analysis examples, course timeline, DL/NLP/CV editorial materials, tests and contribution notes | Reference internally through connected GitHub; do not copy private repo content or publish direct links without separate approval |

Use **the full Colab Notebooks folder tree as the source universe**, not just one notebook, one handout, or selected earlier days. However, **read only files relevant to each article** and record what was actually inspected. New files placed under the folder should be eligible for future review.

### Confirmed Colab folder groups

Discovered through connected Google Drive folder listing; titles are topic locators, not a declaration of full content review.

- `01_데이터분석_및_시각화/` — NumPy, Pandas, plotting, EDA practice and examples.
- `02_머신러닝_회귀_및_KNN/` — introductory ML, regression, scaling, data leakage and KNN.
- `03_머신러닝_트리_앙상블_군집화/` — decision trees, ensemble/boosting, Naive Bayes, PCA and related practice.
- `04_딥러닝_및_PyTorch/` — perceptron, PyTorch tensor/autograd/nn.Module and training practice.
- `05_RNN_및_자연어처리/` — RNN/LSTM, Word2Vec, Seq2Seq, Attention/Transformer.
- `06_CNN_및_컴퓨터비전/` — OpenCV, CNN, image classification and transfer learning.
- `Nvidia ai campus project 1/`, `Nvidia ai campus project 2/` — cross-topic practical projects.
- Root-level notebooks — e.g. segmentation, pose estimation, ViT/CLIP, object detection, Gradio, and other practice files.
- `00_빈파일_모음/` — inspect for content before using; untitled or empty files do **not** count as evidence.

These folders may change over time. List them anew when preparing the next post instead of assuming the 2026-11-22 inventory remains exhaustive.

### Cross-checks performed for this source policy (sample, not complete review)

- Google Drive folder structure and grouped notebook titles were listed.
- Individual notebook contents were inspected for **NumPy practice**, **Machine Learning 1일차**, **OpenCV 기초**, and **Attention_Transformer [정리]**, to confirm the folders hold Markdown explanations and executable code cells. Some notebooks are exercise scaffolds and some outputs may be present, but **no notebook was executed by this review**.
- GitHub's private learning repository `README.md`, `python-learning/README.md`, `data-analysis/README.md`, and `CURRICULUM_SYNC.md` were inspected. The last-mentioned curriculum index was last marked checked on **2026-11-16**; recheck file state before treating it as fully current.

## 2. How to choose references for a post

1. Select the intended learning date and specific **topic**. Preserve the order and scope of the actual class material.
2. Read the **matching course handout**. If a relevant Colab notebook exists in the entire folder tree, open the **specific notebook's code and Markdown cells**; do not infer its content from its title.
3. Read matching date/topic files and contribution notes in the owner's private GitHub learning repository. `CURRICULUM_SYNC.md` is a useful route map, **not the substitute for the source code**.
4. Reconcile only **supported** details. If sources disagree, identify the contradiction in internal notes and verify it; do not silently harmonize or attribute a concept to the wrong day.
5. Distinguish **personal original attempt**, **instructor-distributed assignment/answer**, **AI-completed code**, **illustrative example**, and **actually executed or validated output**. No evidence = no assertion of a personal execution result.
6. Build a beginner-readable learning progression: reason → concept → minimal runnable code → expected/observed output label → frequent mistakes → how the concept connects to later lessons. Avoid introducing later-day problems early without explicit explanation.
7. Keep the public article focused on learning. Store detailed source/permission/verification logs in editorial docs, not inside the reader's introductory text.
8. **Copyright/publication boundary:** never replicate complete proprietary PDFs, answer notebooks, private course code, proprietary datasets, confidential outputs, or private source URLs into this public blog repository. Use original explanations, minimal independent examples, and permission-appropriate references.

## 3. Topic routing, not indiscriminate mixing

| Blog topic | Primary source(s) | Additional sources to cross-reference |
| --- | --- | --- |
| Python first steps (Day 01) | Python 01 handout | The matching 2026-10-13 Python GitHub learning history; use relevant Colab notebooks **only if their contents match these basics** |
| Loops, strings, lists, files, OOP | The corresponding later Python handout | Matching date folders in GitHub `python-learning/`; any topic-matching notebook |
| NumPy/Pandas/EDA | Data-analysis course materials | Full Colab 01 folders and GitHub `data-analysis/` with attribution/validation labels |
| ML, regression, trees, clustering | Matching ML course materials | Colab 02/03 and the dated ML project material |
| Deep learning and PyTorch | Relevant DL lecture | Colab 04 plus GitHub editorial/project notes |
| RNN, NLP, Attention/Transformer | Matching RNN/NLP lesson | Colab 05, root-level NLP notes, GitHub `deep-learning/` summaries |
| CNN, OpenCV, ViT/CLIP, Gradio | Relevant CV/agent course materials | Colab 06 plus root-level notebooks and GitHub projects where applicable |

**Special case: PR #7 first Python article.** It must remain an entry-level article. Adding the complete Colab pool and the GitHub learning portfolio as **reference sources** does not imply adding all advanced notebook topics to this one post.

## 4. Checks before release

- [ ] Relevant course + actual notebook/repo files reopened as needed; file titles alone were not treated as evidence.
- [ ] First-hand practice vs instructor material vs AI-enhanced code clearly distinguished.
- [ ] Examples' results marked as expected unless verified through execution.
- [ ] Content matches the article's lesson/day and does not add later topics as if taught that day.
- [ ] No private URLs, notebook data, proprietary course attachments, or unreleased drafts exposed.
- [ ] Article remains easy for a first-time learner and source logistics do not clutter the public prose.
