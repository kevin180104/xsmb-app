# -*- coding: utf-8 -*-
"""
Pattern Engine - Backtesting & Walk-forward Validation
Thực thi kiểm thử quá khứ (Backtest) trên dữ liệu chuỗi số không có look-ahead bias:
- Walk-forward Out-of-sample split
- Chuỗi ăn/thua (Current streak, Max hit streak, Max miss streak)
- Chu kỳ và khoảng cách trung bình (Average gap, Median gap)
- Lịch sử từng kỳ (Explainable hit/miss per draw)
- Dự đoán kỳ quay kế tiếp
"""
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
import numpy as np
from .data_model import DatasetSnapshot, ALL_COORDS, COORD_BY_INDEX
from .primitives import RuleSpecification, OperationType, TargetType
from .scorer import evaluate_pattern_statistics

@dataclass
class DayEvaluationRecord:
    """Chi tiết kết quả đối chiếu của 1 kỳ quay"""
    source_date: str            # Ngày xuất hiện cầu (t)
    source_date_display: str
    target_date: str            # Ngày mở thưởng đối chiếu (t + day_offset)
    target_date_display: str
    digit_a: int
    digit_b: int
    predicted_numbers: List[str] # ["68", "86"]
    actual_result: List[str]     # Các số đã về của kỳ đối chiếu
    hit: bool                    # Trúng hay Trượt
    matched_numbers: List[str]   # Các số trúng thưởng
    hit_locations: List[Dict[str, Any]] # Vị trí trúng giải cụ thể (nếu có)

@dataclass
class BacktestResult:
    """Kết quả tổng hợp backtest toàn diện cho 1 rule"""
    rule: RuleSpecification
    total_occurrences: int
    total_hits: int
    total_misses: int
    current_streak: int
    max_hit_streak: int
    max_miss_streak: int
    average_gap: float
    median_gap: float
    last_seen_days_ago: int
    stats: Dict[str, Any]
    next_prediction: List[str]
    history: List[DayEvaluationRecord]

    def to_dict(self, include_history_limit: Optional[int] = 15) -> Dict[str, Any]:
        """Chuyển thành dict JSON thân thiện với REST API"""
        hist_slice = self.history if include_history_limit is None else self.history[-include_history_limit:]
        history_dicts = []
        for h in hist_slice:
            history_dicts.append({
                "sourceDate": h.source_date,
                "sourceDateDisplay": h.source_date_display,
                "targetDate": h.target_date,
                "targetDateDisplay": h.target_date_display,
                "digitA": h.digit_a,
                "digitB": h.digit_b,
                "predictedNumbers": h.predicted_numbers,
                "hit": h.hit,
                "matchedNumbers": h.matched_numbers,
                "hitLocations": h.hit_locations
            })

        return {
            **self.rule.to_dict(),
            "occurrences": self.total_occurrences,
            "hits": self.total_hits,
            "misses": self.total_misses,
            "currentStreak": self.current_streak,
            "maxHitStreak": self.max_hit_streak,
            "maxMissStreak": self.max_miss_streak,
            "averageGap": round(self.average_gap, 2),
            "medianGap": round(self.median_gap, 2),
            "lastSeenDaysAgo": self.last_seen_days_ago,
            "metrics": self.stats,
            "nextPrediction": self.next_prediction,
            "recentHistory": history_dicts
        }

