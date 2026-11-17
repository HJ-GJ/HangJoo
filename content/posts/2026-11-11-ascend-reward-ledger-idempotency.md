---
issue: "NO. 12"
title: "중복 보상 지급을 차단하는 RewardLedger 멱등성 설계"
date: "2026-11-11"
category: "Project ASCEND"
readTime: "5분"
tags: ["Database", "Room", "Idempotency", "Testing"]
summary: "모바일 UI 더블 탭이나 백그라운드 복귀 재시도가 겹치더라도 경험치(XP)와 보상이 단 한 번만 적립되도록 원장(Ledger) 고유 키와 트랜잭션을 구성한 기록입니다."
coverType: "reward-ledger"
takeaway: "상태 플래그(isCompleted) 하나만 믿지 않고, 보상 지급 이력 자체를 고유 키(eventKey)가 걸린 불변 원장 테이블로 관리해야 경쟁 조건에서도 정합성이 깨지지 않습니다."
---

## 1. 왜 단순 불리언 플래그(`isCompleted`)만으로는 부족한가

퀘스트 완료 버튼을 빠르게 두 번 누르거나, 타이머 자동 완료 콜백과 수동 완료 요청이 같은 시점에 도착하면 두 코루틴이 동시에 `isCompleted == false`를 읽을 수 있습니다. 이 경우 경험치와 포인트가 두 번 가산되는 **중복 보상 버그**가 발생합니다.

:::compare
### 단순 상태 업데이트 방식
- `quest.isCompleted` 확인 후 `player.xp += reward` 실행
- 동시 요청 시 두 트랜잭션이 모두 통과할 위험 존재
- 보상이 언제, 어떤 사유로 지급되었는지 역추적하기 어려움
---
### RewardLedger 원장 방식
- 보상 사건마다 결정론적 고유 키(`idempotencyKey`) 생성
- `UNIQUE` 제약과 `INSERT OR IGNORE`로 원장 기록 성공 여부를 먼저 판정
- 원장 행이 실제로 삽입된 경우에만 플레이어 경험치를 갱신
:::

## 2. 결정론적 원장 키(Idempotency Key) 규약

동일한 퀘스트 인스턴스에 대한 완료 요청은 언제 호출되더라도 항상 같은 원장 키를 생성해야 합니다.

:::formula
일일 퀘스트 원장 키 | key = "QUEST_COMPLETE:" + questInstanceId | 인스턴스 ID 자체가 날짜와 슬롯을 포함하므로 재호출 시 동일한 키가 보장됩니다.
원장 적립 조건 | insertedRowId != -1L ⇒ applyPlayerReward(xpDelta) | 데이터베이스 수준에서 중복 키가 무시되면(-1L 반환) 후속 경험치 가산을 즉시 건너뜁니다.
:::

## 3. Room 트랜잭션 구현 및 검증

Room DAO에서 `@Transaction`으로 원장 삽입과 플레이어 상태 갱신을 하나의 원자적(Atomic) 단위로 묶어 부분 실패를 방지합니다.

```kotlin
// title: RewardLedgerDao.kt — UNIQUE 원장 키 기반 멱등적 보상 지급
// takeaway: OnConflictStrategy.IGNORE는 중복 키 충돌 시 예외를 던지는 대신 -1L을 반환하므로, 분기 제어가 명확해집니다.
package com.hangjoo.ascend.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction

@Dao
interface RewardLedgerDao {
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertLedgerEntry(entry: RewardLedgerEntity): Long

    @Query("UPDATE player_profile SET totalXp = totalXp + :xpDelta WHERE id = 1")
    suspend fun incrementPlayerXp(xpDelta: Int)

    // 핵심: 원장 행 삽입이 실제로 성공(rowId != -1L)했을 때만 보상을 가산합니다.
    @Transaction
    suspend fun commitRewardIdempotently(entry: RewardLedgerEntity): Boolean {
        val rowId = insertLedgerEntry(entry)
        if (rowId == -1L) {
            return false
        }
        incrementPlayerXp(entry.xpDelta)
        return true
    }
}
```

## 4. 최종적으로 내가 알아낸 내용

:::finding
### Project ASCEND RewardLedger 설계와 테스트를 통해 깨달은 핵심 원리
- **UI 버튼 비활성화만으로는 중복 지급을 막을 수 없음:** 백그라운드 타이머 만료 콜백과 사용자의 수동 완료 탭이 겹치는 경쟁 조건(Race Condition)은 DB 계층의 `UNIQUE` 원장 키(`INSERT OR IGNORE`)로만 완벽히 차단됩니다.
- **백업/복원에서도 원장 테이블이 함께 보존되어야 재지급이 막힘:** 단순히 현재 총 XP만 백업하는 것이 아니라 지급 원장(`RewardLedger`)까지 스냅샷에 포함해야 복원 직후 동일 퀘스트가 다시 적립되지 않습니다.
:::
