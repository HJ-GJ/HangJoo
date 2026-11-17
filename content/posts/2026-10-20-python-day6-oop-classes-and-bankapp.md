---
issue: "NO. 06"
title: "[Python] - 객체지향(OOP) 4대 원리와 데코레이터(@property), 콘솔 은행 앱(BankApp)"
date: "2026-10-20"
category: "Python"
readTime: "12분"
tags: ["Python", "OOP", "Class", "Property", "Abstraction", "Security"]
summary: "'파이썬은 모든 것이 객체이다(id, type)'에서 출발해 클래스 변수 공유 버그 vs 인스턴스 변수(__init__ & self), OOP 4대 핵심 개념(상속 super(), 다형성 Overriding, 추상화 ABC/@abstractmethod, 캡슐화 Name Mangling 및 @property 데코레이터)을 정리하고 BankApp 구현을 복기합니다."
coverType: "python-day6"
takeaway: "객체지향 설계는 데이터(속성)와 검증 규칙(메서드)을 하나의 책임 단위로 묶는 것이며, 파이썬에서는 __변수명(Name Mangling)과 @property 데코레이터를 통해 문법적 자연스러움과 캡슐화 안전성을 동시에 달성합니다."
---

## 1. 이론: "파이썬은 모든 것이 객체이다"와 OOP 4대 핵심 원리

수업 교재(`[python] 04. OOP.pdf`)는 **"파이썬에서는 숫자 `1`, 문자열, 함수, 심지어 `None`까지 모든 것이 객체(Object)이다"**라는 명제에서 시작합니다. 실제로 `a = 1`에 대해 `id(a)`(메모리 주소), `type(a)`(`<class 'int'>`), 그리고 `a.__add__(2)`를 호출해보면 단순 숫자로 보이던 값도 내부 속성과 메서드를 가진 인스턴스임을 확인할 수 있습니다.

### 1) 절차형(Procedural) vs 객체지향(OOP), 그리고 클래스 변수 공유 함정
- **절차형 프로그래밍:** 데이터(딕셔너리·리스트)와 이를 처리하는 함수가 서로 분리되어 있어, 프로그램이 커질수록 어떤 함수가 어떤 데이터를 건드리는지 추적하기 어려워집니다.
- **객체지향 프로그래밍(OOP):** **클래스(`class`, 설계도 — 관례상 `CamelCase` 사용)** 안에 **속성(`attribute`, 변수)**과 **메서드(`method`, 함수)**를 하나로 묶어 실제 메모리에 **인스턴스(`instance`)**를 찍어냅니다.
- **`self`와 철벽 스코프:** 클래스 안의 메서드는 독립된 스코프를 가지므로, 같은 클래스 안에 선언된 변수라도 그냥 `name`이라고 부르면 찾지 못합니다. 반드시 첫 번째 매개변수 **`self`(메서드를 호출한 바로 그 인스턴스 자신)**를 통해 `self.name`으로 접근해야 합니다.
- **클래스 변수 vs 인스턴스 변수(`__init__`) 주의점:** 클래스 선언부 바로 아래에 `li = []`처럼 **클래스 변수**로 가변 리스트를 선언하면, **모든 인스턴스가 똑같은 리스트 메모리를 공유**하여 한 객체에만 값을 추가해도 모든 객체의 리스트가 동시에 바뀌는 버그가 발생합니다! 객체마다 독립된 상태를 가지려면 반드시 생성자 매직 메서드 **`__init__(self, ...)`** 안에서 `self.li = []`로 초기화해야 합니다.

### 2) OOP 4대 핵심 개념: 상속 · 다형성 · 추상화 · 캡슐화(`@property`)

:::formula
1. 상속 (Inheritance) & super() | class Dog(Animal): → super().__init__(name) | 부모 클래스(Superclass)의 속성과 메서드를 자식 클래스(Subclass)가 그대로 물려받으며, super()로 부모의 초기화 로직을 재사용합니다.
2. 다형성 (Polymorphism — Overriding) | 자식 클래스에서 부모와 동일한 이름의 메서드를 재정의 | 주의: 파이썬은 매개변수 개수/타입만 다르게 같은 이름의 함수를 여러 개 만드는 오버로딩(Overloading)을 지원하지 않으며, 오버라이딩(Overriding)만 다형성으로 동작합니다!
3. 추상화 (Abstraction — ABC) | from abc import ABC, abstractmethod → class Shape(ABC): @abstractmethod | 자식 클래스가 반드시 구현해야 할 메서드의 뼈대만 강제하며, 추상 메서드가 하나라도 남아 있으면 그 클래스 자체로는 인스턴스를 생성할 수 없습니다.
4. 캡슐화 (Encapsulation)와 Name Mangling | var(공개) / _var(내부용 관례) / __var(맹글링: _ClassName__var 로 이름 변환) | __hp 처럼 밑줄 2개를 붙이면 파이썬이 내부 이름을 _Character__hp 로 숨겨 외부에서 c.__hp 로 직접 접근하거나 덮어쓰는 실수를 차단합니다.
:::

