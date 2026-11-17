---
issue: "NO. 10"
title: "[Pandas] - 데이터 정제(결측치·중복 행)와 그룹 집계(groupby·agg·transform), 시각화 연결"
date: "2026-10-26"
category: "Pandas"
readTime: "11분"
tags: ["Pandas", "DataCleaning", "GroupBy", "Transform", "DataVisualization", "Seaborn"]
summary: "수업 PDF([python] 06. pandas.pdf 심화편 & [python] 07. Data Visualization.pdf)와 HTML 교재를 바탕으로 결측치 정제(dropna subset, fillna 평균·중앙·최빈값 및 Series 매핑), 중복 데이터 처리(duplicated subset, drop_duplicates, reset_index), 데이터 변형(map vs apply), Split-Apply-Combine 그룹 집계(groupby, agg, transform), 그리고 Wide/Long-form 변환(pivot, melt)과 시각화(Matplotlib, Seaborn, Pandas plot) 연결을 정리합니다."
coverType: "pandas-analysis"
takeaway: "쓰레기 데이터를 넣으면 분석 결과도 쓰레기가 되므로(Garbage In, Garbage Out), 결측치(isna/fillna/dropna)와 중복 행(drop_duplicates)을 먼저 정제한 뒤 groupby(agg vs transform)와 melt/pivot으로 집계·시각화 파이프라인을 완성해야 합니다."
---

## 1. 이론: 데이터 정제(결측치 · 중복 행), `Split-Apply-Combine`(`groupby` · `transform`), 그리고 시각화 폼 변환(`pivot` · `melt`)

수업 교재(`[python] 06. pandas.pdf` 심화편 & `[python] 07. Data Visualization.pdf`)는 **"실제 데이터는 항상 생각보다 지저분하며, 쓰레기 정리를 하지 않고 활용한 데이터는 분석 결과도 쓰레기가 된다"**는 데이터 정제(Data Cleaning) 원칙에서 출발합니다.

### 1) 결측치(`null` / `NaN`) 탐지와 정제 기준(삭제 vs 채우기)
- **탐지:** `.isnull()`과 `.isna()`는 100% 동일한 함수입니다(하나는 SQL의 `NULL`에서, 하나는 NumPy의 `NaN`에서 유래). 여기에 `.sum()`을 이어 붙인 **`df.isna().sum()`**으로 각 열의 결측치 개수를 한눈에 확인합니다.
- **언제 삭제(`dropna`)하고 언제 채울까(`fillna`)?**
  1. 아주 적은 양의 행만 결측치를 보유하고 있다면 → 행 삭제(**`df.dropna()`** 또는 특정 열 기준 **`df.dropna(subset=['열'])`**)
  2. 중요한 정보를 담은 컬럼에 일부 결측치가 있다면 → 대표값으로 채우기(**`df.fillna(값)`**: 수치형은 이상치에 강건한 **중앙값(`median`)**이나 **평균(`mean`)**을, 문자열 범주형은 **최빈값(`mode()[0]`)**을 주로 활용하며, `fillna(Series)`를 전달하면 같은 인덱스끼리 짝지어 채움)
  3. 중요하지 않은 컬럼인데 결측치가 너무 많다면 → 컬럼 자체를 삭제(`df.drop(['열'], axis=1)`)
  4. 결정적으로 중요한 컬럼인데 결측치가 너무 많다면 → 억지로 채우지 말고 **데이터 수집부터 다시 수행**

### 2) 중복 데이터(`duplicated`)와 인덱스 재배정(`reset_index`), `map` / `apply`
- **중복 행 확인 및 주의점:** `df.duplicated()`는 모든 열의 값이 완벽히 일치하는 중복 행을 찾습니다(`keep=False`를 주면 처음 만난 행까지 모두 표시). 단, `df.duplicated(subset=['이름'])`처럼 이름만 같고 급여 등 다른 열이 다른 경우는 **동명이인(유효 데이터)**일 수 있으므로 함부로 삭제해서는 안 됩니다!
- **중복 삭제 후 인덱스 초기화:** `df.drop_duplicates()`로 중복 행을 지우면 중간중간 인덱스 번호가 비게 되므로, 머신러닝 전처리에서는 반드시 **`.drop_duplicates().reset_index(drop=True)`**를 함께 호출해 인덱스를 `0, 1, 2...`로 다시 매겨줍니다.
- **데이터 변형 (`map` vs `apply`):** `df['열'].map(함수)`와 `df['열'].apply(함수)`는 파이썬의 `map(int, input().split())`처럼 해당 열의 모든 값에 함수를 일괄 적용해 파생 열을 만듭니다.

