---
issue: "NO. 03"
title: "LSTM 셀 상태 덧셈 통로와 기울기 보존 원리"
date: "2026-11-14"
category: "Study Note"
readTime: "8분"
tags: ["DeepLearning", "LSTM", "Math", "PyTorch"]
summary: "바닐라 RNN의 반복 행렬 곱이 야기하는 기울기 소실 문제를 복기하고, LSTM이 셀 상태 덧셈 경로(Additive Highway)로 장거리 의존성을 보존하는 원리를 수식과 코드로 확인합니다."
coverType: "lstm-highway"
takeaway: "LSTM의 핵심은 복잡한 게이트 개수가 아니라, 셀 상태 업데이트 식 C_t = f_t ⊙ C_{t-1} + i_t ⊙ C̃_t 에 존재하는 선형 덧셈 경로입니다."
---

## 1. 바닐라 RNN에서 기울기가 사라지는 수학적 이유

순환신경망(RNN)은 매 시점 같은 가중치 행렬 $W_{hh}$와 비선형 활성화 함수 $\tanh$를 반복 적용합니다. 시점 $T$의 손실에서 초기 시점 $k$로 역전파할 때 야코비안(Jacobian) 연쇄 법칙은 다음과 같이 전개됩니다.

:::formula
은닉 상태 전파 | h_t = tanh(W_xh x_t + W_hh h_{t-1} + b_h) | 매 시점 비선형 압축과 행렬 곱이 중첩됩니다.
역전파 기울기 곱 | ∂h_T / ∂h_k = ∏_{j=k+1..T} diag(1 - h_j²) · W_hh^T | 시퀀스 길이(T-k)가 길어질수록 행렬 곱이 지수적으로 감쇠하거나 폭발합니다.
:::

$\tanh'(z) = 1 - \tanh^2(z)$의 치역은 $[0, 1]$이며, 입력이 조금만 포화되어도 도함수 값이 $0$에 가까워집니다. 따라서 수십 스텝만 거슬러 올라가도 앞단 시점의 기울기는 사실상 소실됩니다.

## 2. LSTM의 해결책: 곱셈 경로를 덧셈 통로로 전환

LSTM(Long Short-Term Memory)은 단기 요약본인 은닉 상태 $h_t$와 별개로, 시퀀스 전체를 관통하는 **셀 상태(Cell State, $C_t$)** 통로를 도입합니다.

:::compare
### 바닐라 RNN 은닉 상태 (h_t)
- 매 시점 가중치 행렬 $W_{hh}$가 직접 곱해짐
- 활성화 함수 $\tanh$를 매번 통과하며 신호가 압축됨
- 장거리 시점 간 기울기가 지수적으로 감소
---
### LSTM 셀 상태 (C_t)
- 원소별 곱($\odot$)과 덧셈($+$)만으로 상태를 갱신
- 망각 게이트 $f_t \approx 1$이면 과거 정보가 감쇠 없이 직진
- ResNet의 스킵 연결(Skip Connection)과 유사한 기울기 고속도로 역할
:::

## 3. PyTorch로 직접 확인하는 스텝별 기울기 노름 비교

실제 시퀀스 길이 $T = 40$에서 마지막 시점의 출력이 첫 시점 입력 $x_0$에 얼마나 큰 기울기를 전달하는지 바닐라 RNN과 LSTM을 나란히 실행해 비교합니다.

```python
# title: verify_gradient_flow.py — RNN vs LSTM 초기 시점 기울기 보존 비교
# takeaway: 망각 게이트 편향(forget bias)을 양수로 초기화하면 초기 학습 구간에서도 첫 시점까지 기울기가 안정적으로 도달합니다.
import torch
import torch.nn as nn

torch.manual_seed(42)
seq_len, batch_size, input_dim, hidden_dim = 40, 4, 16, 32

x_rnn = torch.randn(seq_len, batch_size, input_dim, requires_grad=True)
x_lstm = x_rnn.detach().clone().requires_grad_(True)

rnn = nn.RNN(input_dim, hidden_dim, batch_first=False)
lstm = nn.LSTM(input_dim, hidden_dim, batch_first=False)

# 핵심: LSTM 망각 게이트(forget gate) 편향을 +1.0으로 두어 초기 기억 보존율을 높입니다.
with torch.no_grad():
    for name, param in lstm.named_parameters():
        if "bias" in name:
            n = param.size(0)
            param[n // 4 : n // 2].fill_(1.0)

out_rnn, _ = rnn(x_rnn)
out_lstm, _ = lstm(x_lstm)

out_rnn[-1].sum().backward()
out_lstm[-1].sum().backward()

print(f"RNN  t=0 grad norm : {x_rnn.grad[0].norm().item():.6e}")
print(f"LSTM t=0 grad norm : {x_lstm.grad[0].norm().item():.6e}")
```

## 4. 게이트별 활성화 함수 선택의 이유

- **게이트 ($f_t, i_t, o_t$) → Sigmoid ($\sigma$):** 치역이 $[0, 1]$이므로 정보를 얼마나 통과시킬지 비율(0%–100%)을 제어하는 스위치 역할에 정확히 부합합니다.
- **후보 상태 ($\tilde{C}_t$) → Tanh:** 치역이 $[-1, +1]$이고 0을 중심으로 대칭이므로, 셀 상태에 값을 더하거나 빼며 부호와 스케일 균형을 맞출 수 있습니다.
