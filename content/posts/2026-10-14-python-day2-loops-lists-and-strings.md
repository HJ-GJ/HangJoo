---
issue: "NO. 02"
title: "Python Day 2 — 반복문과 리스트·문자열 기초, 그리고 첫 오타 디버깅"
date: "2026-10-14"
category: "Python Study"
readTime: "6분"
tags: ["Python", "Loops", "Lists", "Strings", "Debugging"]
summary: "for·while 반복문과 리스트 메서드(append, insert, sort, 슬라이싱), 문자열 팰린드롬 판별([::-1])을 실습하고, 수업 중 겪었던 변수 선언 순서·내장 함수 오타(leng) 기록을 복기합니다."
coverType: "python-day2"
takeaway: "리스트 슬라이싱과 문자열 역순([::-1])은 파이썬다운 간결함을 보여주며, NameError를 겪으며 배운 '선언 후 참조'와 정확한 내장 함수명(len) 확인은 가장 확실한 디버깅 교훈이 됩니다."
---

## 1. 리스트 인덱싱·슬라이싱과 주요 메서드

둘째 날에는 여러 데이터를 순서대로 담는 **리스트(`list`)**의 조작 메서드를 집중적으로 연습했습니다. 음수 인덱스(`num[-1]`)로 맨 뒤 원소에 접근하고, 슬라이싱(`num[:3]`, `num[2:]`)으로 부분 리스트를 잘라내는 규칙을 익혔습니다.

:::formula
앞쪽 슬라이싱 | num[:3] → 인덱스 0, 1, 2 (끝 인덱스 3은 미포함) | 슬라이싱의 끝 번호는 항상 '포함되지 않는 경계(exclusive)'입니다.
역순 슬라이싱 | s[::-1] → 처음부터 끝까지 보폭 -1로 역방향 복사 | 반복문 없이도 문자열이나 리스트를 한 줄로 뒤집을 수 있습니다.
원소 삽입과 정렬 | num.append(x), num.insert(idx, x), num.sort() | 리스트 원본 자체(in-place)를 변경하는 메서드입니다.
:::

## 2. 첫 디버깅 기록: `list_methods_notes.py`에서 배운 2가지 실수

수업 중 빠르게 필기하며 작성했던 `2026-10-14/lists/list_methods_notes.py` 원본에는 초보 시기에 흔히 겪는 두 가지 `NameError` 원인이 그대로 남아 있었습니다.

:::compare
### 수업 중 작성했던 원본 실수 (`REVIEW_NOTES.md` 기록)
- `num1 = [10, 20, ...]`을 선언하기 전에 위쪽 줄에서 `num1.append(60)`을 먼저 호출함 (`NameError`)
- 리스트 길이를 구할 때 `len(num3)` 대신 `leng(num3)`으로 오타를 냄
- `while` 숫자 맞히기 게임에서 정답을 맞힌 뒤 `break`를 빼먹어 루프가 종료되지 않음
---
### 원인을 짚고 수정한 올바른 코드
- 변수는 반드시 메모리에 먼저 할당(`num1 = [...]`)한 뒤 메서드를 호출
- 파이썬 내장 길이 함수는 항상 3글자 `len()`을 사용
- 종료 조건을 만족한 즉시 `break`로 반복문을 탈출
:::

```python
# title: 2026-10-14/lists — 리스트 메서드 정리 및 오타 수정본
# takeaway: 리스트의 sort()와 insert()는 새 리스트를 반환하지 않고 원본 리스트를 직접 수정(return None)한다는 점을 기억해야 합니다.
# 핵심: 변수를 먼저 선언한 뒤 append / insert / sort 메서드를 순서대로 호출합니다.
num1 = [10, 20, 30, 40, 50]
num1.append(60)          # 맨 뒤에 60 추가
num1.insert(3, 25)       # 3번 인덱스 위치에 25 삽입

print("앞 3개 슬라이싱 :", num1[:3])
print("마지막 원소     :", num1[-1])
print("값 20의 인덱스  :", num1.index(20))

num3 = [10, 5, 2, 1, 83, 72, 37]
num3.sort()              # 오름차순 정렬
print("정렬 결과       :", num3)
print("길이(len)와 최댓값(max):", len(num3), max(num3))
```

## 3. 문자열 순회와 팰린드롬(회문) 한 줄 판별

특정 문자의 등장 횟수를 세는 문제(`count_character.py`)와 앞으로 읽어도 뒤로 읽어도 같은 **팰린드롬(`palindrome_check.py`)** 문제를 각각 반복문과 슬라이싱, 그리고 조건부 표현식(삼항 연산자)으로 구현했습니다.

```python
# title: 2026-10-14/strings — 문자 개수 세기와 팰린드롬 판별
# takeaway: s == s[::-1] 과 삼항 조건식("YES" if 조건 else "NO")을 결합하면 회문 판별을 한 줄로 명확하게 작성할 수 있습니다.
def count_char(text: str, target: str) -> int:
    count = 0
    for ch in text:
        if ch == target:
            count += 1
    return count

def is_palindrome(word: str) -> str:
    # 핵심: 역순 슬라이싱 word[::-1] 과 원본이 일치하는지 비교합니다.
    return "YES" if word == word[::-1] else "NO"

print("banana에서 a 개수:", count_char("banana", "a"))
print("level 회문 여부  :", is_palindrome("level"))
print("python 회문 여부 :", is_palindrome("python"))
```
