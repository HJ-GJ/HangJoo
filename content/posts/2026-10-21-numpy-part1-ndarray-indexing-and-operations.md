---
issue: "NO. 07"
title: "[NumPy] - 스칼라·벡터·행렬·텐서 구조와 인덱싱·브로드캐스팅"
date: "2026-10-21"
category: "NumPy"
readTime: "10분"
tags: ["NumPy", "ndarray", "Indexing", "BooleanIndexing", "FancyIndexing", "Broadcasting"]
summary: "수업 PDF([python] 05. Numpy.pdf)와 HTML 교재를 바탕으로 Google Colab 런타임 특성, C/C++ 기반 NumPy가 파이썬 리스트보다 10배 이상 빠른 이유, 4대 배열 구조(Scalar·Vector·Matrix·Tensor)와 4대 속성(shape, ndim, dtype, size), 난수 생성(rand, randn, randint), 불리언·팬시 인덱싱 및 브로드캐스팅을 정리합니다."
coverType: "numpy-basics"
takeaway: "NumPy는 C/C++ 저수준 연속 메모리 기반으로 동작해 파이썬 리스트보다 10배 이상 빠르며, 불리언 인덱싱(조건 마스크)과 브로드캐스팅을 통해 반복문 없이 대규모 배열을 한 번에 처리합니다."
---

## 1. 이론: 왜 NumPy인가? — C/C++ 고속 연산과 4대 배열 구조·속성·생성 함수

수업 교재(`[python] 05. Numpy.pdf` & `numpy.html` Part 01~03)는 클라우드 실험 환경인 **Google Colab**의 특징(코드 셀/마크다운 텍스트 셀, T4 GPU 런타임, 최대 12시간 세션 휘발성과 Google Drive 마운트 `drive.mount('/content/drive')`)을 소개한 뒤, 데이터 분석과 머신러닝에서 왜 기본 리스트 대신 **NumPy(`Numerical Python`, `import numpy as np`)**를 쓰는지에서 출발합니다.

### 1) NumPy를 쓰는 단 한 가지 결정적 이유: 속도(Speed)
- 인터프리터 언어인 파이썬의 기본 리스트는 요소를 하나씩 꺼내 타입을 확인하며 순차 연산하므로 대량 연산 시 속도가 매우 느립니다.
- 반면 **NumPy는 내부 연산이 C/C++ 같은 저수준(Low-level) 기계어에 가까운 언어로 구현**되어 있어, 머신러닝의 수백만 개 배열 연산을 파이썬 리스트보다 **10배 이상 빠르게 한 방에 처리(Vectorization)**합니다.

### 2) 차원별 배열 이름 4종과 `ndarray` 4대 필수 속성
NumPy 배열은 차원(`ndim`)이 깊어질 때마다 부르는 이름이 달라지며, 배열을 처음 만들었을 때 반드시 확인하는 **4대 속성**이 있습니다.

:::formula
0~3차원 배열 구조 | Scalar(0차원: 단일값, ndim=0, shape=()) → Vector(1차원: 한 줄 배열, ndim=1, shape=(n,)) → Matrix(2차원: 행×열 표, ndim=2, shape=(r, c)) → Tensor(3차원 이상: 행렬 여러 장 겹침, 예: 컬러 이미지 (H, W, 3)) | t = np.arange(24).reshape(2, 3, 4) 는 0~23 수열을 2장의 (3×4) 행렬로 쌓은 3차원 텐서입니다.
NumPy 배열 4대 속성 | .shape (구조: 행×열 튜플) / .ndim (차원 수) / .dtype (요소 자료형: int64, float64 등) / .size (전체 요소의 총개수 = 행×열) | 4대 속성은 함수가 아니라 상태 이름표이므로 뒤에 괄호 ()를 붙이지 않습니다.
기본·단위·수열 배열 생성 | np.array(list), np.zeros((r, c)), np.ones((r, c)), np.full((r, c), 값), np.eye(n) (n×n 단위행렬) / np.arange(start, end, step) vs np.linspace(start, end, n) | arange는 end-1까지 step 간격으로 생성하고, linspace는 start부터 end까지(끝값 포함!) 정확히 n등분한 배열을 생성합니다.
난수(Random) 생성 3종 | np.random.rand(r, c) (0~1 균등분포) / np.random.randn(r, c) (평균 0·표준편차 1 표준정규분포, 음수 가능) / np.random.randint(low, high, size) (low 이상 high 미만 정수 난수) | 균등분포(Uniform)는 모든 값이 나올 확률이 같고, 정규분포(Normal)는 0 근처가 가장 많이 나오는 종 모양 분포입니다.
:::

