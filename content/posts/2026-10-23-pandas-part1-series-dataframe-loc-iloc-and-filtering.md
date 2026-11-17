---
issue: "NO. 09"
title: "[Pandas] - Series·DataFrame 구조와 데이터 입출력(I/O), loc·iloc·불리언 인덱싱"
date: "2026-10-23"
category: "Pandas"
readTime: "10분"
tags: ["Pandas", "DataFrame", "Series", "DataIO", "loc", "iloc", "BooleanIndexing"]
summary: "수업 PDF([python] 06. pandas.pdf 전반부)와 HTML 교재를 바탕으로 Series·DataFrame 구조, 5대 파일 포맷 I/O(CSV, Excel, JSON, SQL, Parquet)와 한글 인코딩(cp949), 문자열 접근자(.str), 기술 통계(mode, value_counts(normalize=True), unique, nunique), 행·열 추가/삭제(pd.concat, drop, astype), 그리고 loc vs iloc·다중 조건(&, |, ~) 필터링을 정리합니다."
coverType: "pandas-intro"
takeaway: "Pandas는 NumPy 기반의 고속 표 처리 도구로, 이름표 기반 df.loc[0:3](끝 포함)과 위치 번호 기반 df.iloc[0:3](끝 제외)의 차이, 그리고 다중 조건(&, |, ~)의 소괄호 묶음 규칙을 정확히 지키는 것이 핵심입니다."
---

## 1. 이론: Series · DataFrame 구조와 데이터 I/O, 기술 통계, 행·열 조작

수업 교재(`[python] 06. pandas.pdf` 기본편 & `Pandas_입문교재.html` Part 01~04)에서는 엑셀로 하던 수작업을 코드로 자동화하는 **Pandas(`import pandas as pd`)**의 핵심 자료구조와 데이터 입출력(I/O), 정보 탐색, 기술 통계, 그리고 행·열 추가/삭제 문법을 체계적으로 다뤘습니다.

### 1) `Series`(1차원 열)와 `DataFrame`(2차원 시트), 그리고 `.values` · `.str`
- **`Series`:** 엑셀의 **하나의 열(Column)**에 해당하는 1차원 구조(**인덱스 + 값**)입니다. `index` 옵션을 지정하지 않으면 `0, 1, 2...` 번호가 붙고, 지정하면 딕셔너리처럼 이름표 인덱스로 값에 접근할 수 있습니다.
- **`DataFrame`:** 여러 개의 `Series`가 모여 만든 **하나의 엑셀 시트(2차원 표)**입니다. `df['열']`로 특정 열 하나를 꺼내면 `Series`가 반환되며, **`.values`** 속성을 붙이면 언제든 NumPy 배열(`ndarray`)로 변환할 수 있습니다.
- **문자열 접근자 `df['열'].str`:** 문자열로 구성된 범주형 컬럼은 `.str`을 붙여서 파이썬 문자열 메서드(`df['열'].str.upper()`, `.lower()`, `.contains('키워드')`, `.startswith()`)를 열 전체에 한 번에 적용할 수 있습니다.

### 2) 데이터 입출력(Data I/O) 5종과 탐색·기술 통계·행/열 편집
실무에서는 직접 리스트로 표를 만들기보다 외부 파일을 불러와 분석합니다. 한글 CSV 파일이 깨질 때는 **`pd.read_csv("파일.csv", encoding="cp949")`** 옵션으로 해결합니다.

:::formula
지원 파일 포맷 5종 (읽기 / 쓰기) | CSV(read_csv / to_csv), Excel(read_excel / to_excel), JSON(read_json / to_json), SQL(read_sql / to_sql), Parquet(read_parquet / to_parquet) | 웹 URL이나 로컬 경로를 read_csv()에 바로 전달해 DataFrame으로 적재할 수 있습니다.
데이터 정보 확인 7종 | df.shape, df.columns, df.dtypes (괄호 없는 속성 3종!) / df.head(n), df.tail(n), df.info(), df.describe() | info()는 각 열의 데이터 타입과 Non-Null(결측치 여부) 개수를, describe()는 숫자형 열의 평균·표준편차·사분위수를 요약합니다.
기술 통계 및 고유값 확인 | .max(), .min(), .sum(), .mean(), .mode()(최빈값), .count()(결측 제외 개수) / .value_counts(normalize=True), .unique(), .nunique() | value_counts(normalize=True)는 빈도수가 아니라 전체 대비 비율(0~1)을 계산해주며, nunique()는 고유값의 총개수를 반환합니다.
행·열 추가/삭제 및 형 변환 | 열 추가: df['새열'] = 값 / 행·열 결합: pd.concat([df1, df2], ignore_index=True, axis=0 또는 1) / 삭제: df.drop(['열'], axis=1), df.drop(행인덱스, axis=0) / 형 변환: df['열'].astype(타입) | pd.concat으로 행을 이어 붙일 때 ignore_index=True를 주어야 인덱스가 중복되지 않고 0부터 깔끔하게 재배정됩니다.
:::

## 2. 비교: `df.loc`(이름표) vs `df.iloc`(번호표)와 조건 결합(`&`, `|`, `~`)

