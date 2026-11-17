---
issue: "NO. 03"
title: "Python Day 3 — 리스트 절사평균, 아스키 시저 암호, 중첩 반복문"
date: "2026-10-15"
category: "Python"
readTime: "7분"
tags: ["Python", "Lists", "ASCII", "NestedLoops"]
summary: "최댓값·최솟값을 제외한 절사평균과 인접 원소 경사 계산, ord()·chr() 아스키 코드 순환을 이용한 시저 암호, 그리고 이중 for문 주사위 합 경우의 수 탐색을 정리합니다."
coverType: "python-day3"
takeaway: "문자열 암호화는 ord()로 정수 좌표로 바꾼 뒤 다시 chr()로 복원하는 과정이며, 알파벳 끝('z')을 넘어갈 때 26을 빼주는 순환 보정이 핵심입니다."
---

## 1. 리스트 응용: 절사평균(`trimmed_mean`)과 인접 원소 비교

셋째 날에는 단순 합계를 넘어 극단값(최댓값·최솟값)을 제외한 **절사평균**과, 리스트의 인접한 두 원소(`arr[i]`, `arr[i+1]`)를 비교해 가장 가파른 오르막 구간을 찾는 문제를 풀었습니다.

:::formula
절사평균 (Trimmed Mean) | (sum(numbers) - max(numbers) - min(numbers)) / (n - 2) | 전체 합에서 최댓값과 최솟값을 각각 한 번씩 뺀 뒤 남은 개수(n - 2)로 나눕니다.
인접 원소 순회 범위 | for i in range(len(arr) - 1): diff = arr[i + 1] - arr[i] | i + 1 인덱스를 참조할 때는 IndexError가 나지 않도록 반복 범위를 len(arr) - 1 까지만 돕니다.
:::

```python
# title: 2026-10-15/lists — 절사평균(trimmed_mean)과 인접 차이 계산
# takeaway: 인접한 두 원소를 비교할 때 range(len(nums))로 돌면 마지막 인덱스에서 IndexError가 발생하므로 반드시 len(nums) - 1을 상한으로 둡니다.
numbers = [10, 25, 30, 45, 90]
n = len(numbers)

# 핵심: 전체 합에서 최댓값(90)과 최솟값(10)을 제외하고 (n - 2)로 나눕니다.
trimmed_total = sum(numbers) - max(numbers) - min(numbers)
trimmed_avg = int(trimmed_total / (n - 2))
print("절사평균:", trimmed_avg)  # (25 + 30 + 45) // 3 = 33

# 인접한 원소 간 절댓값 차이 구하기
adj_diffs = [abs(numbers[i + 1] - numbers[i]) for i in range(n - 1)]
print("인접 원소 차이:", adj_diffs)
```

## 2. 아스키 코드(`ord`, `chr`)와 시저 암호(`caesar_cipher.py`)

문자를 일정한 칸수(`key`)만큼 밀어 암호화하는 시저 암호 실습에서는 문자를 아스키 코드 정수로 바꾸는 `ord()`와 정수를 다시 문자로 바꾸는 `chr()`을 사용했습니다.

:::compare
### 단순 덧셈만 했을 때의 문제
- `'z'`(아스키 122)에 `key = 3`을 더하면 `125`(`'}'`)가 되어 알파벳 범위를 벗어남
- 공백(`" "`)까지 함께 밀어버리면 단어 구분이 깨짐
---
### 알파벳 순환 보정 (`caesar_cipher.py`)
- 공백 문자는 `continue`로 그대로 보존
- 이동한 코드값이 `ord('z')`보다 크면 `- 26`(또는 `% 26`)으로 `'a'`부터 다시 시작하도록 순환
:::

```python
# title: 2026-10-15/strings/caesar_cipher.py — 소문자 시저 암호 구현
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

print(caesar_encrypt("hello python xyz", 3))  # khoor sbwkrq abc
```

## 3. 중첩 반복문(`nested_loops`): 두 주사위의 합 경우의 수

두 개의 주사위(`1~6`)를 던져 눈의 합이 `N`이 되는 모든 순서쌍 개수를 구하는 문제(`dice_sum_count.py`)를 통해 바깥 루프 1회당 안쪽 루프가 전체 순회하는 $6 \times 6 = 36$ 완전탐색 구조를 익혔습니다.

```python
# title: 2026-10-15/nested_loops/dice_sum_count.py — 두 주사위 눈의 합 탐색
# takeaway: 바깥 for문이 첫 번째 주사위(d1)를 고정할 때마다 안쪽 for문이 두 번째 주사위(d2)의 1~6을 모두 확인합니다.
target_sum = 7
pairs = []

for d1 in range(1, 7):
    for d2 in range(1, 7):
        if d1 + d2 == target_sum:
            pairs.append((d1, d2))

print(f"합이 {target_sum}이 되는 경우의 수: {len(pairs)}개 -> {pairs}")
```

## 4. 최종적으로 내가 알아낸 내용

:::finding
### Day 3 실습을 통해 직접 깨달은 핵심 원리
- **인접 원소 비교(`arr[i]` vs `arr[i+1]`)의 반복 상한은 무조건 `len(arr) - 1`:** 마지막 원소에서 `i + 1`을 찾으려 하면 `IndexError`가 발생하므로, 두 칸씩 묶어 비교할 때는 반복 횟수가 원소 개수보다 1개 적어야 합니다.
- **문자도 결국 숫자(ASCII 좌표)로 바꾸면 수학 연산이 가능함:** `'a'`(97)~`'z'`(122)는 연속된 26개의 정수이므로, `(ord(ch) - ord('a') + key) % 26 + ord('a')` 공식을 쓰면 어떤 `key`가 들어와도 알파벳 원형 고리 안에서 안전하게 회전합니다.
- **절사평균에서 정렬(`sort`) 없이도 `sum - max - min`으로 극단값을 제거할 수 있음:** 최댓값과 최솟값을 각각 1개씩만 빼는 문제는 굳이 전체 리스트를 정렬하지 않아도 $O(N)$ 내장 함수 조합만으로 즉시 계산됩니다.
:::
