# -*- coding: utf-8 -*-
"""
Pattern Engine - Statistical Scorer & Ranking
Cung cấp các công thức thống kê chuẩn mực:
- Wilson Score 95% Confidence Lower Bound
- Bayesian Beta-Binomial Smoothing
- Baseline Hit Probability & Lift Index
- Z-Score Hypothesis Test vs Random Baseline
- Walk-forward Out-of-sample Overfit Detector
- Statistical Strength: VERY WEAK, WEAK, MEDIUM, STRONG
"""
import math
from typing import Dict, Any, Tuple
from .primitives import OperationType, TargetType

def get_baseline_probability(op: OperationType, target: TargetType) -> float:
    """
    Tính xác suất trúng ngẫu nhiên cơ sở (Baseline Probability p0)
    dựa trên lý thuyết xác suất tổ hợp xổ số miền Bắc (27 số / 100 số).
    """
    if target == TargetType.SPECIAL_LAST2:
        # 1 giải ĐB duy nhất trong 100 số
        if op in (OperationType.CONCAT_PAIR, OperationType.BONG_PAIR, OperationType.SUM_DIFF_PAIR):
            # Cặp song thủ (90% là 2 số, 10% là kép 1 số)
            return 0.9 * 0.02 + 0.1 * 0.01  # ~0.019 (1.9%)
        elif op in (OperationType.SUM_PAIR, OperationType.DIFF_PAIR):
            # Tổng hoặc Hiệu có ~10 số
            return 0.10
        elif op == OperationType.CHAM_PAIR:
            # 2 chạm có ~36 số trong 100
            return 0.36
        return 0.01

    # Mặc định là LOTO_2DIGIT (27 giải loto trong 100 số)
    # Xác suất để ít nhất 1 trong 2 số bất kỳ nổ trong 27 số:
    # 1 - (C(98, 27) / C(100, 27)) = 1 - (73*72)/(100*99) = 1 - 5256/9900 = 0.46909
    p_pair = 1.0 - (73.0 * 72.0) / (100.0 * 99.0)  # ~0.4691
    # Nếu là kép bằng (chỉ 1 số): 27 / 100 = 0.27
    p_single = 0.27

    if op in (OperationType.CONCAT_PAIR, OperationType.BONG_PAIR, OperationType.SUM_DIFF_PAIR):
        # 90% trường hợp tạo 2 số, 10% tạo 1 số kép
        return 0.90 * p_pair + 0.10 * p_single  # ~0.4492

    elif op in (OperationType.SUM_PAIR, OperationType.DIFF_PAIR):
        # 10 số trong 100 số nổ ít nhất 1 lần trong 27 lần quay
        # 1 - (90/100)^27 approx 0.94
        return 0.94

    elif op == OperationType.CHAM_PAIR:
        # 36 số trong 100 số
        return 0.99

    return 0.45

def calculate_wilson_lower_bound(hits: int, total: int, z: float = 1.96) -> float:
    """
    Tính Wilson Score Interval 95% (Lower Bound).
    Tránh trường hợp 1/1 = 100% bị xếp trên 60/80 = 75%.
    Công thức:
    W = (p + z^2/(2n) - z * sqrt(p*(1-p)/n + z^2/(4n^2))) / (1 + z^2/n)
    """
    if total <= 0:
        return 0.0
    p = hits / total
    z2 = z * z
    denominator = 1.0 + z2 / total
    centre_adjusted_probability = p + z2 / (2.0 * total)
    adjusted_std_dev = math.sqrt((p * (1.0 - p) + z2 / (4.0 * total)) / total)
    lower_bound = (centre_adjusted_probability - z * adjusted_std_dev) / denominator
    return max(0.0, float(lower_bound))

def calculate_bayesian_smoothed_rate(hits: int, total: int, baseline: float, prior_weight: float = 10.0) -> float:
    """
    Làm mượt xác suất Bayes (Beta-Binomial smoothing).
    prior mean = baseline
    alpha = prior_weight * baseline
    beta = prior_weight * (1 - baseline)
    smoothed = (hits + alpha) / (total + prior_weight)
    """
    alpha = prior_weight * baseline
    return float((hits + alpha) / (total + prior_weight))

