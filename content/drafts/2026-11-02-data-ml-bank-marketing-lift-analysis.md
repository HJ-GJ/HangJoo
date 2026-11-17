---
issue: "NO. 11"
title: "[Data & ML] - 머신러닝 전처리·모델링 핵심 이론과 정기예금 가입 예측(Bank Marketing) Lift 검증"
date: "2026-11-02"
category: "Data & ML"
readTime: "12분"
tags: ["DataAnalysis", "MachineLearning", "LinearRegression", "Classification", "DecisionTree", "Lift"]
summary: "수업 PDF([ML] 01~03.pdf)의 머신러닝 3대 분류, 선형 회귀(OLS, MAE/MSE/RMSE, R²), 데이터 누수(Data Leakage) 방지 전처리(train_test_split, IQR Clipping, One-Hot Encoding과 Dummy Variable Trap, Feature Scaling), 분류 알고리즘 4종(로지스틱 회귀 Log Loss/경사하강법, KNN Elbow, 나이브 베이즈 라플라스 스무딩, 결정 트리 지니 불순도/엔트로피/GridSearchCV)을 총정리하고, 45,111건 은행 마케팅 Lift 검증 실습을 복기합니다."
coverType: "data-ml"
takeaway: "결측치 대체·이상치 클리핑·원핫 인코딩·피처 스케일링은 반드시 train_test_split 분할 이후에 학습 데이터(X_train) 기준으로만 수행해야 데이터 누수(Data Leakage)를 막을 수 있으며, 실무 캠페인 분석에서도 통화 종료 후에만 알 수 있는 duration 변수를 제거하고 시기별 Lift를 교차 검증해야 진짜 예측력을 얻습니다."
---

## 1. 이론: 머신러닝 3대 학습 방식과 회귀·분류 알고리즘, 그리고 데이터 누수(Data Leakage) 방지 전처리

수업 교재(`[ML] 01. Machine Learning, Linear Regression.pdf`, `[ML] 02. Logistic Regression, KNN.pdf`, `[ML] 03. Naive Bayes, Decision Tree.pdf`)는 **"거대 AI 에이전트 시대에 왜 여전히 머신러닝(Machine Learning)을 배워야 하는가?"**에서 출발합니다. 실무에서는 (1) 이상거래 탐지처럼 빠르고 저렴한 경량 모델이 필요하고, (2) 금융·의료·보험처럼 **"왜 이런 결정을 내렸는가"에 대한 설명 가능성(Explainability)**이 필수적이며, (3) 엑셀·DB 같은 **정형 데이터(Tabular Data)**에서는 여전히 머신러닝·트리 기반 모델이 가장 강력하기 때문입니다.

### 1) 머신러닝 3대 학습과 선형 회귀(Linear Regression · OLS · $R^2$)
- **3대 학습 방식:** 정답(Label)이 있는 데이터를 학습하는 **지도 학습(Supervised Learning — 회귀/분류)**, 정답 없이 스스로 군집·패턴을 찾는 **비지도 학습(Unsupervised Learning)**, 환경과 상호작용하며 보상을 극대화하는 **강화 학습(Reinforcement Learning)**으로 나뉩니다.
- **회귀(Regression)와 최소제곱법(OLS):** 프랜시스 골턴(Francis Galton)의 "부모의 키가 아무리 커도 자녀의 키는 전체 평균으로 돌아온다(회귀)"는 발견에서 유래한 연속형 숫자 예측 기법입니다. 실제값($y_i$)과 예측값($\hat{y}_i$)의 차이인 **잔차(Residual) 제곱합 $SSE = \sum(y_i - \hat{y}_i)^2$가 최소가 되는 최적의 직선(Line of Best Fit, $y = b_0 + b_1 X_1 + \dots$)**을 최소제곱법(OLS)으로 구합니다.

:::formula
회귀 평가 지표 4종 (MAE, MSE, RMSE, R²) | MAE = (1/n)∑|y - ŷ| (원래 단위 유지, 직관적) / MSE = (1/n)∑(y - ŷ)² (큰 오차에 강한 벌점, 단위 제곱) / RMSE = √MSE (원래 단위로 복원) / 결정계수 R² = SSR / SST = 1 - (SSE / SST) | R² = 1 이면 모델이 변동을 100% 완벽히 설명한 것이고, R² = 0 이면 그냥 전체 평균(ȳ)으로 찍은 것과 다를 바 없는 상태입니다.
데이터 누수(Data Leakage) 방지 전처리 순서 | 1) 명백한 오류 행 삭제(drop) → 2) train_test_split 분할 → 3) X_train 기준 결측치 중앙값(median) 대체 → 4) X_train 기준 IQR 이상치 Clipping → 5) 범주형 인코딩 & Feature Scaling | 테스트 데이터(X_test)의 정보가 학습 과정에 섞여 들어가지 않도록, 중앙값·IQR 경계(Q1 - 1.5×IQR, Q3 + 1.5×IQR)·스케일러는 무조건 X_train에서만 fit 한 뒤 X_test에 적용합니다!
범주형 인코딩과 Dummy Variable Trap | 순서/계층이 있는 변수(초급<중급<상급): Label Encoding (0, 1, 2) / 순서가 없는 독립 범주(지역, 방향): One-Hot Encoding (drop='first' 필수!) | N개 범주를 원-핫 인코딩할 때 모든 열을 다 남기면 합이 항상 1이 되어 다중공선성(Dummy Variable Trap)이 생기므로, 반드시 첫 열 하나를 지워(N-1개 열) 모델이 억지 추측을 하지 못하게 막습니다.
피처 스케일링 (Normalization vs Standardization) | 정규화(MinMaxScaler): 0 ~ 1 사이로 압축 / 표준화(StandardScaler): 평균 0, 표준편차 1 기준으로 변환 | 연봉(수천만 단위)이 나이(10~80 단위)를 압도하는 Feature Dominance 현상을 막기 위해 거리 기반 모델(KNN, 선형/로지스틱 회귀)에서는 표준화(Standardization)가 필수입니다.
:::

