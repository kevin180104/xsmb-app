import os
from pathlib import Path

# Thư mục gốc dự án
BASE_DIR = Path(__file__).resolve().parent

# Đường dẫn cơ sở dữ liệu và file xuất JSON
DB_PATH = os.path.join(BASE_DIR, "xsmb.db")
JSON_PATH = os.path.join(BASE_DIR, "xsmb_results.json")

# Nguồn dữ liệu cào
SOURCE_URL_TEMPLATE = "https://xskt.com.vn/xsmb/ngay-{date_str}"

# Cấu hình mặc định
DEFAULT_CRAWL_DAYS = 60

# Giờ tự động cập nhật hàng ngày (18h35 sau khi có kết quả quay thưởng 18h15 - 18h30)
SCHEDULE_HOUR = 18
SCHEDULE_MINUTE = 35

# User Agent giả lập trình duyệt
HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
}
