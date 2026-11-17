---
issue: "NO. 04"
title: "Python Day 4 — 집합(set)·딕셔너리(dict)와 2차원 문자 격자 디버깅"
date: "2026-10-16"
category: "Python"
readTime: "7분"
tags: ["Python", "Set", "Dict", "2DGrid", "Debugging"]
summary: "중복을 허용하지 않는 set으로 구현한 로또 번호 생성·교집합 판정, dict.get()을 활용한 숫자 빈도수 집계, 그리고 2차원 문자 사각형·삼각형 인덱스 범위를 수정한 과정을 정리합니다."
coverType: "python-day4"
takeaway: "중복 제거와 포함 여부 확인은 set이, 키별 등장 횟수 누적은 dict.get(key, 0) + 1 패턴이 가장 적합하며, 2차원 격자 문제는 행(row)과 열(col) 순회 순서를 먼저 그림으로 고정해야 헷갈리지 않습니다."
---

## 1. 집합(`set`)과 딕셔너리(`dict`)의 핵심 활용 패턴

넷째 날에는 순서 중심의 리스트를 넘어, **중복 없는 집합(`set`)**과 **키-값 매핑(`dict`)** 자료구조를 배웠습니다.

:::compare
### `set` (집합 — `lottery_game.py`, `apartment_blacklist.py`)
- 중복 원소를 자동으로 제거하므로 `while len(numbers) < 6:`과 `set.add()`로 중복 없는 6개 번호를 안전하게 뽑음
- 교집합 연산(`lotto & user`) 한 줄로 일치하는 번호 개수를 즉시 계산
---
### `dict` (딕셔너리 — `number_frequency.py`)
- 각 숫자가 몇 번 등장했는지 `counts[num] = counts.get(num, 0) + 1`로 깔끔하게 누적
- `KeyError` 없이 기본값 `0`을 반환하는 `.get(key, 0)` 패턴이 핵심
:::

```python
# title: 2026-10-16/lottery_game.py & number_frequency.py — set 교집합과 dict 빈도수
# takeaway: set의 교집합(&)과 차집합(-) 연산을 쓰면 이중 반복문 없이도 두 집단 간 포함 관계를 즉시 구할 수 있습니다.
# 1) 로또 당첨 번호와 내 번호 일치 개수 판정
winning_numbers = {3, 11, 19, 24, 33, 42}
my_numbers = {7, 11, 24, 31, 33, 45}

# 핵심: 교집합(&) 연산으로 두 집합에 공통으로 들어 있는 번호만 추출합니다.
matched = winning_numbers & my_numbers
print(f"일치 번호 ({len(matched)}개):", sorted(matched))

# 2) 숫자별 등장 횟수 집계 (dict.get 활용)
samples = [1, 3, 2, 3, 1, 3, 5, 2]
freq = {}
for num in samples:
    freq[num] = freq.get(num, 0) + 1
print("숫자별 빈도:", freq)
```

## 2. 2차원 격자 패턴과 인덱스 범위 디버깅 (`letter_rectangle.py`, `letter_triangle.py`)

2차원 격자에 문자를 채우는 문제에서는 **행(`i`)과 열(`j`) 중 어느 축을 바깥 반복문에 둘 것인가**와 **초기화 변수의 위치**가 결정적이었습니다.

- **연속 숫자 사각형 (`sequential_square.py`):** `number = 1`을 안쪽 반복문이 아니라 **바깥 반복문 시작 전**에 선언해야 행이 바뀌어도 숫자가 1로 초기화되지 않고 이어집니다.
- **오른쪽 아래부터 채우는 문자 정사각형 (`letter_rectangle.py`):** 열(`j`)과 행(`i`)을 `range(n - 1, -1, -1)`로 역순 순회하면서 `chr(65 + num % 26)`을 대입하면 `'Z'` 다음 다시 `'A'`로 순환하며 채워집니다.
- **문자 삼각형 범위 수정 (`letter_triangle.py`):** 처음에 `start = mid - j`, `end = mid + j`로 잘못 잡았던 행 범위를 실행 출력과 대조해 `start = j`, `end = n - 1 - j`로 바로잡았습니다.

```python
# title: 2026-10-16/letter_rectangle.py — 오른쪽 아래부터 역방향으로 채우는 문자 격자
# takeaway: 격자 채우는 순서(역방향 열 순회)와 화면 출력 순서(정방향 행 순회)가 다를 때는 2차원 배열 board[i][j]를 먼저 만들어 채운 뒤 출력하면 논리가 단순해집니다.
n = 4
board = [[""] * n for _ in range(n)]
num = 0

# 핵심: 가장 오른쪽 열(n-1)부터 왼쪽 열(0)까지, 아래쪽 행(n-1)부터 위쪽 행(0)까지 채웁니다.
for j in range(n - 1, -1, -1):
    for i in range(n - 1, -1, -1):
        board[i][j] = chr(65 + (num % 26))
        num += 1

for row in board:
    print(" ".join(row))
```

## 3. 최종적으로 내가 알아낸 내용

:::finding
### Day 4 실습을 통해 직접 깨달은 핵심 원리
- **빈도수 집계는 `if key in d:` 대신 `d.get(key, 0) + 1` 한 줄로 통일할 것:** 키가 없을 때 기본값 `0`을 돌려주므로 분기문 없이도 모든 원소의 등장 횟수를 안전하게 셀 수 있습니다.
- **채우는 순서와 출력하는 순서가 다를 때는 2차원 배열(`board[i][j]`)을 먼저 만들 것:** 화면 출력(`print`)은 항상 위→아래(행), 왼쪽→오른쪽(열)으로만 가능하므로, 오른쪽 아래부터 역방향으로 채우는 문제는 `board` 배열에 먼저 값을 기록한 뒤 마지막에 정방향으로 출력해야 인덱스가 꼬이지 않습니다.
- **누적 변수(`num`)의 초기화 위치가 결과를 바꿈:** 바깥 루프 밖에 두면 격자 전체에서 숫자가 이어지고, 바깥 루프 안에 두면 행이 바뀔 때마다 1부터 다시 시작합니다.
:::
