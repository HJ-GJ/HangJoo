---
issue: "NO. 02"
title: "[Python] - 반복문(for·while)과 리스트·문자열 구조, 얕은 복사와 깊은 복사"
date: "2026-10-14"
category: "Python"
readTime: "11분"
tags: ["Python", "Loops", "Lists", "Strings", "ShallowCopy", "DeepCopy"]
summary: "for·range와 while 제어문(break, continue 주의점), Iterable 5종 중 리스트(sequence + mutable)의 메모리 참조(단순 대입 vs 얕은 복사 vs 깊은 복사), 문자열(immutable)의 find vs index 차이를 정리하고 첫 디버깅 기록을 복기합니다."
coverType: "python-day2"
takeaway: "리스트는 가변(mutable) 객체라 단순 대입(li2 = li)이나 얕은 복사(li[:])만으로는 중첩 리스트의 메모리 공유를 막을 수 없으며, 문자열은 불변(immutable) 객체라 슬라이싱 조합으로 새 문자열을 만들어야 합니다."
---

## 1. 이론: 반복문(`for` · `while`) 제어와 리스트(`mutable`) · 문자열(`immutable`) 내부 구조

수업 교재(`[python] 01. 파이썬 기초.pdf` 후반부 & `[python] 02. iterables.pdf` 전반부)에서는 반복문 제어 원리와 함께, 여러 요소를 하나씩 꺼내 반복할 수 있는 **Iterable 객체(`list`, `str`, `tuple`, `set`, `dict`)** 중 순서가 있는(`sequence`) **리스트**와 **문자열**의 메모리 구조를 깊게 다뤘습니다.

### 1) `for` · `while` 반복문과 `continue` 무한 루프 주의점
- **`for i in range(start, end, step):`** `start`부터 **`end - 1`까지**(끝값 미포함) `step` 간격으로 숫자를 꺼내 반복합니다. `range(5)`는 `0, 1, 2, 3, 4`를 생성합니다.
- **`while 조건식:`과 제어 키워드:** 조건이 `True`인 동안 계속 반복하며, `break`를 만나면 반복문을 즉시 탈출하고, `continue`를 만나면 아래 코드를 건너뛰고 다음 반복의 조건 검사로 직행합니다.
- **`while`문에서 `continue`를 쓸 때의 함정:** 증감식(`counter += 1`)이 `continue`보다 아래쪽에 있으면, `continue`가 실행될 때마다 `counter`가 증가하지 못해 **영원히 같은 값에서 무한 루프**에 빠집니다.

### 2) 리스트(`list`)의 성질과 복사 3단계(대입 vs 얕은 복사 vs 깊은 복사)
리스트는 **순서가 있고(`sequence` → 인덱싱·슬라이싱 가능)**, **값을 직접 바꿀 수 있는 가변(`mutable`) 자료형**입니다. 변수가 실제 데이터 값 자체가 아니라 **리스트가 저장된 메모리 주소(`0x...`)를 가리킨다(pointing)**는 점 때문에 복사 방식에 따라 결정적인 차이가 발생합니다.

:::formula
단순 대입 (li2 = li) | 같은 1층 메모리 주소를 함께 가리킴 | li2[0] = 99 로 바꾸면 원본 li[0] 도 함께 99로 바뀝니다(복사가 아니라 별명 추가).
얕은 복사 (Shallow Copy: li2 = li[:]) | 1층 껍데기 리스트만 새로 만들고 내부 요소 주소는 그대로 복사 | 1차원 요소 변경은 독립적이지만, 2차원 중첩 리스트(li[3][0] = 99)는 내부 리스트 주소(0x0001...)를 공유해 원본까지 함께 바뀝니다!
깊은 복사 (Deep Copy: copy.deepcopy(li)) | import copy 후 중첩된 내부 리스트까지 완전히 새로운 메모리에 독립 복제 | 2차원 이상의 격자(board) 시뮬레이션에서 원본 상태를 보존할 때 필수입니다.
문자열 탐색과 결합 | s.find(x) (없으면 -1 반환) vs s.index(x) (없으면 ValueError 발생) | 문자열(str)은 불변(immutable) 데이터라 s[0] = "B" 로 직접 수정할 수 없으며, "B" + s[1:] 처럼 새로 조합해야 합니다.
:::

:::compare
### 리스트(`list` — `sequence` + `mutable`) 주요 연산과 메서드
- **연산자:** `+`(두 리스트 이어 붙이기), `* n`(`n`번 반복 확장), `in`(포함 여부 확인)
- **추가·삽입:** `append(x)`(맨 끝에 추가), `insert(idx, x)`(지정 인덱스에 삽입; 만약 리스트 크기를 초과하는 큰 인덱스를 넣으면 에러 없이 맨 끝에 추가됨)
- **삭제·탐색·정렬:** `pop()` / `pop(idx)`(삭제 후 그 값을 반환), `remove(x)`(첫 번째로 만나는 값 `x` 삭제, 없으면 에러), `index(x)`(위치 반환, 없으면 에러), `sort()`(비교 가능한 같은 타입끼리만 정렬), `reverse()`
---
### 문자열(`str` — `sequence` + `immutable`) 주요 메서드
- **대소문자 변환:** `upper()`(전체 대문자), `lower()`(전체 소문자), `capitalize()`(문장 첫 글자만 대문자), `title()`(각 단어 첫 글자마다 대문자)
- **분리·공백 제거·결합:** `split(구분자)`(문자열을 쪼개 **리스트**로 반환), `strip()` / `lstrip()` / `rstrip()`(양쪽·왼쪽·오른쪽 공백 및 개행 제거), `"구분자".join(리스트)`(문자열 리스트를 하나로 결합)
- **구성 검증:** `isupper()`, `islower()`, `isdigit()`(숫자 형태인가), `isalpha()`(알파벳/한글인가), `isalnum()`(영문·숫자 조합인가)
:::

