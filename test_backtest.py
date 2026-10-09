import sys
import database
from datetime import datetime

# Đảm bảo in UTF-8 không lỗi trên Windows console
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Lấy toàn bộ kết quả có trong database
draws = database.get_recent_results(limit=1000)
print(f"Tổng số kỳ quay trong DB: {len(draws)}")
if draws:
    print(f"Từ ngày: {draws[-1]['draw_date']} đến ngày: {draws[0]['draw_date']}")

# Kiểm tra cơ chế tính date sum
def calc_date_sum(dt):
    s = dt.day + dt.month + dt.year
    p1 = f"{s % 100:02d}"
    p2 = f"{p1[1]}{p1[0]}"
    pairs = [p1] if p1 == p2 else [p1, p2]
    return {
        "sum": s,
        "predicted": pairs,
        "formula": f"{dt.day:02d} + {dt.month:02d} + {dt.year} = {s}"
    }

# draws được sắp xếp từ mới nhất (index 0) đến cũ nhất (index -1)
# Để thuận tiện tính toán chuỗi thời gian, ta sắp xếp theo thứ tự tăng dần (từ cũ đến mới)
chron_draws = list(reversed(draws))
n = len(chron_draws)

print(f"\n--- BẮT ĐẦU BACKTEST CẦU TỔNG NGÀY TRÊN {n} KỲ ---")

# 1. Backtest Khung 1 ngày (Đánh ngày N+1)
# Kỳ căn cứ i -> Đánh ở kỳ i+1
k1_total = 0
k1_win = 0
k1_hits = 0
k1_de = 0
k1_streaks = []
cur_k1_win_streak = 0
cur_k1_lose_streak = 0
max_k1_win_streak = 0
max_k1_lose_streak = 0

k1_results = []
for i in range(n - 1):
    d_base = chron_draws[i]
    d_target = chron_draws[i + 1]
    
    dt_base = datetime.strptime(d_base["draw_date"], "%Y-%m-%d")
    pred = calc_date_sum(dt_base)["predicted"]
    
    lotos = d_target.get("loto_2digit", [])
    sp = str(d_target.get("special_prize", "")).strip()
    de = sp[-2:] if len(sp) >= 2 else ""
    
    hits = sum(lotos.count(p) for p in pred)
    is_win = hits > 0
    is_de = de in pred if de else False
    
    k1_total += 1
    if is_win:
        k1_win += 1
        k1_hits += hits
        cur_k1_win_streak += 1
        cur_k1_lose_streak = 0
        max_k1_win_streak = max(max_k1_win_streak, cur_k1_win_streak)
    else:
        cur_k1_lose_streak += 1
        cur_k1_win_streak = 0
        max_k1_lose_streak = max(max_k1_lose_streak, cur_k1_lose_streak)
        
    if is_de:
        k1_de += 1
        
    k1_results.append({
        "base_date": d_base["draw_date"],
        "target_date": d_target["draw_date"],
        "pred": pred,
        "hits": hits,
        "is_win": is_win,
        "is_de": is_de
    })

# 2. Backtest Khung 2 ngày (Đánh ngày N+1 và N+2)
# Chiến lược A: Dừng ngay khi trúng (Stop on win)
# - Ngày 1 (N+1): Nếu trúng -> Ăn khung ở Ngày 1, dừng khung.
# - Nếu Ngày 1 trượt -> Đánh tiếp Ngày 2 (N+2). Nếu Ngày 2 trúng -> Ăn khung ở Ngày 2.
# - Nếu cả 2 ngày đều trượt -> Trượt khung.
k2_total = 0
k2_win = 0
k2_win_day1 = 0
k2_win_day2 = 0
k2_hits = 0
k2_de = 0
cur_k2_win_streak = 0
cur_k2_lose_streak = 0
max_k2_win_streak = 0
max_k2_lose_streak = 0

# Chiến lược B: Đánh cả 2 ngày bất kể ngày 1 có trúng hay không (Tổng điểm 2 ngày)
k2_all_hits = 0