:::compare
### 전통적인 Getter / Setter 메서드 vs 파이썬 `@property` 데코레이터
- 다른 언어처럼 `c.get_hp()`, `c.set_hp(300)` 메서드를 일일이 호출하면 기존에 `c.hp`로 작성된 코드를 전부 고쳐야 함
- 외부에서 `c.hp = -500`이나 `max_hp`를 초과하는 값을 바로 대입할 때 검증 로직을 끼워 넣기 번거로움
---
### `@property` (Getter)와 `@속성명.setter` (Setter) 래퍼(Wrapper)
- 데코레이터(Decorator)는 기존 함수를 감싸 전후 동작을 덧붙이는 wrapper 함수임
- `@property`와 `@hp.setter`를 붙여두면, 외부에서는 평소처럼 **`c.hp`(내부적으로 `__get__` 호출)**로 읽고 **`c.hp = 300`(내부적으로 `__set__` 호출)**으로 대입하면서도, 음수 차단이나 최대 체력(`max_hp`) 상한 검증을 자동으로 강제할 수 있음!
:::

```python
# title: python_04_oop_pillars.py — 추상 클래스(ABC), 상속(super), 캡슐화(@property) 통합 예제
# takeaway: @property와 @hp.setter를 사용하면 외부에서는 일반 변수(warrior.hp = 200)처럼 간결하게 쓰면서도 내부적으로는 max_hp 상한 검증을 강제할 수 있습니다.
from abc import ABC, abstractmethod

class Character(ABC):
    def __init__(self, name: str, max_hp: int):
        self.name = name
        self.max_hp = max_hp
        self.__hp = max_hp  # Name Mangling: _Character__hp 로 외부 직접 수정 보호

    @property
    def hp(self) -> int:
        return self.__hp

    @hp.setter
    def hp(self, value: int) -> None:
        # 핵심: 체력이 0 미만으로 내려가거나 max_hp를 초과하지 않도록 캡슐화로 보호합니다.
        self.__hp = max(0, min(value, self.max_hp))

    @abstractmethod
    def attack(self) -> int:
        pass

class Warrior(Character):
    def __init__(self, name: str):
        super().__init__(name, max_hp=100)

    # 다형성(Method Overriding): 추상 메서드 attack을 Warrior에 맞게 구현
    def attack(self) -> int:
        return 25

w = Warrior("아서")
w.hp -= 40
print("피격 후 체력:", w.hp)  # 60
w.hp += 999
print("회복 후 체력(max_hp 제한):", w.hp)  # 100 (max_hp를 절대 넘지 않음!)
```

## 2. 실습 및 디버깅: `class.py` · `Product.py` 초기 실수 교정

실습 파일(`class.py`, `class2.py`, `Product.py`)을 작성하며 겪었던 세 가지 초기 문법 실수와 수정 내역입니다.

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

## 3. 프로젝트 실습: `BankApp.py` — 안전한 입출금·송금과 비밀번호 해시 저장

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

## 4. 최종적으로 내가 알아낸 내용

:::finding
### OOP 4대 원리 이론과 BankApp · Dice Battle 실습을 통해 깨달은 핵심 원리
- **클래스 바로 아래에 가변 객체(`li = []`)를 선언하면 모든 인스턴스가 메모리를 공유함:** 인스턴스마다 고유하게 가져야 할 데이터는 무조건 `__init__(self)` 안에서 `self.변수명`으로 만들어야 서로 간섭하지 않습니다.
- **파이썬의 다형성은 오버라이딩(Overriding)뿐이며, 캡슐화는 `@property`로 완성됨:** 매개변수 개수만 다른 동명 함수(Overloading)는 나중에 선언된 함수가 앞 함수를 덮어써 버리며, 속성을 보호할 때는 `__변수명`(Name Mangling)과 `@property` 데코레이터를 조합하는 것이 가장 파이썬다운 설계입니다.
- **상태 변경 메서드는 '사전 검증 → 상태 갱신' 순서를 지킬 것:** 송금(`transfer_to`)이나 체력 회복(`heal`)에서 비밀번호 확인·잔액 부족·`max_hp` 상한 검사를 먼저 통과한 뒤에만 상태를 갱신해야 데이터 정합성이 깨지지 않습니다.
:::
