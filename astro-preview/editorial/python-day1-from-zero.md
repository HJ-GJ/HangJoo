---
issue: "NO. 01"
title: "파이썬 기초 공부: 변수와 조건문"
date: "2026-10-13"
category: "Python"
readTime: "15분"
tags: ["Python", "Basics", "DataTypes", "Operators", "Conditionals"]
summary: "프로그래밍 언어와 Python이 무엇인지부터 시작해 첫 출력, 변수와 입력, 자료형, 연산자, 조건문까지 차근차근 살펴본 첫 번째 공부 기록입니다."
coverType: "python-day1"
takeaway: "출력 → 입력 → 변수와 자료형 → 계산 → 조건 판단의 흐름을 순서대로 익혀 봅니다."
---

컴퓨터에게 “3과 5를 더한 결과를 화면에 보여 줘”라고 말하면 어떻게 될까요?

우리는 문장의 뜻을 이해하지만, 일반적인 컴퓨터 프로그램은 **사람의 말을 그대로 명령으로 받아 실행하지는 못합니다.** 컴퓨터가 일을 하려면 무엇을 계산하고 어디에 보여 줄지 **정해진 규칙에 맞게 표현한 명령**이 필요합니다.

그 명령을 사람이 읽고 작성하기 편하도록 만드는 방법 중 하나가 **프로그래밍 언어**입니다. Python으로 첫 명령을 적어 보는 것부터 시작해 봅시다.

<span class="legacy-heading-anchor" id="개념--python과-처음-만나는-코드" aria-hidden="true"></span>
## 1. 개념 · Python과 처음 만나는 코드

<span class="legacy-heading-anchor" id="프로그래밍-언어란-무엇일까" aria-hidden="true"></span>
### 1-1. 프로그래밍 언어란 무엇일까?

우리가 쓰는 한국어나 영어는 일상적인 뜻을 전달하는 데 편리합니다. 하지만 “조금 더 크게 보여 줘”, “계산해 줘”처럼 말만 하면 일반적인 컴퓨터 프로그램은 **어떤 값을 어떻게 처리해야 하는지** 정확하게 알 수 없습니다.

컴퓨터의 프로세서는 최종적으로 기계 명령을 실행합니다. 사람이 그 명령을 직접 작성하기는 불편하므로, **프로그래밍 언어로 작업 순서를 코드에 적고 실행 환경이 그 코드를 처리**하도록 합니다.

예를 들어 “3과 5를 더해서 결과를 보여 주기”를 Python에서는 이렇게 표현할 수 있습니다.

~~~python
print(3 + 5)
~~~

**예상 출력**

~~~text
8
~~~

이 코드 한 줄을 작게 나눠 볼까요?

- **`3 + 5`**: 더하기 계산을 합니다.
- **`print(...)`**: 괄호 안에 전달한 값이나 계산 결과를 화면에 보여 줍니다.
- **`8`**: 계산한 뒤 화면에서 확인할 수 있는 값입니다.

즉, **사람이 하려는 일 → Python 코드 → Python 실행 환경 → 화면의 결과**로 이어지는 것입니다. Python 코드 자체가 곧 기계어인 것은 아니며, 실행 환경이 필요한 처리를 거쳐 컴퓨터가 작업하도록 합니다.

<span class="legacy-heading-anchor" id="python은-어떤-언어일까" aria-hidden="true"></span>
### 1-2. Python은 어떤 언어일까?

Python(파이썬)은 사람이 읽기 비교적 쉬운 문법을 가진 프로그래밍 언어입니다. **계산을 자동화하거나 데이터를 정리하고, 웹 서비스나 인공지능 프로그램을 만드는 일** 등 다양한 분야에서 쓰입니다.

Python 코드를 작성한 뒤 실행하면, **Python 실행 환경이 코드를 읽고 처리해 결과를 만들어 줍니다.** 그래서 처음에는 Python의 문법과 실행 방법을 차근차근 익히는 것이 중요합니다. 구현 방식에 따라 내부 처리 과정에는 여러 단계가 있을 수 있습니다.

<span class="legacy-heading-anchor" id="python과-vs-code는-무슨-차이일까" aria-hidden="true"></span>
### 1-3. Python과 VS Code는 무슨 차이일까?

| 도구 | 하는 일 |
| --- | --- |
| **Python** | 실제 코드를 실행하는 환경 |
| **VS Code** | 코드를 편하게 작성·수정하는 편집기 |