def find_matched_locations(predicted_numbers: List[int], draw_record: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Xác định chính xác số trúng thưởng đã xuất hiện ở giải nào, nháy mấy của kỳ mở thưởng đối chiếu.
    """
    pred_strs = {f"{n:02d}" for n in predicted_numbers}
    matched = []
    
    # 1. Giải đặc biệt
    sp = str(draw_record.get("special_prize", "")).strip()
    if len(sp) >= 2 and sp[-2:] in pred_strs:
        matched.append({
            "prize": "Đặc biệt",
            "prizeCode": "DB",
            "value": sp,
            "hitNumber": sp[-2:]
        })
        
    # 2. Các giải khác
    prizes_map = [
        ("prize_1", "Giải Nhất", "G1"),
        ("prize_2", "Giải Nhì", "G2"),
        ("prize_3", "Giải Ba", "G3"),
        ("prize_4", "Giải Tư", "G4"),
        ("prize_5", "Giải Năm", "G5"),
        ("prize_6", "Giải Sáu", "G6"),
        ("prize_7", "Giải Bảy", "G7"),
    ]
    for p_key, p_name, p_code in prizes_map:
        items = draw_record.get(p_key, [])
        if isinstance(items, str):
            items = [items]
        for idx, val in enumerate(items):
            val_str = str(val).strip()
            if len(val_str) >= 2 and val_str[-2:] in pred_strs:
                matched.append({
                    "prize": f"{p_name} #{idx+1}" if len(items) > 1 else p_name,
                    "prizeCode": p_code,
                    "value": val_str,
                    "hitNumber": val_str[-2:]
                })
    return matched

def backtest_rule(snapshot: DatasetSnapshot, rule: RuleSpecification) -> Optional[BacktestResult]:
    """
    Chạy backtest chi tiết từng kỳ quay cho một rule chỉ định trên toàn bộ DatasetSnapshot.
    Không có look-ahead bias (kỳ t chỉ dùng kết quả của t để suy luận t + day_offset).
    """
    n = snapshot.total_draws
    offset = rule.day_offset
    total_evaluable = n - offset
    if total_evaluable <= 0:
        return None

    # Tách tập Train (70%) và Test Out-of-Sample (30%)
    train_cutoff = int(total_evaluable * 0.70)
    train_hits = 0
    train_total = max(0, train_cutoff)
    test_hits = 0
    test_total = max(0, total_evaluable - train_cutoff)

    history: List[DayEvaluationRecord] = []
    hit_bools: List[bool] = []
    gaps: List[int] = []
    current_gap = 0

    for t in range(total_evaluable):
        src_date = snapshot.dates[t]
        tgt_date = snapshot.dates[t + offset]

        da = int(snapshot.digit_matrix[t, rule.pos_a])
        db = int(snapshot.digit_matrix[t, rule.pos_b])
        predicted_ints = rule.predict_for_digits(da, db)
        pred_strs = [f"{x:02d}" for x in predicted_ints]

        # Kiểm tra trúng thưởng
        is_hit = False
        matched_ints = []
        if rule.target_type == TargetType.SPECIAL_LAST2:
            sp_actual = int(snapshot.special_last2_array[t + offset])
            if sp_actual in predicted_ints:
                is_hit = True
                matched_ints.append(sp_actual)
        else:
            # LOTO_2DIGIT
            for p in predicted_ints:
                if snapshot.loto_hits_matrix[t + offset, p]:
                    is_hit = True
                    matched_ints.append(p)

        hit_bools.append(is_hit)
        if is_hit:
            gaps.append(current_gap)
            current_gap = 0
            if t < train_cutoff:
                train_hits += 1
            else:
                test_hits += 1
        else:
            current_gap += 1

        # Vị trí trúng thưởng
        tgt_record = snapshot.draw_records[t + offset]
        hit_locations = find_matched_locations(matched_ints, tgt_record) if is_hit else []

        history.append(DayEvaluationRecord(
            source_date=src_date,
            source_date_display=snapshot.date_display_map.get(src_date, src_date),
            target_date=tgt_date,
            target_date_display=snapshot.date_display_map.get(tgt_date, tgt_date),
            digit_a=da,
            digit_b=db,
            predicted_numbers=pred_strs,
            actual_result=[f"{x:02d}" for x in range(100) if snapshot.loto_hits_matrix[t + offset, x]],
            hit=is_hit,
            matched_numbers=[f"{x:02d}" for x in matched_ints],
            hit_locations=hit_locations
        ))

    # Tính toán các chuỗi
    total_hits = sum(hit_bools)
    total_misses = total_evaluable - total_hits

    # Chuỗi ăn hiện tại (tính lùi từ kỳ gần nhất)
    curr_streak = 0
    for h in reversed(hit_bools):
        if h:
            curr_streak += 1
        else:
            break

    # Max hit streak và max miss streak
    max_h_streak = 0
    max_m_streak = 0
    cur_h = 0
    cur_m = 0
    for h in hit_bools:
        if h:
            cur_h += 1
            cur_m = 0
            if cur_h > max_h_streak:
                max_h_streak = cur_h
        else:
            cur_m += 1
            cur_h = 0
            if cur_m > max_m_streak:
                max_m_streak = cur_m

    avg_gap = float(np.mean(gaps)) if gaps else float(total_evaluable)
    med_gap = float(np.median(gaps)) if gaps else float(total_evaluable)
    last_seen = current_gap

    # Đánh giá chỉ số thống kê & độ tin cậy
    stats = evaluate_pattern_statistics(
        hits=total_hits,
        total=total_evaluable,
        current_streak=curr_streak,
        max_hit_streak=max_h_streak,
        train_hits=train_hits,
        train_total=train_total,
        test_hits=test_hits,
        test_total=test_total,
        op=rule.operation,
        target=rule.target_type
    )

    # Dự đoán cho kỳ tiếp theo từ kỳ gần nhất (t = n - 1)
    latest_da = int(snapshot.digit_matrix[n - 1, rule.pos_a])
    latest_db = int(snapshot.digit_matrix[n - 1, rule.pos_b])
    next_preds = [f"{x:02d}" for x in rule.predict_for_digits(latest_da, latest_db)]

    return BacktestResult(
        rule=rule,
        total_occurrences=total_evaluable,
        total_hits=total_hits,
        total_misses=total_misses,
        current_streak=curr_streak,
        max_hit_streak=max_h_streak,
        max_miss_streak=max_m_streak,
        average_gap=avg_gap,
        median_gap=med_gap,
        last_seen_days_ago=last_seen,
        stats=stats,
        next_prediction=next_preds,
        history=history
    )
