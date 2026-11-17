---
issue: "NO. 03"
title: "[Python] - 리스트 컴프리헨션과 절사평균, 아스키(ASCII) 시저 암호, 중첩 반복문"
date: "2026-10-15"
category: "Python"
readTime: "9분"
tags: ["Python", "ListComprehension", "ASCII", "NestedLoops"]
summary: "리스트 컴프리헨션(조건 필터링 및 2차원 배열 생성)과 내장 집계 함수(len, sum, max, min 사전순 비교), ASCII 0~127 코드표(ord, chr) 원리를 정리하고 절사평균·시저 암호·중첩 반복문 실습을 복기합니다."
coverType: "python-day3"
takeaway: "리스트 컴프리헨션은 반복과 조건 필터링을 한 줄의 수식처럼 압축해주며, 문자열 암호화는 ord()로 아스키 정수 좌표로 바꾼 뒤 26글자 주기로 순환 보정해 다시 chr()로 복원하는 과정입니다."
---

## 1. 이론: 리스트 컴프리헨션(List Comprehension)과 내장 집계 함수, ASCII 코드

수업 교재(`[python] 02. iterables.pdf` 중반부)에서는 빈 리스트를 만들고 `for`문으로 `.append()`를 반복하는 패턴을 파이썬답게 한 줄로 압축하는 **리스트 컴프리헨션(List Comprehension)**과, 문자를 숫자로 매핑하는 **ASCII 코드 체계**, 그리고 **중첩 반복문(Nested Loop)**의 작동 원리를 다뤘습니다.

:::formula
기본 리스트 컴프리헨션 | [표현식 for 변수 in 반복대상 if 조건식] | 예: [i**2 for i in range(1, 11) if i % 2 == 0] 은 1~10 중 짝수의 제곱만 모아 [4, 16, 36, 64, 100]을 생성합니다.
2차원 리스트 컴프리헨션 | [[j for j in range(3)] for i in range(5)] | 안쪽 리스트 [0, 1, 2]를 독립적인 메모리로 5줄 생성하여 (5행 × 3열) 2차원 리스트를 안전하게 초기화합니다.
내장 집계 함수 4종 | len(길이), sum(합계), max(최댓값), min(최솟값) | 숫자 리스트에서는 크기 비교를 수행하고, 문자열 리스트에서 max()/min()을 호출하면 사전순(알파벳/아스키 코드 순)으로 비교합니다.
ASCII 코드 변환 (0~127) | ord('A') → 65, ord('a') → 97, ord('0') → 48 / chr(65) → 'A' | 컴퓨터는 문자를 0~127 사이의 7비트 정수(총 128개 문자 매핑)로 기억하며, ord()와 chr()로 문자와 정수 사이를 오갑니다.
:::

:::compare
### 2차원 리스트 생성 시 `*` 연산자 함정 vs 리스트 컴프리헨션
- `board = [[0] * 3] * 5`처럼 바깥쪽까지 곱셈(`* 5`)으로 복제하면, 5개의 행이 **모두 똑같은 내부 리스트 메모리 주소**를 가리켜 `board[0][0] = 1`만 바꿔도 모든 행의 첫 칸이 `1`로 바뀌는 버그가 발생함
- 행마다 원소 개수가 다른 **가변 길이(Jagged) 2차원 리스트**를 순회할 때 열 범위를 고정 상수로 두면 `IndexError`가 발생함
---
### 안전한 2차원 초기화와 동적 길이 순회 (`range(len(li[i]))`)
- 반드시 `board = [[0 for _ in range(3)] for _ in range(5)]` (또는 `[[0] * 3 for _ in range(5)]`)처럼 바깥 행은 `for` 컴프리헨션으로 생성해 각 행의 메모리를 분리해야 함
- 중첩 반복문으로 2차원 리스트를 순회할 때는 `for i in range(len(li)):` 안쪽에서 **`for j in range(len(li[i])):`**를 사용해야 각 행(`li[i]`)의 실제 길이에 맞춰 안전하게 순회할 수 있음
:::

## 2. 실습: 리스트 컴프리헨션과 절사평균(`trimmed_mean`) · 인접 원소 비교

내장 집계 함수(`sum`, `max`, `min`, `len`)를 조합해 극단값(최댓값·최솟값)을 제외한 **절사평균**을 구하고, 리스트 컴프리헨션으로 인접한 두 원소(`numbers[i]`, `numbers[i+1]`) 사이의 경사 차이를 한 줄로 계산했습니다.

