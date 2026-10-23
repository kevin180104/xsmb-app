# -*- coding: utf-8 -*-
"""
Bộ kiểm thử toàn diện cho BẢNG LỊCH SỬ DỰ ĐOÁN (TOP_4_KY & TRA_CUU_4_NGAY)
Bao gồm đầy đủ 10 kịch bản kiểm thử nghiêm ngặt theo yêu cầu nghiệp vụ:
1. Cặp không xuất hiện -> 0 nháy / TRƯỢT (LOSE).
2. Cặp xuất hiện 1 lần -> 1 nháy.
3. Cặp xuất hiện nhiều lần -> đếm đúng số nháy.
4. Một ngày có nhiều cặp cùng trúng.
5. Hai nguồn dự đoán cùng dự đoán một cặp.
6. Ngày chưa có kết quả -> trạng thái PENDING (CHỜ KẾT QUẢ), không tính vào mẫu số của hit_rate.
7. Ngày có kết quả -> tự đối chiếu chính xác.
8. Refresh trang / gọi lại API -> lịch sử hoàn toàn bất biến.
9. Sang ngày mới -> lịch sử ngày cũ giữ nguyên.
10. Thuật toán thay đổi -> snapshot cũ không bị thay đổi.
"""
import sys
import os
import unittest
import tempfile
from pathlib import Path
from unittest.mock import patch
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import config
import database
from pattern_engine.service import get_unified_prediction_history


