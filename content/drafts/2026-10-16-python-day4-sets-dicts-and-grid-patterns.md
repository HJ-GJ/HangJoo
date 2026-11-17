---
issue: "NO. 04"
title: "[Python] - 튜플·딕셔너리·집합(Hash Table) 내부 원리와 2차원 격자 탐색"
date: "2026-10-16"
category: "Python"
readTime: "10분"
tags: ["Python", "Tuple", "Dict", "Set", "HashTable", "2DGrid"]
summary: "불변 시퀀스 튜플(tuple), 해시 테이블(Hash Table) 기반 딕셔너리(dict.get vs d[key])와 집합(set 초기화 및 remove vs discard 차이)의 내부 동작 원리를 정리하고, 로또 교집합·빈도수 집계·2차원 격자 디버깅을 복기합니다."
coverType: "python-day4"
takeaway: "딕셔너리와 집합(set)은 내부적으로 해시 테이블(Hash Table) 구조를 사용해 원소 개수와 무관하게 O(1)에 가까운 초고속 탐색을 제공하며, 이 때문에 변하지 않는 불변(immutable) 객체만 키나 원소로 담을 수 있습니다."
---

## 1. 이론: `tuple` · `dict` · `set`의 내부 구조와 해시 테이블(Hash Table) 원리

수업 교재(`[python] 02. iterables.pdf` 후반부)에서는 리스트·문자열에 이어 나머지 3가지 Iterable 자료구조인 **튜플(`tuple`)**, **딕셔너리(`dict`)**, **집합(`set`)**이 왜 존재하는지, 그리고 왜 리스트보다 탐색이 압도적으로 빠른지를 내부 메모리 구조로 설명합니다.

### 1) 튜플(`tuple` — `sequence` + `immutable`)
- 소괄호 `(1, 2, 3)`으로 생성하며 리스트처럼 인덱싱·슬라이싱이 가능하지만, **한 번 생성하면 요소를 수정·추가·삭제할 수 없는 불변(`immutable`) 자료형**입니다.
- **왜 리스트 대신 튜플을 쓸까?** 구조가 단순해 **리스트보다 처리 속도가 빠르고 메모리를 적게 차지**하며, 프로그램 실행 도중 절대 바뀌면 안 되는 상수 데이터(예: 좌표 `(x, y)`, RGB 색상값)를 안전하게 보호하고 **딕셔너리의 `key`나 집합(`set`)의 원소**로 사용할 수 있습니다.

### 2) 딕셔너리(`dict`)와 해시 테이블(Hash Table)
- 중괄호 `{key: value}` 형태로 데이터를 저장하는 **비시퀀스(순서 인덱싱 불가)** 매핑 자료구조입니다.
- **Key의 2가지 절대 조건:** `key`는 중복될 수 없으며(중복 대입 시 나중 값으로 덮어써짐), 반드시 **불변(`immutable`) 데이터(정수, 문자열, 튜플)만 `key`로 사용할 수 있습니다.** 가변 객체인 리스트(`[1, 2]`)는 값이 바뀌면 해시 주소가 달라지므로 `key`로 쓸 수 없습니다(`TypeError: unhashable type: 'list'`).
- **해시 테이블(Hash Table)과 `d[key]` vs `d.get(key)`:** 딕셔너리는 내부적으로 `key`를 해시 함수에 통과시켜 저장 위치를 즉시 찾아가는 **해시 테이블** 구조입니다. 없는 키를 `d[key]`로 찾으면 `KeyError`가 발생해 사전에 `if key in d:` 검사가 필요하지만, **`d.get(key, 기본값)`**을 쓰면 해시 테이블을 한 번만 조회해 키가 없을 때 에러 없이 `None`(또는 지정한 기본값)을 즉시 반환합니다.

### 3) 집합(`set` — Value가 없는 `dict` 해시 구조)
- 중복을 허용하지 않고 **"원소가 존재하는가"**만 관리하는 자료구조입니다. 순서가 없으므로 `s[0]` 같은 인덱싱은 불가능합니다.
- **빈 집합 생성 주의점:** `{}`라고만 쓰면 빈 집합이 아니라 **빈 딕셔너리(`dict`)**가 만들어집니다! 빈 집합은 반드시 **`s = set()`**으로 초기화해야 합니다.
- **왜 `s.remove(x)`는 `KeyError`를 낼까?** 파이썬의 `set`은 내부적으로 **value가 없는 `dict`(해시 테이블)**와 똑같은 구조로 구현되어 있습니다. 그래서 없는 원소를 `s.remove(x)`로 지우려 하면 딕셔너리에서 없는 키를 찾을 때와 똑같이 `KeyError`가 발생합니다! 에러 없이 안전하게 지우려면 **`s.discard(x)`**를 사용합니다.

