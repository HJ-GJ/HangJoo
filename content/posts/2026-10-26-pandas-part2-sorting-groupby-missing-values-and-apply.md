---
issue: "NO. 10"
title: "Pandas Part 2 — 정렬·그룹 집계(groupby)와 결측치 처리·파생 열(apply)"
date: "2026-10-26"
category: "Pandas"
readTime: "7분"
tags: ["Pandas", "GroupBy", "MissingValues", "FeatureEngineering", "Apply"]
summary: "수업 HTML 교재(Pandas_입문교재.html Part 05~06)를 바탕으로 sort_values 다중 정렬, groupby + agg 그룹별 통계 요약, 결측치(NaN) 탐지·대체(isna, fillna, dropna), 그리고 총점·평균·등급 파생 열 생성(apply)을 정리합니다."
coverType: "pandas-analysis"
takeaway: "결측치(NaN)가 섞여 있을 때 무작정 0으로 채우면(fillna(0)) 평균이 왜곡될 수 있으므로, 도메인 맥락에 맞춰 평균값 대체(fillna(mean))와 행 삭제(dropna) 중 적절한 전략을 선택해야 합니다."
---

## 1. 이론: 정렬(`sort_values`)과 묶어 보기(`groupby` · `value_counts`)

데이터를 조건으로 추려낸 다음 단계는 **순서대로 줄 세우기(정렬)**와 **그룹별로 묶어 요약하기(집계)**입니다. 수업 교재(`Pandas_입문교재.html` Part 05)에서는 `groupby`가 내부적으로 **(1) 그룹 나누기(Split) → (2) 각 그룹별 계산(Apply) → (3) 결과 합치기(Combine)**의 3단계로 작동한다는 원리를 다뤘습니다.

:::formula
다중 기준 정렬 | df.sort_values(['반', '국어'], ascending=[True, False]) | 반은 오름차순(A→B)으로 묶고, 같은 반 안에서는 국어 점수 내림차순(높은 순)으로 정렬합니다.
그룹별 다중 집계 | df.groupby('반')['수학'].agg(['mean', 'max', 'min', 'count']) | 그룹별로 평균, 최댓값, 최솟값, 인원수를 한 번에 표로 요약합니다.
범주별 개수 세기 | df['반'].value_counts() | 각 값이 몇 번씩 등장하는지 빈도수를 큰 순서대로 세어 줍니다.
:::

## 2. 비교: 결측치(`NaN`) 처리 3가지 전략과 `apply` 함수 전달 규칙

현실 데이터에는 설문 미응답이나 측정 누락으로 인해 빈칸(`NaN`, Not a Number)이 자주 등장합니다. 교재 Part 06에서는 `df.isna().sum()`으로 열별 빈칸 개수를 먼저 파악한 뒤, 데이터의 성격에 따라 채우거나 지우는 기준을 비교했습니다.

:::compare
### `fillna(0)` vs `fillna(평균)` vs `dropna()`
- **`fillna(0)`:** 보너스 미지급액이나 구매 횟수처럼 '빈칸 = 실제로 0'인 경우에 적합하지만, 시험 점수에 쓰면 반 평균을 깎아먹는 왜곡이 생김
- **`fillna(df['열'].mean())`:** 전체 분포의 중심을 크게 해치지 않고 빈칸을 메울 때 사용
- **`dropna()`:** 핵심 정보가 비어 있어 추정이 위험할 때 해당 행을 아예 제외
---
### 파생 열 생성과 `apply(함수이름)` 주의점
- `df['총점'] = df['국어'] + df['영어'] + df['수학']`처럼 열끼리 더하면 같은 행끼리 자동 계산되어 새 열이 맨 끝에 추가됨
- 점수 구간에 따라 `'A'`, `'B'`, `'C'` 등급을 매길 때는 함수를 정의한 뒤 **`df['평균'].apply(grade)`처럼 함수 이름만 전달**해야 함 (`grade()`처럼 괄호를 붙이면 즉시 호출 에러 발생)
- 원본 표는 기본적으로 보호되므로, 변경 결과를 유지하려면 `df = df.fillna(...)`처럼 다시 변수에 담아야 함
:::