def evaluate_pattern_statistics(
    hits: int,
    total: int,
    current_streak: int,
    max_hit_streak: int,
    train_hits: int,
    train_total: int,
    test_hits: int,
    test_total: int,
    op: OperationType,
    target: TargetType
) -> Dict[str, Any]:
    """
    Đánh giá toàn diện các chỉ số thống kê & độ tin cậy của một pattern.
    """
    raw_hit_rate = hits / total if total > 0 else 0.0
    baseline_p0 = get_baseline_probability(op, target)

    # 1. Wilson Score 95%
    wilson_lower = calculate_wilson_lower_bound(hits, total, z=1.96)

    # 2. Bayesian smoothed rate
    bayesian_rate = calculate_bayesian_smoothed_rate(hits, total, baseline_p0)

    # 3. Lift so với xác suất ngẫu nhiên
    lift = raw_hit_rate / baseline_p0 if baseline_p0 > 0 else 1.0

    # 4. Z-Score kiểm định giả thuyết (so sánh với phân phối nhị thức cơ sở)
    if total > 0 and baseline_p0 * (1.0 - baseline_p0) > 0:
        se = math.sqrt((baseline_p0 * (1.0 - baseline_p0)) / total)
        z_score = (raw_hit_rate - baseline_p0) / se
    else:
        z_score = 0.0

    # 5. Kiểm tra Overfitting (Walk-forward Validation)
    train_rate = train_hits / train_total if train_total > 0 else 0.0
    test_rate = test_hits / test_total if test_total > 0 else 0.0

    # Nếu train rất cao mà test rớt mạnh dưới 80% baseline -> Overfit
    is_overfit = False
    if train_total >= 10 and test_total >= 8:
        if train_rate >= (baseline_p0 * 1.25) and test_rate < (baseline_p0 * 0.85):
            is_overfit = True

    # 6. Đánh giá Statistical Strength
    # VERY WEAK / WEAK / MEDIUM / STRONG
    if is_overfit:
        strength = "OVERFIT"
    elif z_score >= 2.5 and wilson_lower >= 0.50 and total >= 25 and lift >= 1.25:
        strength = "STRONG"
    elif z_score >= 1.5 and wilson_lower >= 0.44 and total >= 15 and lift >= 1.10:
        strength = "MEDIUM"
    elif z_score >= 0.5 and total >= 10 and lift >= 1.02:
        strength = "WEAK"
    else:
        strength = "VERY WEAK"

    # 7. Tổng hợp Điểm Xếp Hạng Đa Tiêu Chí (Confidence Score)
    # Tích hợp Wilson lower, Lift, Phong độ chuỗi ăn hiện tại (streak bonus), và out-of-sample stability
    streak_bonus = min(0.15, current_streak * 0.03)  # Thưởng thêm tối đa 15% cho cầu đang ăn thông
    stability_factor = 1.0 if not is_overfit else 0.3

    confidence_score = (
        0.50 * wilson_lower +
        0.20 * min(1.0, lift / 1.8) +
        0.15 * streak_bonus +
        0.15 * (test_rate if test_total > 0 else raw_hit_rate)
    ) * stability_factor

    return {
        "rawHitRate": round(raw_hit_rate, 4),
        "baseline": round(baseline_p0, 4),
        "wilsonLower": round(wilson_lower, 4),
        "bayesianRate": round(bayesian_rate, 4),
        "lift": round(lift, 2),
        "zScore": round(z_score, 2),
        "trainHitRate": round(train_rate, 4),
        "testHitRate": round(test_rate, 4),
        "isOverfit": is_overfit,
        "statisticalStrength": strength,
        "confidenceScore": round(max(0.0, min(1.0, confidence_score)), 4)
    }
