# 📚 HangJoo — Personal Engineering & Study Blog

> **🔗 블로그 바로가기 링크 (Quick Access)**
> - 🏠 **블로그 저장소 메인:** [https://github.com/HJ-GJ/HangJoo](https://github.com/HJ-GJ/HangJoo)
> - 🌐 **블로그 웹페이지 (GitHub Pages):** [https://hj-gj.github.io/HangJoo/](https://hj-gj.github.io/HangJoo/) *(GitHub Free 정책상 저장소를 Public으로 전환하면 즉시 웹페이지가 열립니다)*
> - 📖 **1번 글 바로 읽기 (`NO. 01`):** [**[Python] - 입출력과 데이터 타입·연산자, 조건문 분기 설계**](./content/posts/2026-10-13-python-day1-basics-and-conditionals.md) · [빌드된 HTML 보기](./posts/2026-10-13-python-day1-basics-and-conditionals.html)
> - 🎨 **디자인 테마:** Warm Editorial (`#FFFEF2` · `#285E4F` · `#6D5B39`) × Book-Cover / Zine Shelf (`3:4` 북커버 서가)

일자별 **Python · NumPy · Pandas · Data & ML · Deep Learning** 학습 기록과 **Project ASCEND** 개발기를 수업 교재(**1. 이론 → 2. 실습 코드 → 3. 최종적으로 내가 알아낸 내용**) 흐름 그대로 한 권의 북커버 에디션처럼 엮어 보관하는 서가입니다.

---

## 📌 현재 게시된 에디션 (순차 컨펌 진행 중)

| 에디션 | 카테고리 | 제목 (클릭 시 본문 이동) | 작성 일자 | 상태 |
| :---: | :---: | --- | :---: | :---: |
| **`NO. 01`** | `Python` | [**[Python] - 입출력과 데이터 타입·연산자, 조건문 분기 설계**](./content/posts/2026-10-13-python-day1-basics-and-conditionals.md) | `2026-10-13` | ✅ **게시됨 (1번 글 컨펌 대기)** |

---

## 📂 컨펌 후 순차 게시 예정 목록 ([`content/drafts/`](./content/drafts/))

1번 글 컨펌이 완료되면 아래 에디션들을 순서대로 정식 서가(`content/posts/`)에 올립니다.

- **`NO. 02`** · [`[Python] - 반복문(for·while)과 리스트·문자열 구조, 얕은 복사와 깊은 복사`](./content/drafts/2026-10-14-python-day2-loops-lists-and-strings.md)
- **`NO. 03`** · [`[Python] - 리스트 컴프리헨션과 절사평균, 아스키(ASCII) 시저 암호, 중첩 반복문`](./content/drafts/2026-10-15-python-day3-lists-strings-and-nested-loops.md)
- **`NO. 04`** · [`[Python] - 튜플·딕셔너리·집합(Hash Table) 내부 원리와 2차원 격자 탐색`](./content/drafts/2026-10-16-python-day4-sets-dicts-and-grid-patterns.md)
- **`NO. 05`** · [`[Python] - 함수 스코프·가변 인자와 모듈, 파일 입출력(File I/O) 및 2차원 격자 시뮬레이션`](./content/drafts/2026-10-19-python-day5-2d-lists-modules-and-file-io.md)
- **`NO. 06`** · [`[Python] - 객체지향(OOP) 4대 원리와 데코레이터(@property), 콘솔 은행 앱(BankApp)`](./content/drafts/2026-10-20-python-day6-oop-classes-and-bankapp.md)
- **`NO. 07`** · [`[NumPy] - 스칼라·벡터·행렬·텐서 구조와 인덱싱·브로드캐스팅`](./content/drafts/2026-10-21-numpy-part1-ndarray-indexing-and-operations.md)
- **`NO. 08`** · [`[NumPy] - 내적(Dot Product)의 그림자 원리와 행렬곱(@)·축(axis) 통계·배열 변형`](./content/drafts/2026-10-22-numpy-part2-dot-product-matmul-and-transform.md)
- **`NO. 09`** · [`[Pandas] - Series·DataFrame 구조와 데이터 입출력(I/O), loc·iloc·불리언 인덱싱`](./content/drafts/2026-10-23-pandas-part1-series-dataframe-loc-iloc-and-filtering.md)
- **`NO. 10`** · [`[Pandas] - 데이터 정제(결측치·중복 행)와 그룹 집계(groupby·agg·transform), 시각화 연결`](./content/drafts/2026-10-26-pandas-part2-sorting-groupby-missing-values-and-apply.md)
- **`NO. 11`** · [`[Data & ML] - 머신러닝 전처리·모델링 핵심 이론과 정기예금 가입 예측(Bank Marketing) Lift 검증`](./content/drafts/2026-11-02-data-ml-bank-marketing-lift-analysis.md)
- **`NO. 12`** · [`[Project ASCEND] - 중복 보상 지급을 차단하는 RewardLedger 멱등성 설계`](./content/drafts/2026-11-11-ascend-reward-ledger-idempotency.md)
- **`NO. 13`** · [`[Deep Learning] - LSTM 셀 상태 덧셈 통로와 기울기 보존 원리`](./content/drafts/2026-11-14-lstm-additive-gradient-highway.md)
- **`NO. 14`** · [`[Project ASCEND] - 로컬 우선 타이머 상태머신과 기준 시각 복구 설계`](./content/drafts/2026-11-16-ascend-timer-state-machine.md)

---

## 🛠️ 글 작성 및 빌드 방법

1. **새 글 마크다운 파일 생성**
   ```bash
   npm run new "[Python] - 새 글 제목" "Python"
   ```
   - 본문에서는 `:::formula`(핵심 규칙/수식 표), `:::compare`(2단 비교 박스), ` ```python `(접이식 실습 코드), `:::finding`(최종적으로 내가 알아낸 내용) 블록을 사용할 수 있습니다.

2. **정적 HTML 및 북커버 서가 빌드**
   ```bash
   npm run build
   npm test
   ```
   - [`index.html`](./index.html) (북커버 · 진 셸프 메인 서가)
   - [`posts/*.html`](./posts/) (개별 에디토리얼 본문 페이지)
   - [`posts.json`](./posts.json) (메타데이터 인덱스)