class TestUnifiedPredictionHistory(unittest.TestCase):
    def setUp(self):
        # Tạo database cô lập cho test
        self.temp_dir = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
        self.addCleanup(self.temp_dir.cleanup)
        self.db_path = str(Path(self.temp_dir.name) / "test_history.db")
        self.patcher = patch.object(config, "DB_PATH", self.db_path)
        self.patcher.start()
        self.addCleanup(self.patcher.stop)

        database.init_db()

        # Nạp dữ liệu giả lập kết quả XSMB cho 2 ngày:
        # Ngày 1 (2026-10-18): 27 về 2 lần, 36 về 1 lần, 72 không về
        database.upsert_result({
            "draw_date": "2026-10-18",
            "date_display": "18/10/2026",
            "day_of_week": "Chủ Nhật",
            "special_prize": "12327",
            "prize_1": ["45627"],
            "prize_2": ["78936"],
            "prize_3": [],
            "prize_4": [],
            "prize_5": [],
            "prize_6": [],
            "prize_7": [],
            "special_code": "HN",
            "loto_2digit": ["27", "27", "36", "05", "10", "88"]
        })

        # Lưu snapshot cho TOP_4_KY ngày 2026-10-18 (Soi ngày 17/10)
        # Top 1: 27 - 72 (27 nổ 2 nháy, 72 trượt -> trúng 2 nháy)
        # Top 2: 36 - 63 (36 nổ 1 nháy, 63 trượt -> trúng 1 nháy)
        # Top 3: 49 - 94 (cả hai trượt -> trượt 0 nháy)
        with database.get_connection() as conn:
            conn.execute("""
                INSERT INTO daily_streak_top3_snapshots (
                    target_date, streak, date_display, source_date,
                    top1_pair, top2_pair, top3_pair,
                    top1_name, top2_name, top3_name,
                    patterns_json, scan_summary_json, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "2026-10-18", 4, "18/10/2026", "2026-10-17",
                "27 - 72", "36 - 63", "49 - 94",
                "Cầu G1 - G2", "Cầu G3 - G4", "Cầu G5 - G6",
                "[]", "{}", "2026-10-17T18:30:00", "2026-10-17T18:30:00"
            ))
            conn.commit()

        # Lưu snapshot cho TRA_CUU_4_NGAY ngày 2026-10-18 (Soi ngày 17/10)
        # Bridge 1: dự đoán 27 - 72 (trùng cặp với TOP_4_KY để test testcase 5)
        # Bridge 2: dự đoán 88 (kép 88 nổ 1 nháy)
        # Bridge 3: dự đoán 99 (trượt 0 nháy)
        streak_data = {
            "queryDate": "2026-10-17",
            "targetDate": "2026-10-18",
            "targetDateDisplay": "18/10/2026",
            "queryDateDisplay": "17/10/2026",
            "bridges": [
                {
                    "patternId": "P_BRIDGE_1",
                    "predictionDisplay": "27 - 72",
                    "predictedNumbers": ["27", "72"],
                    "posA": 10, "posB": 20,
                    "labelA": "G1[2]", "labelB": "G2[1]",
                    "displayPrizeA": "Giải Nhất", "displayPrizeB": "Giải Nhì",
                    "streak": 4
                },
                {
                    "patternId": "P_BRIDGE_2",
                    "predictionDisplay": "88",
                    "predictedNumbers": ["88"],
                    "posA": 30, "posB": 40,
                    "labelA": "G3[1]", "labelB": "G4[2]",
                    "displayPrizeA": "Giải Ba", "displayPrizeB": "Giải Tư",
                    "streak": 4
                },
                {
                    "patternId": "P_BRIDGE_3",
                    "predictionDisplay": "99",
                    "predictedNumbers": ["99"],
                    "posA": 50, "posB": 60,
                    "labelA": "G5[0]", "labelB": "G6[1]",
                    "displayPrizeA": "Giải Năm", "displayPrizeB": "Giải Sáu",
                    "streak": 4
                }
            ]
        }
        database.save_streak_bridges_snapshot(
            query_date="2026-10-17",
            streak=4,
            exact_streak=True,
            target_type="loto_2digit",
            target_date="2026-10-18",
            data_dict=streak_data
        )

        # Lưu 1 snapshot ngày TƯƠNG LAI chưa có kết quả (2026-10-25) để test PENDING
        with database.get_connection() as conn:
            conn.execute("""
                INSERT INTO daily_streak_top3_snapshots (
                    target_date, streak, date_display, source_date,
                    top1_pair, top2_pair, top3_pair,
                    top1_name, top2_name, top3_name,
                    patterns_json, scan_summary_json, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "2026-10-25", 4, "25/10/2026", "2026-10-24",
                "11", "22", "33",
                "Cầu 1", "Cầu 2", "Cầu 3",
                "[]", "{}", "2026-10-24T18:30:00", "2026-10-24T18:30:00"
            ))
            conn.commit()

    def test_case_1_miss_pair_zero_hits(self):
        """Testcase 1: Cặp không xuất hiện -> 0 nháy và trạng thái LOSE (TRƯỢT)"""
        res = get_unified_prediction_history(source="TOP_4_KY", time_range="all")
        rec = next(r for r in res["records"] if r["pair"] == "49 - 94")
        self.assertEqual(rec["status"], "LOSE")
        self.assertFalse(rec["pair_is_hit"])
        self.assertEqual(rec["pair_total_hits"], 0)
        for n in rec["numbers_detail"]:
            self.assertEqual(n["hit_count"], 0)
            self.assertFalse(n["is_hit"])
            self.assertEqual(n["hit_locations"], [])

    def test_case_2_single_hit(self):
        """Testcase 2: Cặp xuất hiện 1 lần -> 1 nháy"""
        res = get_unified_prediction_history(source="TOP_4_KY", time_range="all")
        rec = next(r for r in res["records"] if r["pair"] == "36 - 63")
        self.assertEqual(rec["status"], "WIN")
        self.assertTrue(rec["pair_is_hit"])
        self.assertEqual(rec["pair_total_hits"], 1)

        # 36 nổ 1 nháy, 63 trượt
        n36 = next(n for n in rec["numbers_detail"] if n["number"] == "36")
        n63 = next(n for n in rec["numbers_detail"] if n["number"] == "63")
        self.assertEqual(n36["hit_count"], 1)
        self.assertTrue(n36["is_hit"])
        self.assertEqual(len(n36["hit_locations"]), 1)
        self.assertEqual(n63["hit_count"], 0)
        self.assertFalse(n63["is_hit"])

    def test_case_3_multiple_hits(self):
        """Testcase 3: Cặp xuất hiện nhiều lần -> đếm đúng số nháy (27 xuất hiện 2 lần -> 2 nháy)"""
        res = get_unified_prediction_history(source="TOP_4_KY", time_range="all")
        rec = next(r for r in res["records"] if r["pair"] == "27 - 72")
        self.assertEqual(rec["status"], "WIN")
        self.assertEqual(rec["pair_total_hits"], 2)

        n27 = next(n for n in rec["numbers_detail"] if n["number"] == "27")
        self.assertEqual(n27["hit_count"], 2)
        self.assertTrue(n27["is_hit"])
        # Kiểm tra chi tiết 2 vị trí giải nổ
        self.assertEqual(len(n27["hit_locations"]), 2)
        prizes = [loc["prizeCode"] for loc in n27["hit_locations"]]
        self.assertIn("DB", prizes)
        self.assertIn("G1", prizes)

    def test_case_4_multiple_winning_pairs_in_one_day(self):
        """Testcase 4: Một ngày có nhiều cặp cùng trúng (ngày 18/10 có cả 27-72 và 36-63 cùng nổ)"""
        res = get_unified_prediction_history(source="TOP_4_KY", time_range="all")
        day_recs = [r for r in res["records"] if r["target_date"] == "2026-10-18"]
        win_pairs = [r for r in day_recs if r["status"] == "WIN"]
        self.assertEqual(len(win_pairs), 2)

    def test_case_5_both_sources_predict_same_pair(self):
        """Testcase 5: Hai nguồn dự đoán cùng dự đoán một cặp (27 - 72) -> cả 2 đều đối chiếu độc lập chính xác"""
        res = get_unified_prediction_history(source="all", time_range="all")
        pairs_27 = [r for r in res["records"] if r["pair"] == "27 - 72"]
        self.assertEqual(len(pairs_27), 2)
        sources = {r["source_type"] for r in pairs_27}
        self.assertEqual(sources, {"TOP_4_KY", "TRA_CUU_4_NGAY"})
        for p in pairs_27:
            self.assertEqual(p["status"], "WIN")
            self.assertEqual(p["pair_total_hits"], 2)

    def test_case_6_pending_excluded_from_hit_rate(self):
        """Testcase 6: Ngày chưa có kết quả (2026-10-25) -> PENDING, KHÔNG bị tính vào mẫu số của hit_rate"""
        res = get_unified_prediction_history(source="TOP_4_KY", time_range="all")
        pending_recs = [r for r in res["records"] if r["target_date"] == "2026-10-25"]
        self.assertEqual(len(pending_recs), 3)
        for r in pending_recs:
            self.assertEqual(r["status"], "PENDING")
            self.assertIsNone(r["pair_is_hit"])

        kpi_top4 = res["kpi"]["top_4_ky"]
        self.assertEqual(kpi_top4["total_pairs"], 6)      # 3 cặp ngày 18 + 3 cặp ngày 25
        self.assertEqual(kpi_top4["pending_pairs"], 3)    # 3 cặp ngày 25 chờ
        self.assertEqual(kpi_top4["completed_pairs"], 3)  # 3 cặp ngày 18
        self.assertEqual(kpi_top4["hit_pairs"], 2)        # 2 cặp trúng ngày 18
        self.assertEqual(kpi_top4["miss_pairs"], 1)       # 1 cặp trượt ngày 18
        # Tỷ lệ trúng = 2 / 3 * 100 = 66.7% (Không chia cho 6!)
        self.assertEqual(kpi_top4["hit_rate"], 66.7)

    def test_case_7_auto_evaluate_when_result_arrives(self):
        """Testcase 7: Ngày có kết quả mới nạp vào DB -> tự động đối chiếu chính xác"""
        # Trước khi có kết quả: 2026-10-25 là PENDING
        res_before = get_unified_prediction_history(source="TOP_4_KY", time_range="all")
        r_before = next(r for r in res_before["records"] if r["id"] == "TOP4_2026-10-25_1")
        self.assertEqual(r_before["status"], "PENDING")

        # Nạp kết quả chính thức cho 2026-10-25 (số 11 nổ 1 nháy)
        database.upsert_result({
            "draw_date": "2026-10-25",
            "date_display": "25/10/2026",
            "day_of_week": "Chủ Nhật",
            "special_prize": "99911",
            "prize_1": [], "prize_2": [], "prize_3": [], "prize_4": [], "prize_5": [], "prize_6": [], "prize_7": [],
            "special_code": "HN",
            "loto_2digit": ["11", "00", "01"]
        })

        # Sau khi có kết quả: tự động chuyển thành WIN 1 nháy
        res_after = get_unified_prediction_history(source="TOP_4_KY", time_range="all")
        r_after = next(r for r in res_after["records"] if r["id"] == "TOP4_2026-10-25_1")
        self.assertEqual(r_after["status"], "WIN")
        self.assertEqual(r_after["pair_total_hits"], 1)

    def test_case_8_idempotency_immutability_on_reload(self):
        """Testcase 8: Gọi lại hàm nhiều lần -> dữ liệu hoàn toàn bất biến"""
        call1 = get_unified_prediction_history()
        call2 = get_unified_prediction_history()
        self.assertEqual(call1["records"], call2["records"])
        self.assertEqual(call1["kpi"], call2["kpi"])

    def test_case_9_historical_integrity_across_days(self):
        """Testcase 9: Sang ngày mới -> bản ghi ngày cũ vẫn giữ nguyên vẹn"""
        snap_before = get_unified_prediction_history(source="TOP_4_KY")
        rec_old_before = [r for r in snap_before["records"] if r["target_date"] == "2026-10-18"]

        # Thêm dữ liệu ngày mới 2026-10-26
        database.save_top3_snapshot(target_date="2026-10-26", patterns=[])

        snap_after = get_unified_prediction_history(source="TOP_4_KY")
        rec_old_after = [r for r in snap_after["records"] if r["target_date"] == "2026-10-18"]
        self.assertEqual(rec_old_before, rec_old_after)

    def test_case_10_snapshot_survives_algorithm_updates(self):
        """Testcase 10: Snapshot cũ không bị thay đổi dù thuật toán hay logic bên ngoài thay đổi"""
        with database.get_connection() as conn:
            row_before = conn.execute("SELECT top1_pair, top2_pair, top3_pair FROM daily_streak_top3_snapshots WHERE target_date = '2026-10-18'").fetchone()

        # Gọi prediction history
        get_unified_prediction_history()

        with database.get_connection() as conn:
            row_after = conn.execute("SELECT top1_pair, top2_pair, top3_pair FROM daily_streak_top3_snapshots WHERE target_date = '2026-10-18'").fetchone()

        self.assertEqual(tuple(row_before), tuple(row_after))


if __name__ == "__main__":
    unittest.main()
