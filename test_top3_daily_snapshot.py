# -*- coding: utf-8 -*-
"""
Kiểm thử tính bất biến của Top 3 đề xuất theo từng ngày (Daily Snapshot Immutability Test)
Kịch bản kiểm thử:
1. Ngày N (Ví dụ: 2026-10-18):
   - Tạo Top 3 đề xuất cho ngày N (căn cứ trên dữ liệu trước ngày N).
   - Lưu kết quả snapshot vào cơ sở dữ liệu SQLite.
   - Ghi nhận chính xác Top 1, Top 2, Top 3 của ngày N.
2. Ngày N+1 (Ví dụ: 2026-10-19):
   - Ngày N đã có kết quả mở thưởng chính thức được nạp vào DB.
   - Tạo Top 3 đề xuất mới cho ngày N+1 (căn cứ trên dữ liệu đã bao gồm cả ngày N).
   - Lưu snapshot cho ngày N+1.
3. Mở lại ngày N (2026-10-18):
   - Hệ thống đọc lại dữ liệu của ngày N từ snapshot.
   - Kiểm tra khẳng định (assert):
     Top3(N)_sau_khi_sang_N+1 == Top3(N)_tại_thời_điểm_đã_lưu
   - Đảm bảo các con số dự đoán, vị trí cầu (pos_a, pos_b), công thức không bị thay đổi dù đã sang ngày N+1.
"""
import sys
import os
import unittest

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Đảm bảo đường dẫn root có trong sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import database
from pattern_engine.service import scan_patterns_service

