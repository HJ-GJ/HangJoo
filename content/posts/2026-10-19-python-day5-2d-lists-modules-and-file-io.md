---
issue: "NO. 05"
title: "[Python] - 함수 스코프·가변 인자와 모듈, 파일 입출력(File I/O) 및 2차원 격자 시뮬레이션"
date: "2026-10-19"
category: "Python"
readTime: "11분"
tags: ["Python", "Function", "Scope", "Module", "FileIO", "2DList"]
summary: "함수의 4가지 형태와 인자 전달 방식(positional, default, keyword, *args, **kwargs), 지역·전역 스코프(global), 표준 모듈(random, datetime, time, os), 파일 입출력(with open, 커서 이동 원리, utf-8 vs cp949 인코딩) 이론을 정리하고 색종이 겹침 디버깅과 영단어장 실습을 복기합니다."
coverType: "python-day5"
takeaway: "함수는 지역 스코프(Local)가 전역 스코프(Global)보다 우선하며, 파일 입출력에서는 read() 호출 시 파일 커서가 끝으로 이동하는 원리와 한글 인코딩(utf-8 3바이트 vs cp949 2바이트) 차이를 정확히 이해해야 합니다."
---

## 1. 이론: 함수(`def`) 인자 전달 4종과 스코프, 표준 모듈, 파일 입출력(File I/O)

수업 교재(`[python] 03. Function, Module & File I/O.pdf`)에서는 반복되는 코드를 재사용 가능한 단위로 묶는 **함수(`def`)**, 다른 파일과 표준 도구를 불러오는 **모듈(`import`)**, 그리고 휘발성 메모리(RAM)의 데이터를 영구 저장소(HDD/SSD)에 기록하는 **파일 입출력(File I/O)**의 전체 원리를 다뤘습니다.

### 1) 함수의 구조와 매개변수(`parameter`) · 인자(`argument`) 전달 방식 4종
- 함수를 정의할 때 받는 변수를 **매개변수(`parameter`)**, 함수를 호출할 때 실제로 넘기는 값을 **인자(`argument`)**라고 부릅니다.
- 함수는 **입력(매개변수) 유/무 × 반환값(`return`) 유/무**에 따라 4가지 형태로 나뉘며, `return`을 명시하지 않으면 파이썬은 자동으로 **`None`**을 반환합니다. 또한 `def add(a: int, b: int) -> int:`처럼 **Type Hint**로 입력과 반환 타입을 명시해 가독성을 높일 수 있습니다.

:::formula
인자 전달 4가지 방식 | 1) 위치 인자(Positional) / 2) 기본값 인자(Default: 반드시 일반 매개변수 뒤에 배치!) / 3) 키워드 인자(Keyword: 순서 무관 지정) / 4) 가변 인자(*args, **kwargs) | *args는 개수 미정의 위치 인자들을 튜플(tuple)로 묶어 받고, **kwargs는 키워드 인자들을 딕셔너리(dict)로 묶어 받습니다.
변수의 스코프 (Local vs Global) | 탐색 우선순위: Local(함수 내부) > Global(함수 외부) | 지역 변수는 함수 호출 시 생성되어 종료 시 소멸합니다. 함수 안에서 전역 변수는 기본적으로 '읽기 전용'이며, 값을 수정하려면 global 변수명 선언이 필요합니다.
표준 모듈 import 4가지 문법 | import 모듈 / from 모듈 import 함수 / from 모듈 import * / import 모듈 as 별칭 | random(randint, random, choice, choices(weights=..., k=n), shuffle), datetime(datetime.now(), strftime("%Y-%m-%d %H:%M:%S %p %A")), time.sleep(초), os.system("cls") 등을 표준으로 제공합니다.
파일 입출력 3단계와 읽기 3종 | open(경로, 모드, encoding) → read() / readline() / readlines() → close() | with open(...) as f: 구문을 쓰면 블록을 벗어날 때 자동으로 f.close()가 호출되어 메모리 누수와 기록 누락을 방지합니다.
:::