## 3. 실습: 반별 성적 집계·결측치 보정·등급 파생 열 파이프라인

수업 교재 Part 05~06의 흐름을 하나로 이어, 결측치가 포함된 성적표에서 빈칸을 열 평균으로 보정한 뒤 `총점`·`평균`·`등급` 파생 열을 만들고 반별 요약 통계를 산출하는 전체 파이프라인을 작성했습니다.

```python
# title: pandas_part2_groupby_fillna_apply.py — 결측치 보정, 파생 열(apply), 반별 다중 집계
# takeaway: df['평균'].apply(grade)에서 grade 뒤에 괄호 ()를 붙이지 않아야 각 행의 점수마다 함수가 차례대로 호출됩니다.
import numpy as np
import pandas as pd

df = pd.DataFrame({
    "이름": ["민준", "서연", "도윤", "하은", "시우", "지안", "예준", "수아"],
    "반":   ["A", "A", "B", "B", "A", "B", "A", "B"],
    "국어": [88, 92, 76, 85, 95, 70, 81, 90],
    "영어": [84, 95, np.nan, 89, 91, 75, 78, 93],  # 도윤 영어 결측
    "수학": [90, 87, 94, 78, 98, 65, np.nan, 88],  # 예준 수학 결측
})

# 1) 열별 결측치 개수 확인 후 각 과목 평균으로 채우기
print("보정 전 결측치 개수:\n", df.isna().sum())
df["영어"] = df["영어"].fillna(df["영어"].mean())
df["수학"] = df["수학"].fillna(df["수학"].mean())

# 2) 파생 열(총점, 평균) 만들기 및 apply로 등급 부여
df["총점"] = df["국어"] + df["영어"] + df["수학"]
df["평균"] = (df["총점"] / 3).round(1)

def assign_grade(score: float) -> str:
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    return "C"

# 핵심: 함수 이름 assign_grade 만 넘겨 각 학생의 평균 점수를 등급으로 변환합니다.
df["등급"] = df["평균"].apply(assign_grade)

# 3) 반별 평균·최고·최저·인원수 한 번에 집계
summary = df.groupby("반")["평균"].agg(["mean", "max", "min", "count"]).round(2)
print("\n반별 평균 점수 요약:\n", summary)
print("\n등급별 학생 수:\n", df["등급"].value_counts())
```

## 4. 최종적으로 내가 알아낸 내용

:::finding
### Pandas Part 2 (교재 05~06) 학습으로 내가 직접 정리한 핵심 포인트
- **Pandas 메서드의 대부분은 원본 `df`를 직접 바꾸지 않고 '새로운 표'를 돌려줌:** `df.sort_values(...)`, `df.fillna(...)`, `df.drop(...)`을 호출한 뒤 결과를 계속 쓰려면 반드시 `df = ...`로 다시 대입해야 다음 줄에 반영됩니다.
- **결측치 확인은 `df.isna().sum()` 한 줄이 가장 빠른 진단표:** `df.isna()`가 빈칸을 `True(1)`로 바꾸고 `.sum()`이 열마다 `1`을 모두 더해주기 때문에, 수만 줄 데이터에서도 어느 열에 빈칸이 몇 개인지 1초 만에 파악할 수 있습니다.
- **단순 사칙연산은 열끼리 바로 계산하고, 조건 분기(`if-elif`)가 필요할 때만 `.apply(함수)`를 쓸 것:** `총점`이나 `평균`은 브로드캐스팅 벡터 연산(`df['국어'] + df['영어']`)이 가장 빠르고, 구간별 등급처럼 조건문이 들어갈 때 `.apply()`가 빛을 발합니다.
:::
