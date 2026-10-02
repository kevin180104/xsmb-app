import sys
import argparse
from datetime import datetime
import config
import database
import crawler
import scheduler
import analyzer

def main():
    sys.stdout.reconfigure(encoding='utf-8')

    parser = argparse.ArgumentParser(description="XSMB Crawler, Analyzer & Auto-Updater")
    parser.add_argument("--init", action="store_true", help="Cào dữ liệu XSMB các ngày gần nhất và lưu vào DB/JSON")
    parser.add_argument("--days", type=int, default=config.DEFAULT_CRAWL_DAYS, help="Số ngày cần cào (mặc định 60 ngày)")
    parser.add_argument("--schedule", action="store_true", help="Khởi chạy tiến trình tự động cập nhật kết quả mỗi ngày lúc 18h35")
    parser.add_argument("--info", action="store_true", help="Hiển thị thống kê dữ liệu hiện có trong SQLite DB")
    parser.add_argument("--analyze", action="store_true", help="Chạy phân tích cầu XSMB ngắn hạn (15 Modules)")

    args = parser.parse_args()

    # Khởi tạo DB nếu chưa có
    database.init_db()

    # Nếu gọi --schedule
    if args.schedule:
        scheduler.start_scheduler()
        return

    # Nếu gọi --info
    if args.info:
        results = database.get_recent_results(limit=10)
        print("=" * 60)
        print(f"THÔNG TIN DỮ LIỆU XSMB TRONG CƠ SỞ DỮ LIỆU ({config.DB_PATH})")
        print(f"Tổng số bản ghi gần nhất: {len(results)}")
        if results:
            print(f"Ngày mới nhất: {results[0]['date_display']} (ĐB: {results[0]['special_prize']})")
            print(f"Ngày cũ nhất (trong 10 ngày gần đây): {results[-1]['date_display']} (ĐB: {results[-1]['special_prize']})")
        print("=" * 60)
        return

    # Nếu gọi --analyze
    if args.analyze:
        print("=" * 60)
        print(" HỆ THỐNG PHÂN TÍCH CẦU XSMB NGẮN HẠN (15 MODULES)")
        print("=" * 60)
        response_text = analyzer.quick_check_response()
        print(response_text)
        print("=" * 60)
        return

    # Mặc định hoặc nếu gọi --init: Cào dữ liệu N ngày gần nhất
    days_to_fetch = args.days if args.days > 0 else config.DEFAULT_CRAWL_DAYS
    print("=" * 60)
    print(f" KHỞI TẠO DỮ LIỆU XSMB ({days_to_fetch} NGÀY GẦN NHẤT)")
    print("=" * 60)

    # 1. Cào dữ liệu từ web
    data_list = crawler.fetch_xsmb_range(days=days_to_fetch)

    # 2. Lưu vào SQLite
    if data_list:
        print("\nĐang lưu dữ liệu vào cơ sở dữ liệu SQLite...")
        saved_count = database.upsert_batch(data_list)
        print(f"  [✓] Đã lưu/cập nhật thành công {saved_count} ngày vào {config.DB_PATH}")

        # 3. Đồng bộ ra file JSON
        print("\nĐang đồng bộ dữ liệu ra file JSON...")
        database.export_to_json()

        # 4. Hiển thị mẫu bản ghi mới nhất
        recent = database.get_recent_results(limit=1)
        if recent:
            item = recent[0]
            print("\n" + "=" * 60)
            print(f"MẪU DỮ LIỆU NGÀY MỚI NHẤT ({item['date_display']} - {item['day_of_week']}):")
            print(f"  - Giải Đặc Biệt: {item['special_prize']}")
            print(f"  - Giải Nhất: {item['prize_1']}")
            print(f"  - Giải Nhì: {item['prize_2']}")
            print(f"  - Giải Ba: {item['prize_3']}")
            print(f"  - Giải Tư: {item['prize_4']}")
            print(f"  - Giải Năm: {item['prize_5']}")
            print(f"  - Giải Sáu: {item['prize_6']}")
            print(f"  - Giải Bảy: {item['prize_7']}")
            print(f"  - Mã ĐB: {item['special_code']}")
            print(f"  - Danh sách 27 số lô tô: {item['loto_2digit']}")
            print("=" * 60)
    else:
        print("Không cào được dữ liệu nào. Vui lòng kiểm tra lại kết nối mạng.")

if __name__ == "__main__":
    main()