### 2) 파일 커서(Cursor) 이동 원리와 한글 인코딩(`utf-8` vs `cp949`)
파일 입출력 파트에서 가장 놓치기 쉬운 두 가지 핵심 메커니즘은 다음과 같습니다.

:::compare
### `read()` / `readline()` / `readlines()`와 파일 커서(Cursor) 이동
- `read()`는 파일 전체를 하나의 문자열로, `readline()`은 한 줄씩 문자열로, `readlines()`는 전체 줄을 리스트(`["1줄\n", "2줄\n"]`)로 읽어옴
- **주의할 점 (파일 커서):** 메모장에서 글을 읽듯 파일 내부에는 보이지 않는 **커서(Cursor)**가 있음. **`f.read()`를 한 번 실행하면 커서가 파일 맨 끝으로 이동**해버리므로, 바로 다음 줄에서 `f.readline()`이나 `f.readlines()`를 호출하면 읽을 내용이 없어 빈 문자열(`""`)이나 빈 리스트(`[]`)만 반환됨!
---
### 텍스트 모드(`"r"`, `"w"`, `"a"`)와 한글 인코딩(`utf-8` vs `cp949`)
- `"r"`은 읽기(파일 없으면 에러), `"w"`는 새로 쓰기(기존 내용 전체 덮어쓰기), `"a"`는 파일 맨 끝에 이어쓰기(append)
- **`utf-8` vs `cp949`:** 국제 표준인 **`utf-8`은 한글 1글자를 3바이트(byte)**로 표현하지만, Windows 기본 인코딩인 **`cp949`는 한글 1글자를 2바이트**로 표현함. 저장할 때와 읽을 때의 바이트 규격이 다르면 글자가 깨지거나 `UnicodeDecodeError`가 발생하므로 `encoding="utf-8"`을 명시해야 함
:::

```python
# title: python_03_func_scope_fileio.py — 가변 인자(*args, **kwargs), 파일 커서, 인코딩 실습
# takeaway: 가변 위치 인자 *args는 튜플(tuple)로, 가변 키워드 인자 **kwargs는 딕셔너리(dict)로 묶여 전달됩니다.
from datetime import datetime

# 1) 기본값 인자(뒤쪽 배치) + *args(튜플) + **kwargs(딕셔너리) 결합
def build_order(menu: str, size: str = "Regular", *toppings: str, **options: str) -> dict:
    return {
        "menu": menu,
        "size": size,
        "toppings_tuple": toppings,     # ('샷추가', '휘핑') -> tuple
        "options_dict": options,        # {'takeout': 'Yes', 'temp': 'Ice'} -> dict
        "ordered_at": datetime.now().strftime("%Y-%m-%d %p"),
    }

print(build_order("아메리카노", "Large", "샷추가", "헤이즐넛", takeout="Yes", temp="Ice"))
```

## 2. 실습: 겹친 색종이 면적(`layered_paper.py`)과 X/Y 좌표 교환 디버깅

다섯째 날의 알고리즘 실습은 $100 \times 100$ 2차원 격자 위에 여러 장의 색종이를 순서대로 붙였을 때, 각 색종이가 최종적으로 가려지지 않고 보이는 면적을 구하는 문제였습니다.

:::compare
### 처음 겪었던 좌표 반전 오류
- 입력으로 `(x, y, width, height)`를 받아놓고 `board[x][y]` 순서로 접근하거나 가로·세로 범위를 뒤바꿔 대입함
- 새 색종이가 이전 색종이를 덮어쓸 때 이전 색종이의 노출 면적을 차감하지 않아 합계가 부풀려짐
---
### 수정한 격자 시뮬레이션 규칙
- 격자 인덱스를 `board[row][col] = board[y][x]`로 통일
- 격자 칸에 색종이 번호(`idx`)를 그대로 덮어쓴 뒤 마지막에 번호별 칸 수를 집계해 오차를 원천 차단
:::

