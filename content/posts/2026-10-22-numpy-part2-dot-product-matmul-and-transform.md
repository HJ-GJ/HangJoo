---
issue: "NO. 08"
title: "[NumPy] - 내적(Dot Product)의 그림자 원리와 행렬곱(@)·축(axis) 통계·배열 변형"
date: "2026-10-22"
category: "NumPy"
readTime: "10분"
tags: ["NumPy", "DotProduct", "MatrixMultiplication", "Axis", "Reshape", "Sort"]
summary: "수업 PDF([python] 05. Numpy.pdf)와 HTML 교재를 바탕으로 내적(a @ b)의 기하학적 의미(그림자 정사영)와 행렬곱(A @ B) 크기 규칙, 2D 좌표 변환과 GPU 필요성, 그리고 축(axis=0 vs axis=1) 통계 집계(sum, mean, np.median, std), 배열 변형(reshape, transpose), 정렬(np.sort vs argsort)을 정리합니다."
coverType: "numpy-matmul"
takeaway: "내적(a @ b)은 유사도 측정기이고 행렬곱(A @ B)은 여러 내적을 동시에 수행하는 공간 변환 장치이며, axis=0(세로 압축)과 axis=1(가로 압축), reshape, argsort는 머신러닝 데이터 전처리의 필수 도구입니다."
---

## 1. 이론: 내적(`a @ b`)의 그림자 원리와 행렬곱(`A @ B`), 그리고 축(`axis`) 통계·변형·정렬

수업 교재(`[python] 05. Numpy.pdf` & `numpy.html` Part 04~05)에서는 선형대수의 핵심인 **내적(Dot Product)**과 **행렬곱(Matrix Multiplication)**의 원리, 그리고 실전 데이터 전처리에서 매일 사용하는 **통계 집계(`axis`)·형태 변형(`reshape`, `transpose`)·정렬(`sort`, `argsort`)** 메서드를 함께 다뤘습니다.

### 1) 내적(`a @ b`)과 행렬곱(`A @ B` / `np.dot(A, B)`)
- **내적(Dot Product):** 같은 위치의 원소를 곱한 뒤 모두 더하는 연산(`a₁b₁ + a₂b₂ + ...`)입니다. 기하학적으로는 한 벡터 위로 손전등을 비췄을 때 생기는 **그림자(정사영)의 길이와 바닥 벡터의 길이를 곱한 값**으로, 두 벡터가 얼마나 같은 방향(비슷한 성향)을 가리키는지 측정합니다.
- **행렬곱 조건 `(m, n) @ (n, p) = (m, p)`:** 결과 행렬의 `(i, j)` 칸은 **앞 행렬 `A`의 `i`번째 행과 뒤 행렬 `B`의 `j`번째 열을 내적한 값**입니다. 따라서 반드시 **앞 행렬의 열 개수(`n`)와 뒤 행렬의 행 개수(`n`)가 일치**해야 하며, 결과 크기는 바깥쪽 숫자인 `(m, p)`가 됩니다.
- **왜 딥러닝에 행렬곱과 GPU가 필수인가?** CPU는 복잡한 계산을 순서대로 처리하는 데 강하지만, **GPU는 단순한 곱셈과 덧셈 수만 개를 동시에 병렬 처리**하는 데 최적화되어 있습니다. 그래서 딥러닝 프레임워크는 모든 입력 데이터와 가중치를 행렬로 묶어 **행렬곱(`X @ W + b`)** 형태로 바꿔서 GPU에 전달합니다.

### 2) NumPy 배열 통계(`axis=0` vs `axis=1`), 형태 변형(`reshape`), 정렬(`argsort`)
교재 후반부 부록에서 정리한 핵심 메서드 규칙은 다음과 같습니다.

:::formula
축(axis) 기반 통계 집계 | axis=0 : 열(세로, 위→아래) 방향으로 압축 / axis=1 : 행(가로, 왼→오) 방향으로 압축 | .sum()(합계), .mean()(평균), .min()(최솟값), .max()(최댓값), .std()(표준편차: 평균 중심으로 흩어진 정도)를 지원합니다.
중앙값(median) 호출 주의점 | np.median(arr) (인스턴스 메서드 arr.median() 은 존재하지 않음!) | sum, mean, std와 달리 중앙값만 유일하게 arr.median()으로 부를 수 없고 반드시 np.median(arr) 함수로 호출해야 합니다!
배열 변형 (reshape & transpose) | arr.reshape(a, b) (단, a × b == arr.size 필수!) / arr.transpose() 또는 arr.T (행과 열 축 교환) | 12개 원소를 가진 배열은 (2, 6), (3, 4), (4, 3) 등 원소 총개수(size)가 같은 모양으로만 reshape 할 수 있습니다.
정렬과 인덱스 추출 (sort vs argsort) | np.sort(arr) (원본 유지, 정렬된 복사본 반환) vs arr.sort(axis=...) (원본 자체 정렬) / np.argsort(arr) | np.argsort(arr)는 값을 정렬했을 때 '원래 몇 번 인덱스에 있던 값인지' 인덱스 번호 배열을 반환하여 상위 N개 추천에 핵심적으로 쓰입니다.
:::

:::compare
### 원소별 곱셈 (`A * B`) vs 행렬곱 (`A @ B`)
- **`A * B` (Element-wise):** 두 행렬의 모양(`shape`)이 같아야 하며, 단순히 같은 자리에 있는 숫자끼리만 곱함
- **`A @ B` (`np.dot(A, B)`):** 행과 열을 짝지어 내적하며, 곱하는 순서가 바뀌면 결과나 모양이 완전히 달라짐 (`A @ B ≠ B @ A`, 예: `(4, 2) @ (2, 4) → (4, 4)` 이지만 `(2, 4) @ (4, 2) → (2, 2)`)
---
### `np.sort(arr)` vs `np.argsort(arr)`
- **`np.sort([50, 10, 30])`:** 값 자체를 오름차순으로 줄 세운 배열 `[10, 30, 50]`을 반환함
- **`np.argsort([50, 10, 30])`:** 가장 작은 값(`10`, 1번 인덱스)부터 순서대로 **원래 인덱스 번호**인 `[1, 2, 0]`을 반환함 (가장 큰 값의 위치 하나만 찾을 때는 `.argmax()` 사용)
:::

