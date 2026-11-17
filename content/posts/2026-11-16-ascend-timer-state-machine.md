---
issue: "NO. 10"
title: "로컬 우선 타이머 상태머신과 기준 시각 복구 설계"
date: "2026-11-16"
category: "Project ASCEND"
readTime: "6분"
tags: ["Architecture", "LocalFirst", "Kotlin", "StateMachine"]
summary: "오프라인 환경에서 앱이 백그라운드로 전환되거나 종료되어도, 기준 타임스탬프만으로 잔여 시간과 완료 판정을 오차 없이 복원하는 타이머 계약을 정리합니다."
coverType: "timer-state"
takeaway: "매초 남은 시간을 저장소에 쓰지 않고 시작 시각과 누적 일시정지 구간만 영속화하면 디스크 쓰기 비용과 백그라운드 드리프트를 동시에 제거할 수 있습니다."
---

## 1. 문제 정의: 왜 1초 카운트다운 저장은 깨지기 쉬운가

모바일 환경에서 퀘스트 타이머를 구현할 때 흔히 1초마다 `remainingSeconds -= 1`을 실행해 데이터베이스에 저장하는 방식을 떠올립니다. 하지만 안드로이드 OS가 절전 모드(Doze)로 진입하거나 프로세스를 회수하면 주기적 타이머 콜백이 지연되면서 실제 경과 시간과 화면 표시 시간이 어긋나기 시작합니다.

:::compare
### 단순 카운트다운 방식 (지양)
- 매초 디스크 쓰기(Room/DataStore)가 발생해 배터리와 I/O 소모가 큼
- 앱이 백그라운드로 내려가면 코루틴 루프가 멈춰 시간이 느리게 흐름
- 강제 종료 후 재실행 시 마지막 틱 이후의 경과 시간을 잃어버림
---
### 기준 시각 상태머신 방식 (채택)
- 상태 전이(시작·일시정지·재개·완료) 시점에만 저장소에 기록
- 현재 시각(`nowMillis`)과 시작 시각(`startedAtMillis`)의 차이로 즉시 복원
- 프로세스가 종료되었다가 다시 켜져도 정확한 경과 시간을 유지
:::

## 2. 상태 전이와 경과 시간 수식

타이머 세션은 `IDLE`, `RUNNING`, `PAUSED`, `COMPLETED`, `CANCELLED` 다섯 가지 상태만 가집니다. 경과 시간은 누적된 실행 구간(`accumulatedElapsedMs`)과 현재 진행 중인 구간의 합으로 정의합니다.

:::formula
순수 경과 시간 | elapsed(t) = accumulatedMs + max(0, t - lastResumedAtMs) | RUNNING 상태일 때만 현재 구간을 더하고, PAUSED 상태에서는 accumulatedMs만 유지합니다.
잔여 시간 | remaining(t) = max(0, targetDurationMs - elapsed(t)) | 잔여 시간이 0에 도달하면 완료 가능(Completable) 상태로 전이합니다.
:::

## 3. 핵심 구현 코드와 경계 조건 검증

시간 계산 로직을 안드로이드 프레임워크 의존성이 없는 순수 함수로 분리하면, 에뮬레이터 없이도 단위 테스트에서 수천 개의 시나리오를 즉시 검증할 수 있습니다.

```kotlin
// title: TimerCalculator.kt — 기준 시각 기반 경과 및 잔여 시간 계산
// takeaway: 시스템 시계 역행(수동 시간 조작 등)이 발생해도 음수 경과 시간이 누적되지 않도록 max(0L, ...) 방어식을 강제합니다.
package com.hangjoo.ascend.domain.timer

data class TimerSessionSnapshot(
    val sessionId: String,
    val targetDurationMs: Long,
    val accumulatedElapsedMs: Long,
    val lastResumedAtMs: Long?,
    val status: TimerStatus
)

enum class TimerStatus { IDLE, RUNNING, PAUSED, COMPLETED, CANCELLED }

object TimerCalculator {
    // 핵심: 저장된 남은 시간이 아니라 기준 타임스탬프 차이로 현재 경과 시간을 산출합니다.
    fun computeElapsedMs(snapshot: TimerSessionSnapshot, nowMs: Long): Long {
        val activeSegment = if (snapshot.status == TimerStatus.RUNNING && snapshot.lastResumedAtMs != null) {
            maxOf(0L, nowMs - snapshot.lastResumedAtMs)
        } else {
            0L
        }
        return snapshot.accumulatedElapsedMs + activeSegment
    }

    fun computeRemainingMs(snapshot: TimerSessionSnapshot, nowMs: Long): Long {
        val elapsed = computeElapsedMs(snapshot, nowMs)
        return maxOf(0L, snapshot.targetDurationMs - elapsed)
    }
}
```

## 4. 취소(Cancel)와 포기(Abandon)의 분리

실제 사용 흐름에서는 잠깐 타이머 모달을 닫거나 세션을 초기화하는 **단순 취소**와, 오늘의 퀘스트 자체를 포기하는 **영구 포기**를 명확히 구분해야 합니다.

- **세션 취소 (Cancel Session):** 현재 타이머 세션만 `CANCELLED`로 닫고, 퀘스트 인스턴스는 다시 시작할 수 있는 대기 상태로 되돌립니다.
- **퀘스트 포기 (Abandon Quest):** 퀘스트 상태 자체를 `ABANDONED`로 확정하며, 동일 일자에는 재시도 보상이 지급되지 않도록 기록합니다.
- **보류 세션 재개 (Resume Paused):** `PAUSED` 상태의 세션이 존재할 때는 새 세션을 중복 생성하지 않고 기존 `sessionId`를 그대로 이어받아 재개합니다.