직접 코드를 실행하려면 [Python 공식 사이트](https://www.python.org/)에서 Python을 설치한 뒤, [VS Code](https://code.visualstudio.com/) 같은 편집기로 파일을 작성할 수 있습니다.

1. Python을 설치합니다. Windows에서는 설치 중 실행 경로(PATH) 관련 옵션을 확인합니다.
2. 터미널에서 `python --version`으로 설치를 확인합니다. 일부 환경에서는 `python3 --version`을 사용합니다.
3. VS Code에서 새 파일을 만들고 **`hello.py`**로 저장합니다. `.py`는 Python 소스 파일 확장자입니다.
4. 다음 코드를 입력하고 터미널에서 `python hello.py`를 실행합니다. VS Code에서도 실행 환경을 선택해 실행할 수 있습니다.

~~~python
print("Hello World!")
~~~

**예상 출력**

~~~text
Hello World!
~~~

> **처음 헷갈리는 부분:** VS Code만 설치했다고 Python 실행 환경까지 자동으로 준비되는 것은 아닙니다. 실행 명령을 인식하지 못한다면 Python 설치와 PATH 설정을 확인해 보세요.

<span class="legacy-heading-anchor" id="화면에-글자를-보여주는-print" aria-hidden="true"></span>
### 1-4. 화면에 글자를 보여주는 print()

`print()`는 값을 출력하는 함수입니다. 글자는 따옴표로 감싸고 숫자는 그대로 쓸 수 있습니다.

~~~python
print("안녕하세요!")
print(2026)
print("Python", "공부")
~~~

**예상 출력**

~~~text
안녕하세요!
2026
Python 공부
~~~

`print()`는 기본적으로 출력 후 줄을 바꿉니다. 여러 문장을 이어서 출력하고 싶다면 `end`를, 여러 값을 구분하는 방식을 바꾸고 싶다면 `sep`를 사용할 수 있습니다.

~~~python
print("Hello", end=", ")
print("Python")
print("A", "B", sep=" / ")
~~~

**예상 출력**

~~~text
Hello, Python
A / B
~~~

여기까지가 첫 출력입니다. 이제 **출력할 내용을 변수에 저장하고, 직접 입력받는 방법**으로 넘어가 봅시다.

<span class="legacy-heading-anchor" id="실습--변수와-입력을-직접-다뤄보기" aria-hidden="true"></span>
## 2. 실습 · 변수와 입력을 직접 다뤄보기

<span class="legacy-heading-anchor" id="변수는-무엇일까" aria-hidden="true"></span>
### 2-1. 변수는 무엇일까?

변수는 **값을 다시 사용하기 위해 붙인 이름**입니다. 처음에는 값을 담는 상자라고 생각해도 좋습니다. Python에서는 더 정확히 변수 이름이 객체를 참조한다고 설명합니다.

~~~python
name = "HangJoo"
age = 26

print(name)
print(age)
~~~

**예상 출력**

~~~text
HangJoo
26
~~~

`=`는 “같다”가 아니라 오른쪽 값을 왼쪽 이름에 연결하는 **대입**입니다. 변수는 숫자로 시작할 수 없고, `if`처럼 Python이 사용하는 예약어는 이름으로 사용할 수 없습니다. `age`와 `Age`는 다른 이름입니다.

<span class="legacy-heading-anchor" id="자료형은-왜-필요할까" aria-hidden="true"></span>
### 2-2. 자료형은 왜 필요할까?

숫자 `26`과 문자열 `"26"`은 비슷해 보여도 서로 다른 값입니다. Python은 이런 구분을 **자료형(type)**으로 표현합니다.

| 자료형 | 의미 | 예시 |
| --- | --- | --- |
| `int` | 정수 | `26`, `-3` |
| `float` | 실수 | `3.14` |
| `str` | 문자열 | `"Python"`, `"26"` |
| `bool` | 참·거짓 | `True`, `False` |

~~~python
print(type(26))
print(type("26"))
print(type(True))
~~~

**예상 출력**

~~~text
<class 'int'>
<class 'str'>
<class 'bool'>
~~~

`type()`으로 자료형을 확인할 수 있습니다. **따옴표로 둘러싼 숫자도 문자열**이라는 점이 뒤에 나올 입력 계산에서 중요합니다.

<span class="legacy-heading-anchor" id="입력을-받는-input" aria-hidden="true"></span>
### 2-3. 입력을 받는 input()

`input()`은 사용자가 키보드로 입력할 때까지 기다렸다가 입력값을 받아옵니다.

~~~python
name = input("이름을 입력하세요: ")
print("안녕하세요,", name)
~~~

**예시 입력:** `형주`

**예상 출력:** `안녕하세요, 형주`

그런데 `input()`으로 받은 값은 항상 **문자열(`str`)**입니다. 숫자를 입력하더라도 자동으로 정수로 바뀌지는 않습니다.

:::visual python-day1-input-flow.svg | 입력으로 받은 숫자는 문자열이므로 숫자 계산 전에 자료형을 바꿔야 합니다.

<span class="legacy-heading-anchor" id="형-변환-입력받은-나이에-1-더하기" aria-hidden="true"></span>
### 2-4. 형 변환: 입력받은 나이에 1 더하기

~~~python
age_text = input("나이를 입력하세요: ")
age = int(age_text)
print("내년에는", age + 1, "살")
~~~

**예시 입력:** `26`

**예상 출력:** `내년에는 27 살`

한 줄씩 살펴보면 `input()`으로 문자열을 받고, `int()`로 정수로 변환한 다음 `+ 1`을 계산해 `print()`로 출력합니다. 즉, **입력 → 변환 → 계산 → 출력** 순서입니다.

`int("26")`은 정수 `26`으로 바꿀 수 있지만 `int("스물여섯")`은 숫자로 바꿀 수 없어 `ValueError`가 발생합니다. 문자열 `"26"`에 정수 `1`을 바로 더하면 `TypeError`가 발생합니다.

<span class="legacy-heading-anchor" id="작은-실습-두-숫자-더하기" aria-hidden="true"></span>
### 2-5. 작은 실습: 두 숫자 더하기

~~~python
first = int(input("첫 번째 숫자: "))
second = int(input("두 번째 숫자: "))
print("합계:", first + second)
~~~

**예시 입력:** 첫 번째 `3`, 두 번째 `5`

**예상 출력:** `합계: 8`

두 숫자를 한 줄로 입력받을 때는 `map(int, input().split())` 같은 방법도 사용합니다. 하지만 처음에는 `input()`으로 입력을 받고 `int()`로 변환하는 과정을 따로 이해한 뒤 살펴보면 더 쉽습니다.

<span class="legacy-heading-anchor" id="작은-실습으로-다시-확인하기" aria-hidden="true"></span>
### 2-6. 작은 실습으로 다시 확인하기

입력과 변환을 이해했는지 확인하려면 숫자 대신 문자열을 넣었을 때의 동작도 비교해보면 좋습니다.

~~~python
print("3" + "5")
print(3 + 5)
~~~

**예상 출력**

~~~text
35
8
~~~

첫 줄은 **문자열 이어 붙이기**이고, 두 번째 줄은 **정수 더하기**입니다. 같은 기호 `+`를 사용해도 자료형에 따라 하는 일이 달라집니다.

출력할 문장을 꾸밀 때에는 다음처럼 `f`가 붙은 문자열을 활용할 수도 있습니다. 익숙하지 않다면 기본 `print()`부터 연습한 뒤 돌아와도 됩니다.

~~~python
name = "HangJoo"
age = 26

print(f"{name}의 나이는 {age}살입니다.")
~~~

**예상 출력:** `HangJoo의 나이는 26살입니다.`

이 예시에서 `{name}`과 `{age}` 부분에는 각 변수의 값이 들어갑니다. 출력 내용이 길어졌을 때 보기 편리한 방식입니다.

<span class="legacy-heading-anchor" id="확인--연산자와-조건문-이해하기" aria-hidden="true"></span>
## 3. 확인 · 연산자와 조건문 이해하기

<span class="legacy-heading-anchor" id="연산자로-계산하기" aria-hidden="true"></span>
### 3-1. 연산자로 계산하기

| 기호 | 의미 | 예시와 결과 |
| --- | --- | --- |
| `+` | 더하기 | `7 + 3` → `10` |
| `-` | 빼기 | `7 - 3` → `4` |
| `*` | 곱하기 | `7 * 3` → `21` |
| `/` | 나누기 | `7 / 2` → `3.5` |
| `//` | 내림한 몫 | `7 // 2` → `3` |
| `%` | 나머지 | `7 % 2` → `1` |
| `**` | 거듭제곱 | `2 ** 3` → `8` |

`//`는 양수 계산에서 보통 정수 몫처럼 보이지만, 정확히는 아래쪽(음의 무한대 방향)으로 내림합니다. 예를 들어 `-7 // 3`의 결과는 `-3`입니다.

<span class="legacy-heading-anchor" id="와-는-다릅니다" aria-hidden="true"></span>
### 3-2. =와 ==는 다릅니다

`=`는 **대입**, `==`는 **두 값이 같은지 비교**하는 기호입니다. 비교 결과는 `True` 또는 `False`입니다.

~~~python
score = 80
print(score == 80)
print(score >= 90)
~~~

**예상 출력**

~~~text
True
False
~~~

<span class="legacy-heading-anchor" id="if는-언제-사용할까" aria-hidden="true"></span>
### 3-3. if는 언제 사용할까?

`if`는 어떤 조건이 참일 때만 코드를 실행하는 **조건문**입니다. Python은 **콜론(`:`)과 들여쓰기**로 코드를 묶습니다.

~~~python
age = 26

if age >= 20:
    print("성인입니다.")

print("확인 종료")
~~~

**예상 출력**

~~~text
성인입니다.
확인 종료
~~~

첫 번째 `print()`는 조건이 참일 때만, 들여쓰지 않은 마지막 `print()`는 조건과 상관없이 실행됩니다.

:::visual python-day1-branch-flow.svg | if는 조건에 따라 실행할 코드의 경로를 선택합니다.

`else`를 사용하면 조건이 거짓일 때 실행할 코드를 정할 수 있습니다.

~~~python
score = 55

if score >= 60:
    print("합격입니다.")
else:
    print("다음에 다시 도전해 봅시다.")
~~~

**예상 출력:** `다음에 다시 도전해 봅시다.`

`elif`는 조건을 위에서부터 추가로 검사할 때 사용합니다.

~~~python
score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
else:
    grade = "C"

print(grade)
~~~

**예상 출력:** `B`

처음 참인 조건 하나만 실행하기 때문에 **조건을 작성한 순서**도 중요합니다. `and`는 두 조건을 함께 만족하는지, `or`는 둘 중 하나라도 만족하는지 확인할 때 사용합니다. `not`은 참과 거짓을 반대로 바꿉니다. 처음에는 조건 하나부터 연습한 뒤 조합해 보세요.

<span class="legacy-heading-anchor" id="직접-확인할-네-가지-질문" aria-hidden="true"></span>
### 3-4. 직접 확인할 네 가지 질문

1. `print("Hello", "World", sep="-")`는 무엇을 출력할까요?
2. `input()`으로 받은 숫자에 바로 `1`을 더하면 왜 문제가 될까요?
3. `score = 75`일 때 `if score >= 80:` 아래의 코드는 실행될까요?
4. `=`와 `==`의 역할을 설명할 수 있나요?

<span class="legacy-heading-anchor" id="처음에-자주-겪는-실수-세-가지" aria-hidden="true"></span>
### 3-5. 처음에 자주 겪는 실수 세 가지

**1. 입력받은 문자열을 숫자로 착각하기**

~~~python
age = "26"
# print(age + 1)  # 문자열과 정수를 더하므로 TypeError
print(int(age) + 1)
~~~

**예상 출력:** `27`

오류가 나는 코드는 주석 처리했습니다. 숫자처럼 보이는 입력도 **문자열인지 먼저 확인**해 보세요.

**2. 대입(`=`)과 비교(`==`)를 혼동하기**

~~~python
score = 90

if score == 90:
    print("90점입니다.")
~~~

**예상 출력:** `90점입니다.`

`score = 90`은 저장하는 문장이고, `score == 90`은 조건의 참·거짓을 확인하는 비교식입니다.

**3. 들여쓰기 때문에 실행 범위를 바꿔 버리기**

~~~python
score = 50

if score >= 60:
    print("합격입니다.")

print("검사가 끝났습니다.")
~~~

**예상 출력:** `검사가 끝났습니다.`

첫 번째 출력은 조건이 거짓이므로 실행되지 않지만, 들여쓰지 않은 마지막 출력은 실행됩니다. Python에서는 들여쓰기 자체가 코드의 구조입니다.

<span class="legacy-heading-anchor" id="정리--첫-번째-공부-기록" aria-hidden="true"></span>
## 4. 정리 · 첫 번째 공부 기록

이번에는 **Python이 무엇인지**부터 시작해 **출력 → 변수와 입력 → 자료형과 형 변환 → 계산 → 조건문**까지 살펴봤습니다.

- **Python과 VS Code:** 하나는 실행 환경, 하나는 코드 편집 도구
- **`print()`와 `input()`:** 출력하고 사용자 입력받기
- **변수와 자료형:** 값을 이름으로 다루고 숫자·문자열 구별하기
- **`int()`:** 숫자로 된 문자열을 정수로 바꾸기
- **`if`·`elif`·`else`:** 조건에 따라 다른 코드 실행하기

**복습해 볼 순서:** `print("Hello World!")` 작성 → 변수에 값 저장 → `input()`으로 입력받기 → `int()`로 형 변환 → `if`로 분기하기. 처음에는 이 흐름을 직접 손으로 작성해 보는 것으로 충분합니다.

반복문과 여러 자료를 함께 다루는 방법은 이번 입문 내용과 구별해서 이후 학습에서 정리할 주제로 남겨 두었습니다.

