# -*- coding: utf-8 -*-
"""
Pattern Engine - Data Model & Coordinate System
Định nghĩa hệ tọa độ 107 chữ số chuẩn của XSMB và cấu trúc dữ liệu vector hóa.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Tuple, Optional, Any, Set
import numpy as np

# Bảng bóng âm dương truyền thống
BONG_DUONG = {0: 5, 1: 6, 2: 7, 3: 8, 4: 9, 5: 0, 6: 1, 7: 2, 8: 3, 9: 4}
BONG_AM = {0: 7, 1: 4, 2: 9, 3: 6, 5: 8, 7: 0, 4: 1, 9: 2, 6: 3, 8: 5}

@dataclass(frozen=True)
class DigitCoord:
    """Tọa độ chính xác của 1 chữ số trong bảng kết quả XSMB (107 vị trí)"""
    global_index: int       # 0 đến 106
    prize_key: str          # 'special_prize', 'prize_1' ... 'prize_7'
    prize_code: str         # 'DB', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'
    sub_index: int          # Thứ tự giải con (0-indexed, ví dụ G3 có 0..5)
    digit_index: int        # Thứ tự chữ số trong giải (0-indexed từ trái sang phải)
    num_digits: int         # Độ dài của giải đó (5, 4, 3, hoặc 2)
    label: str              # Ví dụ: "ĐB[0]", "G3.2[4]", "G7.3[1]"
    display_prize: str      # Ví dụ: "Đặc biệt", "Giải 3.2", "Giải 7.3"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "globalIndex": self.global_index,
            "prizeKey": self.prize_key,
            "prize": self.prize_code,
            "row": self.sub_index + 1,  # 1-indexed for display
            "subIndex": self.sub_index,
            "digitIndex": self.digit_index,
            "label": self.label,
            "displayPrize": self.display_prize,
            "numDigits": self.num_digits
        }

def _build_coords_table() -> List[DigitCoord]:
    """Sinh toàn bộ danh sách 107 vị trí chữ số của XSMB theo chuẩn cố định"""
    prizes_spec = [
        ("special_prize", "DB", 1, 5, "Đặc biệt"),
        ("prize_1", "G1", 1, 5, "Giải Nhất"),
        ("prize_2", "G2", 2, 5, "Giải Nhì"),
        ("prize_3", "G3", 6, 5, "Giải Ba"),
        ("prize_4", "G4", 4, 4, "Giải Tư"),
        ("prize_5", "G5", 6, 4, "Giải Năm"),
        ("prize_6", "G6", 3, 3, "Giải Sáu"),
        ("prize_7", "G7", 4, 2, "Giải Bảy"),
    ]

    coords = []
    idx = 0
    for prize_key, prize_code, count, length, display_name in prizes_spec:
        for sub in range(count):
            sub_label = f".{sub+1}" if count > 1 else ""
            display_sub = f"{display_name} #{sub+1}" if count > 1 else display_name
            for d in range(length):
                label = f"{prize_code}{sub_label}[{d}]"
                coord = DigitCoord(
                    global_index=idx,
                    prize_key=prize_key,
                    prize_code=prize_code,
                    sub_index=sub,
                    digit_index=d,
                    num_digits=length,
                    label=label,
                    display_prize=display_sub
                )
                coords.append(coord)
                idx += 1
    assert len(coords) == 107, f"Kỳ vọng đúng 107 vị trí, thực tế {len(coords)}"
    return coords

ALL_COORDS: List[DigitCoord] = _build_coords_table()
COORD_BY_INDEX: Dict[int, DigitCoord] = {c.global_index: c for c in ALL_COORDS}
COORD_BY_LABEL: Dict[str, DigitCoord] = {c.label: c for c in ALL_COORDS}

def extract_draw_digits(draw: Dict[str, Any]) -> np.ndarray:
    """
    Trích xuất mảng 107 số nguyên (0..9) từ 1 kỳ quay structured data.
    Nếu dữ liệu thiếu hoặc lỗi, trả về mảng 0.
    """
    digits = np.zeros(107, dtype=np.int8)
    curr_idx = 0

    # 1. Special prize (5 digits)
    sp = str(draw.get("special_prize", "")).strip()
    sp_clean = [int(c) for c in sp if c.isdigit()]
    while len(sp_clean) < 5:
        sp_clean.append(0)
    for c in sp_clean[:5]:
        digits[curr_idx] = c
        curr_idx += 1

    # 2. Các giải G1..G7
    prizes_order = [
        ("prize_1", 1, 5),
        ("prize_2", 2, 5),
        ("prize_3", 6, 5),
        ("prize_4", 4, 4),
        ("prize_5", 6, 4),
        ("prize_6", 3, 3),
        ("prize_7", 4, 2),
    ]

    for p_key, count, length in prizes_order:
        raw_list = draw.get(p_key, [])
        if isinstance(raw_list, str):
            raw_list = [raw_list]
        for sub in range(count):
            item_str = str(raw_list[sub]) if sub < len(raw_list) else ""
            item_clean = [int(c) for c in item_str if c.isdigit()]
            while len(item_clean) < length:
                item_clean.append(0)
            for c in item_clean[:length]:
                digits[curr_idx] = c
                curr_idx += 1

    return digits

@dataclass
class DatasetSnapshot:
    """
    Toàn bộ dữ liệu lịch sử được vector hóa và lập chỉ mục trong bộ nhớ.
    Sẵn sàng cho việc tính toán song song ma trận cực nhanh.
    """
    dates: List[str]                            # Danh sách ngày tăng dần: t=0 (cũ nhất) -> t=N-1 (mới nhất)
    date_display_map: Dict[str, str]           # YYYY-MM-DD -> DD/MM/YYYY
    draw_records: List[Dict[str, Any]]         # Nguyên bản records
    digit_matrix: np.ndarray                   # Shape (N, 107) dtype int8
    loto_hits_matrix: np.ndarray               # Shape (N, 100) dtype bool (đánh dấu số nào có về lô)
    special_last2_array: np.ndarray            # Shape (N,) dtype int16 (2 số cuối GĐB)
    loto_counts_matrix: np.ndarray             # Shape (N, 100) dtype int8 (số nháy về của từng số)
    
    @property
    def total_draws(self) -> int:
        return len(self.dates)

def build_dataset_snapshot(draws: List[Dict[str, Any]]) -> DatasetSnapshot:
    """
    Chuyển đổi danh sách kết quả XSMB từ DB thành DatasetSnapshot tối ưu hóa.
    Đảm bảo sắp xếp tăng dần theo thời gian (t=0 là kỳ cũ nhất, t=N-1 là kỳ gần nhất).
    """
    # Sắp xếp tăng dần theo draw_date
    sorted_draws = sorted(draws, key=lambda x: str(x.get("draw_date", "")))
    n = len(sorted_draws)
    
    dates = []
    date_display_map = {}
    digit_matrix = np.zeros((n, 107), dtype=np.int8)
    loto_hits_matrix = np.zeros((n, 100), dtype=bool)
    loto_counts_matrix = np.zeros((n, 100), dtype=np.int8)
    special_last2_array = np.zeros(n, dtype=np.int16)

    for i, d in enumerate(sorted_draws):
        dt = d.get("draw_date", "")
        dates.append(dt)
        date_display_map[dt] = d.get("date_display", dt)
        
        # 107 digits
        digit_matrix[i] = extract_draw_digits(d)

        # 2 số cuối giải đặc biệt
        sp = str(d.get("special_prize", "")).strip()
        sp_clean = [c for c in sp if c.isdigit()]
        if len(sp_clean) >= 2:
            special_last2_array[i] = int(sp_clean[-2] + sp_clean[-1])
        else:
            special_last2_array[i] = -1

        # Loto 2 số
        loto_list = d.get("loto_2digit", [])
        for item in loto_list:
            item_str = str(item).strip().zfill(2)
            if item_str.isdigit() and len(item_str) >= 2:
                num_val = int(item_str[-2:])
                loto_hits_matrix[i, num_val] = True
                loto_counts_matrix[i, num_val] += 1

    return DatasetSnapshot(
        dates=dates,
        date_display_map=date_display_map,
        draw_records=sorted_draws,
        digit_matrix=digit_matrix,
        loto_hits_matrix=loto_hits_matrix,
        special_last2_array=special_last2_array,
        loto_counts_matrix=loto_counts_matrix
    )
