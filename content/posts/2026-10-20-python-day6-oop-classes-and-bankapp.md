---
issue: "NO. 06"
title: "Python Day 6 — 클래스(__init__)·상속과 콘솔 은행 계좌 앱(BankApp)"
date: "2026-10-20"
category: "Python"
readTime: "8분"
tags: ["Python", "OOP", "Class", "Security", "JSON"]
summary: "객체지향 프로그래밍(클래스, 생성자, 상속)의 기초 문법과 _init_ 오타 디버깅을 정리하고, JSON 영속 저장과 PBKDF2 비밀번호 해시를 적용해 완성한 BankApp 실습을 복기합니다."
coverType: "python-day6"
takeaway: "객체지향 설계는 데이터(속성)와 그 데이터를 변경하는 검증 규칙(메서드)을 하나로 묶는 것이며, 비밀번호 같은 민감 정보는 학습 예제라도 평문 대신 해시로 저장하는 습관이 중요합니다."
---

## 1. 클래스와 생성자(`__init__`), 그리고 자주 하는 문법 실수

여섯째 날에는 함수와 변수를 하나의 설계도로 묶는 **클래스(`class`)**와 **상속(Inheritance)**을 학습했습니다. 실습 파일(`class.py`, `class2.py`, `Product.py`)을 다듬으며 고쳤던 세 가지 핵심 버그는 다음과 같습니다.

:::compare
### 실습 초기 코드에서 발견한 오류
- 생성자 이름을 던더(dunder, 밑줄 2개) `__init__` 대신 밑줄 1개인 `_init_`으로 작성해 초기화가 호출되지 않음
- 메서드 내부에서 같은 객체의 다른 메서드를 부를 때 `self.total()` 대신 `total()`로 호출해 `NameError` 발생
- `Product.py`에서 누적 판매량 속성명을 `amount`와 `acount`로 혼용해 재고 수량이 어긋남
---
### 객체지향 원칙에 맞게 수정한 코드
- 생성자는 정확한 매직 메서드 `__init__(self, ...)`으로 선언
- 인스턴스 속성과 메서드는 항상 `self.` 접두사로 접근 경로를 명시
- 상태 변경(입금·출금·재고 차감)은 음수 입력이나 잔액 부족을 먼저 검사하는 메서드를 통해서만 수행
:::

## 2. `BankApp.py` — 안전한 입출금·송금과 비밀번호 해시 저장

단순 메모리 변수에만 계좌를 저장하면 프로그램 종료와 함께 잔액이 사라집니다. 이를 보완해 `database.json` 영속 저장과 표준 라이브러리 `hashlib.pbkdf2_hmac` 기반 비밀번호 해시 검증을 적용했습니다.

```python
# title: 2026-10-20/bankaccount.py — PBKDF2 해시 인증 및 계좌 이체 불변식 검증
# takeaway: 송금(transfer)은 출금과 입금이 모두 성공해야 하므로, 출금 가능 여부를 먼저 검증한 뒤 두 계좌의 잔액을 갱신합니다.
import hashlib
import secrets

class BankAccount:
    def __init__(self, owner: str, account_no: str, password: str, balance: int = 0):
        self.owner = owner
        self.account_no = account_no
        self.salt = secrets.token_hex(16)
        self.password_hash = self._hash_password(password, self.salt)
        self.balance = balance

    @staticmethod
    def _hash_password(password: str, salt: str) -> str:
        # 핵심: 평문 비밀번호를 저장하지 않고 salt와 결합한 PBKDF2-HMAC-SHA256 해시를 생성합니다.
        dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
        return dk.hex()

    def verify_password(self, candidate: str) -> bool:
        return self._hash_password(candidate, self.salt) == self.password_hash

    def transfer_to(self, target: "BankAccount", amount: int, password: str) -> bool:
        if not self.verify_password(password):
            raise PermissionError("비밀번호가 일치하지 않습니다.")
        if amount <= 0 or amount > self.balance:
            raise ValueError("이체 금액이 올바르지 않거나 잔액이 부족합니다.")
        self.balance -= amount
        target.balance += amount
        return True

acc1 = BankAccount("홍길동", "110-001", "pass1234", balance=50_000)
acc2 = BankAccount("이순신", "110-002", "secret99", balance=10_000)
acc1.transfer_to(acc2, 15_000, "pass1234")
print("이체 후 잔액:", acc1.balance, acc2.balance)  # 35000 25000
```

## 3. 최종적으로 내가 알아낸 내용

:::finding
### Day 6 실습과 BankApp 구현을 통해 직접 깨달은 핵심 원리
- **생성자 `__init__`은 양쪽에 밑줄 2개씩(Dunder) 정확히 맞춰야 자동 실행됨:** `_init_`처럼 밑줄을 1개만 쓰면 파이썬이 일반 메서드로 취급해 객체 생성 시 속성 초기화가 아예 일어나지 않습니다.
- **클래스 내부에서 내 속성과 내 메서드를 부를 때는 항상 `self.`가 기준점:** `self`는 "지금 이 메서드를 실행 중인 바로 그 인스턴스 자신"을 가리키므로, 메서드 간 호출에서도 `self.total()`처럼 명시해야 합니다.
- **상태 변경 메서드는 '사전 검증 → 상태 갱신' 순서를 지킬 것:** 송금(`transfer_to`)에서 비밀번호 확인과 잔액 부족 검사를 먼저 통과한 뒤에만 두 계좌의 잔액을 동시에 갱신해야 데이터 정합성이 깨지지 않습니다.
:::
