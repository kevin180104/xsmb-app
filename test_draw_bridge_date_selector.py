# -*- coding: utf-8 -*-
"""
Kiểm thử logic khung Chọn thời gian vẽ đường cầu:
1. Kiểm tra Kỳ mới nhất lấy đúng kỳ quay gần nhất có kết quả thực tế trong DB.
2. Kiểm tra tính độc lập của việc xem đường cầu theo các ngày khác nhau:
   Không làm thay đổi, không ghi đè và không kích hoạt tính lại Top 3 đã lưu.
"""
import sys
import os
import unittest
from datetime import datetime, timedelta

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import database
from pattern_engine.service import get_pattern_visualization_service, scan_patterns_service

class TestDrawBridgeDateSelector(unittest.TestCase):
    def setUp(self):
        database.init_db()

    def test_latest_available_draw_date(self):
        """Kỳ mới nhất phải là kỳ quay gần nhất thực sự có kết quả trong database"""
        recent = database.get_recent_results(limit=1)
        self.assertGreater(len(recent), 0, "Database phải có ít nhất 1 kết quả")
        latest_date = recent[0]["draw_date"]
        print(f"\n[TEST] Kỳ quay gần nhất có kết quả thực tế trong DB: {latest_date}")
        self.assertEqual(latest_date, "2026-10-18")

    def test_viewing_draw_bridge_dates_does_not_mutate_top3_snapshots(self):
        """
        Việc chuyển qua lại các mốc ngày trong tab Vẽ đường cầu
        tuyệt đối không được làm thay đổi Top 3 snapshot đã lưu.
        """
        target_date = "2026-10-18"
        
        # 1. Đảm bảo đã có snapshot cho ngày 18/10
        scan_res = scan_patterns_service(anchor_date=target_date, force_refresh=False)
        self.assertEqual(scan_res.get("status"), "SUCCESS")
        orig_snapshot = database.get_top3_snapshot(target_date)
        self.assertIsNotNone(orig_snapshot, "Phải có snapshot của ngày 18/10")
        orig_top1 = orig_snapshot["top1_pair"]
        orig_top2 = orig_snapshot["top2_pair"]
        orig_top3 = orig_snapshot["top3_pair"]
        orig_updated_at = orig_snapshot["updated_at"]

        print(f"[TEST] Top 3 snapshot ngày {target_date} trước khi đổi ngày vẽ cầu: Top 1={orig_top1}, Top 2={orig_top2}, Top 3={orig_top3}")

        # 2. Người dùng xem đường cầu của các ngày khác nhau (Kỳ mới nhất 18/10, Hôm nay 19/10, Ngày mai 20/10, Quá khứ 15/10)
        test_dates_to_view = ["2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20"]
        for dt in test_dates_to_view:
            vis_payload = get_pattern_visualization_service(
                pos_a=27,
                pos_b=60,
                operation_str="BONG_PAIR",
                anchor_date=dt
            )
            self.assertEqual(vis_payload.get("status"), "SUCCESS", f"Lỗi xem đường cầu tại mốc {dt}")

        # 3. Kiểm tra lại Snapshot ngày 18/10 trong cơ sở dữ liệu: Phải giữ nguyên 100%
        after_snapshot = database.get_top3_snapshot(target_date)
        self.assertEqual(after_snapshot["top1_pair"], orig_top1, "Top 1 bị thay đổi!")
        self.assertEqual(after_snapshot["top2_pair"], orig_top2, "Top 2 bị thay đổi!")
        self.assertEqual(after_snapshot["top3_pair"], orig_top3, "Top 3 bị thay đổi!")
        self.assertEqual(after_snapshot["updated_at"], orig_updated_at, "Snapshot bị ghi đè updated_at!")

        print(f"[TEST] Top 3 snapshot ngày {target_date} sau khi đổi qua 6 mốc ngày: Top 1={after_snapshot['top1_pair']}, Top 2={after_snapshot['top2_pair']}, Top 3={after_snapshot['top3_pair']}")
        print("===> TEST PASSED: Việc chuyển mốc ngày vẽ đường cầu hoàn toàn độc lập và không ảnh hưởng đến Top 3! <===\n")

if __name__ == '__main__':
    unittest.main()
