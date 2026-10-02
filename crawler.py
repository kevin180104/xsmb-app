import time
import re
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import config

def parse_xsmb_html(html_content, date_str_ddmmyyyy):
    """
    Phân tích cú pháp HTML từ trang kết quả XSMB của xskt.com.vn
    """
    soup = BeautifulSoup(html_content, "html.parser")
    table = soup.find("table", id="MB0")
    if not table:
        return None

    # Lấy tiêu đề ngày tháng (ví dụ: KẾT QUẢ XỔ SỐ MIỀN BẮC NGÀY 20/09/2026)
    title_el = soup.find("h1") or soup.find("h2")
    header_text = title_el.text.strip() if title_el else ""

    prizes = {
        "special_prize": "",
        "prize_1": [],
        "prize_2": [],
        "prize_3": [],
        "prize_4": [],
        "prize_5": [],
        "prize_6": [],
        "prize_7": [],
        "special_code": ""
    }

    key_map = {
        "ĐB": "special_prize",
        "DB": "special_prize",
        "G1": "prize_1",
        "G2": "prize_2",
        "G3": "prize_3",
        "G4": "prize_4",
        "G5": "prize_5",
        "G6": "prize_6",
        "G7": "prize_7"
    }

    day_of_week = ""
    # Thử lấy thứ trong tuần từ hàng đầu tiên
    first_tr = table.find("tr")
    if first_tr:
        header_td = first_tr.find("th") or first_tr.find("td")
        if header_td:
            first_text = header_td.text.strip()
            # Ví dụ: XSMB> XSMB Chủ Nhật (Thái Bình)
            match_dow = re.search(r"(Thứ\s+[ThứHaiBaTưNămSáuBảy\d]+|Chủ\s+Nhật)", first_text, re.IGNORECASE)
            if match_dow:
                day_of_week = match_dow.group(1)

    for tr in table.find_all("tr"):
        tds = tr.find_all("td")
        if len(tds) >= 2:
            prize_label = tds[0].text.strip()
            if prize_label in key_map:
                key = key_map[prize_label]
                raw_text = " ".join(tds[1].stripped_strings)
                nums = re.findall(r"\b\d+\b", raw_text)
                if key == "special_prize":
                    prizes[key] = nums[0] if nums else ""
                else:
                    prizes[key] = nums
        
        # Lấy Mã ĐB nếu có
        full_row_text = tr.text.strip()
        if "Mã ĐB:" in full_row_text:
            match_code = re.search(r"Mã ĐB:\s*(.*)", full_row_text)
            if match_code:
                prizes["special_code"] = match_code.group(1).strip()

    # Tách 27 số lô tô 2 chữ số (lấy 2 số cuối của mỗi giải)
    loto_2digit = []
    if prizes["special_prize"]:
        loto_2digit.append(prizes["special_prize"][-2:])
    for p_key in ["prize_1", "prize_2", "prize_3", "prize_4", "prize_5", "prize_6", "prize_7"]:
        for num in prizes[p_key]:
            if len(num) >= 2:
                loto_2digit.append(num[-2:])

    # Chuyển đổi định dạng ngày DD-MM-YYYY sang YYYY-MM-DD
    dt_obj = datetime.strptime(date_str_ddmmyyyy, "%d-%m-%Y")
    draw_date = dt_obj.strftime("%Y-%m-%d")
    date_display = dt_obj.strftime("%d/%m/%Y")

    if not day_of_week:
        days_vn = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]
        day_of_week = days_vn[dt_obj.weekday()]

    return {
        "draw_date": draw_date,
        "date_display": date_display,
        "day_of_week": day_of_week,
        "special_prize": prizes["special_prize"],
        "prize_1": prizes["prize_1"],
        "prize_2": prizes["prize_2"],
        "prize_3": prizes["prize_3"],
        "prize_4": prizes["prize_4"],
        "prize_5": prizes["prize_5"],
        "prize_6": prizes["prize_6"],
        "prize_7": prizes["prize_7"],
        "special_code": prizes["special_code"],
        "loto_2digit": loto_2digit,
        "total_numbers": len(loto_2digit),
        "raw_header": header_text
    }

def fetch_xsmb_by_date(date_obj, max_retries=3):
    """
    Cào dữ liệu XSMB theo ngày chỉ định (date_obj là đối tượng datetime/date)
    """
    date_str = date_obj.strftime("%d-%m-%Y")
    url = config.SOURCE_URL_TEMPLATE.format(date_str=date_str)
    
    for attempt in range(1, max_retries + 1):
        try:
            response = requests.get(url, headers=config.HTTP_HEADERS, timeout=10)
            if response.status_code == 200:
                result = parse_xsmb_html(response.text, date_str)
                if result:
                    return result
            elif response.status_code == 404:
                # Chưa có kết quả hoặc ngày không mở thưởng
                return None
        except Exception as e:
            if attempt == max_retries:
                print(f"Lỗi khi cào dữ liệu ngày {date_str}: {e}")
            time.sleep(1)
    return None

def fetch_xsmb_range(days=60, delay=0.3):
    """
    Cào dữ liệu XSMB cho khoảng N ngày gần nhất tính từ ngày hôm nay trở về trước
    """
    results = []
    today = datetime.now()
    print(f"Bắt đầu cào dữ liệu XSMB cho {days} ngày gần nhất...")

    for i in range(days):
        target_date = today - timedelta(days=i)
        date_str = target_date.strftime("%d/%m/%Y")
        data = fetch_xsmb_by_date(target_date)
        if data:
            results.append(data)
            print(f"  [✓] {date_str}: Giải ĐB = {data['special_prize']} | Lô tô: {len(data['loto_2digit'])} số")
        else:
            print(f"  [✗] {date_str}: Không có dữ liệu quay thưởng")
        time.sleep(delay)

    print(f"Đã cào xong {len(results)}/{days} ngày có dữ liệu.")
    return results

def update_missing_results():
    """
    Tự động quét các ngày còn thiếu từ kỳ quay mới nhất trong DB đến hôm nay,
    cào bù dữ liệu và lưu vào cơ sở dữ liệu SQLite & JSON.
    """
    import database
    database.init_db()

    today = datetime.now().date()
    existing_records = database.get_recent_results(limit=60)
    existing_dates = set(r["draw_date"] for r in existing_records)

    if existing_records:
        latest_date_str = existing_records[0]["draw_date"]
        latest_dt = datetime.strptime(latest_date_str, "%Y-%m-%d").date()
        days_gap = max((today - latest_dt).days, 0)
        check_days = max(days_gap + 1, 7)
    else:
        check_days = config.DEFAULT_CRAWL_DAYS

    # Danh sách ngày cần kiểm tra từ cũ đến mới (tránh sót ngày)
    dates_to_check = []
    for i in range(check_days, -1, -1):
        target_date = today - timedelta(days=i)
        target_str = target_date.strftime("%Y-%m-%d")
        if target_str not in existing_dates:
            dates_to_check.append(target_date)

    updated_items = []
    for target_date in dates_to_check:
        res = fetch_xsmb_by_date(target_date)
        if res:
            database.upsert_result(res)
            updated_items.append(res)
            existing_dates.add(res["draw_date"])
            try:
                print(f"  [+] Cap nhat thanh cong ngay {res['date_display']}: Giai DB = {res['special_prize']}")
            except Exception:
                pass
            time.sleep(0.2)

    if updated_items:
        database.export_to_json()

    return updated_items