## 2. 실습: 영화 취향 내적 추천과 행렬곱 크기 규칙 · 통계(`axis`) · `argsort` 검증

내적(`@`)으로 영화 추천 점수를 구하고, 교재의 연습문제 행렬곱(`(2, 3) @ (3, 1) → (2, 1)`, `(4, 2) @ (2, 4) → (4, 4)`), 그리고 `axis`별 통계와 `np.median()`, `np.argsort()`를 한 번에 검증했습니다.

```python
# title: numpy_part2_matmul_stats_sort.py — 내적 추천, 행렬곱, axis 통계, np.median, argsort 실습
# takeaway: 중앙값은 arr.median()이 아니라 np.median(arr)으로 호출해야 하며, 추천 점수 순위를 매길 때는 np.argsort()로 원래 영화 번호를 찾습니다.
import numpy as np

# 1) 내적(a @ b)으로 내 영화 취향([액션=4, 로맨스=5])과 가장 비슷한 영화 찾기
my_taste = np.array([4, 5])
movies = np.array([
    [5, 0],  # 0번 영화: 순수 액션
    [5, 4],  # 1번 영화: 액션+로맨스 조화
    [0, 5],  # 2번 영화: 순수 로맨스
])

scores = movies @ my_taste
# 핵심: argsort()는 오름차순 인덱스를 반환하므로 [::-1]로 뒤집어 최고점 영화 번호부터 뽑습니다.
ranking_idx = np.argsort(scores)[::-1]
print("영화별 추천 점수 :", scores)       # [20, 40, 25]
print("추천 순위 인덱스 :", ranking_idx)  # [1, 2, 0] -> 1번 영화(40점) 1위!

# 2) 축(axis) 기반 통계와 np.median() 확인
exam = np.array([
    [80, 90, 70],
    [60, 85, 95]
])
print("과목별(세로 압축, axis=0) 평균:", exam.mean(axis=0))  # [70.  87.5 82.5]
print("학생별(가로 압축, axis=1) 합계:", exam.sum(axis=1))   # [240 240]
print("전체 점수 중앙값(np.median)   :", np.median(exam))    # 82.5
print("전체 점수 표준편차(.std)      :", round(exam.std(), 2))

# 3) reshape와 transpose(.T) 변형
reshaped = np.arange(1, 13).reshape(3, 4)
print("reshape(3, 4) 후 transpose(4, 3) shape:", reshaped.T.shape)  # (4, 3)
```

## 3. 실습: 2D 좌표 회전·확대 변환(`points @ R`)

교재 Part 05에서는 점 `p = [x, y]`들이 모인 `(N, 2)` 좌표 행렬에 $2 \times 2$ 변환 행렬을 한 번만 행렬곱(`points @ R`)하면 모든 점의 위치가 동시에 확대되거나 회전하는 원리를 실험했습니다.

```python
# title: numpy_part2_transform.py — 2x2 변환 행렬로 여러 점 동시에 회전·확대하기
# takeaway: 점 4개를 담은 (4, 2) 행렬에 (2, 2) 변환 행렬을 한 번만 곱하면(points @ R), 반복문 없이 모든 꼭짓점이 동시에 회전합니다.
import numpy as np

# 정사각형의 네 꼭짓점 좌표 (4개의 점 x 2차원 좌표)
points = np.array([
    [0, 0],
    [2, 0],
    [2, 1],
    [0, 1]
])

# 가로 2배 확대 행렬 & 반시계 방향 90도 회전 행렬
scale_x2 = np.array([[2, 0], [0, 1]])
rotate_90 = np.array([[0, 1], [-1, 0]])

# 핵심: 반복문 없이 행렬곱 한 번으로 4개 꼭짓점 전체를 동시에 변환합니다.
print("가로 2배 확대 좌표:\n", points @ scale_x2)
print("90도 회전 좌표    :\n", points @ rotate_90)
```

## 4. 최종적으로 내가 알아낸 내용

:::finding
### NumPy 내적·행렬곱·통계·변형 이론으로 내가 직접 정리한 핵심 포인트
- **`axis=0`은 '행 번호가 바뀌는 세로 방향 압축'이고 `axis=1`은 '열 번호가 바뀌는 가로 방향 압축'임:** 학생(행) × 과목(열) 성적표에서 과목별 평균을 구할 때는 위아래로 압축하는 `axis=0`을, 학생 개인별 총점을 구할 때는 옆으로 압축하는 `axis=1`을 씁니다.
- **중앙값은 유일하게 `arr.median()` 메서드가 없어서 `np.median(arr)` 함수를 써야 함:** `.sum()`, `.mean()`, `.min()`, `.max()`, `.std()`는 배열 인스턴스에서 바로 부를 수 있지만, `median`만 함수 형태로 호출해야 한다는 점을 직접 비교하며 확실히 외웠습니다.
- **정렬 후에도 '원래 몇 번째 데이터였는지' 알아야 할 때는 무조건 `np.argsort()`:** 그냥 `np.sort()`를 쓰면 점수만 남고 몇 번 영화인지 정보가 사라지지만, `np.argsort()`를 쓰면 정렬된 순서의 원본 인덱스 번호를 그대로 얻을 수 있습니다.
:::
