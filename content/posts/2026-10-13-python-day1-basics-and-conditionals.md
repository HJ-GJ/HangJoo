---
issue: "NO. 01"
title: "Python Day 1 — 입출력과 몫·나머지 연산, 조건문 분기 설계"
date: "2026-10-13"
category: "Python"
readTime: "6분"
tags: ["Python", "Basics", "Conditionals", "Day1"]
summary: "파이썬 첫날 배운 input·split·map 입력 처리와 print(sep, end) 포맷팅, 몫(//)·나머지(%)를 이용한 시간·자릿수 분해, 그리고 윤년·삼각형·야간 소음 조건문 실습을 정리합니다."
coverType: "python-day1"
takeaway: "문자열로 들어오는 input()을 map(int, input().split())으로 정수로 변환하는 흐름과, 몫(//)·나머지(%) 연산으로 시간·자릿수를 쪼개는 원리가 모든 기초 문제의 출발점입니다."
---

## 1. 표준 입출력과 `sep` · `end` 제어

파이썬의 `input()`은 항상 문자열(`str`)을 반환합니다. 한 줄에 공백으로 구분된 여러 숫자를 받을 때는 `.split()`으로 문자열 리스트를 만든 뒤 `map(int, ...)`을 적용해 정수로 변환합니다. 또한 `print()`의 기본 줄바꿈(`\n`)과 공백 구분자를 `end`와 `sep` 매개변수로 직접 제어할 수 있습니다.

:::compare
### 기본 `input()` / `print()`
- `input()` 단독 호출 시 문자열(`"10"`) 그대로 저장되어 산술 연산 불가
- `print(a, b)` 호출 시 값 사이에 공백(`" "`), 끝에 줄바꿈(`"\n"`) 자동 삽입
---
### `map(int, input().split())` / `sep` · `end`
- 공백으로 구분된 복수 입력을 즉시 정수 변수(`n1, n2, n3`)에 언패킹
- `end="!"`로 다음 출력과 한 줄에 이어 붙이거나 `sep="~"`로 구분자 지정
:::

## 2. 몫(`//`)과 나머지(`%`)로 시간·자릿수 다루기

첫날 실습에서 가장 많이 등장한 패턴은 나눗셈의 **몫(`//`)**과 **나머지(`%`)**를 조합해 단위를 변환하거나 세 자리 정수를 뒤집는 계산이었습니다.

:::formula
시·분 경과 계산 | total = H * 60 + M + T → ((total // 60) % 24, total % 60) | 시(hour)와 분(minute)을 모두 '분' 단위로 통일해 더한 뒤, 다시 60으로 나눈 몫과 나머지로 복원합니다.
세 자리 정수 뒤집기 | a = N // 100, b = (N // 10) % 10, c = N % 10 | 백의 자리, 십의 자리, 일의 자리를 차례로 분리한 뒤 c * 100 + b * 10 + a 로 재조립합니다.
맨해튼 거리 | dist = abs(y1 - y2) + abs(x1 - x2) | 두 좌표 사이의 격자 이동 거리는 각 축 차이의 절댓값 합으로 구합니다.
:::

```python
# title: 2026-10-13/basics — 시·분 더하기와 세 자리 숫자 뒤집기 실습
# takeaway: 단위 변환 문제는 가장 작은 단위(분, 초, 1의 자리)로 먼저 합산한 뒤 // 와 % 로 상위 단위를 복원하면 조건 분기 없이 깔끔하게 풀립니다.
# 1) 현재 시각(H, M)에서 T분이 지난 뒤의 시각(24시간제) 구하기
H, M = 23, 40
T = 35

# 핵심: 전체 분(total)으로 통합한 뒤 60으로 나눈 몫에 % 24를 적용해 자정을 넘깁니다.
total = H * 60 + M + T
next_h = (total // 60) % 24
next_m = total % 60
print(f"{next_h}시 {next_m}분")  # 0시 15분

# 2) 세 자리 정수 뒤집기 및 자릿수별 곱셈
N = 472
hundreds = N // 100
tens = (N // 10) % 10
ones = N % 10
reversed_num = ones * 100 + tens * 10 + hundreds
print(f"{N} -> {reversed_num}")  # 472 -> 274
```

## 3. 조건문(`if - elif - else`)과 논리 연산자 결합

조건문 실습에서는 **더 좁고 특수한 조건을 `if`의 맨 위에 배치**해야 아래쪽 일반 조건에 흡수되지 않는다는 점을 확인했습니다.

- **윤년 판별 (`leap_year.py`):** `400`의 배수인지 먼저 확인(`N % 400 == 0`)한 뒤, `4`의 배수이면서 `100`의 배수가 아닌 경우(`N % 4 == 0 and N % 100 != 0`)를 `elif`로 검사합니다.
- **삼각형 종류 판별 (`triangle_type.py`):** 세 변이 모두 같은 정삼각형(`a == b == c`)을 먼저 검사하고, 두 변만 같은 이등변삼각형(`a == b or b == c or a == c`)을 그다음에 두어야 정삼각형이 이등변삼각형으로 잘못 분류되지 않습니다.
- **야간 소음 판정 (`quiet_hours.py`):** `and`와 `or`를 함께 쓸 때는 괄호로 우선순위를 명확히 묶어줍니다.

```python
# title: 2026-10-13/conditionals — 윤년·삼각형·야간 소음 조건 판정
# takeaway: 복합 조건식에서 and 가 or 보다 우선순위가 높으므로, 시간 범위 조건 (T < 7 or T >= 20) 은 반드시 괄호로 감싸야 의도대로 동작합니다.
def classify_year(year: int) -> str:
    if year % 400 == 0:
        return "Leap"
    elif year % 4 == 0 and year % 100 != 0:
        return "Leap"
    return "Normal"

def check_quiet_hours(crying: int, hour: int) -> str:
    # 핵심: 울고 있으면서(crying == 1) 동시에 야간 시간대(7시 이전 또는 20시 이후)인지 검사
    if crying == 1 and (hour < 7 or hour >= 20):
        return "조용히 해!"
    return "조용하군"

print(classify_year(2000), classify_year(1900), classify_year(2024))
print(check_quiet_hours(1, 22), check_quiet_hours(1, 14))
```

## 4. 최종적으로 내가 알아낸 내용

:::finding
### Day 1 실습을 통해 직접 깨달은 핵심 원리
- **단위 변환은 최소 단위로 먼저 통일할 것:** 시·분 계산에서 `분 >= 60`, `시 >= 24`를 `if`문으로 각각 나눌 필요 없이, 전체를 '분(`H * 60 + M + T`)'으로 합산한 뒤 `(total // 60) % 24`와 `total % 60`을 쓰면 자정을 몇 번 넘어가도 한 줄로 해결됩니다.
- **`if - elif`는 범위가 좁은 특수 조건부터 검사할 것:** 정삼각형(`a == b == c`)은 이등변삼각형(`a == b or b == c`)의 부분집합이므로, 특수한 조건을 반드시 `if` 맨 위에 두어야 상위 조건에 가로채이지 않습니다.
- **논리 연산자 `and`와 `or`가 섞이면 무조건 괄호로 의도를 고정할 것:** 파이썬은 `and`를 `or`보다 먼저 계산하므로 `crying == 1 and (hour < 7 or hour >= 20)`처럼 괄호를 쳐야 버그가 생기지 않습니다.
:::
