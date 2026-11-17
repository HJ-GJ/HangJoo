---
issue: "NO. 05"
title: "Python Day 5 — 색종이 겹침 좌표 디버깅과 파일 기반 영단어장"
date: "2026-10-19"
category: "Python"
readTime: "7분"
tags: ["Python", "2DList", "FileIO", "Module", "Debugging"]
summary: "2차원 격자에서 겹친 색종이 노출 면적을 구하는 layered_paper.py의 X·Y 좌표 반전 버그 수정기, 사용자 정의 모듈(import), 그리고 파일 입출력(words.txt) 영단어 퀴즈 구현을 정리합니다."
coverType: "python-day5"
takeaway: "2차원 리스트 board[y][x]에서 첫 번째 인덱스는 행(y, 세로)이고 두 번째 인덱스는 열(x, 가로)이라는 규칙을 일관되게 지켜야 좌표 회전 버그를 막을 수 있습니다."
---

## 1. 겹친 색종이 면적(`layered_paper.py`)과 X/Y 좌표 교환 디버깅

다섯째 날의 핵심 실습은 $100 \times 100$ 격자 위에 여러 장의 색종이를 순서대로 붙였을 때, 각 색종이가 최종적으로 가려지지 않고 보이는 면적을 구하는 문제였습니다.

:::compare
### 처음 겪었던 좌표 반전 오류
- 입력으로 `(x, y, width, height)`를 받아놓고 `board[x][y]` 순서로 접근하거나 가로·세로 범위를 뒤바꿔 대입함
- 새 색종이가 이전 색종이를 덮어쓸 때 이전 색종이의 노출 면적을 차감하지 않아 합계가 부풀려짐
---
### 수정한 격자 시뮬레이션 규칙
- 격자 인덱스를 `board[row][col] = board[y][x]`로 통일
- 이미 다른 색종이(`prev_id > 0`)가 칠해진 칸을 덮어쓸 때는 `area[prev_id] -= 1`로 이전 색종이 면적을 즉시 차감
:::

```python
# title: 2026-10-19/layered_paper.py — 겹친 색종이 노출 면적 시뮬레이션
# takeaway: 새 색종이를 칠할 때 기존 칸에 적힌 색종이 번호를 확인해 즉시 -1 차감하거나, 마지막에 격자 전체를 한 번 순회해 번호별 개수를 세면 정확합니다.
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

## 2. 파일 입출력(`open`, `with`)과 영단어 퀴즈(`vocabulary_quiz.py`)

프로그램이 종료되어도 단어장이 사라지지 않도록 `words.txt` 파일에 `영단어:뜻` 형식으로 읽고 쓰는 기능을 구현했습니다.

:::formula
읽기 모드 (`"r"`) | with open(path, "r", encoding="utf-8") as f: | 줄 끝 개행문자(\n)는 .strip()으로 제거한 뒤 .split(":")으로 분리합니다.
쓰기 모드 (`"w"` vs `"a"`) | "w"는 전체 덮어쓰기, "a"는 파일 끝에 이어쓰기 | 단어장 전체 사전을 갱신해 저장할 때는 "w" 모드로 일괄 기록합니다.
:::

```python
# title: 2026-10-19/vocabulary_quiz.py — 파일 파싱 및 퀴즈 채점 핵심 로직
# takeaway: open() 사용 시 읽기 전용("r")과 쓰기("w") 모드를 명확히 구분하고, 파일 경로는 __file__ 기준으로 잡아야 실행 위치에 상관없이 동작합니다.
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

## 3. 최종적으로 내가 알아낸 내용

:::finding
### Day 5 실습을 통해 직접 깨달은 핵심 원리
- **수학 좌표 `(x, y)`와 2차원 배열 인덱스 `board[행][열]`은 순서가 반대임:** 수학에서는 가로(`x`)를 먼저 쓰지만 2차원 배열에서는 세로 행(`y`)이 먼저 오므로 `board[y][x]`로 고정해야 직사각형이 90도 회전하는 버그를 막을 수 있습니다.
- **겹침 시뮬레이션은 격자에 번호(`idx`)를 덮어쓴 뒤 마지막에 번호별 개수를 세는 것이 가장 안전함:** 칠하는 도중에 면적을 더하고 빼면 경계 조건 실수가 생기기 쉽지만, 격자에 색종이 번호를 덮어쓰고 마지막에 한 번 스캔하면 항상 정확한 노출 면적을 얻습니다.
- **텍스트 파일 파싱 시 `.strip()`은 선택이 아니라 필수:** 파일에서 읽은 각 줄 끝에는 보이지 않는 `\n`이 붙어 있어서, `.strip()`을 빼먹으면 정답 문자열과 비교할 때 계속 오답 처리됩니다.
:::