:::formula
딕셔너리 순회·조작 메서드 | .keys(), .values(), .items() / d.get(k, default), d.pop(k), d.update(d2) | for k, v in d.items(): 패턴으로 키와 값을 동시에 꺼내 순회합니다.
집합(set) 추가·삭제 메서드 | s.add(단일값), s.update(여러값_이터러블) / s.remove(x) (없으면 KeyError) vs s.discard(x) (없어도 무시) | 여러 값을 한 번에 넣을 때는 add가 아니라 update()를 사용합니다.
집합(set) 수학 연산자 4종 | 합집합(a | b), 교집합(a & b), 차집합(a - b), 대칭차집합(a ^ b : 합집합 - 교집합) | 이중 반복문 없이도 두 집단 간의 공통 원소(&)와 배타적 원소(-, ^)를 단 한 줄로 추출합니다.
:::

:::compare
### 리스트(`list`) 기반 탐색 및 중복 제거
- `if x in my_list:`는 맨 앞부터 끝까지 하나씩 비교하는 선형 탐색($O(N)$)이라 데이터가 10만 개면 10만 번 비교함
- 중복을 제거하려면 새 리스트를 만들고 일일이 확인하며 `.append()`해야 함
---
### 집합(`set`) · 딕셔너리(`dict`) 해시 테이블 탐색
- `if x in my_set:` 또는 `d.get(x)`는 해시 주소로 곧장 점프($O(1)$)하므로 데이터가 100만 개여도 즉시 찾음
- `list(set(my_list))` 한 줄로 모든 중복 원소를 제거하고, `a & b`로 교집합을 즉시 구함
:::

## 2. 실습: `set` 교집합·차집합과 `dict.get()` 숫자 빈도수 집계

이론에서 배운 `set`과 `dict.get()`을 활용해 중복 없는 로또 번호 생성·당첨 판정(`lottery_game.py`), 아파트 블랙리스트 차집합 필터링(`apartment_blacklist.py`), 그리고 숫자별 등장 횟수 집계(`number_frequency.py`)를 구현했습니다.

```python
# title: 2026-10-16/lottery_game.py & number_frequency.py — set 집합 연산과 dict.get 빈도수
# takeaway: 빈 집합은 {}가 아니라 set()으로 만들어야 하며, 원소 삭제 시 KeyError를 피하려면 remove() 대신 discard()를 사용합니다.
# 1) 로또 당첨 번호와 내 번호의 교집합(&), 차집합(-), 대칭차집합(^)
winning_numbers = {3, 11, 19, 24, 33, 42}
my_numbers = {7, 11, 24, 31, 33, 45}

matched = winning_numbers & my_numbers          # 교집합: 둘 다 있는 번호
missed = winning_numbers - my_numbers           # 차집합: 당첨 번호 중 내가 못 맞힌 번호
sym_diff = winning_numbers ^ my_numbers         # 대칭차집합: 한쪽에만 있는 번호들
my_numbers.discard(99)                          # 없는 번호(99)를 지워도 에러가 나지 않음!

print(f"일치 번호 ({len(matched)}개):", sorted(matched))
print("아쉽게 놓친 당첨 번호      :", sorted(missed))

# 2) 숫자별 등장 횟수 집계 (Hash Table 기반 dict.get 활용)
samples = [1, 3, 2, 3, 1, 3, 5, 2]
freq = {}
for num in samples:
    freq[num] = freq.get(num, 0) + 1
print("숫자별 빈도:", freq)
```

## 3. 실습: 2차원 격자 패턴과 인덱스 범위 디버깅 (`letter_rectangle.py`, `letter_triangle.py`)

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

## 4. 최종적으로 내가 알아낸 내용

:::finding
### 튜플·딕셔너리·집합(Hash Table) 이론과 2차원 격자 실습에서 깨달은 핵심 원리
- **`set`은 내부적으로 value가 없는 `dict`(해시 테이블)와 똑같음:** 그래서 리스트(`mutable`)는 해시값을 고정할 수 없어 `dict`의 키나 `set`의 원소로 넣을 수 없고(대신 불변인 `tuple`은 가능!), `set.remove(없는값)`를 호출하면 `KeyError`가 발생한다는 원리가 한 번에 이해되었습니다.
- **빈도수 집계는 `if key in d:` 대신 `d.get(key, 0) + 1` 한 줄로 통일할 것:** 해시 테이블에서 키를 찾아 있으면 값을 꺼내고 없으면 기본값 `0`을 즉시 돌려주므로 분기문 없이도 모든 원소의 등장 횟수를 안전하게 셀 수 있습니다.
- **채우는 순서와 출력하는 순서가 다를 때는 2차원 배열(`board[i][j]`)을 먼저 만들 것:** 화면 출력(`print`)은 항상 위→아래(행), 왼쪽→오른쪽(열)으로만 가능하므로, 오른쪽 아래부터 역방향으로 채우는 문제는 `board` 배열에 먼저 값을 기록한 뒤 마지막에 정방향으로 출력해야 인덱스가 꼬이지 않습니다.
:::