:::compare
### 파이썬 리스트 vs NumPy 배열 (`ndarray`) 생성 및 연산 규칙
- `lst = [1, 2, 3]`에서 `lst + lst`는 이어 붙이기, `lst * 2`는 `[1, 2, 3, 1, 2, 3]` 반복 복제임
- 원소마다 값을 더하려면 `[x + 1 for x in lst]`처럼 직접 반복문을 돌려야 함
- `np.zeros((2, 3))`, `np.ones((2, 3))`, `np.full((2, 3), 7)`은 모양(`shape`)을 튜플 하나로 받으므로 **괄호가 두 겹**임
---
### NumPy 원소별 연산과 생성 함수 괄호 구분
- `a = np.array([1, 2, 3])`, `b = np.array([4, 5, 6])`에서 `a + b`는 `[5, 7, 9]`, `a * b`는 `[4, 10, 18]`로 **같은 위치 원소끼리 즉시 연산**함
- `np.eye(3)`은 대각선만 `1`이고 나머지는 `0`인 $3 \times 3$ **단위행렬(Identity Matrix)**을 생성함
- `np.random.rand(2, 3)`과 `np.random.randn(2, 3)`은 모양 숫자를 바로 나열하므로 **괄호 한 겹**만 씀
:::

```python
# title: numpy_part1_creation.py — 4대 배열 구조·4대 속성과 단위행렬(eye)·난수 생성 3종 검증
# takeaway: rand()는 0~1 사이 균등분포, randn()은 평균 0·표준편차 1인 표준정규분포(음수 포함), randint(low, high, size)는 정수 난수를 생성합니다.
import numpy as np

np.random.seed(42)

# 1) 스칼라, 벡터, 행렬, 3차원 텐서 생성 및 4대 속성(shape, ndim, dtype, size) 확인
t = np.arange(24).reshape(2, 3, 4)
print(f"텐서 4대 속성 -> shape: {t.shape}, ndim: {t.ndim}, dtype: {t.dtype}, size: {t.size}")

# 2) 단위행렬(eye), 수열(arange vs linspace), 난수(rand vs randn vs randint)
identity_3x3 = np.eye(3)
arr_step = np.arange(0, 10, 2)             # [0, 2, 4, 6, 8] (끝 미포함)
arr_even = np.linspace(0, 1, 5)            # [0. , 0.25, 0.5 , 0.75, 1. ] (끝 포함 5등분)
rand_int = np.random.randint(1, 10, (2, 3)) # 1 이상 10 미만 정수로 (2, 3) 생성

print("3x3 단위행렬(eye):\n", identity_3x3)
print("randint (2x3)    :\n", rand_int)
```

## 2. 이론 및 비교: 2차원·3차원 인덱싱과 불리언 인덱싱(Boolean) · 팬시 인덱싱(Fancy)

NumPy의 인덱스가 `0`부터 시작하는 이유는 맨 앞 기준점으로부터 떨어진 거리(offset)를 뜻하기 때문입니다. 2차원 이상의 배열에서는 대괄호 여러 개(`m[1][2]`) 대신 쉼표로 축을 구분하는 **`m[행, 열]`** 또는 **`t[면, 행, 열]`** 표기법을 표준으로 사용합니다. 여기에 더해 교재 부록에서는 조건이나 인덱스 목록으로 데이터를 한 번에 뽑아내는 두 가지 고급 인덱싱을 다룹니다.

:::formula
2차원·3차원 슬라이싱 | m[행범위, 열범위] (예: m[0:2, 1:3]) / t[:, 0, :2] | 콜론(:) 단독은 해당 축 전체를 의미하며, 끝 번호는 항상 미포함(exclusive)됩니다.
불리언 인덱싱 (Boolean Indexing) | mask = (arr > 50) → arr[mask] 또는 arr[arr > 50] | 조건식을 적용해 [True, False, True, ...] 마스크 배열을 만든 뒤, True 위치의 원소만 골라냅니다.
팬시 인덱싱 (Fancy Indexing) | arr[[0, 2]] (0번과 2번 행만 추출) / m[1, [0, 2]] (1번 행의 0번·2번 열만 추출) | 원하는 인덱스 번호들을 리스트 [ ]로 묶어 전달하면 그 순서와 위치의 요소들만 한 번에 뽑아옵니다.
:::

