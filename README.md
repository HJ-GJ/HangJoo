# HangJoo — Editions & Notes

> **Repository:** [https://github.com/HJ-GJ/HangJoo](https://github.com/HJ-GJ/HangJoo) (Private)  
> **Style:** Warm Editorial (`#FFFEF2` · `#285E4F` · `#6D5B39`) × Book-Cover / Zine Shelf (`3:4` 에디션 표지 아카이브)

일자별 **Python · NumPy · Pandas · Data & ML · Deep Learning** 학습 기록과 **Project ASCEND** 개발기를 수업 HTML 교재 구성(**이론 → 비교/규칙 → 실습 코드 → 최종적으로 내가 알아낸 내용**) 그대로 한 권의 소책자 표지처럼 엮어 보관하는 개인 서가입니다.

---

## 카테고리 구성 (총 14 Editions)

- **Python (`NO. 01 ~ NO. 06`)**: Day 1~6 파이썬 기초 문법, 자료구조(`list`, `set`, `dict`), 2차원 격자 디버깅, 파일 입출력, `BankApp` OOP 실습
- **NumPy (`NO. 07 ~ NO. 08`)**: 스칼라·벡터·행렬·텐서(`ndim`, `shape`), 0-based 인덱싱·슬라이싱, 브로드캐스팅, 내적(`a @ b`)의 정사영 그림자 원리와 행렬곱(`A @ B`) 좌표 변환
- **Pandas (`NO. 09 ~ NO. 10`)**: `Series`·`DataFrame` 구조와 탐색 6종 도구, `loc`(끝 포함) vs `iloc`(끝 제외), 불리언 인덱싱, `groupby` 다중 집계, 결측치(`isna`/`fillna`/`dropna`) 및 `apply` 파생 열
- **Data & ML (`NO. 11`)**: 정기예금 캠페인(Bank Marketing) 데이터 누수 차단과 시기별 Lift 교차 검증
- **Deep Learning (`NO. 13`)**: 바닐라 RNN 기울기 소실 원인과 LSTM 셀 상태 덧셈 통로(Additive Highway)
- **Project ASCEND (`NO. 12, NO. 14`)**: `RewardLedger` 멱등성 원장 설계 및 로컬 우선 타이머 상태머신

---

## 글 작성 및 빌드 방법

1. **새 글 마크다운 파일 생성**
   ```bash
   npm run new "새 글 제목" "Python"
   ```
   - 본문에서는 `:::formula`(핵심 규칙/수식 표), `:::compare`(2단 비교 박스), ` ```python `(접이식 실습 코드), `:::finding`(최종적으로 내가 알아낸 내용) 블록을 사용할 수 있습니다.

2. **정적 HTML 및 북커버 서가 빌드**
   ```bash
   npm run build
   npm test
   ```
   - `index.html` (북커버 · 진 셸프 메인 서가)
   - `posts/*.html` (개별 에디토리얼 본문 페이지)
   - `posts.json` (메타데이터 인덱스)
