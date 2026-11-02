import os
from pathlib import Path

# Thư mục gốc dự án
BASE_DIR = Path(__file__).resolve().parent

# Railway supplies its persistent mount path automatically. Local runs keep the
# existing location; operators can explicitly override the data directory.
DATA_DIR = Path(os.environ.get("XSMB_DATA_DIR") or
                os.environ.get("RAILWAY_VOLUME_MOUNT_PATH") or BASE_DIR)
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "xsmb.db")
JSON_PATH = os.path.join(DATA_DIR, "xsmb_results.json")

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