## 3. 실습: 불리언·팬시 인덱싱과 브로드캐스팅(Broadcasting)

모양(`shape`)이 서로 다른 배열끼리 연산할 때, 작은 배열을 자동으로 복제해 늘려서 큰 배열의 모양에 맞춰주는 기능을 **브로드캐스팅(Broadcasting — 값을 여러 곳으로 전파)**이라고 합니다.

- **가능한 경우:** `(3, 2)` 행렬과 `(1, 2)`(또는 `(2,)`) 벡터를 더하면 벡터가 모든 행으로 복제되어 더해지고, `(3, 2)` 행렬과 `(3, 1)` 열벡터를 더하면 열 방향으로 확장되어 `(3, 2)`가 됩니다.
- **불가능한 경우(`ValueError`):** `(2, 2)` 행렬과 `(3,)` 벡터처럼 기준 축의 요소 개수가 맞지 않으면 브로드캐스팅이 불가능해 에러가 발생합니다.

```python
# title: numpy_part1_indexing_broadcasting.py — 불리언·팬시 인덱싱과 브로드캐스팅 실습
# takeaway: 불리언 인덱싱 arr[arr > 50]은 반복문이나 if문 없이 조건을 만족하는 원소만 1초 만에 필터링하는 데이터 전처리의 핵심 문법입니다.
import numpy as np

# 1) 불리언 인덱싱(Boolean Indexing): 50점 초과 점수만 골라내기
scores = np.array([55, 42, 77, 93, 35])
mask = scores > 50
print("마스크 배열      :", mask)          # [ True False  True  True False]
print("50점 초과 필터링 :", scores[mask])  # [55 77 93]

# 2) 팬시 인덱싱(Fancy Indexing): 원하는 행 번호 목록([0, 2])만 추출
grid = np.array([
    [10, 20, 30],
    [40, 50, 60],
    [70, 80, 90]
])
print("0번·2번 행 팬시 인덱싱:\n", grid[[0, 2]])      # [[10, 20, 30], [70, 80, 90]]
print("1번 행의 0번·2번 열   :", grid[1, [0, 2]])    # [40, 60]

# 3) 브로드캐스팅(Broadcasting): (3, 2) 행렬 + (3, 1) 열벡터 -> (3, 2)
mat = np.array([[1, 2], [3, 4], [5, 6]])   # shape: (3, 2)
col_vec = np.array([[10], [20], [30]])     # shape: (3, 1) -> (3, 2)로 자동 확장!
print("브로드캐스팅 덧셈 결과:\n", mat + col_vec)
```

## 4. 최종적으로 내가 알아낸 내용

:::finding
### NumPy 구조·인덱싱·브로드캐스팅 이론과 실습에서 깨달은 핵심 포인트
- **`shape`의 `(3,)`과 `(1, 3)`과 `(3, 1)`은 차원과 브로드캐스팅 방향이 다름:** `[1, 2, 3]`은 1차원 벡터 `(3,)`이고, `[[1, 2, 3]]`은 가로 1줄짜리 2차원 행렬 `(1, 3)`, `[[1], [2], [3]]`은 세로 1줄짜리 2차원 행렬 `(3, 1)`입니다.
- **불리언 인덱싱과 팬시 인덱싱을 알면 `for`문과 `if`문이 사라짐:** 조건으로 거를 때는 `arr[arr > 50]`(불리언 마스킹), 특정 번호들만 콕 집어 꺼낼 때는 `arr[[0, 2]]`(팬시 인덱싱)를 쓰면 C/C++ 속도로 즉시 추출됩니다.
- **`arange`와 `linspace`는 문제 조건에 따라 골라 쓸 것:** 보폭(간격)이 주어지면 끝값을 제외하는 `np.arange(시작, 끝, 간격)`을 쓰고, 그래프 x축처럼 구간을 정확히 `n`개의 점으로 등분해야 할 때는 끝점까지 포함하는 `np.linspace(시작, 끝, 개수)`가 가장 정확합니다.
:::
