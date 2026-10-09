import sys
import time
from datetime import datetime, timedelta
import crawler
import database

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Lấy ngày cũ nhất hiện có trong DB
draws = database.get_recent_results(limit='all')
if not draws:
    print("Database rỗng!")
    sys.exit(1)

oldest_date_str = draws[-1]["draw_date"]
oldest_dt = datetime.strptime(oldest_date_str, "%Y-%m-%d").date()
print(f"Ngày cũ nhất hiện tại trong DB: {oldest_date_str} (Tổng hiện có: {len(draws)} kỳ)")

# Cào lùi về trước 60 ngày nữa
target_days = 60
print(f"Bắt đầu cào thêm {target_days} ngày lịch sử trước ngày {oldest_date_str}...")

saved_count = 0
for i in range(1, target_days + 1):
    crawl_date = oldest_dt - timedelta(days=i)
    date_display = crawl_date.strftime("%d/%m/%Y")
    try:
        data = crawler.fetch_xsmb_by_date(crawl_date)
        if data:
            database.upsert_result(data)
            saved_count += 1
            if saved_count % 10 == 0:
                print(f"  [+] Đã cào & lưu {saved_count} ngày (Đến ngày {date_display})...")
        else:
            print(f"  [-] Ngày {date_display} không có dữ liệu mở thưởng.")
    except Exception as e:
        print(f"  [!] Lỗi cào ngày {date_display}: {e}")
    time.sleep(0.15)

# Cập nhật lại file xsmb_results.json để đồng bộ nếu cần
all_draws = database.get_recent_results(limit='all')
print(f"\n=> HOÀN TẤT! Đã cào thêm {saved_count} ngày. Tổng số kỳ trong DB hiện tại: {len(all_draws)} kỳ.")
print(f"Dữ liệu trải dài từ: {all_draws[-1]['draw_date']} đến {all_draws[0]['draw_date']}")
