import sqlite3
import json
from datetime import datetime, timedelta
import config

def get_connection():
    """Tạo kết nối tới file SQLite với chế độ WAL và cấu hình hiệu năng cao"""
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn

def init_db():
    """Khởi tạo các bảng xsmb_results và pattern_memory cùng chỉ mục nếu chưa tồn tại"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS xsmb_results (
                draw_date TEXT PRIMARY KEY,
                date_display TEXT NOT NULL,
                day_of_week TEXT,
                special_prize TEXT,
                prize_1 TEXT,
                prize_2 TEXT,
                prize_3 TEXT,
                prize_4 TEXT,
                prize_5 TEXT,
                prize_6 TEXT,
                prize_7 TEXT,
                special_code TEXT,
                loto_2digit TEXT,
                updated_at TEXT
            )
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_draw_date ON xsmb_results(draw_date DESC);
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pattern_memory (
                pattern_id TEXT PRIMARY KEY,
                pair TEXT NOT NULL,
                pattern_type TEXT NOT NULL,
                sequence_json TEXT,
                observations INTEGER DEFAULT 0,
                repeat_count INTEGER DEFAULT 0,
                success_count INTEGER DEFAULT 0,
                broken_count INTEGER DEFAULT 0,
                status TEXT NOT NULL,
                score INTEGER DEFAULT 0,
                next_expected TEXT,
                updated_at TEXT
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_bridge_wins (
                draw_date TEXT PRIMARY KEY,
                date_display TEXT NOT NULL,
                win_count INTEGER DEFAULT 0,
                total_bridges INTEGER DEFAULT 0,
                win_rate REAL DEFAULT 0.0,
                de_hits INTEGER DEFAULT 0,
                total_hits INTEGER DEFAULT 0,
                winning_bridges_json TEXT,
                updated_at TEXT
            )
        """)
        conn.commit()

def upsert_result(result_dict, conn=None):
    """Thêm mới hoặc cập nhật một bản ghi kết quả XSMB (hỗ trợ tái sử dụng transaction conn)"""
    if not result_dict:
        return False

    now_iso = datetime.now().isoformat()
    sql = """
        INSERT INTO xsmb_results (
            draw_date, date_display, day_of_week, special_prize,
            prize_1, prize_2, prize_3, prize_4, prize_5, prize_6, prize_7,
            special_code, loto_2digit, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(draw_date) DO UPDATE SET
            date_display=excluded.date_display,
            day_of_week=excluded.day_of_week,
            special_prize=excluded.special_prize,
            prize_1=excluded.prize_1,
            prize_2=excluded.prize_2,
            prize_3=excluded.prize_3,
            prize_4=excluded.prize_4,
            prize_5=excluded.prize_5,
            prize_6=excluded.prize_6,
            prize_7=excluded.prize_7,
            special_code=excluded.special_code,
            loto_2digit=excluded.loto_2digit,
            updated_at=excluded.updated_at
    """
    params = (
        result_dict["draw_date"],
        result_dict["date_display"],
        result_dict.get("day_of_week", ""),
        result_dict.get("special_prize", ""),
        json.dumps(result_dict.get("prize_1", []), ensure_ascii=False),
        json.dumps(result_dict.get("prize_2", []), ensure_ascii=False),
        json.dumps(result_dict.get("prize_3", []), ensure_ascii=False),
        json.dumps(result_dict.get("prize_4", []), ensure_ascii=False),
        json.dumps(result_dict.get("prize_5", []), ensure_ascii=False),
        json.dumps(result_dict.get("prize_6", []), ensure_ascii=False),
        json.dumps(result_dict.get("prize_7", []), ensure_ascii=False),
        result_dict.get("special_code", ""),
        json.dumps(result_dict.get("loto_2digit", []), ensure_ascii=False),
        now_iso
    )

    if conn is not None:
        conn.execute(sql, params)
        return True

    with get_connection() as local_conn:
        local_conn.execute(sql, params)
        local_conn.commit()
    return True

def upsert_batch(results_list):
    """Lưu danh sách nhiều bản ghi vào SQLite trong 1 giao dịch duy nhất (tăng tốc độ 20x)"""
    if not results_list:
        return 0
    count = 0
    with get_connection() as conn:
        for item in results_list:
            if upsert_result(item, conn=conn):
                count += 1
        conn.commit()
    return count