k2_results = []
for i in range(n - 2):
    d_base = chron_draws[i]
    d_target1 = chron_draws[i + 1]
    d_target2 = chron_draws[i + 2]
    
    dt_base = datetime.strptime(d_base["draw_date"], "%Y-%m-%d")
    pred = calc_date_sum(dt_base)["predicted"]
    
    # Ngày 1
    lotos1 = d_target1.get("loto_2digit", [])
    sp1 = str(d_target1.get("special_prize", "")).strip()
    de1 = sp1[-2:] if len(sp1) >= 2 else ""
    hits1 = sum(lotos1.count(p) for p in pred)
    win1 = hits1 > 0
    de_win1 = de1 in pred if de1 else False
    
    # Ngày 2
    lotos2 = d_target2.get("loto_2digit", [])
    sp2 = str(d_target2.get("special_prize", "")).strip()
    de2 = sp2[-2:] if len(sp2) >= 2 else ""
    hits2 = sum(lotos2.count(p) for p in pred)
    win2 = hits2 > 0
    de_win2 = de2 in pred if de2 else False
    
    k2_total += 1
    k2_all_hits += (hits1 + hits2)
    
    frame_win = win1 or win2
    if win1:
        k2_win += 1
        k2_win_day1 += 1
        k2_hits += hits1
        cur_k2_win_streak += 1
        cur_k2_lose_streak = 0
        max_k2_win_streak = max(max_k2_win_streak, cur_k2_win_streak)
    elif win2:
        k2_win += 1
        k2_win_day2 += 1
        k2_hits += hits2
        cur_k2_win_streak += 1
        cur_k2_lose_streak = 0
        max_k2_win_streak = max(max_k2_win_streak, cur_k2_win_streak)
    else:
        cur_k2_lose_streak += 1
        cur_k2_win_streak = 0
        max_k2_lose_streak = max(max_k2_lose_streak, cur_k2_lose_streak)
        
    if de_win1 or de_win2:
        k2_de += 1
        
    status_day = "TRƯỢT"
    if win1 and win2:
        status_day = "ĂN CẢ 2 NGÀY"
    elif win1:
        status_day = "ĂN NGÀY 1"
    elif win2:
        status_day = "ĂN NGÀY 2"
        
    k2_results.append({
        "base_date": d_base["draw_date"],
        "target_date1": d_target1["draw_date"],
        "target_date2": d_target2["draw_date"],
        "pred": pred,
        "hits1": hits1,
        "hits2": hits2,
        "win1": win1,
        "win2": win2,
        "status": status_day,
        "frame_win": frame_win
    })

print("\n" + "="*60)
print("KẾT QUẢ SO SÁNH: KHUNG 1 NGÀY vs KHUNG 2 NGÀY")
print("="*60)

print(f"\n1. KHUNG 1 NGÀY (Đánh ngày hôm sau N+1):")
print(f" - Tổng số khung kiểm tra: {k1_total} ngày")
print(f" - Số ngày trúng: {k1_win} ngày")
print(f" - Số ngày trượt: {k1_total - k1_win} ngày")
print(f" - TỶ LỆ TRÚNG: {k1_win / k1_total * 100:.2f}%")
print(f" - Tổng số nháy ăn được: {k1_hits} nháy (trung bình {k1_hits / k1_win:.2f} nháy/lần trúng)")
print(f" - Số lần trúng Đề: {k1_de}")
print(f" - Chuỗi ăn thông dài nhất: {max_k1_win_streak} ngày")
print(f" - Chuỗi trượt dài nhất: {max_k1_lose_streak} ngày liên tiếp")

