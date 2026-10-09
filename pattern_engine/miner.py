# -*- coding: utf-8 -*-
"""
Pattern Engine - Pattern Discovery & Mining Engine (High-Performance Vectorized)
Tự động sinh hàng chục nghìn candidate rules, chạy sàng lọc vector hóa qua NumPy,
chống quá khớp (overfitting), chuẩn hóa signature loại bỏ trùng lặp,
và xếp hạng theo điểm tin cậy Wilson + Lift + Streak trong < 0.5 giây.
"""
import time
from typing import List, Dict, Any, Optional, Tuple
import numpy as np

from .data_model import DatasetSnapshot, ALL_COORDS, COORD_BY_INDEX, BONG_DUONG
from .primitives import RuleSpecification, OperationType, TargetType
from .backtest import backtest_rule, BacktestResult
from .scorer import evaluate_pattern_statistics, get_baseline_probability

class PatternMiner:
    """
    Bộ máy đào tìm đường cầu tự động tốc độ cao.
    Sử dụng ma trận NumPy quét 5,671 cặp vị trí x nhiều phép biến đổi trong < 0.2 giây.
    """
    def __init__(self, snapshot: DatasetSnapshot):
        self.snapshot = snapshot
        self.n_draws = snapshot.total_draws
        # Tạo danh sách các cặp (pos_a, pos_b) với a < b cố định
        self.pairs = np.array(
            [(i, j) for i in range(107) for j in range(i + 1, 107)],
            dtype=np.int16
        )
        self.num_pairs = len(self.pairs)  # 5671
        self.p_a = self.pairs[:, 0]
        self.p_b = self.pairs[:, 1]

    def _screen_concat_pairs(
        self,
        day_offset: int = 1,
        target_type: TargetType = TargetType.LOTO_2DIGIT
    ) -> np.ndarray:
        """
        Sàng lọc vector hóa toàn bộ 5,671 cặp phép ghép trực tiếp CONCAT_PAIR {AB, BA}.
        Trả về ma trận hits shape (T, 5671) kiểu bool.
        """
        T = self.n_draws - day_offset
        hits = np.zeros((T, self.num_pairs), dtype=bool)

        for t in range(T):
            da = self.snapshot.digit_matrix[t, self.p_a]
            db = self.snapshot.digit_matrix[t, self.p_b]
            n1 = da * 10 + db
            n2 = db * 10 + da

            if target_type == TargetType.LOTO_2DIGIT:
                hits[t] = (
                    self.snapshot.loto_hits_matrix[t + day_offset, n1] |
                    self.snapshot.loto_hits_matrix[t + day_offset, n2]
                )
            else:
                sp_val = self.snapshot.special_last2_array[t + day_offset]
                hits[t] = (n1 == sp_val) | (n2 == sp_val)

        return hits

    def _screen_bong_pairs(
        self,
        day_offset: int = 1,
        target_type: TargetType = TargetType.LOTO_2DIGIT
    ) -> np.ndarray:
        """
        Sàng lọc vector hóa phép biến đổi bóng dương BONG_PAIR.
        """
        T = self.n_draws - day_offset
        hits = np.zeros((T, self.num_pairs), dtype=bool)

        for t in range(T):
            da = (self.snapshot.digit_matrix[t, self.p_a] + 5) % 10
            db = (self.snapshot.digit_matrix[t, self.p_b] + 5) % 10
            n1 = da * 10 + db
            n2 = db * 10 + da

            if target_type == TargetType.LOTO_2DIGIT:
                hits[t] = (
                    self.snapshot.loto_hits_matrix[t + day_offset, n1] |
                    self.snapshot.loto_hits_matrix[t + day_offset, n2]
                )
            else:
                sp_val = self.snapshot.special_last2_array[t + day_offset]
                hits[t] = (n1 == sp_val) | (n2 == sp_val)

        return hits

    def _screen_sum_diff_pairs(
        self,
        day_offset: int = 1,
        target_type: TargetType = TargetType.LOTO_2DIGIT
    ) -> np.ndarray:
        """
        Sàng lọc vector hóa phép Tổng và Hiệu: tens=(da+db)%10, units=|da-db| => {TU, UT}.
        """
        T = self.n_draws - day_offset
        hits = np.zeros((T, self.num_pairs), dtype=bool)

        for t in range(T):
            da = self.snapshot.digit_matrix[t, self.p_a]
            db = self.snapshot.digit_matrix[t, self.p_b]
            tens = (da + db) % 10
            units = np.abs(da - db)
            n1 = tens * 10 + units
            n2 = units * 10 + tens

            if target_type == TargetType.LOTO_2DIGIT:
                hits[t] = (
                    self.snapshot.loto_hits_matrix[t + day_offset, n1] |
                    self.snapshot.loto_hits_matrix[t + day_offset, n2]
                )
            else:
                sp_val = self.snapshot.special_last2_array[t + day_offset]
                hits[t] = (n1 == sp_val) | (n2 == sp_val)

        return hits

    def auto_discover(
        self,
        min_occurrences: int = 10,
        min_confidence: float = 0.40,
        min_streak: int = 0,
        target_type_str: str = "loto_2digit",
        day_offset: int = 1,
        top_n: int = 50
    ) -> Dict[str, Any]:
        """
        Quy trình khai phá tự động [TỰ TÌM ĐƯỜNG CẦU] siêu tốc:
        - Sử dụng vector hóa ma trận cho toàn bộ 17,013 candidates
        - Tính toán thống kê Wilson, Bayesian, Streak, Overfit trực tiếp trên ma trận bool
        - Chỉ dựng chi tiết explainable history cho Top N candidates sau khi xếp hạng
        """
        t_start = time.time()
        target_type = TargetType(target_type_str)
        T = self.n_draws - day_offset

        if T < min_occurrences:
            return {
                "status": "ERROR",
                "message": f"Số kỳ dữ liệu ({T}) không đủ điều kiện tối thiểu ({min_occurrences} kỳ)."
            }

        train_cutoff = int(T * 0.70)
        train_total = max(1, train_cutoff)
        test_total = max(1, T - train_cutoff)

        ops_to_test = [
            (OperationType.CONCAT_PAIR, self._screen_concat_pairs(day_offset, target_type)),
            (OperationType.BONG_PAIR, self._screen_bong_pairs(day_offset, target_type)),
            (OperationType.SUM_DIFF_PAIR, self._screen_sum_diff_pairs(day_offset, target_type)),
        ]

        total_candidates_checked = self.num_pairs * len(ops_to_test)
        candidates_pool = []

        strong_count = 0
        medium_count = 0
        weak_count = 0
        overfit_count = 0
        passed_count = 0

        for op, hits_matrix in ops_to_test:
            # Vectorized sum
            tot_hits = hits_matrix.sum(axis=0)                      # (5671,)
            train_hits = hits_matrix[:train_cutoff, :].sum(axis=0)   # (5671,)
            test_hits = hits_matrix[train_cutoff:, :].sum(axis=0)    # (5671,)

            # Tính streak cho từng pair
            for pair_idx in range(self.num_pairs):
                hits_col = hits_matrix[:, pair_idx]
                h_total = int(tot_hits[pair_idx])

                # Streak tính từ dưới lên
                streak = 0
                for row_idx in range(T - 1, -1, -1):
                    if hits_col[row_idx]:
                        streak += 1
                    else:
                        break

                if min_streak > 0 and streak < min_streak:
                    continue

                # Max streak
                max_h_streak = 0
                cur_h = 0
                for h in hits_col:
                    if h:
                        cur_h += 1
                        if cur_h > max_h_streak:
                            max_h_streak = cur_h
                    else:
                        cur_h = 0

                tr_h = int(train_hits[pair_idx])
                te_h = int(test_hits[pair_idx])

                # Tính nhanh stats
                stats = evaluate_pattern_statistics(
                    hits=h_total,
                    total=T,
                    current_streak=streak,
                    max_hit_streak=max_h_streak,
                    train_hits=tr_h,
                    train_total=train_total,
                    test_hits=te_h,
                    test_total=test_total,
                    op=op,
                    target=target_type
                )

                conf = stats["confidenceScore"]
                if conf < min_confidence:
                    continue

                passed_count += 1
                st = stats["statisticalStrength"]
                if stats["isOverfit"]:
                    overfit_count += 1
                elif st == "STRONG":
                    strong_count += 1
                elif st == "MEDIUM":
                    medium_count += 1
                elif st == "WEAK":
                    weak_count += 1

                # Không thêm overfit vào pool xếp hạng
                if not stats["isOverfit"]:
                    pa = int(self.p_a[pair_idx])
                    pb = int(self.p_b[pair_idx])
                    hit_rate = round(h_total / T, 4)
                    candidates_pool.append({
                        "pa": pa,
                        "pb": pb,
                        "op": op,
                        "hit_rate": hit_rate,
                        "conf": conf,
                        "streak": streak,
                        "lift": stats["lift"],
                        "hits": h_total,
                        "stats": stats
                    })

        # Xếp hạng đa tiêu chí tương ứng với cách xếp hạng của Cầu Thứ, Tỉnh Thành:
        # 1. Độ ổn định % cao nhất (hit_rate)
        # 2. Chuỗi ăn thông liên tiếp gần nhất (streak)
        # 3. Điểm tin cậy thống kê (conf)
        # 4. Tổng số nháy nổ (hits)
        candidates_pool.sort(
            key=lambda x: (x["hit_rate"], x["streak"], x["conf"], x["hits"]),
            reverse=True
        )

        # Lấy Top N
        top_slice = candidates_pool[:top_n]
        top_patterns = []

        # Chỉ xây dựng full explainable history cho Top N
        for item in top_slice:
            pa = item["pa"]
            pb = item["pb"]
            op = item["op"]
            rule_id = f"P_{op.value}_{pa}_{pb}"

            rule = RuleSpecification(
                rule_id=rule_id,
                pos_a=pa,
                pos_b=pb,
                operation=op,
                target_type=target_type,
                day_offset=day_offset
            )
            bt = backtest_rule(self.snapshot, rule)
            if bt:
                top_patterns.append(bt.to_dict(include_history_limit=12))

        elapsed_sec = round(time.time() - t_start, 3)

        return {
            "status": "SUCCESS",
            "scanSummary": {
                "candidatesChecked": total_candidates_checked,
                "rejectedCount": total_candidates_checked - passed_count,
                "passedCount": passed_count,
                "strongCount": strong_count,
                "mediumCount": medium_count,
                "weakCount": weak_count,
                "overfitCount": overfit_count,
                "elapsedSeconds": elapsed_sec,
                "drawsAnalyzed": T,
                "dateRange": f"{self.snapshot.dates[0]} -> {self.snapshot.dates[-1]}"
            },
            "patterns": top_patterns
        }