def _row_to_result_dict(r):
    """Chuyển đổi một hàng SQLite sang dict chuẩn kết quả XSMB"""
    if not r:
        return None
    return {
        "draw_date": r["draw_date"],
        "date_display": r["date_display"],
        "day_of_week": r["day_of_week"],
        "special_prize": r["special_prize"],
        "prize_1": json.loads(r["prize_1"]) if r["prize_1"] else [],
        "prize_2": json.loads(r["prize_2"]) if r["prize_2"] else [],
        "prize_3": json.loads(r["prize_3"]) if r["prize_3"] else [],
        "prize_4": json.loads(r["prize_4"]) if r["prize_4"] else [],
        "prize_5": json.loads(r["prize_5"]) if r["prize_5"] else [],
        "prize_6": json.loads(r["prize_6"]) if r["prize_6"] else [],
        "prize_7": json.loads(r["prize_7"]) if r["prize_7"] else [],
        "special_code": r["special_code"],
        "loto_2digit": json.loads(r["loto_2digit"]) if r["loto_2digit"] else [],
        "updated_at": r["updated_at"]
    }

def get_recent_results(limit=60):
    """Lấy danh sách kết quả XSMB gần nhất từ SQLite"""
    limit_val = -1 if (limit == 'all' or limit is None) else int(limit)
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM xsmb_results 
            ORDER BY draw_date DESC 
            LIMIT ?
        """, (limit_val,))
        rows = cursor.fetchall()
    return [_row_to_result_dict(r) for r in rows]

def get_result_by_date(draw_date):
    """Lấy kết quả 1 kỳ quay theo ngày draw_date (YYYY-MM-DD)"""
    if isinstance(draw_date, dict):
        draw_date = draw_date.get("draw_date")
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM xsmb_results WHERE draw_date = ?", (draw_date,))
        row = cursor.fetchone()
        return _row_to_result_dict(row) if row else None

def get_results_before_date(target_date, limit=60):
    """Lấy danh sách các kỳ quay xảy ra nghiêm ngặt trước target_date (draw_date < target_date)"""
    if isinstance(target_date, dict):
        target_date = target_date.get("draw_date")
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM xsmb_results 
            WHERE draw_date < ? 
            ORDER BY draw_date DESC 
            LIMIT ?
        """, (target_date, limit))
        rows = cursor.fetchall()
        return [_row_to_result_dict(r) for r in rows]

def get_available_backtest_dates(min_prior_draws=4, include_pending=True):
    """
    Lấy danh sách tất cả các ngày có đủ dữ liệu lịch sử phía trước (tối thiểu min_prior_draws kỳ)
    để người dùng có thể chọn và backtest lại thuật toán.
    Nếu include_pending=True, tự động bổ sung ngày hôm nay (hoặc kỳ quay kế tiếp) vào đầu danh sách.
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT draw_date, date_display, day_of_week FROM xsmb_results ORDER BY draw_date ASC")
        rows = cursor.fetchall()
    
    if len(rows) <= min_prior_draws:
        return []
    
    eligible = rows[min_prior_draws:]
    result_dates = [
        {
            "draw_date": r["draw_date"],
            "date_display": r["date_display"],
            "day_of_week": r["day_of_week"]
        } for r in reversed(eligible)
    ]

    if include_pending and result_dates:
        today_dt = datetime.now()
        today_str = today_dt.strftime("%Y-%m-%d")
        latest_date = result_dates[0]["draw_date"]
        days_vn = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"]
        if latest_date < today_str:
            result_dates.insert(0, {
                "draw_date": today_str,
                "date_display": today_dt.strftime("%d/%m/%Y") + " (Hôm nay)",
                "day_of_week": days_vn[today_dt.weekday()],
                "is_pending": True
            })
        elif latest_date == today_str:
            next_dt = today_dt + timedelta(days=1)
            result_dates.insert(0, {
                "draw_date": next_dt.strftime("%Y-%m-%d"),
                "date_display": next_dt.strftime("%d/%m/%Y") + " (Kỳ tới)",
                "day_of_week": days_vn[next_dt.weekday()],
                "is_pending": True
            })

    return result_dates

def save_pattern_memory(pattern_dict):
    """Lưu hoặc cập nhật thông tin bộ nhớ cầu"""
    now_iso = datetime.now().isoformat()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO pattern_memory (
                pattern_id, pair, pattern_type, sequence_json,
                observations, repeat_count, success_count, broken_count,
                status, score, next_expected, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(pattern_id) DO UPDATE SET
                sequence_json=excluded.sequence_json,
                observations=excluded.observations,
                repeat_count=excluded.repeat_count,
                success_count=excluded.success_count,
                broken_count=excluded.broken_count,
                status=excluded.status,
                score=excluded.score,
                next_expected=excluded.next_expected,
                updated_at=excluded.updated_at
        """, (
            pattern_dict["pattern_id"],
            pattern_dict["pair"],
            pattern_dict["pattern_type"],
            json.dumps(pattern_dict.get("sequence", []), ensure_ascii=False),
            pattern_dict.get("observations", 0),
            pattern_dict.get("repeat_count", 0),
            pattern_dict.get("success_count", 0),
            pattern_dict.get("broken_count", 0),
            pattern_dict.get("status", "WATCH"),
            pattern_dict.get("score", 0),
            pattern_dict.get("next_expected", "V"),
            now_iso
        ))
        conn.commit()