## 2. 실습 및 디버깅: `list_methods_notes.py` 실수 교정과 얕은/깊은 복사 실험

수업 중 빠르게 필기하며 작성했던 `2026-10-14/lists/list_methods_notes.py` 원본에는 초보 시기에 겪기 쉬운 `NameError` 원인이 남아 있었고, 여기에 더해 2차원 리스트에서 얕은 복사와 깊은 복사가 어떻게 다르게 동작하는지 코드로 직접 검증했습니다.

```python
# title: 2026-10-14/lists — 리스트 핵심 메서드와 얕은 복사(Shallow) vs 깊은 복사(Deep) 검증
# takeaway: 2차원 리스트에서 슬라이싱(li[:])은 겉 리스트만 복사할 뿐 안쪽 리스트의 메모리 주소는 공유하므로, 중첩 구조 복제에는 반드시 copy.deepcopy()를 사용해야 합니다.
import copy

# 1) 리스트 기본 메서드 (선언 후 호출 원칙, 내장 함수 len 사용)
num1 = [10, 20, 30, 40, 50]
num1.append(60)          # 맨 뒤에 60 추가
num1.insert(3, 25)       # 3번 인덱스에 25 삽입
print("앞 3개 슬라이싱 :", num1[:3])
print("길이(len)와 최댓값:", len(num1), max(num1))

# 2) 핵심: 중첩 리스트에서 얕은 복사(li[:]) vs 깊은 복사(copy.deepcopy) 비교
orig = [1, 2, [10, 20]]
shallow = orig[:]                # 얕은 복사: 내부 리스트 [10, 20]의 주소를 공유함!
deep = copy.deepcopy(orig)       # 깊은 복사: 내부 리스트까지 완전히 독립 복제

shallow[2][0] = 999
print("얕은 복사 수정 후 원본 orig :", orig)   # [1, 2, [999, 20]] -> 원본까지 오염됨!
print("깊은 복사본 deep           :", deep)   # [1, 2, [10, 20]]  -> 안전하게 보존됨
```

## 3. 실습: 문자열 메서드(`find`, `split`, `join`)와 팰린드롬 한 줄 판별

특정 문자의 등장 횟수를 세는 문제(`count_character.py`), 찾는 문자가 없을 때 프로그램이 멈추지 않도록 `find()`를 활용하는 패턴, 그리고 앞으로 읽어도 뒤로 읽어도 같은 **팰린드롬(`palindrome_check.py`)**을 역순 슬라이싱(`[::-1]`)으로 구현했습니다.

```python
# title: 2026-10-14/strings — 문자열 탐색(find vs index), 분리·결합(split/join), 회문 판별
# takeaway: 찾는 문자가 없을 가능성이 있는 입력에서는 ValueError를 던지는 index() 대신 -1을 반환하는 find()를 써야 예외 없이 안전하게 분기할 수 있습니다.
def analyze_text(sentence: str, target: str) -> dict:
    # 1) strip()으로 양끝 공백 제거 후 split()으로 단어 리스트 추출, "-".join()으로 재결합
    words = sentence.strip().split()
    joined = "-".join(words)

    # 2) find()는 target이 없으면 에러 대신 -1을 반환합니다.
    first_pos = sentence.find(target)
    return {"joined": joined, "first_pos": first_pos}

def is_palindrome(word: str) -> str:
    # 핵심: 역순 슬라이싱 word[::-1] 과 원본이 일치하는지 비교합니다.
    return "YES" if word == word[::-1] else "NO"

print(analyze_text("  hello nvidia campus  ", "z"))  # {'joined': 'hello-nvidia-campus', 'first_pos': -1}
print("level 회문 여부 :", is_palindrome("level"))   # YES
```

## 4. 최종적으로 내가 알아낸 내용

:::finding
### 반복문·리스트·문자열 이론과 디버깅에서 얻은 핵심 교훈
- **2차원 리스트 복제 시 `li[:]`(얕은 복사)를 쓰면 안쪽 리스트가 공유되어 원본이 망가짐:** 1차원 리스트에서는 `li[:]`로도 충분하지만, 리스트 안에 리스트가 들어 있는 2차원 배열에서는 내부 메모리 주소가 그대로 복사되므로 반드시 `copy.deepcopy()`나 리스트 컴프리헨션으로 복사해야 합니다.
- **문자열은 불변(`immutable`)이라 일부 글자만 직접 덮어쓸 수 없음:** `s[0] = 'y'`는 `TypeError`가 나므로 슬라이싱을 이용해 `'y' + s[1:]`처럼 새 문자열을 만들어 다시 변수에 대입해야 합니다.
- **`find()`는 없으면 `-1`, `index()`는 없으면 `ValueError`:** 입력 데이터에 특정 문자가 들어 있는지 불확실할 때는 `-1`을 돌려주는 `find()`가 조건문 처리에 훨씬 안전합니다.
- **`while`문에서 `continue`를 쓸 때는 증감식(`i += 1`)의 위치를 반드시 먼저 확인할 것:** `continue`보다 아래쪽에 `i += 1`을 두면 조건에 걸리는 순간 숫자가 영원히 증가하지 않는 무한 루프가 발생합니다.
:::
