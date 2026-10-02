from datetime import datetime
from apscheduler.schedulers.blocking import BlockingScheduler
import config
import crawler
import database

def run_daily_update():
    """
    Hàm được gọi bởi scheduler hàng ngày sau 18h30 để cào bù và cập nhật kết quả mới nhất
    """
    now = datetime.now()
    print(f"\n[{now.strftime('%Y-%m-%d %H:%M:%S')}] Đang tiến hành kiểm tra và cập nhật các kết quả XSMB còn thiếu...")

    updated = crawler.update_missing_results()
    if updated:
        dates_str = ", ".join([item["date_display"] for item in updated])
        print(f"  [+] Cap nhat thanh cong {len(updated)} ky quay: {dates_str}")
    else:
        print(f"  [!] Du lieu da o trang thai moi nhat (chua co ket qua moi hoac chua quay xong).")

def start_scheduler():
    """
    Khởi chạy tiến trình lập lịch chạy ngầm mỗi ngày lúc 18h35
    """
    scheduler = BlockingScheduler()
    scheduler.add_job(
        run_daily_update,
        trigger="cron",
        hour=config.SCHEDULE_HOUR,
        minute=config.SCHEDULE_MINUTE,
        name="Auto_Update_XSMB"
    )

    print("=" * 60)
    print(f" Lịch tự động cập nhật XSMB đã được khởi tạo thành công!")
    print(f" Thời gian chạy định kỳ: {config.SCHEDULE_HOUR:02d}:{config.SCHEDULE_MINUTE:02d} hàng ngày.")
    print(" Bấm Ctrl+C để dừng tiến trình.")
    print("=" * 60)

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("\nĐã dừng tiến trình lập lịch tự động.")

if __name__ == "__main__":
    start_scheduler()