교재에서 가장 강조된 핵심은 행과 열을 꺼내는 두 가지 방법(`loc` vs `iloc`)의 **슬라이싱 끝 번호 포함 여부**와, **다중 조건 불리언 인덱싱(`&`, `|`, `~`)의 괄호 규칙**이었습니다.

:::compare
### `df.loc` (Label-based, 이름표 기준) 및 열 선택
- `df.loc[행이름표, '열이름']`처럼 눈에 적힌 **인덱스 이름표(Label)**로 찾음
- **슬라이싱 `df.loc[0:3]`은 끝 번호 `3`을 포함**하여 0, 1, 2, 3번 총 4개 행을 가져옴
- 단일 열은 `df['수학']`(`Series`), 복수 열(Fancy Indexing)은 `df[['이름', '수학']]`(`DataFrame`)으로 추출
---
### `df.iloc` (Integer-location, 위치 번호 기준) 및 불리언 조건 결합
- `df.iloc[행번호, 열번호]`처럼 무조건 0부터 시작하는 **순서 번호(Index)**로만 찾음
- **슬라이싱 `df.iloc[0:3]`은 끝 번호 `3`을 제외**하여 0, 1, 2번 총 3개 행만 가져옴
- 조건 결합 시 파이썬 `and`/`or`/`not` 대신 **`&`(그리고), `|`(또는), `~`(부정, not)** 기호를 쓰며, **모든 개별 조건을 반드시 소괄호 `( )`로 묶어야 함!**
:::

## 3. 실습: 8명 학생 성적표 탐색 · 기술 통계(`value_counts`, `nunique`) · 조건 필터링

수업 교재의 8명 학생 성적표에 더해, 기술 통계(`value_counts(normalize=True)`, `unique()`, `nunique()`), `.str.contains()`, `pd.concat(..., ignore_index=True)`, 그리고 `&`·`|`·`~` 다중 조건 필터링을 통합 검증했습니다.

```python
# title: pandas_part1_explore_and_filter.py — 기술 통계, loc/iloc 비교, 다중 조건(&, |, ~), concat 실습
# takeaway: pd.concat()으로 새 행을 추가할 때 ignore_index=True를 설정해야 기존 인덱스와 겹치지 않고 연속된 번호가 부여됩니다.
import pandas as pd

df = pd.DataFrame({
    "이름": ["민준", "서연", "도윤", "하은", "시우", "지안", "예준", "수아"],
    "반":   ["A", "A", "B", "B", "A", "B", "A", "B"],
    "국어": [88, 92, 76, 85, 95, 70, 81, 90],
    "영어": [84, 95, 80, 89, 91, 75, 78, 93],
    "수학": [90, 87, 94, 78, 98, 65, 85, 88],
})

# 1) 표 기본 정보 및 범주 비율(normalize=True), 고유값 개수(nunique) 확인
print("표 크기(shape):", df.shape, "| 반 고유값 개수(nunique):", df["반"].nunique())
print("반별 비율(normalize=True):\n", df["반"].value_counts(normalize=True))

# 2) loc vs iloc 슬라이싱 끝 번호 포함 여부 비교
print("loc[0:2] 행 개수 (끝 포함):", len(df.loc[0:2]))   # 3행 (0, 1, 2)
print("iloc[0:2] 행 개수(끝 제외):", len(df.iloc[0:2]))  # 2행 (0, 1)

# 3) 핵심: 불리언 인덱싱 — &(그리고)와 ~(not, 부정) 조합 (모든 조건은 괄호 필수!)
cond_and = (df["반"] == "A") & (df["수학"] >= 90)
cond_not = ~(df["반"] == "B")  # B반이 아닌(즉 A반인) 학생
print("A반 & 수학>=90 학생:", list(df.loc[cond_and, "이름"]))  # ['민준', '시우']
print("~B반 학생 수       :", len(df[cond_not]))               # 4

# 4) pd.concat(..., ignore_index=True)로 새 학생 행 안전하게 추가 후 불필요 열 drop
new_row = pd.DataFrame({"이름": ["지호"], "반": ["A"], "국어": [91], "영어": [88], "수학": [92]})
df_added = pd.concat([df, new_row], ignore_index=True)
print("행 추가 후 마지막 인덱스:", df_added.index[-1], df_added.loc[8, "이름"])  # 8 지호
```

## 4. 최종적으로 내가 알아낸 내용

:::finding
### Pandas 기본편 이론(Data I/O, 기술 통계, 인덱싱)과 실습으로 정리한 핵심 포인트
- **`df.shape`, `df.columns`, `df.dtypes`는 속성(이름표)이라 괄호 `()`를 붙이지 않음:** 반면 `df.info()`, `df.describe()`, `df.head()`는 계산을 수행하는 메서드라 괄호를 붙입니다.
- **비율을 볼 때는 `value_counts(normalize=True)`가 가장 빠름:** 전체 행 개수로 직접 나눌 필요 없이 `normalize=True` 옵션 하나만 넣으면 각 범주의 차지 비율(`0.5`, `0.5`)을 즉시 계산해 줍니다.
- **다중 조건 필터링에서는 `&`, `|`, `~`와 소괄호 `( )`가 절대 규칙:** 파이썬의 `not` 대신 물결표 `~`를 써야 하며(`~(df['반'] == 'B')`), 연산자 우선순위 충돌을 막기 위해 조건마다 반드시 괄호를 감싸야 합니다.
:::