```python
# title: 2026-10-19/layered_paper.py — 겹친 색종이 노출 면적 시뮬레이션
# takeaway: 새 색종이를 칠할 때 기존 칸에 적힌 색종이 번호를 덮어쓰고 마지막에 격자 전체를 한 번 순회해 번호별 개수를 세면 경계 실수 없이 정확합니다.
board = [[0] * 101 for _ in range(101)]
papers = [
    (10, 10, 30, 10),  # 1번 색종이: (x=10, y=10), 가로 30, 세로 10
    (20, 0, 10, 30),   # 2번 색종이: (x=20, y=0),  가로 10, 세로 30
    (15, 5, 20, 20),   # 3번 색종이: (x=15, y=5),  가로 20, 세로 20
]

# 핵심: board[y][x] 순서에 맞춰 세로(y ~ y+h), 가로(x ~ x+w) 범위를 칠합니다.
for idx, (x, y, w, h) in enumerate(papers, start=1):
    for r in range(y, y + h):
        for c in range(x, x + w):
            board[r][c] = idx

visible_areas = [0] * (len(papers) + 1)
for r in range(101):
    for c in range(101):
        paper_id = board[r][c]
        if paper_id > 0:
            visible_areas[paper_id] += 1

print("1~3번 색종이 최종 노출 면적:", visible_areas[1:])  # [100, 100, 400]
```

## 3. 실습: 파일 입출력(`with open`)과 영단어 퀴즈(`vocabulary_quiz.py`)

프로그램이 종료되어도 단어장이 사라지지 않도록 `words.txt` 파일에 `영단어:뜻` 형식으로 읽고 쓰는 기능을 `with open(..., encoding="utf-8")`으로 구현했습니다.

```python
# title: 2026-10-19/vocabulary_quiz.py — 파일 파싱 및 퀴즈 채점 핵심 로직
# takeaway: 파일에서 읽은 각 줄 끝에는 개행문자(\n)가 붙어 있으므로 반드시 .strip()으로 먼저 제거한 뒤 .split(":", 1)로 분리해야 합니다.
def parse_word_lines(lines: list[str]) -> dict[str, str]:
    vocab = {}
    for raw in lines:
        line = raw.strip()
        if not line or ":" not in line:
            continue
        # 핵심: 첫 번째 콜론(:)을 기준으로 영단어와 뜻을 안전하게 분리합니다.
        word, meaning = line.split(":", 1)
        vocab[word.strip()] = meaning.strip()
    return vocab

sample_lines = ["apple:사과\n", "algorithm:알고리즘\n", "persistence:영속성\n"]
print("로드된 단어장:", parse_word_lines(sample_lines))
```

## 4. 최종적으로 내가 알아낸 내용

:::finding
### 함수·모듈·파일 입출력 이론과 격자 실습을 통해 직접 깨달은 핵심 원리
- **`f.read()`를 실행한 직후 `f.readlines()`를 부르면 빈 리스트(`[]`)가 나옴:** 파일 객체 내부의 읽기 커서(Cursor)가 이미 파일 맨 끝까지 이동했기 때문이며, 다시 읽으려면 파일을 새로 열거나 한 가지 읽기 방식만 일관되게 써야 합니다.
- **한글 파일 깨짐(`UnicodeDecodeError`)의 원인은 바이트 수 차이(`utf-8` 3바이트 vs `cp949` 2바이트):** Windows 메모장이나 엑셀이 `cp949`로 저장한 파일을 읽거나 범용 텍스트를 저장할 때는 항상 `encoding="utf-8"`(또는 `cp949`)을 명시적으로 맞춰주어야 합니다.
- **수학 좌표 `(x, y)`와 2차원 배열 인덱스 `board[행][열]`은 순서가 반대임:** 수학에서는 가로(`x`)를 먼저 쓰지만 2차원 배열에서는 세로 행(`y`)이 먼저 오므로 `board[y][x]`로 고정해야 직사각형이 90도 회전하는 버그를 막을 수 있습니다.
:::
