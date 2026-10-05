# -*- coding: utf-8 -*-
"""
Pattern Engine - Primitive Operators & Candidate Rule Specifications
Định nghĩa các toán tử nguyên thủy: SELECT, PAIR, CONCAT, BONG, SUM, DIFF, CHAM
và chuẩn hóa định danh rule signature.
"""
from enum import Enum
from typing import List, Tuple, Dict, Any, Set, Optional
import numpy as np
from .data_model import ALL_COORDS, COORD_BY_INDEX, BONG_DUONG

class OperationType(str, Enum):
    CONCAT_PAIR = "CONCAT_PAIR"       # Ghép 2 số tạo cặp lộn: {AB, BA}
    BONG_PAIR = "BONG_PAIR"           # Ghép bóng dương 2 chữ số: {A_bong + B_bong, B_bong + A_bong}
    SUM_DIFF_PAIR = "SUM_DIFF_PAIR"   # Tens=(A+B)%10, Units=abs(A-B) => {TU, UT}
    SUM_PAIR = "SUM_PAIR"             # Tổng (A+B)%10 (Chạm hoặc đuôi)
    DIFF_PAIR = "DIFF_PAIR"           # Hiệu abs(A-B)
    CHAM_PAIR = "CHAM_PAIR"           # Cầu chạm: Chạm A hoặc Chạm B

class TargetType(str, Enum):
    LOTO_2DIGIT = "loto_2digit"       # Lô tô 2 số bất kỳ trong 27 giải
    SPECIAL_LAST2 = "special_last2"   # 2 số cuối Giải Đặc Biệt (Bạch thủ đề)