```python
# title: 2026-10-15/lists — 절사평균(trimmed_mean)과 리스트 컴프리헨션 인접 차이 계산
# takeaway: 인접한 두 원소를 비교할 때 range(len(nums))로 돌면 마지막 인덱스에서 IndexError가 발생하므로 반드시 len(nums) - 1을 상한으로 둡니다.
numbers = [10, 25, 30, 45, 90]
n = len(numbers)

# 1) 핵심: 전체 합에서 최댓값(90)과 최솟값(10)을 제외하고 (n - 2)로 나눕니다.
trimmed_total = sum(numbers) - max(numbers) - min(numbers)
trimmed_avg = int(trimmed_total / (n - 2))
print("절사평균:", trimmed_avg)  # (25 + 30 + 45) // 3 = 33

# 2) 리스트 컴프리헨션으로 인접한 원소 간 절댓값 차이 구하기
adj_diffs = [abs(numbers[i + 1] - numbers[i]) for i in range(n - 1)]
print("인접 원소 차이:", adj_diffs)  # [15, 5, 15, 45]
```

## 3. 실습: 아스키 코드(`ord`, `chr`) 시저 암호와 중첩 반복문 완전탐색

문자를 일정한 칸수(`key`)만큼 밀어 암호화하는 시저 암호(`caesar_cipher.py`)와, 두 개의 주사위(`1~6`)를 던져 눈의 합이 `N`이 되는 모든 순서쌍을 찾는 중첩 반복문(`dice_sum_count.py`)을 구현했습니다.

:::compare
### 단순 아스키 덧셈만 했을 때의 문제
- 소문자 `'z'`(아스키 122)에 `key = 3`을 더하면 `125`(`'}'`)가 되어 알파벳 범위를 벗어남
- 공백(`" "`)까지 함께 밀어버리면 단어 구분이 깨짐
---
### 알파벳 순환 보정 (`caesar_cipher.py`)
- 공백 문자는 `continue`로 그대로 보존
- 이동한 코드값이 `ord('z')`보다 크면 `- 26`(또는 `% 26`)으로 `'a'`(97)부터 다시 시작하도록 순환
:::

```python
# title: 2026-10-15/strings/caesar_cipher.py & nested_loops — 시저 암호와 주사위 합 탐색
# takeaway: key가 26보다 큰 경우까지 안전하게 처리하려면 (ord(ch) - ord('a') + key) % 26 + ord('a') 일반식을 사용할 수 있습니다.
def caesar_encrypt(text: str, key: int) -> str:
    result = ""
    for ch in text:
        if ch == " ":
            result += " "
            continue
        # 핵심: 소문자 'a'~'z' 범위 안에서 key만큼 이동 후 범위를 넘으면 26을 빼 순환시킵니다.
        shifted = ord(ch) + (key % 26)
        if shifted > ord("z"):
            shifted -= 26
        result += chr(shifted)
    return result

print("시저 암호 결과:", caesar_encrypt("hello python xyz", 3))  # khoor sbwkrq abc

# 중첩 반복문 + 리스트 컴프리헨션으로 두 주사위의 합이 7이 되는 모든 순서쌍 찾기
target_sum = 7
pairs = [(d1, d2) for d1 in range(1, 7) for d2 in range(1, 7) if d1 + d2 == target_sum]
print(f"합이 {target_sum}이 되는 경우({len(pairs)}개):", pairs)
```

## 4. 최종적으로 내가 알아낸 내용

:::finding
### 리스트 컴프리헨션·ASCII·중첩 반복문 실습을 통해 깨달은 핵심 원리
- **2차원 배열을 만들 때는 반드시 리스트 컴프리헨션(`[[0] * M for _ in range(N)]`)을 쓸 것:** `[[0] * M] * N`으로 만들면 모든 행이 같은 리스트 주소를 공유해 한 칸만 바꿔도 세로줄 전체가 바뀌는 치명적인 버그가 생깁니다.
- **인접 원소 비교(`arr[i]` vs `arr[i+1]`)의 반복 상한은 무조건 `len(arr) - 1`:** 마지막 원소에서 `i + 1`을 찾으려 하면 `IndexError`가 발생하므로, 두 칸씩 묶어 비교할 때는 반복 횟수가 원소 개수보다 1개 적어야 합니다.
- **문자도 결국 숫자(ASCII 0~127 좌표)로 바꾸면 수학 연산이 가능함:** 대문자 `'A'`(65)~`'Z'`(90), 소문자 `'a'`(97)~`'z'`(122)는 연속된 26개의 정수이므로, `ord()`로 빼서 기준점을 `0`으로 맞춘 뒤 `% 26` 나머지 연산을 쓰면 어떤 `key`가 들어와도 알파벳 원형 고리 안에서 안전하게 회전합니다.
:::