class TestDailyTop3SnapshotImmutability(unittest.TestCase):
    def setUp(self):
        # Đảm bảo database đã được khởi tạo
        database.init_db()

    def test_top3_snapshot_immutability_across_days(self):
        """
        Kiểm tra: Top 3 của Ngày N sau khi sang Ngày N+1 phải tuyệt đối trùng khớp với Top 3 của Ngày N ban đầu.
        """
        # 1. Tạo và chốt snapshot cho ngày 2026-10-18
        test_date_n = "2026-10-18"
        
        # Chạy quét hoặc lấy snapshot cho ngày N
        res_n_initial = scan_patterns_service(
            days="60",
            min_occurrences=10,
            min_confidence=0.40,
            min_streak=0,
            exact_streak=4,
            target_type="loto_2digit",
            anchor_date=test_date_n,
            force_refresh=True  # Tạo mới snapshot chuẩn
        )
        self.assertEqual(res_n_initial.get("status"), "SUCCESS", "Tạo Top 3 ngày N thất bại")
        patterns_n = res_n_initial.get("patterns", [])
        self.assertGreater(len(patterns_n), 0, "Không tìm thấy pattern nào cho ngày N")

        # Lọc ra Top 3 ăn thông 4 ngày
        streak4_n = [p for p in patterns_n if p.get("currentStreak") == 4]
        if not streak4_n:
            streak4_n = patterns_n
        top3_initial = streak4_n[:3]
        self.assertGreaterEqual(len(top3_initial), 1, "Phải có ít nhất 1 pattern trong Top đề xuất")

        # Trích xuất dữ liệu mốc của Top 1, Top 2, Top 3
        top3_initial_data = []
        for p in top3_initial:
            top3_initial_data.append({
                "patternId": p.get("patternId"),
                "prediction": p.get("nextPrediction"),
                "pos_a": p.get("sources", [{}])[0].get("globalIndex"),
                "pos_b": p.get("sources", [{}, {}])[1].get("globalIndex"),
                "operation": p.get("operation")
            })

        print(f"\n[TEST] Top 3 đã chốt cho ngày N ({test_date_n}):")
        for idx, item in enumerate(top3_initial_data):
            print(f"  Top #{idx+1}: Cặp [{', '.join(item['prediction'])}] (ID: {item['patternId']})")

        # 2. Sang ngày N+1 (2026-10-19): Tạo Top 3 cho ngày N+1
        test_date_n_plus_1 = "2026-10-19"
        res_n_plus_1 = scan_patterns_service(
            days="60",
            min_occurrences=10,
            min_confidence=0.40,
            min_streak=0,
            exact_streak=4,
            target_type="loto_2digit",
            anchor_date=test_date_n_plus_1,
            force_refresh=True
        )
        self.assertEqual(res_n_plus_1.get("status"), "SUCCESS", "Tạo Top 3 ngày N+1 thất bại")
        patterns_n_plus_1 = res_n_plus_1.get("patterns", [])
        print(f"[TEST] Đã tạo thành công Top 3 cho ngày N+1 ({test_date_n_plus_1}) với {len(patterns_n_plus_1)} patterns.")

        # 3. Mở lại ngày N (2026-10-18) mà KHÔNG dùng force_refresh (mô phỏng người dùng xem lại lịch sử ngày cũ)
        res_n_reloaded = scan_patterns_service(
            days="60",
            min_occurrences=10,
            min_confidence=0.40,
            min_streak=0,
            exact_streak=4,
            target_type="loto_2digit",
            anchor_date=test_date_n,
            force_refresh=False  # Đọc snapshot
        )
        self.assertEqual(res_n_reloaded.get("status"), "SUCCESS")
        self.assertTrue(res_n_reloaded.get("isSnapshot"), "Kết quả tải lại phải là Snapshot đã lưu cố định")

        reloaded_patterns = res_n_reloaded.get("patterns", [])
        reloaded_streak4 = [p for p in reloaded_patterns if p.get("currentStreak") == 4]
        if not reloaded_streak4:
            reloaded_streak4 = reloaded_patterns
        top3_reloaded = reloaded_streak4[:3]

        top3_reloaded_data = []
        for p in top3_reloaded:
            top3_reloaded_data.append({
                "patternId": p.get("patternId"),
                "prediction": p.get("nextPrediction"),
                "pos_a": p.get("sources", [{}])[0].get("globalIndex"),
                "pos_b": p.get("sources", [{}, {}])[1].get("globalIndex"),
                "operation": p.get("operation")
            })

        print(f"\n[TEST] Top 3 ngày N ({test_date_n}) khi xem lại sau khi đã sang ngày N+1:")
        for idx, item in enumerate(top3_reloaded_data):
            print(f"  Top #{idx+1}: Cặp [{', '.join(item['prediction'])}] (ID: {item['patternId']})")

        # 4. SO SÁNH KHẲNG ĐỊNH TÍNH BẤT BIẾN (IMMUTABILITY ASSERTION)
        self.assertEqual(
            len(top3_initial_data),
            len(top3_reloaded_data),
            "Số lượng pattern trong Top 3 bị lệch sau khi sang ngày mới!"
        )

        for i in range(len(top3_initial_data)):
            orig = top3_initial_data[i]
            reloaded = top3_reloaded_data[i]

            # Kiểm tra Top 1, Top 2, Top 3 giữ nguyên con số
            self.assertEqual(
                orig["prediction"],
                reloaded["prediction"],
                f"LỖI: Cặp số dự đoán của Top #{i+1} ngày {test_date_n} bị thay đổi! Ban đầu: {orig['prediction']} -> Xem lại: {reloaded['prediction']}"
            )
            # Kiểm tra ID pattern giữ nguyên
            self.assertEqual(
                orig["patternId"],
                reloaded["patternId"],
                f"LỖI: Mã Pattern ID của Top #{i+1} bị thay đổi! Ban đầu: {orig['patternId']} -> Xem lại: {reloaded['patternId']}"
            )
            # Kiểm tra tọa độ cầu giữ nguyên
            self.assertEqual(orig["pos_a"], reloaded["pos_a"], f"LỖI: Vị trí pos_a của Top #{i+1} bị thay đổi!")
            self.assertEqual(orig["pos_b"], reloaded["pos_b"], f"LỖI: Vị trí pos_b của Top #{i+1} bị thay đổi!")

        print("\n===> TEST PASSED: Top 3 của ngày cũ hoàn toàn BẤT BIẾN sau khi sang ngày mới! <===\n")


if __name__ == '__main__':
    unittest.main()