### 2) 4대 분류(Classification) 알고리즘과 하이퍼파라미터 튜닝(`Stratified K-Fold`)
연속된 숫자가 아니라 범주($0$ 또는 $1$)를 예측하는 분류 문제에서는 다음 4가지 알고리즘과 평가 지표를 연결해 학습했습니다.

:::compare
### 로지스틱 회귀 (Logistic Regression) & KNN (K-최근접 이웃)
- **로지스틱 회귀:** 선형 방정식 결과를 **Sigmoid 함수**에 통과시켜 $0 \sim 1$ 사이의 확률로 변환함. OLS로 단번에 풀 수 없으므로 **Log Loss(Cross Entropy)** 손실 함수를 편미분(Chain Rule: $\partial w, \partial b$)하여 **경사하강법(Gradient Descent)**과 학습률(Learning Rate — 너무 크면 Overshooting, 너무 작으면 Undershooting)로 최적의 $w, b$를 찾아감
- **KNN (Lazy-learning):** 별도의 사전 수식 학습 없이 데이터를 기억해 두었다가, 새 데이터가 들어오면 가장 가까운 **홀수 $K$개** 이웃의 다수결로 분류함. $K$가 너무 작으면($K=1$) **과적합(Overfitting)**, 너무 크면 **과소적합(Underfitting)**이 되므로 $\sqrt{n}$ 또는 **Elbow Method**로 최적의 $K$를 찾음
---
### 나이브 베이즈 (Naive Bayes) & 결정 트리 (Decision Tree)
- **나이브 베이즈:** 모든 변수가 서로 독립이라는 순진한(Naive) 가정 아래 베이즈 정리 $P(A|B) = P(B|A)P(A)/P(B)$를 계산함. 텍스트를 `CountVectorizer`(Bag-of-Words)로 벡터화할 때, 한 번도 안 나온 단어 때문에 전체 확률이 $0$이 되는 **Zero Probability Problem**을 막기 위해 모든 빈도에 $+1$을 더하는 **라플라스 스무딩(Laplace Smoothing)**을 적용함 (단어 존재 여부는 `BernoulliNB`, 빈도수는 `MultinomialNB`)
- **결정 트리:** 스무고개처럼 **불순도(Gini Impurity $G = 1 - \sum p_i^2$ 또는 Entropy $E = -\sum p_j \log_2 p_j$)가 가장 크게 줄어드는(Information Gain 최대) 질문**부터 가지를 침. 끝까지 키우면 100% 과적합되므로 `max_depth`, `max_leaf_nodes`, `min_samples_split`, `min_samples_leaf`를 **Stratified K-Fold 교차검증(`GridSearchCV` / `RandomizedSearchCV`)**으로 튜닝함
:::

:::formula
혼동 행렬(Confusion Matrix)과 분류 지표 4종 | Accuracy = (TP+TN)/전체 / Precision(정밀도) = TP/(TP+FP) (스팸 오판 방지) / Recall(재현율) = TP/(TP+FN) (암 환자 놓침 방지) / F1-Score = 2×(Precision×Recall)/(Precision+Recall) | 클래스가 불균형할 때는 무조건 다수 클래스로만 찍어도 정확도(Accuracy)가 높게 나오는 Accuracy Paradox에 속지 않도록 Precision·Recall·F1-Score와 Lift를 함께 봐야 합니다.
:::

## 2. 실전 분석: 은행 정기예금 캠페인(45,111건)에서 발견한 데이터 누수와 심슨의 역설

이론에서 배운 **Data Leakage(데이터 누수) 차단**과 **불균형 분류 평가** 원칙을 그대로 적용해, 총 **45,111건(17개 컬럼)**의 은행 정기예금 가입 예측(`Bank Marketing`) 데이터를 분석했습니다.