print(f"\n2. KHUNG 2 NGÀY (Nuôi N+1 và N+2):")
print(f" - Tổng số khung kiểm tra: {k2_total} khung")
print(f" - Số khung trúng (ít nhất 1 ngày nổ): {k2_win} khung")
print(f" - Số khung trượt cả 2 ngày: {k2_total - k2_win} khung")
print(f" - TỶ LỆ TRÚNG KHUNG: {k2_win / k2_total * 100:.2f}% (TĂNG {k2_win / k2_total * 100 - k1_win / k1_total * 100:+.2f}%)")
print(f"   + Trong đó ăn ngay Ngày 1 (N+1): {k2_win_day1} khung ({k2_win_day1 / k2_total * 100:.2f}%)")
print(f"   + Trong đó Ngày 1 xịt, ăn bù vào Ngày 2 (N+2): {k2_win_day2} khung ({k2_win_day2 / k2_total * 100:.2f}%)")
print(f"   + Số khung ăn cả 2 ngày liên tiếp: {sum(1 for r in k2_results if r['win1'] and r['win2'])} khung")
print(f" - Tổng số nháy (chiến lược dừng khi ăn): {k2_hits} nháy")
print(f" - Tổng số nháy nếu đánh đủ 2 ngày: {k2_all_hits} nháy")
print(f" - Chuỗi ăn thông khung dài nhất: {max_k2_win_streak} khung")
print(f" - Chuỗi trượt khung dài nhất: {max_k2_lose_streak} khung liên tiếp")

# 3. Phân tích tài chính / Điểm cược mô phỏng (Financial Simulation)
# Giả sử đánh cặp Song thủ (2 số, mỗi số 10 điểm = 20 điểm / ngày)
# Chi phí: 23,000 đ/điểm. Trúng: 80,000 đ/nháy (lãi 57,000 đ/nháy).
# Mô phỏng vốn:
# - Khung 1 ngày: Mỗi ngày đánh 10 điểm x 2 số = 20 điểm (460,000 đ).
#   Vốn tổng = k1_total * 20 * 23k
#   Tiền trúng = k1_hits * 10 * 80k
cost_k1 = k1_total * 20 * 23000
payout_k1 = k1_hits * 10 * 80000
profit_k1 = payout_k1 - cost_k1
roi_k1 = (profit_k1 / cost_k1) * 100

print(f"\n3. MÔ PHỎNG HIỆU QUẢ TÀI CHÍNH (Đánh 10đ/con, Vốn 23k/đ, Ăn 80k/nháy):")
print(f" - Khung 1 ngày (Đánh đều tay 10đ/con):")
print(f"   + Tổng vốn đánh: {cost_k1:,} VNĐ")
print(f"   + Tổng tiền lĩnh: {payout_k1:,} VNĐ")
print(f"   + Lợi nhuận: {profit_k1:,} VNĐ (ROI: {roi_k1:.2f}%)")

# - Khung 2 ngày vào tiền tỷ lệ 1:2 (Ngày 1 đánh 10đ/con = 20đ; Ngày 2 nếu ngày 1 xịt thì đánh 25đ/con = 50đ để hồi vốn + có lãi):
total_cost_k2_ratio = 0
total_payout_k2_ratio = 0

for r in k2_results:
    # Ngày 1: 10đ/con x 2 con = 20đ
    c1 = 20 * 23000
    p1 = r['hits1'] * 10 * 80000
    if r['win1']:
        # Dừng
        total_cost_k2_ratio += c1
        total_payout_k2_ratio += p1
    else:
        # Vào ngày 2: 25đ/con x 2 con = 50đ
        c2 = 50 * 23000
        p2 = r['hits2'] * 25 * 80000
        total_cost_k2_ratio += (c1 + c2)
        total_payout_k2_ratio += (p1 + p2)

profit_k2_ratio = total_payout_k2_ratio - total_cost_k2_ratio
roi_k2_ratio = (profit_k2_ratio / total_cost_k2_ratio) * 100 if total_cost_k2_ratio > 0 else 0

print(f" - Khung 2 ngày (Vào tiền tỷ lệ 1:2.5, Ngày 1: 10đ/con, Ngày 2: 25đ/con nếu ngày 1 xịt):")
print(f"   + Tổng vốn đánh: {total_cost_k2_ratio:,} VNĐ")
print(f"   + Tổng tiền lĩnh: {total_payout_k2_ratio:,} VNĐ")
print(f"   + Lợi nhuận: {profit_k2_ratio:,} VNĐ (ROI: {roi_k2_ratio:.2f}%)")

print("="*60)
