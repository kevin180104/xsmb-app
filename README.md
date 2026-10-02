# XSMB Data Crawler & Auto-Updater (Step 1)

Ứng dụng tự động cào và lưu trữ dữ liệu kết quả Xổ Số Miền Bắc (XSMB) tối thiểu 60 ngày gần nhất, phục vụ dự án thống kê và soi cầu xổ số.

## 🚀 Tính năng

- **Cào dữ liệu tự động**: Lấy thông tin 8 hạng giải (Đặc biệt đến Giải 7) cho N ngày gần nhất.
- **Tự động tách lô tô**: Tách sẵn mảng 27 cặp số lô tô (2 số cuối) mỗi ngày.
- **Lưu trữ kép**:
  - **SQLite** (`xsmb.db`): Quản lý CSDL quan hệ dễ truy vấn.
  - **JSON** (`xsmb_results.json`): Xuất định dạng JSON tiện kết nối Frontend/API.
- **Cập nhật tự động**: Đặt lịch chạy ngầm bằng `APScheduler` tự động lấy kết quả lúc 18h35 hàng ngày.

---

## 🛠️ Cài đặt & Hướng dẫn sử dụng

### 1. Cài đặt các thư viện phụ thuộc

```bash
pip install -r requirements.txt
```

### 2. Tải dữ liệu 60 ngày gần nhất về máy

Chạy lệnh sau để tiến hành cào dữ liệu 60 ngày gần nhất và lưu vào SQLite + JSON:

```bash
python main.py --init --days 60
```

*Bạn có thể thay đổi số ngày bằng tùy chọn `--days` (ví dụ: `--days 90`).*

### 3. Xem thông tin dữ liệu đã lưu

Kiểm tra số lượng bản ghi trong CSDL:

```bash
python main.py --info
```

### 4. Bật chế độ tự động cập nhật mỗi ngày (sau 18h30)

Khởi chạy daemon đặt lịch tự động cập nhật lúc 18h35 hàng ngày:

```bash
python main.py --schedule
# Hoặc: python scheduler.py
```

---

## 📁 Cấu trúc thư mục

```
LT/
├── config.py           # Cấu hình đường dẫn, URL và thời gian chạy lịch
├── crawler.py          # Module cào và parse HTML dữ liệu XSMB
├── database.py         # Quản lý cơ sở dữ liệu SQLite và xuất file JSON
├── scheduler.py        # Đặt lịch tự động cập nhật ngầm hàng ngày
├── main.py             # Script điều khiển chính (CLI)
├── requirements.txt    # Danh sách thư viện Python cần thiết
├── xsmb.db             # File cơ sở dữ liệu SQLite (sinh ra khi chạy)
└── xsmb_results.json   # File xuất JSON (sinh ra khi chạy)
```