### 3) `Split ▷ Apply ▷ Combine` 프로세스와 `.agg()` vs `.transform()`
반별 수학 평균을 구하는 작업은 **(1) `Split`(반 기준으로 쪼개기) → (2) `Apply`(각 반에서 평균 구하기) → (3) `Combine`(결과 합치기)**의 3단계로 진행됩니다.

:::formula
다중 집계 (.agg) vs 원본 크기 유지 (.transform) | df.groupby('반')['수학'].agg(['mean', 'min', 'max', 'count']) vs df.groupby('반')['수학'].transform('mean') | .agg()는 그룹 개수(A반, B반 2줄)만큼 요약된 표를 반환하지만, .transform()은 원본 데이터와 똑같은 행 개수(8줄)로 각 학생 옆에 '자기 반의 평균'을 붙여줍니다!
Wide-form ↔ Long-form 변환 (pivot vs melt) | long.pivot(index='month', columns='category', values='value') ↔ wide.melt(id_vars='month', var_name='category', value_name='value') | 사람이 보기 편한 가로 나열형(Wide-form)은 Pandas plot(wide.plot())에 유리하고, 범주가 한 열에 모인 세로형(Long-form)은 Seaborn의 hue 그룹 시각화에 필수입니다.
시각화 3대 도구 비교 | Matplotlib(저수준 엔진: plt.plot, bar, barh, scatter, pie, hist, boxplot, imshow) / Seaborn(통계 시각화: sns.lineplot, barplot(평균+신뢰구간 errorbar), countplot, scatterplot, pairplot, histplot(kde=True), boxplot, heatmap(corr(), annot=True)) / Pandas plot(df.plot(kind=...)) |Box Plot은 5가지 요약 수치(최솟값, Q1 25%, 중앙값 Q2, Q3 75%, 최댓값)와 IQR 이상치를 한눈에 보여줍니다.
:::

:::compare
### `groupby` 후 `.agg()` / `.mean()` vs `.transform()`
- **`df.groupby('반')['수학'].mean()`:** 그룹 개수(A반, B반 딱 2개 행)로 압축된 요약 결과를 반환함
- 원본 `df`(8개 행)와 행 길이가 달라서 `df['반평균'] = ...`으로 바로 파생 열을 만들거나 결측치를 반별 평균으로 채울 수 없음
---
### `df.groupby('반')['수학'].transform('mean')`
- 그룹별 계산 결과를 **원본 `df`와 똑같은 행 개수(8개 행)**로 복제해 돌려줌
- 덕분에 `df['반평균과의차이'] = df['수학'] - df.groupby('반')['수학'].transform('mean')`이나 그룹별 결측치 대체를 단 한 줄로 수행할 수 있음!
:::

## 2. 실습: 결측치·중복 행 정제(`reset_index`)와 `groupby`(`agg` vs `transform`) 파이프라인

결측치(`NaN`)와 중복 행이 섞인 학생 성적 데이터를 정제하고, `.transform('mean')`으로 반별 평균을 각 행에 매핑해 결측치를 채운 뒤, `apply`로 등급을 부여하고 `pivot`/`melt`까지 검증했습니다.