def export_to_json(json_path=None, limit=None):
    """Đồng bộ và xuất dữ liệu ra file JSON"""
    if not json_path:
        json_path = config.JSON_PATH
    
    with get_connection() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM xsmb_results ORDER BY draw_date DESC"
        params = ()
        if limit and limit > 0:
            query += " LIMIT ?"
            params = (limit,)
        cursor.execute(query, params)
        rows = cursor.fetchall()

    data = []
    for r in rows:
        data.append({
            "draw_date": r["draw_date"],
            "date_display": r["date_display"],
            "day_of_week": r["day_of_week"],
            "special_prize": r["special_prize"],
            "prize_1": json.loads(r["prize_1"]) if r["prize_1"] else [],
            "prize_2": json.loads(r["prize_2"]) if r["prize_2"] else [],
            "prize_3": json.loads(r["prize_3"]) if r["prize_3"] else [],
            "prize_4": json.loads(r["prize_4"]) if r["prize_4"] else [],
            "prize_5": json.loads(r["prize_5"]) if r["prize_5"] else [],
            "prize_6": json.loads(r["prize_6"]) if r["prize_6"] else [],
            "prize_7": json.loads(r["prize_7"]) if r["prize_7"] else [],
            "special_code": r["special_code"],
            "loto_2digit": json.loads(r["loto_2digit"]) if r["loto_2digit"] else [],
            "updated_at": r["updated_at"]
        })

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    try:
        print(f"Da xuat thanh cong {len(data)} ban ghi ra file JSON: {json_path}")
    except Exception:
        pass
    return len(data)

def save_daily_bridge_wins(win_record):
    """Lưu nhật ký thống kê các cầu nổ trong ngày"""
    if not win_record or not win_record.get("draw_date"):
        return False
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO daily_bridge_wins (
                draw_date, date_display, win_count, total_bridges,
                win_rate, de_hits, total_hits, winning_bridges_json, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            win_record["draw_date"],
            win_record.get("date_display", ""),
            win_record.get("win_count", 0),
            win_record.get("total_bridges", 0),
            win_record.get("win_rate", 0.0),
            win_record.get("de_hits", 0),
            win_record.get("total_hits", 0),
            json.dumps(win_record.get("winning_bridges", []), ensure_ascii=False),
            datetime.now().isoformat()
        ))
        conn.commit()
    return True

def get_latest_daily_bridge_wins(draw_date=None):
    """Lấy bản ghi thống kê trúng cầu gần nhất hoặc theo ngày chỉ định"""
    with get_connection() as conn:
        cursor = conn.cursor()
        if draw_date:
            cursor.execute("SELECT * FROM daily_bridge_wins WHERE draw_date = ?", (draw_date,))
        else:
            cursor.execute("SELECT * FROM daily_bridge_wins ORDER BY draw_date DESC LIMIT 1")
        row = cursor.fetchone()
    if not row:
        return None
    return {
        "draw_date": row["draw_date"],
        "date_display": row["date_display"],
        "win_count": row["win_count"],
        "total_bridges": row["total_bridges"],
        "win_rate": row["win_rate"],
        "de_hits": row["de_hits"],
        "total_hits": row["total_hits"],
        "winning_bridges": json.loads(row["winning_bridges_json"]) if row["winning_bridges_json"] else [],
        "updated_at": row["updated_at"]
    }

def get_all_daily_wins_history(limit=30):
    """Lấy danh sách lịch sử các ngày trúng cầu"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM daily_bridge_wins ORDER BY draw_date DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
    res = []
    for row in rows:
        res.append({
            "draw_date": row["draw_date"],
            "date_display": row["date_display"],
            "win_count": row["win_count"],
            "total_bridges": row["total_bridges"],
            "win_rate": row["win_rate"],
            "de_hits": row["de_hits"],
            "total_hits": row["total_hits"],
            "winning_bridges": json.loads(row["winning_bridges_json"]) if row["winning_bridges_json"] else [],
            "updated_at": row["updated_at"]
        })
    return res