class RuleSpecification:
    """
    Quy tắc machine-readable đại diện cho một đường cầu logic.
    Có thể serialize sang JSON và deserialize ngược lại.
    """
    def __init__(
        self,
        rule_id: str,
        pos_a: int,
        pos_b: int,
        operation: OperationType,
        target_type: TargetType = TargetType.LOTO_2DIGIT,
        day_offset: int = 1
    ):
        # Đảm bảo canonical ordering để tránh trùng lặp
        if pos_a > pos_b:
            pos_a, pos_b = pos_b, pos_a

        self.rule_id = rule_id
        self.pos_a = pos_a
        self.pos_b = pos_b
        self.operation = operation
        self.target_type = target_type
        self.day_offset = day_offset

        self.coord_a = COORD_BY_INDEX[pos_a]
        self.coord_b = COORD_BY_INDEX[pos_b]

    @property
    def canonical_signature(self) -> str:
        """Chuỗi chữ ký duy nhất chống trùng lặp"""
        return f"{self.operation.value}::{self.target_type.value}::offset_{self.day_offset}::pA_{self.pos_a}::pB_{self.pos_b}"

    @property
    def formula_display(self) -> str:
        """Hiển thị công thức trực quan cho người dùng"""
        lbl_a = self.coord_a.label
        lbl_b = self.coord_b.label
        if self.operation == OperationType.CONCAT_PAIR:
            return f"Ghép vị trí {lbl_a} & {lbl_b} => Cặp song thủ [AB, BA]"
        elif self.operation == OperationType.BONG_PAIR:
            return f"Bóng dương ({lbl_a}) & Bóng ({lbl_b}) => Cặp bóng"
        elif self.operation == OperationType.SUM_DIFF_PAIR:
            return f"Tổng ({lbl_a}+{lbl_b})%10 ghép Hiệu |{lbl_a}-{lbl_b}|"
        elif self.operation == OperationType.SUM_PAIR:
            return f"Tổng ({lbl_a} + {lbl_b}) % 10"
        elif self.operation == OperationType.DIFF_PAIR:
            return f"Hiệu tuyệt đối |{lbl_a} - {lbl_b}|"
        elif self.operation == OperationType.CHAM_PAIR:
            return f"Cầu chạm chữ số {lbl_a} hoặc {lbl_b}"
        return f"{self.operation.value}({lbl_a}, {lbl_b})"

    @property
    def name(self) -> str:
        lbl_a = self.coord_a.label
        lbl_b = self.coord_b.label
        op_name = {
            OperationType.CONCAT_PAIR: "Ghép Vị Trí",
            OperationType.BONG_PAIR: "Cầu Bóng Dương",
            OperationType.SUM_DIFF_PAIR: "Tổng & Hiệu",
            OperationType.SUM_PAIR: "Cầu Tổng",
            OperationType.DIFF_PAIR: "Cầu Hiệu",
            OperationType.CHAM_PAIR: "Cầu Chạm"
        }.get(self.operation, self.operation.value)
        target_name = "Lô tô" if self.target_type == TargetType.LOTO_2DIGIT else "Đề ĐB"
        return f"{op_name}: {lbl_a} x {lbl_b} ({target_name})"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "patternId": self.rule_id,
            "signature": self.canonical_signature,
            "name": self.name,
            "operation": self.operation.value,
            "target": {
                "type": self.target_type.value,
                "dayOffset": self.day_offset
            },
            "formula": self.formula_display,
            "sources": [
                {
                    "globalIndex": self.pos_a,
                    "prize": self.coord_a.prize_code,
                    "row": self.coord_a.sub_index + 1,
                    "subIndex": self.coord_a.sub_index,
                    "digitIndex": self.coord_a.digit_index,
                    "label": self.coord_a.label,
                    "displayPrize": self.coord_a.display_prize,
                    "dayOffset": 0
                },
                {
                    "globalIndex": self.pos_b,
                    "prize": self.coord_b.prize_code,
                    "row": self.coord_b.sub_index + 1,
                    "subIndex": self.coord_b.sub_index,
                    "digitIndex": self.coord_b.digit_index,
                    "label": self.coord_b.label,
                    "displayPrize": self.coord_b.display_prize,
                    "dayOffset": 0
                }
            ]
        }

    def predict_for_digits(self, d_a: int, d_b: int) -> List[int]:
        """
        Tính toán danh sách các số nguyên 2 chữ số (0..99) dự đoán từ 2 chữ số d_a, d_b.
        """
        if self.operation == OperationType.CONCAT_PAIR:
            num1 = d_a * 10 + d_b
            num2 = d_b * 10 + d_a
            return [num1] if num1 == num2 else [num1, num2]

        elif self.operation == OperationType.BONG_PAIR:
            b_a = BONG_DUONG.get(d_a, (d_a + 5) % 10)
            b_b = BONG_DUONG.get(d_b, (d_b + 5) % 10)
            num1 = b_a * 10 + b_b
            num2 = b_b * 10 + b_a
            return [num1] if num1 == num2 else [num1, num2]

        elif self.operation == OperationType.SUM_DIFF_PAIR:
            tens = (d_a + d_b) % 10
            units = abs(d_a - d_b)
            num1 = tens * 10 + units
            num2 = units * 10 + tens
            return [num1] if num1 == num2 else [num1, num2]

        elif self.operation == OperationType.SUM_PAIR:
            # Trả về các số có tổng chữ số modulo 10 bằng (d_a + d_b) % 10
            target_sum = (d_a + d_b) % 10
            return [num for num in range(100) if ((num // 10) + (num % 10)) % 10 == target_sum]

        elif self.operation == OperationType.DIFF_PAIR:
            target_diff = abs(d_a - d_b)
            return [num for num in range(100) if abs((num // 10) - (num % 10)) == target_diff]

        elif self.operation == OperationType.CHAM_PAIR:
            # Chạm d_a hoặc chạm d_b
            res = set()
            for x in range(10):
                res.add(d_a * 10 + x)
                res.add(x * 10 + d_a)
                res.add(d_b * 10 + x)
                res.add(x * 10 + d_b)
            return sorted(list(res))

        return []