```python
# title: pandas_part2_cleaning_groupby_transform.py — 중복 제거(reset_index), transform 결측치 보정, apply, agg 실습
# takeaway: groupby().transform('mean')을 사용하면 전체 평균이 아니라 '각 학생이 속한 반의 평균'으로 정교하게 결측치를 채우거나 반 평균 대비 편차를 구할 수 있습니다.
import numpy as np
import pandas as pd

raw_df = pd.DataFrame({
    "이름": ["민준", "서연", "도윤", "하은", "시우", "지안", "예준", "수아", "민준"],
    "반":   ["A", "A", "B", "B", "A", "B", "A", "B", "A"],
    "국어": [88, 92, 76, 85, 95, 70, 81, 90, 88],
    "영어": [84, 95, np.nan, 89, 91, 75, 78, 93, 84],
    "수학": [90, 87, 94, 78, 98, 65, np.nan, 88, 90],
})

# 1) 완벽히 일치하는 중복 행(마지막 '민준' 중복) 제거 후 인덱스 0부터 재배정
df = raw_df.drop_duplicates().reset_index(drop=True)
print("중복 제거 후 행 개수:", len(df))  # 8

# 2) 핵심: groupby + transform('mean')으로 각 과목 결측치를 '해당 반의 평균'으로 정교하게 채우기
df["영어"] = df["영어"].fillna(df.groupby("반")["영어"].transform("mean"))
df["수학"] = df["수학"].fillna(df.groupby("반")["수학"].transform("mean"))

# 3) 반 평균 대비 내 수학 점수 편차(transform 활용) 및 apply 등급 산출
df["반수학평균"] = df.groupby("반")["수학"].transform("mean")
df["반대비편차"] = (df["수학"] - df["반수학평균"]).round(1)
df["평균"] = ((df["국어"] + df["영어"] + df["수학"]) / 3).round(1)
df["등급"] = df["평균"].apply(lambda s: "A" if s >= 90 else ("B" if s >= 80 else "C"))

# 4) 반별 다중 통계 집계 (.agg)
summary = df.groupby("반")["평균"].agg(["mean", "max", "min", "count"]).round(2)
print("\n반별 평균 점수 요약(.agg):\n", summary)
print("\n학생별 반 대비 수학 편차(.transform):\n", df[["이름", "반", "수학", "반수학평균", "반대비편차"]].head(4))
```

## 3. 실습: 시각화를 위한 `Wide-form` ↔ `Long-form` 변환(`melt` & `pivot`)

Pandas 표에서 바로 그래프를 그릴 때(`wide.plot()`)는 과목들이 옆으로 나열된 **Wide-form**이 편하지만, Seaborn에서 `hue="과목"`으로 과목별 분포를 한 번에 비교할 때는 **`melt()`**를 사용해 세로로 긴 **Long-form**으로 녹여주어야 합니다.

```python
# title: pandas_part2_melt_pivot.py — Wide-form 과목 성적표를 Long-form으로 melt 후 다시 pivot 복원
# takeaway: Seaborn의 hue 옵션을 쓰려면 분류 기준(과목명)이 하나의 컬럼 안에 값으로 들어 있는 Long-form 데이터여야 하므로 wide.melt()가 필수입니다.
import pandas as pd

wide_scores = pd.DataFrame({
    "이름": ["민준", "서연", "도윤"],
    "국어": [88, 92, 76],
    "영어": [84, 95, 82],
    "수학": [90, 87, 94],
})

# 1) Wide -> Long 변환 (melt): 국어·영어·수학 컬럼을 '과목'과 '점수' 두 컬럼으로 녹임
long_scores = wide_scores.melt(id_vars="이름", var_name="과목", value_name="점수")
print("Long-form 변환 결과 (상위 4행):\n", long_scores.head(4))

# 2) Long -> Wide 복원 (pivot)
restored_wide = long_scores.pivot(index="이름", columns="과목", values="점수").reset_index()
print("\nPivot 복원 결과:\n", restored_wide)
```

## 4. 최종적으로 내가 알아낸 내용

:::finding
### Pandas 심화 정제·집계(`transform`)와 데이터 시각화 이론으로 깨달은 핵심 원리
- **`drop_duplicates()` 뒤에는 습관처럼 `.reset_index(drop=True)`를 붙일 것:** 중복 행만 지우고 인덱스를 그대로 두면 중간 번호가 이가 빠진 것처럼 비어 버려, 나중에 인덱스로 행을 찾거나 데이터를 결합할 때 오류가 발생합니다.
- **그룹별 요약 표가 필요하면 `.agg()`, 원본 행마다 그룹 대표값을 붙이고 싶으면 `.transform()`:** 이 차이를 알고 나니 "자기 반 평균보다 몇 점 높은가?"나 "반별 중앙값으로 결측치 채우기"를 반복문 없이 단 한 줄로 짤 수 있게 되었습니다.
- **Seaborn의 `sns.barplot`은 단순 막대가 아니라 '평균(`estimator="mean"`)과 신뢰구간(`errorbar`)'을 자동으로 계산해 그림:** 그리고 `hue` 옵션을 자유자재로 쓰려면 `wide.melt()`로 데이터를 Long-form으로 바꾸는 법을 반드시 알고 있어야 합니다.
:::