:::compare
### 흔히 범하는 분석 오류
- 통화가 끝난 뒤에야 기록되는 `duration`(통화 시간)을 입력 변수에 포함해 비현실적으로 높은 정확도를 얻음 (**예측 시점에 알 수 없는 미래 정보 누수!**)
- 가입률이 4.74%인 전반부(24,060건)와 19.48%인 후반부(21,051건)를 단순 합산해 상관관계를 인과로 착각함 (**심슨의 역설**)
---
### 올바른 실험 설계 (`Bank_Marketing_Analysis.md`)
- 고객에게 전화 걸기 전에 이미 알고 있는 **사전 정보(인구통계 + 금융 잔액/대출 + 과거 캠페인 이력)**만 피처로 사용
- 전반부와 후반부 각각에서 **Lift(그룹 가입률 ÷ 동일 시기 평균 가입률) ≥ 1.25**를 동시에 만족하는지 교차 확인
:::

## 3. 실습: 시기별 Lift 수식과 누수 없는 전처리·검증 코드

특정 고객군의 가입률이 단순히 캠페인 후반부에 많이 몰려 있어서 높게 보인 것인지, 아니면 두 시기 모두에서 일관되게 높은지 판별하기 위해 시기별 Lift를 계산했습니다.

:::formula
시기별 Lift 정의 | Lift(G, period) = P(y=1 | G, period) / P(y=1 | period) | 1.0보다 크면 해당 시기 평균보다 가입 확률이 높은 유망 세그먼트입니다.
일관성 판정 기준 | Lift(G, 전반부) ≥ 1.25 AND Lift(G, 후반부) ≥ 1.25 | 두 시기 모두에서 최소 표본(100명 이상)과 Lift 기준을 통과한 세그먼트만 채택합니다.
:::

```python
# title: verify_segment_lift.py — 전·후반 시기별 세그먼트 Lift 계산 및 IQR Clipping 함수
# takeaway: 이상치 클리핑(IQR) 경계값은 반드시 X_train에서만 계산한 뒤 X_test에 동일하게 적용해야 데이터 누수(Data Leakage)가 발생하지 않습니다.
import numpy as np

# 1) 전·후반 시기별 세그먼트 Lift 일관성 검증
segments = [
    ("30세 미만",     0.0652, 0.2583),
    ("학생",          0.0577, 0.3299),
    ("은퇴자",        0.0484, 0.3621),
    ("잔액 상위 25%", 0.0551, 0.2466),
    ("주택대출 없음", 0.0516, 0.2984),
]
base_early, base_late = 0.04738, 0.19481

for name, rate_early, rate_late in segments:
    lift_early = rate_early / base_early
    lift_late = rate_late / base_late
    passed = "PASS (일관된 고가입)" if (lift_early >= 1.25 and lift_late >= 1.25) else "HOLD"
    print(f"{name:<12} | 전반 Lift: {lift_early:.3f} | 후반 Lift: {lift_late:.3f} -> {passed}")

# 2) 핵심: Data Leakage 없이 X_train 기준으로만 IQR Whisker를 구해 X_test까지 Clipping 하기
def fit_transform_iqr_clip(train_col: np.ndarray, test_col: np.ndarray):
    q1, q3 = np.percentile(train_col, [25, 75])
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    # X_test도 반드시 X_train의 lower, upper 경계로 클리핑합니다!
    return np.clip(train_col, lower, upper), np.clip(test_col, lower, upper)

train_sample = np.array([10, 12, 14, 15, 18, 20, 100])  # 100은 이상치
test_sample = np.array([11, 19, 150])
tr_clipped, te_clipped = fit_transform_iqr_clip(train_sample, test_sample)
print("IQR 클리핑 후 test_sample:", te_clipped)
```

## 4. 최종적으로 내가 알아낸 내용

:::finding
### 머신러닝 이론(회귀·분류·전처리)과 Bank Marketing EDA 실습을 통해 깨달은 핵심 원리
- **모든 전처리 기준값(중앙값, IQR 경계, 원핫 인코더, 스케일러)은 무조건 `train_test_split` 이후 `X_train`에서만 뽑아야 함:** 전체 데이터로 먼저 중앙값이나 스케일링을 구하면 미래의 시험 문제(`X_test`) 정보가 학습에 새어 들어가는 **Data Leakage**가 발생하며, 실제 캠페인에서도 통화 종료 후에야 기록되는 `duration`을 빼는 것이 같은 맥락의 누수 차단임을 깨달았습니다.
- **불균형 데이터에서는 정확도(Accuracy) 하나만 믿으면 'Accuracy Paradox'와 '심슨의 역설'에 속기 쉬움:** 가입률이 10% 남짓인 데이터에서는 무조건 미가입($0$)으로만 찍어도 정확도가 90%가 나오므로, 반드시 `Precision`·`Recall`·`F1-Score`와 시기별 `Lift >= 1.25` 교차 검증으로 진짜 유효 타깃(`30세 미만`)을 가려내야 합니다.
- **원-핫 인코딩에서는 `drop="first"`로 Dummy Variable Trap을 피하고, 하이퍼파라미터는 `Stratified K-Fold`로 검증할 것:** 한 번의 `random_state` 분할 운에 좌우되지 않으려면 클래스 비율을 유지하는 `StratifiedKFold` 기반의 `GridSearchCV` / `RandomizedSearchCV`가 필수입니다.
:::
