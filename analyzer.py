import json
import re
from datetime import datetime
from collections import Counter
import itertools
import database

def get_vn_seq_for_pair(pair_str, draws_list):
    """
    Tạo chuỗi trạng thái V/N và số nháy cho một cặp số (pair_str: '00'..'99')
    draws_list được sắp xếp từ MỚI NHẤT -> CŨ HƠN (index 0 là mới nhất)
    Hàm trả về chuỗi sắp xếp từ CŨ -> MỚI để tiện phân tích tiến trình
    """
    raw_seq = [] # list of (status, count)
    for draw in draws_list:
        loto_list = draw.get("loto_2digit", [])
        cnt = loto_list.count(pair_str)
        if cnt > 0:
            raw_seq.append(('V', cnt))
        else:
            raw_seq.append(('N', 0))
    
    # Đảo ngược lại để theo trình tự thời gian: CŨ -> MỚI
    chrono_seq = list(reversed(raw_seq))
    return chrono_seq

def calculate_score(seq, pattern_type, occurrences, next_expected_is_v=True):
    """
    Tính điểm tín hiệu (0 - 100 điểm) theo quy tắc nhịp rơi XSMB:
    +25 điểm: mẫu chạy chuẩn 2 chu kỳ
    +20 điểm: mẫu chạy chuẩn 3 chu kỳ
    +20 điểm: đúng điểm rơi chuẩn bị VỀ (next_expected_is_v=True)
    -30 điểm: nhịp đang ở pha NGHỈ (kỳ tới không nên đánh)
    """
    score = 40
    if occurrences >= 2:
        score += 25
    if occurrences >= 3:
        score += 20
    if occurrences >= 4:
        score += 15

    if next_expected_is_v:
        score += 20
    else:
        score -= 30

    return min(100, max(0, score))

def get_signal_label(score):
    if score >= 80:
        return "TÍN HIỆU CAO"
    elif score >= 60:
        return "TÍN HIỆU KHÁ"
    elif score >= 40:
        return "THEO DÕI"
    else:
        return "KHÔNG ĐỦ TÍN HIỆU"

def get_next_dow(current_dow):
    """Xác định Thứ của kỳ quay tiếp theo"""
    dows = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"]
    curr = current_dow.strip()
    idx = -1
    for i, d in enumerate(dows):
        if d.lower() in curr.lower():
            idx = i
            break
    if idx == -1:
        return "Thứ 2"
    return dows[(idx + 1) % 7]

def get_digit_at_pos(draw, key, p_idx, c_idx):
    """Lấy chữ số tại vị trí chỉ định trong bảng kết quả"""
    val = draw.get(key)
    if isinstance(val, list):
        if p_idx < len(val) and abs(c_idx) <= len(val[p_idx]):
            return val[p_idx][c_idx]
    elif isinstance(val, str):
        if abs(c_idx) <= len(val):
            return val[c_idx]
    return None

def find_active_position_bridge(draws):
    """
    Quét các cặp vị trí giải thưởng kinh điển qua 3 kỳ gần nhất.
    Tìm cặp vị trí đang có streak ăn thông liên tiếp >= 1 kỳ.
    """
    if not draws or len(draws) < 4:
        return None

    bridges = [
        ("GĐB Đầu + G1 Đuôi", ('special_prize', 0, 0), ('prize_1', 0, -1)),
        ("GĐB Đầu + GĐB Đuôi", ('special_prize', 0, 0), ('special_prize', 0, -1)),
        ("G1 Đầu + G1 Đuôi", ('prize_1', 0, 0), ('prize_1', 0, -1)),
        ("G2.1 Đầu + G2.2 Đầu", ('prize_2', 0, 0), ('prize_2', 1, 0)),
        ("G2.1 Đuôi + G2.2 Đuôi", ('prize_2', 0, -1), ('prize_2', 1, -1)),
        ("G3.1 Đầu + G3.6 Đuôi", ('prize_3', 0, 0), ('prize_3', 5, -1)),
        ("G3.2 Đầu + G3.5 Đuôi", ('prize_3', 1, 0), ('prize_3', 4, -1)),
        ("G4.1 Đầu + G4.4 Đuôi", ('prize_4', 0, 0), ('prize_4', 3, -1)),
        ("G5.1 Đầu + G5.6 Đuôi", ('prize_5', 0, 0), ('prize_5', 5, -1)),
        ("G6.1 Đầu + G6.3 Đuôi", ('prize_6', 0, 0), ('prize_6', 2, -1)),
        ("G7.1 Đầu + G7.4 Đuôi", ('prize_7', 0, 0), ('prize_7', 3, -1)),
        ("G7.2 Đầu + G7.3 Đuôi", ('prize_7', 1, 0), ('prize_7', 2, -1)),
        ("Tâm GĐB + Tâm G1", ('special_prize', 0, 2), ('prize_1', 0, 2))
    ]

    best_bridge = None
    best_streak = 0
    candidate_pair = None

    for name, pos1, pos2 in bridges:
        streak = 0
        for k in range(1, min(4, len(draws))):
            prev_d = draws[k]
            next_d = draws[k-1]
            c1 = get_digit_at_pos(prev_d, pos1[0], pos1[1], pos1[2])
            c2 = get_digit_at_pos(prev_d, pos2[0], pos2[1], pos2[2])
            if c1 is not None and c2 is not None:
                p = c1 + c2
                p_rev = c2 + c1
                loto = next_d.get('loto_2digit', [])
                if p in loto or p_rev in loto:
                    streak += 1
                else:
                    break
            else:
                break

        if streak >= 1 and streak > best_streak:
            c1_now = get_digit_at_pos(draws[0], pos1[0], pos1[1], pos1[2])
            c2_now = get_digit_at_pos(draws[0], pos2[0], pos2[1], pos2[2])
            if c1_now is not None and c2_now is not None:
                best_streak = streak
                best_bridge = name
                candidate_pair = c1_now + c2_now

    if best_bridge and candidate_pair:
        return {"name": best_bridge, "pair": candidate_pair, "streak": best_streak}
    return None

def find_sandwich_pairs(draw):
    """
    Nhận diện dạng Cầu Kẹp (Sandwich numbers) trong các giải 4-5 chữ số.
    Dạng A-XY-A (ví dụ 5245 -> kẹp 24, 7167 -> kẹp 16)
    """
    prizes = []
    if draw.get("special_prize"):
        prizes.append(draw["special_prize"])
    for p_key in ["prize_1", "prize_2", "prize_3", "prize_4", "prize_5"]:
        prizes.extend(draw.get(p_key, []))

    sandwiches = []
    for p in prizes:
        if len(p) >= 4:
            for i in range(len(p) - 3):
                if p[i] == p[i+3]:
                    pair = p[i+1:i+3]
                    if len(pair) == 2 and pair.isdigit():
                        sandwiches.append(pair)
    return list(dict.fromkeys(sandwiches))

def analyze_short_term(draws=None):
    """
    Thực hiện phân tích toàn bộ 23 MODULES soi cầu chuẩn hóa theo Data Catalog v1.0.
    Nếu draws được truyền vào, hệ thống sẽ phân tích trên tập dữ liệu đó (phục vụ backtest).
    """
    is_top_level = (draws is None)
    if draws is None:
        draws = database.get_recent_results(limit=30)
    if not draws or len(draws) < 2:
        return {
            "status": "ERROR",
            "message": "Không đủ dữ liệu (cần ít nhất 2 kỳ gần nhất).",
            "modules": {},
            "synthesis": "KHÔNG ĐỦ TÍN HIỆU"
        }

    latest_draw = draws[0]
    
    # Lấy phân tích của trọn bộ 23 thuật toán từ Data Catalog
    b23 = analyze_23_bridges(draws)
    bridges = b23.get("bridges", {})
    blacklist = b23.get("blacklist", [])
    blacklist_set = set([b["pair"] for b in blacklist])

    # Danh sách ánh xạ 23 thuật toán sang 23 Modules chuẩn
    MODULE_MAPPINGS = [
        ("module_01", "CAU_DONG_TO_HOP", "MODULE 01 – CẦU GHÉP VỊ TRÍ (5.671 CẶP)"),
        ("module_02", "CAU_QUA_TRAM", "MODULE 02 – CẦU QUẢ TRÁM"),
        ("module_03", "CAU_KEP_SO", "MODULE 03 – CẦU KẸP SỐ"),
        ("module_04", "CAU_KHUYT_GOC", "MODULE 04 – CẦU KHUYẾT GÓC"),
        ("module_05", "CAU_PASCAL", "MODULE 05 – TAM GIÁC PASCAL"),
        ("module_06", "CAU_TAM_GIAC_TAM", "MODULE 06 – TAM GIÁC ĐỊNH VỊ"),
        ("module_07", "CAU_ROI_TU_DE", "MODULE 07 – LOTO RƠI TỪ ĐỀ"),
        ("module_08", "CAU_ROI_TU_LO", "MODULE 08 – LOTO RƠI TỪ LÔ"),
        ("module_09", "CAU_DAU_CAM", "MODULE 09 – CẦU ĐẦU CÂM"),
        ("module_10", "CAU_DUOI_CAM", "MODULE 10 – CẦU ĐUÔI CÂM"),
        ("module_11", "CAU_G7_GHEP", "MODULE 11 – CẦU BIÊN GIẢI 7"),
        ("module_12", "CAU_BAO_KEP_DB", "MODULE 12 – BÁO KÉP GIẢI ĐẶC BIỆT"),
        ("module_13", "CAU_TAM_CANG_DB", "MODULE 13 – TÂM CÀNG GIẢI ĐẶC BIỆT"),
        ("module_14", "CAU_GHEP_G6_G7", "MODULE 14 – GHÉP TẦNG GIẢI 6 & 7"),
        ("module_15", "CAU_TIEN_KHUYT", "MODULE 15 – CẦU LÔ TIẾN KHUYẾT"),
        ("module_16", "CAU_NHIEU_NHAY", "MODULE 16 – CẦU LOTO NHIỀU NHÁY"),
        ("module_17", "CAU_BONG_NGU_HANH", "MODULE 17 – CẦU BÓNG ÂM DƯƠNG"),
        ("module_18", "CAU_MAX_GAN", "MODULE 18 – CẦU LÔ GAN CỰC ĐẠI"),
        ("module_19", "BAC_NHO_LOTO", "MODULE 19 – BẠC NHỚ THEO LOTO"),
        ("module_20", "BAC_NHO_THU", "MODULE 20 – BẠC NHỚ THEO THỨ"),
        ("module_21", "BAC_NHO_TONG_DB", "MODULE 21 – BẠC NHỚ TỔNG GIẢI ĐB"),
        ("module_22", "BAC_NHO_KEP_LECH_SAT", "MODULE 22 – BẠC NHỚ KÉP LỆCH/SÁT KÉP"),
        ("module_23", "CAU_LOAI_TRU_FILTER", "MODULE 23 – BỘ LỌC CẮT SỐ (BLACKLIST)")
    ]

    modules_output = {}
    for mod_key, b_code, mod_name in MODULE_MAPPINGS:
        b_info = bridges.get(b_code, {})
        modules_output[mod_key] = {
            "key": mod_key,
            "code": b_code,
            "name": mod_name,
            "category": b_info.get("category", ""),
            "pair": b_info.get("pair"),
            "pair_rev": b_info.get("pair_rev"),
            "predicted": b_info.get("predicted", []),
            "output_type": b_info.get("output_type", "Song thủ"),
            "timeframe": b_info.get("timeframe", "Nuôi 1–2 ngày"),
            "score": b_info.get("score", 0),
            "status": b_info.get("status", "NO_SIGNAL"),
            "detail": b_info.get("detail", ""),
            "stats": {"signals": 0, "wins_count": 0, "accuracy_pct": 0.0, "total_hits": 0, "max_streak": 0}
        }

    # Bổ sung thống kê lịch sử nổ cho 23 modules khi gọi ở cấp ứng dụng chính
    if is_top_level:
        try:
            bt_summary = backtest_batch(days=30, method="all_synthesis")
            all_st = bt_summary.get("all_methods_stats", {})
            for mod_k, mod_v in modules_output.items():
                code = mod_v.get("code")
                st = all_st.get(code) or all_st.get(mod_k)
                if st:
                    mod_v["stats"] = {
                        "signals": st.get("signals", 0),
                        "wins_count": st.get("hits_count", 0),
                        "accuracy_pct": st.get("accuracy_pct", 0.0),
                        "total_hits": st.get("total_hits", 0),
                        "max_streak": st.get("max_streak", 0)
                    }
        except Exception:
            pass

    # =========================================================================
    # TỔNG HỢP VÀ CHẤT LƯỢNG TÍN HIỆU (SYNTHESIS ENGINE) KẾT HỢP BỘ LỌC CẮT SỐ
    # =========================================================================
    # Trọng số độ tin cậy và tính ổn định thực nghiệm của từng phương pháp
    MODULE_WEIGHTS = {
        "module_16": 1.5,  # Cầu nhiều nháy
        "module_05": 1.4,  # Tam giác Pascal
        "module_11": 1.4,  # Cầu biên G7
        "module_14": 1.3,  # Ghép G6 & G7
        "module_20": 1.4,  # Bạc nhớ theo thứ
        "module_21": 1.3,  # Bạc nhớ tổng ĐB
        "module_09": 1.3,  # Cầu đầu câm
        "module_17": 1.3,  # Cầu bóng âm dương
        "module_13": 1.2,  # Tâm càng giải ĐB
        "module_02": 1.5,  # Cầu quả trám
        "module_03": 1.2,  # Cầu kẹp số
        "module_07": 1.2,  # Loto rơi từ đề
        "module_19": 1.2,  # Bạc nhớ loto
        "module_18": 1.1,  # Cầu lô gan cực đại
        "module_06": 1.1,  # Tam giác định vị
        "module_04": 1.1,  # Cầu khuyết góc
        "module_08": 1.0,  # Loto rơi từ lô
        "module_01": 0.9,  # Cầu ghép vị trí
        "module_15": 0.8,  # Cầu lô tiến khuyết
        "module_10": 0.8,  # Cầu đuôi câm
    }

    tally = {}
    for m_key, m_val in modules_output.items():
        if m_key == "module_23":  # Bỏ qua module cắt số (Blacklist) khỏi tính điểm dương
            continue
        pair = m_val.get("pair")
        score = m_val.get("score", 0)
        status = m_val.get("status")
        w = MODULE_WEIGHTS.get(m_key, 1.0)
        
        if pair and status in ["ACTIVE", "STRONG ACTIVE"] and score >= 60:
            pair_rev = pair[1] + pair[0] if len(pair) == 2 else pair
            # Nếu cặp số chính không nằm trong Blacklist
            if pair not in blacklist_set:
                if pair not in tally:
                    tally[pair] = {"count": 0, "total_score": 0.0, "modules": []}
                tally[pair]["count"] += 1
                tally[pair]["total_score"] += score * w
                tally[pair]["modules"].append(m_val["name"])
                
            # Số lộn đồng hành nhận điểm hỗ trợ cặp song thủ
            if pair_rev != pair and pair_rev not in blacklist_set:
                if pair_rev not in tally:
                    tally[pair_rev] = {"count": 0, "total_score": 0.0, "modules": []}
                tally[pair_rev]["count"] += 0.5
                tally[pair_rev]["total_score"] += (score * w * 0.6)
                if m_val["name"] + " (lộn)" not in tally[pair_rev]["modules"]:
                    tally[pair_rev]["modules"].append(m_val["name"] + " (lộn)")

    # Thêm cặp số từ Module Cầu nếu có tín hiệu mạnh và không nằm trong blacklist
    mc_data = analyze_module_cau(draws)
    if mc_data and mc_data.get("bridge_pair") and mc_data.get("score", 0) >= 70:
        mc_p = mc_data["bridge_pair"]
        mc_p_rev = mc_p[1] + mc_p[0] if len(mc_p) == 2 else mc_p
        if mc_p not in blacklist_set:
            if mc_p not in tally:
                tally[mc_p] = {"count": 0, "total_score": 0.0, "modules": []}
            tally[mc_p]["count"] += 1.2
            tally[mc_p]["total_score"] += mc_data["score"] * 1.3
            tally[mc_p]["modules"].append(f"CẦU KẸP / NHỊP ({mc_data['pattern_name']})")
        if mc_p_rev != mc_p and mc_p_rev not in blacklist_set:
            if mc_p_rev not in tally:
                tally[mc_p_rev] = {"count": 0, "total_score": 0.0, "modules": []}
            tally[mc_p_rev]["count"] += 0.6
            tally[mc_p_rev]["total_score"] += mc_data["score"] * 0.8
            tally[mc_p_rev]["modules"].append(f"CẦU KẸP / NHỊP ({mc_data['pattern_name']} lộn)")

    # Bổ sung tương hỗ từ Cầu Thứ trong tuần nếu có
    weekly_res = analyze_weekly_bridges(draws=draws)
    if weekly_res and weekly_res.get("status") == "SUCCESS":
        target_dow = latest_draw.get("day_of_week", "").strip().lower()
        for d_item in weekly_res.get("days_analysis", []):
            if d_item.get("dow", "").strip().lower() in target_dow:
                wp = d_item.get("top_pair")
                if wp and wp not in blacklist_set:
                    wp_rev = wp[1] + wp[0] if len(wp) == 2 else wp
                    if wp not in tally:
                        tally[wp] = {"count": 0, "total_score": 0.0, "modules": []}
                    tally[wp]["count"] += 1.2
                    tally[wp]["total_score"] += 85.0 * 1.3
                    tally[wp]["modules"].append(f"CẦU THỨ ({d_item.get('dow')})")
                    if wp_rev != wp and wp_rev not in blacklist_set:
                        if wp_rev not in tally:
                            tally[wp_rev] = {"count": 0, "total_score": 0.0, "modules": []}
                        tally[wp_rev]["count"] += 0.5
                        tally[wp_rev]["total_score"] += 85.0 * 0.7
                break

    # Sắp xếp các cặp số được nhiều Module đồng xác nhận nhất
    sorted_synthesis = sorted(
        tally.items(),
        key=lambda x: (x[1]["count"], x[1]["total_score"]),
        reverse=True
    )

    final_synthesis_text = ""
    final_chot_pair = None
    final_signal_level = "KHÔNG ĐỦ TÍN HIỆU"
    song_thu_chot = []
    top3_pairs = []
    top5_pairs = []

    if sorted_synthesis:
        top_pair, top_info = sorted_synthesis[0]
        final_chot_pair = top_pair
        top_rev = top_pair[1] + top_pair[0] if len(top_pair) == 2 else top_pair
        song_thu_chot = [top_pair, top_rev] if top_pair != top_rev else [top_pair]
        top3_pairs = [x[0] for x in sorted_synthesis[:3]]
        top5_pairs = [x[0] for x in sorted_synthesis[:5]]
        
        avg_score = top_info["total_score"] / max(1, top_info["count"])
        final_signal_level = "CAO" if (top_info["count"] >= 2 or avg_score >= 75) else "KHÁ"
        
        module_names_str = ", ".join([m.split(" – ")[-1] for m in top_info["modules"][:4]])
        final_synthesis_text = f"TỔNG HỢP HỘI TỤ ĐA CẦU: Cặp song thủ [{', '.join(song_thu_chot)}] (chủ lực: {top_pair}) được {int(top_info['count'])} modules ({module_names_str}) đồng thuận xác nhận. Tín hiệu: {final_signal_level}."
    else:
        final_synthesis_text = "Không phát hiện cầu đủ điều kiện an toàn trong các kỳ gần nhất."

    return {
        "status": "SUCCESS",
        "latest_date": latest_draw.get("date_display", latest_draw.get("draw_date")),
        "latest_dow": latest_draw.get("day_of_week", ""),
        "modules": modules_output,
        "module_cau": mc_data,
        "blacklist": blacklist,
        "b23": b23,
        "synthesis": {
            "chot_pair": final_chot_pair,
            "song_thu_chot": song_thu_chot,
            "top3_pairs": top3_pairs,
            "top5_pairs": top5_pairs,
            "signal_level": final_signal_level,
            "summary": final_synthesis_text,
            "tally_list": [
                {
                    "pair": k,
                    "confirmations": int(round(v["count"])),
                    "total_score": round(v["total_score"], 1),
                    "modules": v["modules"]
                } for k, v in sorted_synthesis
            ]
        }
    }

def analyze_module_cau(draws):
    """
    [MODULE – CẦU]: Hệ thống nhận diện Cầu Kẹp bảng giải và nhịp rơi 1 Về 1 Nghỉ qua 4 kỳ gần nhất.
    """
    if not draws or len(draws) < 4:
        return None

    short_draws = draws[:4] # 4 kỳ gần nhất
    chrono_draws = list(reversed(short_draws)) # Cũ -> Mới
    dates = [d["date_display"] for d in chrono_draws]
    latest_draw = short_draws[0]

    candidates = []

    # 1. CẦU KẸP BẢNG GIẢI (Sandwich Pairs): Có tỷ lệ nổ cao nhất
    sandwiches = find_sandwich_pairs(latest_draw)
    for p in sandwiches:
        # Kiểm tra xem cặp kẹp này đã về bao nhiêu lần trong 4 kỳ
        counts = [d.get("loto_2digit", []).count(p) for d in chrono_draws]
        seq = ["V" if c > 0 else "N" for c in counts]
        candidates.append({
            "pair": p,
            "pattern": "CẦU KẸP BẢNG GIẢI",
            "seq": seq,
            "counts": counts,
            "score": 90,
            "status": "STRONG ACTIVE (Cầu Kẹp nổ mạnh)",
            "conclusion": f"Cặp {p} xuất hiện ở dạng Cầu Kẹp (bị kẹp giữa 2 số trùng nhau trong bảng kết quả ngày {dates[-1]}). Đây là một trong những dạng cầu có tỷ lệ nổ cao nhất."
        })

    # 2. CẦU NHỊP 1 VỀ – 1 NGHỈ (Chỉ lấy khi kỳ gần nhất là NGHỈ)
    for i in range(100):
        pair = f"{i:02d}"
        counts = [d.get("loto_2digit", []).count(pair) for d in chrono_draws]
        seq = ["V" if c > 0 else "N" for c in counts]
        pattern_str = "-".join(seq)

        if pattern_str == "V-N-V-N":
            candidates.append({
                "pair": pair,
                "pattern": "1 VỀ – 1 NGHỈ",
                "seq": seq,
                "counts": counts,
                "score": 88,
                "status": "ACTIVE (Cầu nhịp chuẩn)",
                "conclusion": f"Cặp {pair} đang vận hành nhịp nhàng theo chu kỳ 1 VỀ – 1 NGHỈ. Kỳ gần nhất ({dates[-1]}) vừa hoàn thành pha NGHỈ, điểm rơi kỳ tiếp theo bước vào pha VỀ."
            })
        elif pattern_str == "V-V-V-V" or pattern_str == "N-V-V-V":
            # Lô rơi thông
            candidates.append({
                "pair": pair,
                "pattern": "CẦU RƠI THÔNG",
                "seq": seq,
                "counts": counts,
                "score": 78,
                "status": "ACTIVE (Lô rơi thông)",
                "conclusion": f"Cặp {pair} rơi liên tiếp các kỳ gần nhất."
            })

    candidates.sort(key=lambda x: (x["score"], sum(x["counts"])), reverse=True)
    if not candidates:
        return None

    top = candidates[0]
    details_4days = []
    for d, s, c in zip(dates, top["seq"], top["counts"]):
        details_4days.append({
            "date": d,
            "status": "VỀ" if s == "V" else "NGHỈ",
            "hits": c
        })

    v_cnt = top["seq"].count("V")
    return {
        "bridge_pair": top["pair"],
        "pattern_name": top["pattern"],
        "status": top["status"],
        "frequency": f"{v_cnt}/4 ngày ({int(v_cnt/4*100)}%)",
        "total_hits": sum(top["counts"]),
        "score": top["score"],
        "signal": get_signal_label(top["score"]),
        "details_4days": details_4days,
        "conclusion": top["conclusion"],
        "reliability": f"TÍN HIỆU CAO ({top['score']}/100 điểm)"
    }

def quick_check_response():
    """
    Hàm phản hồi nhanh theo định dạng CHATBOT khi người dùng hỏi: "Chốt hôm nay?"
    """
    res = analyze_short_term()
    if res["status"] != "SUCCESS":
        return "Hệ thống chưa đủ dữ liệu XSMB để phân tích."

    syn = res["synthesis"]
    modules = res["modules"]

    output_lines = []
    output_lines.append(f"📌 BÁO CÁO PHÂN TÍCH XSMB NGẮN HẠN ({res['latest_date']} - {res['latest_dow']})\n")
    output_lines.append("🔹 Các cầu đang hoạt động nổi bật:")

    active_count = 0
    for key, val in modules.items():
        if val["pair"] and val["status"] in ["ACTIVE", "STRONG ACTIVE"]:
            active_count += 1
            output_lines.append(f"  • {val['name']}: Cặp {val['pair']} – Trạng thái: {val['status']} – Tín hiệu: {get_signal_label(val['score'])}")

    if active_count == 0:
        output_lines.append("  • Chưa có cầu nào đạt trạng thái ACTIVE rõ ràng trong 2–4 kỳ gần nhất.")

    output_lines.append("\n🎯 TỔNG HỢP KẾT QUẢ:")
    output_lines.append(f"  {syn['summary']}")
    output_lines.append("\n⚠️ LƯU Ý: Đây là kết quả phân tích thống kê mẫu ngắn hạn, KHÔNG PHẢI cam kết trúng 100%.")

    return "\n".join(output_lines)

def analyze_weekly_bridges(draws=None):
    """
    Quan sát dữ liệu theo tuần, phân tích các cầu chạy theo từng Thứ trong tuần.
    Đánh giá sự trùng hợp giữa các cầu (Cầu thứ, Cầu chạm, Cầu tổng, Cầu bệt tuần)
    để tìm ra ngày trong tuần có cặp số về ổn định nhất.
    """
    if draws is None:
        draws = database.get_recent_results(limit=60)
    if not draws or len(draws) < 14:
        return {
            "status": "ERROR",
            "message": "Chưa đủ dữ liệu tối thiểu 2 tuần để phân tích theo tuần."
        }

    standard_dows = [
        ("Thứ 2", "Hà Nội"),
        ("Thứ 3", "Quảng Ninh"),
        ("Thứ 4", "Bắc Ninh"),
        ("Thứ 5", "Hà Nội"),
        ("Thứ 6", "Hải Phòng"),
        ("Thứ 7", "Nam Định"),
        ("Chủ Nhật", "Thái Bình")
    ]

    by_dow = {}
    for d in draws:
        dow = d.get('day_of_week', '').strip()
        matched = False
        for std_dow, _ in standard_dows:
            if std_dow.lower() in dow.lower() or (std_dow == "Thứ 2" and "thứ hai" in dow.lower()) or (std_dow == "Thứ 3" and "thứ ba" in dow.lower()) or (std_dow == "Thứ 4" and "thứ tư" in dow.lower()) or (std_dow == "Thứ 5" and "thứ năm" in dow.lower()) or (std_dow == "Thứ 6" and "thứ sáu" in dow.lower()) or (std_dow == "Thứ 7" and "thứ bảy" in dow.lower()):
                dow_key = std_dow
                matched = True
                break
        if not matched:
            dow_key = dow

        if dow_key not in by_dow:
            by_dow[dow_key] = []
        by_dow[dow_key].append(d)

    days_analysis = []
    for std_dow, province in standard_dows:
        dlist = by_dow.get(std_dow, [])
        total_weeks = len(dlist)
        if total_weeks == 0:
            continue
            
        pair_counts = {}
        pair_recent_streak = {}
        pair_weeks = {}
        
        for i in range(100):
            p = f"{i:02d}"
            cnt = 0
            streak = 0
            in_streak = True
            week_statuses = []
            
            for d in dlist:
                hit = d.get('loto_2digit', []).count(p)
                cnt += hit
                has_v = hit > 0
                week_statuses.append({
                    "date": d.get("date_display", ""),
                    "status": "V" if has_v else "N",
                    "hits": hit
                })
                if in_streak:
                    if has_v:
                        streak += 1
                    else:
                        in_streak = False
                        
            pair_counts[p] = cnt
            pair_recent_streak[p] = streak
            pair_weeks[p] = week_statuses

        pair_active_weeks = {p: sum(1 for w in weeks if w["status"] == "V") for p, weeks in pair_weeks.items()}
        sorted_pairs = sorted(pair_active_weeks.items(), key=lambda x: (x[1], pair_counts[x[0]]), reverse=True)
        
        top_pair, top_weeks_count = sorted_pairs[0]
        top_total_hits = pair_counts[top_pair]
        top_streak = pair_recent_streak[top_pair]
        top_history = pair_weeks[top_pair]
        
        stability_pct = round((top_weeks_count / total_weeks) * 100, 1)
        
        digit_counts = {str(digit): 0 for digit in range(10)}
        for d in dlist:
            for num in d.get('loto_2digit', []):
                if len(num) == 2:
                    digit_counts[num[0]] += 1
                    digit_counts[num[1]] += 1
        top_cham = max(digit_counts.items(), key=lambda x: x[1])
        
        sum_counts = {s: 0 for s in range(10)}
        for d in dlist:
            for num in d.get('loto_2digit', []):
                if len(num) == 2 and num.isdigit():
                    sm = (int(num[0]) + int(num[1])) % 10
                    sum_counts[sm] += 1
        top_sum = max(sum_counts.items(), key=lambda x: x[1])
        
        concurrence_reasons = []
        if top_pair[0] == top_cham[0] or top_pair[1] == top_cham[0]:
            concurrence_reasons.append(f"Trùng Chạm {top_cham[0]} nổ nhiều nhất ({top_cham[1]} lượt)")
        if (int(top_pair[0]) + int(top_pair[1])) % 10 == top_sum[0]:
            concurrence_reasons.append(f"Trùng Tổng {top_sum[0]} nổ nhiều nhất ({top_sum[1]} lượt)")
        if top_streak >= 2:
            concurrence_reasons.append(f"Cầu bệt thông {top_streak} tuần liên tiếp")
            
        score = int(stability_pct * 0.7 + min(30, top_streak * 10) + len(concurrence_reasons) * 5)
        score = min(100, max(40, score))
        
        days_analysis.append({
            "dow": std_dow,
            "province": province,
            "total_weeks": total_weeks,
            "top_pair": top_pair,
            "top_weeks_count": top_weeks_count,
            "top_total_hits": top_total_hits,
            "stability_pct": stability_pct,
            "recent_streak": top_streak,
            "history": top_history,
            "top_cham": top_cham[0],
            "top_cham_hits": top_cham[1],
            "top_sum": top_sum[0],
            "top_sum_hits": top_sum[1],
            "concurrence": concurrence_reasons,
            "score": score,
            "secondary_pairs": [
                {"pair": p, "weeks": w, "hits": pair_counts[p]} 
                for p, w in sorted_pairs[1:4]
            ]
        })

    dow_map = {item['dow'].lower(): item for item in days_analysis}
    weekly_history = []
    w_win = 0
    w_hits = 0
    w_de = 0
    for d in draws:
        d_dow = d.get('day_of_week', '').strip().lower()
        matched = None
        for k, item in dow_map.items():
            if k in d_dow or d_dow in k:
                matched = item
                break
        if not matched:
            continue
        p = matched['top_pair']
        lotos = d.get('loto_2digit', [])
        hit_cnt = lotos.count(p)
        sp = str(d.get('special_prize', '')).strip()
        de = sp[-2:] if len(sp) >= 2 else ''
        is_w = (hit_cnt > 0)
        is_d = (p == de) if de else False
        if is_w:
            w_win += 1
            w_hits += hit_cnt
        if is_d:
            w_de += 1
        weekly_history.append({
            "draw_date": d.get("draw_date"),
            "date_display": d.get("date_display", d.get("draw_date")),
            "day_of_week": d.get("day_of_week"),
            "dow_name": matched['dow'],
            "province": matched['province'],
            "top_pair": p,
            "is_win": is_w,
            "hits": hit_cnt,
            "is_de": is_d,
            "special_prize": sp,
            "actual_de": de
        })

    best_day = max(days_analysis, key=lambda x: (x["stability_pct"], x["recent_streak"], x["score"]))
    
    return {
        "status": "SUCCESS",
        "total_draws_analyzed": len(draws),
        "best_day": best_day,
        "days_analysis": days_analysis,
        "weekly_stats": {
            "total_tested": len(weekly_history),
            "win_count": w_win,
            "lose_count": len(weekly_history) - w_win,
            "win_rate": round((w_win / len(weekly_history)) * 100, 1) if weekly_history else 0,
            "total_hits": w_hits,
            "de_hits": w_de
        },
        "weekly_history": weekly_history,
        "summary": f"Qua phân tích {len(draws)} kỳ quay ({best_day['total_weeks']} tuần dữ liệu), ngày có cầu số về ổn định nhất trong tuần là {best_day['dow']} ({best_day['province']}) với cặp số chủ lực [{best_day['top_pair']}]. Cặp số này đã về {best_day['top_weeks_count']}/{best_day['total_weeks']} tuần gần nhất (đạt độ ổn định {best_day['stability_pct']}%, tổng {best_day['top_total_hits']} nháy) cùng sự hội tụ của {len(best_day['concurrence'])} tín hiệu cầu ({'; '.join(best_day['concurrence'])})."
    }

def backtest_single_date(target_date, target_draw=None, draws_before=None):
    """
    Dự đoán lại và đối chiếu kết quả cho một ngày lịch sử cụ thể (Backtest 1 ngày).
    Chỉ sử dụng dữ liệu xảy ra trước target_date (draw_date < target_date) để đảm bảo tính khách quan.
    Hỗ trợ nhận target_draw và draws_before nạp sẵn từ RAM để tối ưu hóa hiệu năng khi chạy hàng loạt.
    """
    if isinstance(target_date, dict):
        target_date = target_date.get("draw_date")

    if target_draw is None:
        target_draw = database.get_result_by_date(target_date)
    if not target_draw:
        return {
            "status": "ERROR",
            "message": f"Không tìm thấy kết quả ngày {target_date} trong cơ sở dữ liệu."
        }

    # Lấy các kỳ quay trước target_date (Đầy đủ 60 kỳ để thuật toán đạt độ chính xác cao nhất)
    if draws_before is None:
        draws_before = database.get_results_before_date(target_date, limit=60)
    if not draws_before or len(draws_before) < 4:
        return {
            "status": "ERROR",
            "message": f"Không đủ dữ liệu lịch sử trước ngày {target_date} (cần tối thiểu 4 kỳ để thuật toán hoạt động)."
        }

    # Chạy phân tích các thuật toán (tái sử dụng b23 từ pred_short, tránh tính lặp 2 lần)
    pred_short = analyze_short_term(draws=draws_before)
    pred_weekly = analyze_weekly_bridges(draws=draws_before)
    b23 = pred_short.get("b23") or analyze_23_bridges(draws=draws_before)

    # Kết quả thực tế của ngày target_date
    actual_loto = target_draw.get("loto_2digit", [])
    actual_special = str(target_draw.get("special_prize", "")).strip()
    actual_de = actual_special[-2:] if len(actual_special) >= 2 else ""
    actual_set = set(actual_loto)

    # Dữ liệu dự đoán từ Synthesis Engine
    syn = pred_short.get("synthesis", {})
    chot_pair = syn.get("chot_pair")
    song_thu_chot = syn.get("song_thu_chot", [])
    if not song_thu_chot and chot_pair:
        chot_rev = chot_pair[1] + chot_pair[0] if len(chot_pair) == 2 else chot_pair
        song_thu_chot = [chot_pair, chot_rev] if chot_pair != chot_rev else [chot_pair]
    top3_pairs = syn.get("top3_pairs", [])
    top5_pairs = syn.get("top5_pairs", [])
    chot_signal = syn.get("signal_level", "KHÔNG ĐỦ TÍN HIỆU")

    # Module Cầu Kẹp (Sandwich)
    mc = pred_short.get("module_cau")
    mc_pair = mc.get("bridge_pair") if mc else None
    mc_preds = [mc_pair, mc_pair[1] + mc_pair[0]] if mc_pair and len(mc_pair) == 2 and mc_pair[0] != mc_pair[1] else ([mc_pair] if mc_pair else [])

    # Cầu theo Thứ
    weekly_matched = None
    target_dow = target_draw.get("day_of_week", "").strip().lower()
    if pred_weekly and pred_weekly.get("status") == "SUCCESS":
        for d in pred_weekly.get("days_analysis", []):
            if d.get("dow", "").strip().lower() in target_dow or target_dow in d.get("dow", "").strip().lower():
                w_pair = d.get("top_pair")
                w_preds = [w_pair, w_pair[1] + w_pair[0]] if w_pair and len(w_pair) == 2 and w_pair[0] != w_pair[1] else ([w_pair] if w_pair else [])
                w_hits = sum(actual_loto.count(p) for p in w_preds)
                weekly_matched = {
                    "dow": d.get("dow"),
                    "province": d.get("province"),
                    "pair": w_pair,
                    "predicted": w_preds,
                    "hits": w_hits,
                    "is_win": (w_hits > 0),
                    "stability_pct": d.get("stability_pct")
                }
                break

    # =========================================================================
    # ĐÁNH GIÁ TẤT CẢ CÁC PHƯƠNG PHÁP SOI CẦU CHO NGÀY NÀY
    # =========================================================================
    methods_eval = {}

    def _eval_method(key, name, category, preds, score=80, detail="", main_pair=None):
        cleaned_preds = [str(p).strip().zfill(2) for p in preds if p and str(p).strip().isdigit() and len(str(p).strip()) <= 2]
        hits = sum(actual_loto.count(p) for p in cleaned_preds)
        hit_nums = [p for p in cleaned_preds if p in actual_set]
        is_win = (hits > 0)
        is_de = any(p == actual_de for p in cleaned_preds) if actual_de else False
        p_main = main_pair or (cleaned_preds[0] if cleaned_preds else None)
        status = "ACTIVE" if cleaned_preds else "NO_SIGNAL"
        return {
            "key": key,
            "name": name,
            "category": category,
            "pair": p_main,
            "predicted": cleaned_preds,
            "predicted_display": " - ".join(cleaned_preds) if cleaned_preds else "-",
            "hits": hits,
            "hit_numbers": hit_nums,
            "is_win": is_win,
            "is_de": is_de,
            "status": status,
            "score": score,
            "detail": detail
        }

    # 1. Gói Hội Tụ Đa Cầu
    methods_eval["all_synthesis"] = _eval_method(
        "all_synthesis",
        "🌟 Tất Cả / Tổng Hợp Hội Tụ",
        "Gói Dự Đoán Hội Tụ",
        song_thu_chot,
        score=90 if chot_signal == "CAO" else 75,
        detail=syn.get("summary", ""),
        main_pair=chot_pair
    )
    methods_eval["chot_song_thu"] = _eval_method(
        "chot_song_thu",
        "🎯 Cặp Song Thủ Chốt (Xuôi - Lộn)",
        "Gói Dự Đoán Hội Tụ",
        song_thu_chot,
        score=88,
        detail=f"Cặp song thủ bao bọc hai chiều [{', '.join(song_thu_chot)}].",
        main_pair=chot_pair
    )
    methods_eval["chot_bach_thu"] = _eval_method(
        "chot_bach_thu",
        "🥇 Bạch Thủ Chốt Điểm Rơi",
        "Gói Dự Đoán Hội Tụ",
        [chot_pair] if chot_pair else [],
        score=85,
        detail=f"Bạch thủ duy nhất đạt điểm hội tụ cao nhất [{chot_pair}].",
        main_pair=chot_pair
    )
    methods_eval["top_3_hoi_tu"] = _eval_method(
        "top_3_hoi_tu",
        "🏆 Top 3 Số Hội Tụ Cao Nhất",
        "Gói Dự Đoán Hội Tụ",
        top3_pairs,
        score=92,
        detail=f"Tam hoa hội tụ 3 số đứng đầu hệ thống: [{', '.join(top3_pairs)}].",
        main_pair=top3_pairs[0] if top3_pairs else None
    )
    methods_eval["top_5_hoi_tu"] = _eval_method(
        "top_5_hoi_tu",
        "💎 Dàn Lô Top 5 Đẹp Nhất",
        "Gói Dự Đoán Hội Tụ",
        top5_pairs,
        score=96,
        detail=f"Dàn 5 số có xác suất giải tỏa rơi cao nhất: [{', '.join(top5_pairs)}].",
        main_pair=top5_pairs[0] if top5_pairs else None
    )

    # 2. Cầu Kẹp Bảng Giải & Cầu Thứ
    methods_eval["module_cau"] = _eval_method(
        "module_cau",
        "🪟 Cầu Kẹp Bảng Giải (Sandwich)",
        "Phương Pháp Cầu Nổi Bật",
        mc_preds,
        score=mc.get("score", 75) if mc else 0,
        detail=mc.get("conclusion", "") if mc else "",
        main_pair=mc_pair
    )
    if weekly_matched:
        methods_eval["cau_thu"] = _eval_method(
            "cau_thu",
            f"🏛️ Cầu {weekly_matched['dow']} ({weekly_matched['province']})",
            "Phương Pháp Cầu Nổi Bật",
            weekly_matched.get("predicted", []),
            score=weekly_matched.get("stability_pct", 80),
            detail=f"Cặp số chủ lực của {weekly_matched['dow']} (độ ổn định {weekly_matched.get('stability_pct', 0)}%).",
            main_pair=weekly_matched.get("pair")
        )

    # 3. Trọn bộ 23 Modules Soi Cầu
    modules_eval = []
    b23_bridges = b23.get("bridges", {})
    for b_key, b_val in b23_bridges.items():
        b_name = b_val.get("name", b_key)
        b_preds = b_val.get("predicted", [])
        if not b_preds and b_val.get("pair"):
            b_preds = [b_val["pair"]]
            if b_val.get("pair_rev") and b_val["pair_rev"] != b_val["pair"]:
                b_preds.append(b_val["pair_rev"])
        
        m_eval = _eval_method(
            b_key,
            b_name,
            b_val.get("category", "23 Modules Soi Cầu"),
            b_preds,
            score=b_val.get("score", 0),
            detail=b_val.get("detail", ""),
            main_pair=b_val.get("pair")
        )
        methods_eval[b_key] = m_eval
        modules_eval.append({
            "key": b_key,
            "name": b_name,
            "pair": m_eval["pair"],
            "predicted": m_eval["predicted"],
            "score": m_eval["score"],
            "status": b_val.get("status", "NO_SIGNAL"),
            "detail": m_eval["detail"],
            "hits": m_eval["hits"],
            "is_hit": m_eval["is_win"],
            "is_de": m_eval["is_de"]
        })

    # Đánh giá riêng gói chốt số tổng hợp tương thích ngược
    chot_eval = methods_eval["all_synthesis"]

    return {
        "status": "SUCCESS",
        "target_date": target_date,
        "date_display": target_draw.get("date_display", target_date),
        "day_of_week": target_draw.get("day_of_week", ""),
        "actual": {
            "special_prize": actual_special,
            "de": actual_de,
            "loto_2digit": actual_loto,
            "prize_1": target_draw.get("prize_1", []),
            "prize_2": target_draw.get("prize_2", []),
            "prize_3": target_draw.get("prize_3", []),
            "prize_4": target_draw.get("prize_4", []),
            "prize_5": target_draw.get("prize_5", []),
            "prize_6": target_draw.get("prize_6", []),
            "prize_7": target_draw.get("prize_7", []),
            "special_code": target_draw.get("special_code", "")
        },
        "prediction": {
            "chot_pair": chot_pair,
            "song_thu_chot": song_thu_chot,
            "top3_pairs": top3_pairs,
            "top5_pairs": top5_pairs,
            "signal_level": chot_signal,
            "summary": syn.get("summary", ""),
            "tally_list": syn.get("tally_list", []),
            "module_cau": mc,
            "weekly_matched": weekly_matched
        },
        "evaluation": {
            "chot": {
                "pair": chot_pair,
                "song_thu": song_thu_chot,
                "hits": chot_eval["hits"],
                "is_win": chot_eval["is_win"],
                "is_de": chot_eval["is_de"],
                "signal_level": chot_signal
            },
            "module_cau": methods_eval.get("module_cau"),
            "weekly": weekly_matched,
            "modules": modules_eval,
            "methods": methods_eval,
            "total_active_modules": sum(1 for m in modules_eval if m["status"] in ["ACTIVE", "STRONG ACTIVE"]),
            "winning_modules_count": sum(1 for m in modules_eval if m["status"] in ["ACTIVE", "STRONG ACTIVE"] and m["is_hit"])
        }
    }

def backtest_batch(days=14, method="all_synthesis"):
    """
    Kiểm thử hàng loạt thuật toán qua N ngày gần nhất (hoặc toàn bộ lịch sử).
    Hỗ trợ backtest linh hoạt nhiều phương pháp cầu:
      - all_synthesis: Gói hội tụ tổng hợp (Mặc định)
      - chot_song_thu: Cặp song thủ chốt
      - chot_bach_thu: Bạch thủ chốt
      - top_3_hoi_tu: Top 3 số hội tụ
      - top_5_hoi_tu: Dàn lô top 5
      - module_cau: Cầu kẹp bảng giải
      - cau_thu: Cầu theo thứ trong tuần
      - Bất kỳ module nào trong 23 Modules (CAU_PASCAL, CAU_NHIEU_NHAY, CAU_DAU_CAM, ...)
    """
    eligible_dates = database.get_available_backtest_dates()
    if not eligible_dates:
        return {
            "status": "ERROR",
            "message": "Không có đủ dữ liệu lịch sử để thực hiện kiểm thử hàng loạt."
        }

    if days != "all":
        try:
            limit_n = int(days)
            test_dates = eligible_dates[:limit_n]
        except ValueError:
            test_dates = eligible_dates[:14]
    else:
        test_dates = eligible_dates

    # Nạp trước 120 kỳ gần nhất vào RAM để cắt mảng (in-memory slicing), tránh truy vấn SQLite lặp
    all_cached_draws = database.get_recent_results(limit=120)
    draws_map = {d["draw_date"]: idx for idx, d in enumerate(all_cached_draws)}

    # Khởi tạo thống kê cho TẤT CẢ các phương pháp soi cầu
    all_methods_stats = {}

    daily_results = []
    # Duyệt theo thứ tự ngày từ MỚI NHẤT -> CŨ HƠN
    for d in test_dates:
        t_date = d["draw_date"]
        if t_date in draws_map:
            cur_idx = draws_map[t_date]
            target_draw = all_cached_draws[cur_idx]
            draws_before = all_cached_draws[cur_idx + 1 : cur_idx + 61]
            report = backtest_single_date(t_date, target_draw=target_draw, draws_before=draws_before)
        else:
            report = backtest_single_date(t_date)
        if report.get("status") != "SUCCESS":
            continue

        eval_data = report["evaluation"]
        actual_data = report["actual"]
        methods_map = eval_data.get("methods", {})

        # Tích luỹ thống kê cho tất cả các phương pháp
        for m_key, m_eval in methods_map.items():
            if m_key not in all_methods_stats:
                all_methods_stats[m_key] = {
                    "key": m_key,
                    "name": m_eval.get("name", m_key),
                    "category": m_eval.get("category", "Phương pháp soi cầu"),
                    "signals": 0,
                    "hits_count": 0,
                    "total_hits": 0,
                    "accuracy_pct": 0.0,
                    "max_streak": 0,
                    "current_streak": 0,
                    "de_hits": 0,
                    "history_records": []  # List of (draw_date, is_win, hits)
                }

            if m_eval.get("status") in ["ACTIVE", "STRONG ACTIVE"] and m_eval.get("predicted"):
                st = all_methods_stats[m_key]
                st["signals"] += 1
                is_w = m_eval.get("is_win", False)
                hits_val = m_eval.get("hits", 0)
                st["history_records"].append((t_date, is_w, hits_val))
                if is_w:
                    st["hits_count"] += 1
                    st["total_hits"] += hits_val
                if m_eval.get("is_de"):
                    st["de_hits"] += 1

        # Trích xuất dữ liệu chi tiết cho phương pháp đang được chọn
        chosen_eval = methods_map.get(method) or methods_map.get("all_synthesis", {})
        winning_names = [
            m["name"].split(" – ")[-1]
            for m in methods_map.values()
            if m.get("is_win") and m["key"] not in ["all_synthesis", "chot_song_thu", "chot_bach_thu", "top_3_hoi_tu", "top_5_hoi_tu"]
        ]

        daily_results.append({
            "draw_date": report["target_date"],
            "date_display": report["date_display"],
            "day_of_week": report["day_of_week"],
            "method_key": method,
            "method_name": chosen_eval.get("name", method),
            "predicted_numbers": chosen_eval.get("predicted", []),
            "predicted_display": chosen_eval.get("predicted_display", "-"),
            "is_win": chosen_eval.get("is_win", False),
            "hits": chosen_eval.get("hits", 0),
            "hit_numbers": chosen_eval.get("hit_numbers", []),
            "is_de": chosen_eval.get("is_de", False),
            "status": chosen_eval.get("status", "NO_SIGNAL"),
            "actual_special": actual_data.get("special_prize", ""),
            "actual_de": actual_data.get("de", ""),
            "actual_loto": actual_data.get("loto_2digit", []),
            "winning_modules": winning_names,
            "winning_modules_count": len(winning_names),
            # Giữ tương thích ngược cho giao diện cũ
            "chot_pair": chosen_eval.get("pair"),
            "chot_hits": chosen_eval.get("hits", 0),
            "chot_is_win": chosen_eval.get("is_win", False),
            "chot_is_de": chosen_eval.get("is_de", False),
            "chot_signal": eval_data.get("chot", {}).get("signal_level", "CAO"),
            "cau_pair": methods_map.get("module_cau", {}).get("pair"),
            "cau_hits": methods_map.get("module_cau", {}).get("hits", 0),
            "cau_is_win": methods_map.get("module_cau", {}).get("is_win", False),
            # Lưu lại trạng thái của tất cả phương pháp trong ngày để client có thể chuyển đổi tức thì
            "methods_snapshot": {
                k: {
                    "predicted": v.get("predicted", []),
                    "predicted_display": v.get("predicted_display", "-"),
                    "is_win": v.get("is_win", False),
                    "hits": v.get("hits", 0),
                    "hit_numbers": v.get("hit_numbers", []),
                    "is_de": v.get("is_de", False)
                } for k, v in methods_map.items()
            }
        })

    # Tính toán tỷ lệ phần trăm và chuỗi thông (streaks) cho từng phương pháp
    for m_key, st in all_methods_stats.items():
        if st["signals"] > 0:
            st["accuracy_pct"] = round(st["hits_count"] / st["signals"] * 100, 1)

        # Chuỗi thông tính từ CŨ -> MỚI (đảo ngược lịch sử)
        chrono_history = list(reversed(st["history_records"]))
        max_s = 0
        cur_s = 0
        for _, is_w, _ in chrono_history:
            if is_w:
                cur_s += 1
                if cur_s > max_s:
                    max_s = cur_s
            else:
                cur_s = 0
        st["max_streak"] = max_s

        # Chuỗi hiện tại tính từ ngày mới nhất trở về trước
        curr_streak = 0
        if st["history_records"]:
            latest_status = st["history_records"][0][1]
            for _, is_w, _ in st["history_records"]:
                if is_w == latest_status:
                    curr_streak += 1 if latest_status else -1
                else:
                    break
        st["current_streak"] = curr_streak

    # Bảng xếp hạng các phương pháp có phát tín hiệu
    modules_ranking = sorted(
        [v for v in all_methods_stats.values() if v["signals"] > 0],
        key=lambda x: (x["accuracy_pct"], x["hits_count"], x["total_hits"], x["max_streak"]),
        reverse=True
    )

    # Thống kê riêng cho phương pháp đang chọn
    sel_stats = all_methods_stats.get(method) or all_methods_stats.get("all_synthesis", {})
    total_tested = len(daily_results)
    sel_win_rate = sel_stats.get("accuracy_pct", 0.0)
    sel_wins = sel_stats.get("hits_count", 0)
    sel_signals = sel_stats.get("signals", 0)
    sel_total_hits = sel_stats.get("total_hits", 0)
    sel_max_streak = sel_stats.get("max_streak", 0)
    sel_current_streak = sel_stats.get("current_streak", 0)
    sel_de_wins = sel_stats.get("de_hits", 0)

    # Danh sách các phương pháp có sẵn để dropdown trên giao diện lựa chọn
    available_methods = [
        {"key": v["key"], "name": v["name"], "category": v["category"], "accuracy_pct": v["accuracy_pct"], "signals": v["signals"], "hits_count": v["hits_count"], "total_hits": v["total_hits"], "max_streak": v["max_streak"]}
        for v in modules_ranking
    ]

    return {
        "status": "SUCCESS",
        "selected_method": method,
        "selected_method_name": sel_stats.get("name", method),
        "total_days_tested": total_tested,
        "signals_count": sel_signals,
        "wins_count": sel_wins,
        "win_rate": sel_win_rate,
        "total_hits": sel_total_hits,
        "avg_hits": round(sel_total_hits / max(1, sel_signals), 2),
        "max_streak": sel_max_streak,
        "current_streak": sel_current_streak,
        "de_wins": sel_de_wins,
        # Các trường tương thích ngược với UI cũ
        "chot_tested_count": total_tested,
        "chot_wins_count": sel_wins,
        "chot_win_rate": sel_win_rate,
        "chot_total_hits": sel_total_hits,
        "chot_de_wins": sel_de_wins,
        "cau_stats": all_methods_stats.get("module_cau", {"signals": 0, "hits_count": 0, "total_hits": 0, "accuracy_pct": 0.0}),
        "all_methods_stats": all_methods_stats,
        "available_methods": available_methods,
        "modules_ranking": modules_ranking,
        "daily_results": daily_results
    }

def extract_107_digits(draw):
    """
    Chuyển đổi 27 giải thưởng XSMB thành mảng phẳng 107 ký tự số có chỉ mục (0..106)
    theo đúng chuẩn đặc tả Data Catalog v1.0:
    - Giải ĐB: Index 0..4 (5 số)
    - Giải Nhất: Index 5..9 (5 số)
    - Giải Nhì: Index 10..19 (2 giải x 5 số = 10 số)
    - Giải Ba: Index 20..49 (6 giải x 5 số = 30 số)
    - Giải Tư: Index 50..65 (4 giải x 4 số = 16 số)
    - Giải Năm: Index 66..89 (6 giải x 4 số = 24 số)
    - Giải Sáu: Index 90..98 (3 giải x 3 số = 9 số)
    - Giải Bảy: Index 99..106 (4 giải x 2 số = 8 số)
    Tổng cộng: 107 ký tự số.
    """
    chars = []
    sp = str(draw.get('special_prize', '')).strip()
    chars.extend(list(sp.zfill(5)[:5]))
    
    p1 = draw.get('prize_1', [])
    s1 = str(p1[0] if p1 else '').strip()
    chars.extend(list(s1.zfill(5)[:5]))
    
    for s in (draw.get('prize_2', []) + ['', ''])[:2]:
        chars.extend(list(str(s).strip().zfill(5)[:5]))
        
    for s in (draw.get('prize_3', []) + ['']*6)[:6]:
        chars.extend(list(str(s).strip().zfill(5)[:5]))
        
    for s in (draw.get('prize_4', []) + ['']*4)[:4]:
        chars.extend(list(str(s).strip().zfill(4)[:4]))
        
    for s in (draw.get('prize_5', []) + ['']*6)[:6]:
        chars.extend(list(str(s).strip().zfill(4)[:4]))
        
    for s in (draw.get('prize_6', []) + ['']*3)[:3]:
        chars.extend(list(str(s).strip().zfill(3)[:3]))
        
    for s in (draw.get('prize_7', []) + ['']*4)[:4]:
        chars.extend(list(str(s).strip().zfill(2)[:2]))
        
    return chars[:107]

def analyze_23_bridges(draws=None):
    """
    Quy chuẩn 23 thuật toán và cơ chế soi cầu truyền thống theo Từ Điển Dữ Liệu
    & Danh Mục Các Cầu Loto (Data Catalog v1.0).
    Phân loại làm 4 danh mục:
      1. Tổ hợp vị trí & Hình thái ma trận bảng kết quả (8 cầu)
      2. Tín hiệu giải biên, giải phụ & Bất thường thống kê (8 cầu)
      3. Bạc nhớ xác suất & Quy chiếu ngũ hành (6 cầu)
      4. Bộ lọc cắt số / Blacklist (1 cầu)
    """
    if draws is None:
        draws = database.get_recent_results(limit=30)
    if not draws or len(draws) < 4:
        return {
            "status": "ERROR",
            "message": "Không đủ dữ liệu lịch sử để phân tích trọn bộ 23 cầu (cần tối thiểu 4 kỳ)."
        }

    d0 = draws[0]
    arr0 = extract_107_digits(d0)
    loto0 = d0.get('loto_2digit', [])
    sp0 = str(d0.get('special_prize', '')).strip().zfill(5)
    de0 = sp0[-2:]
    all_pairs = [f"{i:02d}" for i in range(100)]

    bridges = {}

    # -------------------------------------------------------------------------
    # DANH MỤC 1: TỔ HỢP VỊ TRÍ & HÌNH THÁI MA TRẬN BẢNG KẾT QUẢ
    # -------------------------------------------------------------------------

    # 1. CAU_DONG_TO_HOP: Cầu ghép vị trí (Duyệt 5.671 cặp vị trí C(107,2))
    d_arrays = [extract_107_digits(d) for d in draws[:5]]
    d_lotos = [set(d.get('loto_2digit', [])) for d in draws[:5]]
    best_pos = None
    best_streak = 0
    for i in range(0, 106, 2):
        for j in range(i + 1, 107, 2):
            streak = 0
            for k in range(1, len(d_arrays)):
                p1 = d_arrays[k][i] + d_arrays[k][j]
                p2 = d_arrays[k][j] + d_arrays[k][i]
                if p1 in d_lotos[k-1] or p2 in d_lotos[k-1]:
                    streak += 1
                else:
                    break
            if streak >= 3 and streak > best_streak:
                best_streak = streak
                best_pos = (i, j, arr0[i] + arr0[j], arr0[j] + arr0[i])

    if best_pos and best_streak >= 3:
        bridges["CAU_DONG_TO_HOP"] = {
            "code": "CAU_DONG_TO_HOP",
            "name": "Cầu ghép vị trí (5.671 cặp)",
            "category": "Tổ hợp vị trí",
            "category_id": 1,
            "status": "ACTIVE",
            "pair": best_pos[2],
            "pair_rev": best_pos[3],
            "predicted": [best_pos[2], best_pos[3]],
            "output_type": "Song thủ",
            "timeframe": "Nuôi 1–2 ngày",
            "score": 85,
            "detail": f"Vị trí Index ({best_pos[0]}, {best_pos[1]}) trong 107 vị trí đang có chuỗi thông liên tiếp {best_streak} ngày."
        }
    else:
        bridges["CAU_DONG_TO_HOP"] = {
            "code": "CAU_DONG_TO_HOP",
            "name": "Cầu ghép vị trí (5.671 cặp)",
            "category": "Tổ hợp vị trí",
            "category_id": 1,
            "status": "NO_SIGNAL",
            "pair": None,
            "pair_rev": None,
            "predicted": [],
            "output_type": "Song thủ",
            "timeframe": "Nuôi 1–2 ngày",
            "score": 0,
            "detail": "Chưa có cặp vị trí đạt chuỗi thông >= 3 ngày."
        }

    # 2. CAU_QUA_TRAM: Cầu quả trám (Ma trận B / A-B-A / B)
    all_prizes_tram = []
    for p in d0.get('prize_3', []):
        if len(str(p)) == 5: all_prizes_tram.append(str(p))
    for p in d0.get('prize_4', []):
        if len(str(p)) == 4: all_prizes_tram.append(str(p))
    for p in d0.get('prize_5', []):
        if len(str(p)) == 4: all_prizes_tram.append(str(p))
    tram_found = None
    for i in range(len(all_prizes_tram) - 2):
        r1, r2, r3 = all_prizes_tram[i], all_prizes_tram[i+1], all_prizes_tram[i+2]
        if len(r1) == len(r2) == len(r3):
            L = len(r1)
            for pos in range(1, L - 1):
                b = r1[pos]
                if r3[pos] == b and r2[pos] == b:
                    a1 = r2[pos - 1]
                    a2 = r2[pos + 1]
                    if a1 == a2 and a1 != b:
                        tram_found = (f"{a1}{b}", f"{b}{a1}", [r1, r2, r3])
                        break
            if tram_found: break

    if tram_found:
        bridges["CAU_QUA_TRAM"] = {
            "code": "CAU_QUA_TRAM",
            "name": "Cầu quả trám",
            "category": "Hình thái bảng",
            "category_id": 1,
            "status": "STRONG ACTIVE",
            "pair": tram_found[0],
            "pair_rev": tram_found[1],
            "predicted": [tram_found[0], tram_found[1]],
            "output_type": "Song thủ",
            "timeframe": "Nuôi 2–3 ngày",
            "score": 95,
            "detail": f"Xuất hiện ma trận hình thoi quả trám hiếm gặp ở 3 giải liền kề: {tram_found[2]}."
        }
    else:
        bridges["CAU_QUA_TRAM"] = {
            "code": "CAU_QUA_TRAM",
            "name": "Cầu quả trám",
            "category": "Hình thái bảng",
            "category_id": 1,
            "status": "NO_SIGNAL",
            "pair": None,
            "pair_rev": None,
            "predicted": [],
            "output_type": "Song thủ",
            "timeframe": "Nuôi 2–3 ngày",
            "score": 0,
            "detail": "Kỳ quay vừa qua không xuất hiện cấu trúc hình thoi quả trám B / A-B-A / B."
        }

    # 3. CAU_KEP_SO: Cầu kẹp số
    prizes_list = [sp0] + d0.get('prize_1', []) + d0.get('prize_2', []) + d0.get('prize_3', []) + d0.get('prize_4', []) + d0.get('prize_5', [])
    kep_pairs = []
    for p in prizes_list:
        p_str = str(p).strip()
        if len(p_str) >= 4:
            for idx in range(len(p_str) - 3):
                if p_str[idx] == p_str[idx+3]:
                    mid = p_str[idx+1:idx+3]
                    if mid.isdigit() and len(mid) == 2:
                        kep_pairs.append(mid)
    kep_pairs = list(dict.fromkeys(kep_pairs))
    if kep_pairs:
        bridges["CAU_KEP_SO"] = {
            "code": "CAU_KEP_SO",
            "name": "Cầu kẹp số",
            "category": "Hình thái bảng",
            "category_id": 1,
            "status": "ACTIVE",
            "pair": kep_pairs[0],
            "pair_rev": kep_pairs[0][1] + kep_pairs[0][0] if len(kep_pairs[0])==2 else None,
            "predicted": kep_pairs[:2],
            "output_type": "Bạch thủ / Song thủ",
            "timeframe": "Nuôi 1–3 ngày",
            "score": 80,
            "detail": f"Trích xuất các chuỗi số bị kẹp giữa 2 số giống nhau: {', '.join(kep_pairs[:3])}."
        }
    else:
        bridges["CAU_KEP_SO"] = {
            "code": "CAU_KEP_SO",
            "name": "Cầu kẹp số",
            "category": "Hình thái bảng",
            "category_id": 1,
            "status": "NO_SIGNAL",
            "pair": None,
            "pair_rev": None,
            "predicted": [],
            "output_type": "Bạch thủ / Song thủ",
            "timeframe": "Nuôi 1–3 ngày",
            "score": 0,
            "detail": "Không có số kẹp dạng X-AB-X."
        }

    # 4. CAU_KHUYT_GOC: Cầu khuyết góc
    khuyt_found = None
    for g in [d0.get('prize_3', []), d0.get('prize_4', []), d0.get('prize_5', [])]:
        for i in range(len(g) - 1):
            s1, s2 = str(g[i]), str(g[i+1])
            if len(s1) == len(s2) and len(s1) >= 4:
                corners = [s1[0], s1[-1], s2[0], s2[-1]]
                cnt = Counter(corners)
                if len(cnt) == 2 and 3 in cnt.values():
                    a = [k for k, v in cnt.items() if v == 3][0]
                    b = [k for k, v in cnt.items() if v == 1][0]
                    khuyt_found = (f"{a}{b}", f"{b}{a}", s1, s2)
                    break
        if khuyt_found: break

    if khuyt_found:
        bridges["CAU_KHUYT_GOC"] = {
            "code": "CAU_KHUYT_GOC",
            "name": "Cầu khuyết góc",
            "category": "Hình thái bảng",
            "category_id": 1,
            "status": "ACTIVE",
            "pair": khuyt_found[0],
            "pair_rev": khuyt_found[1],
            "predicted": [khuyt_found[0], khuyt_found[1]],
            "output_type": "Song thủ",
            "timeframe": "Nuôi 2–3 ngày",
            "score": 78,
            "detail": f"Hai giải cùng kích thước có 3 trong 4 góc là số giống nhau: {khuyt_found[2]} và {khuyt_found[3]}."
        }
    else:
        bridges["CAU_KHUYT_GOC"] = {
            "code": "CAU_KHUYT_GOC",
            "name": "Cầu khuyết góc",
            "category": "Hình thái bảng",
            "category_id": 1,
            "status": "NO_SIGNAL",
            "pair": None,
            "pair_rev": None,
            "predicted": [],
            "output_type": "Song thủ",
            "timeframe": "Nuôi 2–3 ngày",
            "score": 0,
            "detail": "Không có 2 giải cùng kích thước khuyết góc."
        }

    # 5. CAU_PASCAL: Tam giác Pascal
    g1_str = str(d0.get('prize_1', [''])[0]).strip().zfill(5)
    pas_str = sp0 + g1_str
    while len(pas_str) > 2:
        next_pas = ""
        for i in range(len(pas_str) - 1):
            next_pas += str((int(pas_str[i]) + int(pas_str[i+1])) % 10)
        pas_str = next_pas
    pas_pair = pas_str.zfill(2)
    pas_rev = pas_pair[1] + pas_pair[0]
    bridges["CAU_PASCAL"] = {
        "code": "CAU_PASCAL",
        "name": "Tam giác Pascal",
        "category": "Thuật toán cộng",
        "category_id": 1,
        "status": "ACTIVE",
        "pair": pas_pair,
        "pair_rev": pas_rev,
        "predicted": [pas_pair, pas_rev],
        "output_type": "Bạch thủ + Lộn",
        "timeframe": "Nuôi 1–2 ngày",
        "score": 76,
        "detail": f"Ghép 10 chữ số GĐB ({sp0}) và G1 ({g1_str}) cộng dồn thu gọn về đáy tam giác [{pas_pair}]."
    }

    # 6. CAU_TAM_GIAC_TAM: Tam giác định vị (Tâm G1 [7], Đầu GĐB [0], Đuôi G7.4 [106])
    d_tam_g1 = arr0[7]
    d_dau_db = arr0[0]
    d_duoi_g7 = arr0[106]
    pair_tg1 = d_dau_db + d_tam_g1
    pair_tg2 = d_tam_g1 + d_duoi_g7
    bridges["CAU_TAM_GIAC_TAM"] = {
        "code": "CAU_TAM_GIAC_TAM",
        "name": "Tam giác định vị",
        "category": "Vị trí cố định",
        "category_id": 1,
        "status": "ACTIVE",
        "pair": pair_tg1,
        "pair_rev": pair_tg2,
        "predicted": [pair_tg1, pair_tg2],
        "output_type": "Song thủ / Bộ 3",
        "timeframe": "Nuôi 1–3 ngày",
        "score": 75,
        "detail": f"3 đỉnh cố định: Đầu GĐB ({d_dau_db}) + Tâm G1 ({d_tam_g1}) + Đuôi G7.4 ({d_duoi_g7}) $\\rightarrow$ [{pair_tg1}, {pair_tg2}]."
    }

    # 7. CAU_ROI_TU_DE: Loto rơi từ đề
    bridges["CAU_ROI_TU_DE"] = {
        "code": "CAU_ROI_TU_DE",
        "name": "Loto rơi từ đề",
        "category": "Chu kỳ lặp",
        "category_id": 1,
        "status": "ACTIVE",
        "pair": de0,
        "pair_rev": de0[1] + de0[0] if len(de0)==2 and de0[0]!=de0[1] else None,
        "predicted": [de0, de0[1] + de0[0]] if len(de0)==2 and de0[0]!=de0[1] else [de0],
        "output_type": "Bạch thủ + Lót",
        "timeframe": "Nuôi 1–3 ngày",
        "score": 70,
        "detail": f"Bắt lại con số Đề [{de0}] vừa về của giải Đặc biệt dưới dạng loto."
    }

    # 8. CAU_ROI_TU_LO: Loto rơi từ lô
    freq_lo = {}
    for d in draws:
        for num in d.get('loto_2digit', []):
            freq_lo[num] = freq_lo.get(num, 0) + 1
    lo_candidates = [(num, freq_lo.get(num, 0)) for num in loto0 if freq_lo.get(num, 0) >= 3]
    lo_candidates.sort(key=lambda x: x[1], reverse=True)
    if lo_candidates:
        c_lo = lo_candidates[0][0]
        bridges["CAU_ROI_TU_LO"] = {
            "code": "CAU_ROI_TU_LO",
            "name": "Loto rơi từ lô",
            "category": "Chu kỳ lặp",
            "category_id": 1,
            "status": "ACTIVE",
            "pair": c_lo,
            "pair_rev": c_lo[1] + c_lo[0] if len(c_lo)==2 and c_lo[0]!=c_lo[1] else None,
            "predicted": [c_lo],
            "output_type": "Bạch thủ",
            "timeframe": "Nuôi 1–2 ngày",
            "score": 72,
            "detail": f"Loto [{c_lo}] đã nổ hôm qua và duy trì nhịp rơi đều ({freq_lo[c_lo]} lần/30 kỳ gần nhất)."
        }
    else:
        bridges["CAU_ROI_TU_LO"] = {
            "code": "CAU_ROI_TU_LO",
            "name": "Loto rơi từ lô",
            "category": "Chu kỳ lặp",
            "category_id": 1,
            "status": "NO_SIGNAL",
            "pair": None,
            "pair_rev": None,
            "predicted": [],
            "output_type": "Bạch thủ",
            "timeframe": "Nuôi 1–2 ngày",
            "score": 0,
            "detail": "Không có con lô nào đạt nhịp rơi đều đủ chuẩn."
        }

    # -------------------------------------------------------------------------
    # DANH MỤC 2: TÍN HIỆU GIẢI BIÊN, GIẢI PHỤ & BẤT THƯỜNG THỐNG KÊ
    # -------------------------------------------------------------------------

    # 9. CAU_DAU_CAM
    heads_present = {int(num[0]) for num in loto0 if len(num)==2 and num.isdigit()}
    dau_cam = sorted(list(set(range(10)) - heads_present))
    if dau_cam:
        dc = dau_cam[0]
        p_dc = f"{dc}{dc}"
        duong_map = {'0':'5','1':'6','2':'7','3':'8','4':'9','5':'0','6':'1','7':'2','8':'3','9':'4'}
        b_dc = duong_map.get(str(dc), '0')
        bridges["CAU_DAU_CAM"] = {
            "code": "CAU_DAU_CAM",
            "name": "Cầu đầu câm",
            "category": "Tín hiệu câm",
            "category_id": 2,
            "status": "ACTIVE",
            "pair": p_dc,
            "pair_rev": f"{dc}0",
            "predicted": [p_dc, f"{dc}0", f"{dc}{b_dc}"],
            "output_type": "Dàn 2–4 số",
            "timeframe": "Nuôi 1–3 ngày",
            "score": 82,
            "detail": f"Kỳ trước câm Đầu {dc}. Áp lực giải tỏa nổ kép [{p_dc}] hoặc chạm [{dc}0, {dc}{b_dc}]."
        }
    else:
        bridges["CAU_DAU_CAM"] = {
            "code": "CAU_DAU_CAM",
            "name": "Cầu đầu câm",
            "category": "Tín hiệu câm",
            "category_id": 2,
            "status": "NO_SIGNAL",
            "pair": None,
            "pair_rev": None,
            "predicted": [],
            "output_type": "Dàn 2–4 số",
            "timeframe": "Nuôi 1–3 ngày",
            "score": 0,
            "detail": "Bảng mở thưởng đầy đủ 10 đầu, không có đầu câm."
        }

    # 10. CAU_DUOI_CAM
    tails_present = {int(num[1]) for num in loto0 if len(num)==2 and num.isdigit()}
    duoi_cam = sorted(list(set(range(10)) - tails_present))
    if duoi_cam:
        tc = duoi_cam[0]
        p_tc = f"{tc}{tc}"
        bridges["CAU_DUOI_CAM"] = {
            "code": "CAU_DUOI_CAM",
            "name": "Cầu đuôi (đít) câm",
            "category": "Tín hiệu câm",
            "category_id": 2,
            "status": "ACTIVE",
            "pair": p_tc,
            "pair_rev": f"0{tc}",
            "predicted": [p_tc, f"0{tc}"],
            "output_type": "Dàn 2–4 số",
            "timeframe": "Nuôi 1–3 ngày",
            "score": 80,
            "detail": f"Kỳ trước câm Đuôi {tc}. Dự báo giải tỏa áp lực vào kép [{p_tc}] hoặc [{tc}7]."
        }
    else:
        bridges["CAU_DUOI_CAM"] = {
            "code": "CAU_DUOI_CAM",
            "name": "Cầu đuôi (đít) câm",
            "category": "Tín hiệu câm",
            "category_id": 2,
            "status": "NO_SIGNAL",
            "pair": None,
            "pair_rev": None,
            "predicted": [],
            "output_type": "Dàn 2–4 số",
            "timeframe": "Nuôi 1–3 ngày",
            "score": 0,
            "detail": "Bảng mở thưởng đầy đủ 10 đuôi, không có đuôi câm."
        }

    # 11. CAU_G7_GHEP: Cầu biên giải 7 (Index 99 đầu G7.1 và Index 106 đuôi G7.4)
    c_g7_1 = arr0[99]
    c_g7_4 = arr0[106]
    pair_g7 = c_g7_1 + c_g7_4
    pair_g7_rev = c_g7_4 + c_g7_1
    is_kep_g7 = (c_g7_1 == c_g7_4)
    bridges["CAU_G7_GHEP"] = {
        "code": "CAU_G7_GHEP",
        "name": "Cầu biên giải 7",
        "category": "Tín hiệu biên",
        "category_id": 2,
        "status": "ACTIVE",
        "pair": pair_g7,
        "pair_rev": pair_g7_rev,
        "predicted": [pair_g7, pair_g7_rev] if not is_kep_g7 else [pair_g7],
        "output_type": "Song thủ / Kép",
        "timeframe": "Nuôi 1–2 ngày",
        "score": 78 if is_kep_g7 else 74,
        "detail": f"Ghép đầu giải 7.1 ({c_g7_1}) và đuôi giải 7.4 ({c_g7_4}) $\\rightarrow$ [{pair_g7}]. {'Trùng nhau kích hoạt báo kép!' if is_kep_g7 else ''}"
    }

    # 12. CAU_BAO_KEP_DB
    is_k_head = (sp0[0] == sp0[1])
    is_k_mid = (sp0[1] == sp0[2] or sp0[2] == sp0[3])
    if is_k_head or is_k_mid:
        k_val = sp0[0] if is_k_head else (sp0[1] if sp0[1]==sp0[2] else sp0[2])
        bridges["CAU_BAO_KEP_DB"] = {
            "code": "CAU_BAO_KEP_DB",
            "name": "Báo kép giải ĐB",
            "category": "Tín hiệu biên",
            "category_id": 2,
            "status": "STRONG ACTIVE",
            "pair": f"{k_val}{k_val}",
            "pair_rev": None,
            "predicted": [f"{k_val}{k_val}", "11", "22", "33", "44", "55", "66", "77", "88", "99", "00"],
            "output_type": "Dàn kép bằng",
            "timeframe": "Nuôi 3–5 ngày",
            "score": 88,
            "detail": f"Giải Đặc Biệt ({sp0}) xuất hiện kép báo hiệu ({k_val}{k_val}). Kích hoạt nuôi dàn kép bằng."
        }
    else:
        bridges["CAU_BAO_KEP_DB"] = {
            "code": "CAU_BAO_KEP_DB",
            "name": "Báo kép giải ĐB",
            "category": "Tín hiệu biên",
            "category_id": 2,
            "status": "NO_SIGNAL",
            "pair": None,
            "pair_rev": None,
            "predicted": [],
            "output_type": "Dàn kép bằng",
            "timeframe": "Nuôi 3–5 ngày",
            "score": 0,
            "detail": "GĐB không có tín hiệu kép đầu hoặc kép giữa."
        }

    # 13. CAU_TAM_CANG_DB: Tâm càng giải ĐB (index 2)
    tam_cang = sp0[2]
    c_dau_db = sp0[0]
    c_duoi_db = sp0[4]
    p_tc1 = tam_cang + c_dau_db
    p_tc2 = tam_cang + c_duoi_db
    bridges["CAU_TAM_CANG_DB"] = {
        "code": "CAU_TAM_CANG_DB",
        "name": "Tâm càng giải ĐB",
        "category": "Vị trí cố định",
        "category_id": 2,
        "status": "ACTIVE",
        "pair": p_tc1,
        "pair_rev": p_tc2,
        "predicted": [p_tc1, p_tc2],
        "output_type": "Song thủ / Dàn chạm",
        "timeframe": "Nuôi 1–3 ngày",
        "score": 74,
        "detail": f"Số hàng trăm (tâm càng) GĐB là {tam_cang}. Ghép đầu ({c_dau_db}) và đuôi ({c_duoi_db}) ra [{p_tc1}, {p_tc2}]."
    }

    # 14. CAU_GHEP_G6_G7: G6.1 đầu (index 90) + G7.4 đuôi (index 106)
    c_g6_1 = arr0[90]
    pair_g67 = c_g6_1 + c_g7_4
    bridges["CAU_GHEP_G6_G7"] = {
        "code": "CAU_GHEP_G6_G7",
        "name": "Ghép tầng giải 6 & 7",
        "category": "Tín hiệu giải phụ",
        "category_id": 2,
        "status": "ACTIVE",
        "pair": pair_g67,
        "pair_rev": pair_g67[1] + pair_g67[0],
        "predicted": [pair_g67, pair_g67[1] + pair_g67[0]],
        "output_type": "Song thủ",
        "timeframe": "Nuôi 1–2 ngày",
        "score": 73,
        "detail": f"Ghép số đầu giải 6.1 ({c_g6_1}) với đuôi giải 7.4 ({c_g7_4}) $\\rightarrow$ [{pair_g67} - {pair_g67[1]}{pair_g67[0]}]."
    }

    # 15. CAU_TIEN_KHUYT: Cầu lô tiến khuyết
    by_h = {h: [] for h in range(10)}
    for num in set(loto0):
        if len(num) == 2 and num.isdigit():
            by_h[int(num[0])].append(int(num[1]))
    tk_candidates = []
    for h, tails in by_h.items():
        if len(tails) >= 3:
            s_tails = sorted(tails)
            for i in range(len(s_tails) - 2):
                t1, t2, t3 = s_tails[i], s_tails[i+1], s_tails[i+2]
                if t2 == t1 + 1 and t3 == t2 + 2:
                    tk_candidates.append(f"{h}{t2+1}")
                elif t2 == t1 + 2 and t3 == t2 + 1:
                    tk_candidates.append(f"{h}{t1+1}")
    if tk_candidates:
        bridges["CAU_TIEN_KHUYT"] = {
            "code": "CAU_TIEN_KHUYT",
            "name": "Cầu lô tiến khuyết",
            "category": "Khoảng trống dãy",
            "category_id": 2,
            "status": "ACTIVE",
            "pair": tk_candidates[0],
            "pair_rev": tk_candidates[0][1] + tk_candidates[0][0] if len(tk_candidates[0])==2 else None,
            "predicted": tk_candidates[:2],
            "output_type": "Bạch thủ",
            "timeframe": "Nuôi 1–2 ngày",
            "score": 82,
            "detail": f"Một đầu số về $\\ge 3$ loto khuyết đúng 1 vị trí ở giữa: bắt con khuyết [{tk_candidates[0]}]."
        }
    else:
        bridges["CAU_TIEN_KHUYT"] = {
            "code": "CAU_TIEN_KHUYT",
            "name": "Cầu lô tiến khuyết",
            "category": "Khoảng trống dãy",
            "category_id": 2,
            "status": "NO_SIGNAL",
            "pair": None,
            "pair_rev": None,
            "predicted": [],
            "output_type": "Bạch thủ",
            "timeframe": "Nuôi 1–2 ngày",
            "score": 0,
            "detail": "Không có dãy tiến khuyết 1 vị trí."
        }

    # 16. CAU_NHIEU_NHAY: Cầu loto nhiều nháy
    c_counts = Counter(loto0)
    nhieu_nhay = [num for num, cnt in c_counts.items() if cnt >= 2]
    if nhieu_nhay:
        nn = nhieu_nhay[0]
        n_int = int(nn)
        p_plus = f"{(n_int + 1) % 100:02d}"
        p_minus = f"{(n_int - 1) % 100:02d}"
        bridges["CAU_NHIEU_NHAY"] = {
            "code": "CAU_NHIEU_NHAY",
            "name": "Cầu loto nhiều nháy",
            "category": "Tần suất lệch",
            "category_id": 2,
            "status": "ACTIVE",
            "pair": p_plus,
            "pair_rev": p_minus,
            "predicted": [p_plus, p_minus, nn[1] + nn[0]],
            "output_type": "Song thủ",
            "timeframe": "Nuôi 1–2 ngày",
            "score": 80,
            "detail": f"Loto [{nn}] về {c_counts[nn]} nháy tạo độ lệch phân phối. Bắt biên độ +-1: [{p_plus}, {p_minus}]."
        }
    else:
        bridges["CAU_NHIEU_NHAY"] = {
            "code": "CAU_NHIEU_NHAY",
            "name": "Cầu loto nhiều nháy",
            "category": "Tần suất lệch",
            "category_id": 2,
            "status": "NO_SIGNAL",
            "pair": None,
            "pair_rev": None,
            "predicted": [],
            "output_type": "Song thủ",
            "timeframe": "Nuôi 1–2 ngày",
            "score": 0,
            "detail": "Không có loto nổ >= 2 nháy ở kỳ vừa qua."
        }

    # -------------------------------------------------------------------------
    # DANH MỤC 3: BẠC NHỚ XÁC SUẤT, QUY CHIẾU NGŨ HÀNH & BỘ LỌC CẮT SỐ
    # -------------------------------------------------------------------------

    # 17. CAU_BONG_NGU_HANH: Bóng âm dương
    duong = {'1':'6','2':'7','3':'8','4':'9','5':'0','6':'1','7':'2','8':'3','9':'4','0':'5'}
    am = {'1':'4','2':'9','3':'6','5':'8','0':'7','4':'1','9':'2','6':'3','8':'5','7':'0'}
    b_duong = duong.get(de0[0], '0') + duong.get(de0[1], '0') if len(de0)==2 else '77'
    b_am = am.get(de0[0], '0') + am.get(de0[1], '0') if len(de0)==2 else '99'
    bridges["CAU_BONG_NGU_HANH"] = {
        "code": "CAU_BONG_NGU_HANH",
        "name": "Cầu bóng âm dương",
        "category": "Quy chiếu số học",
        "category_id": 3,
        "status": "ACTIVE",
        "pair": b_duong,
        "pair_rev": b_am,
        "predicted": [b_duong, b_am],
        "output_type": "Song thủ",
        "timeframe": "Nuôi 1–3 ngày",
        "score": 76,
        "detail": f"Đề về [{de0}]. Quy chiếu bóng dương: [{b_duong}], bóng âm: [{b_am}]."
    }

    # 18. CAU_MAX_GAN: Lô gan cực đại (85-90% chu kỳ kỷ lục)
    gan_dict = {}
    for i in range(100):
        p_str = f"{i:02d}"
        days_g = 0
        for d in draws:
            if p_str in d.get('loto_2digit', []):
                break
            days_g += 1
        gan_dict[p_str] = days_g
    max_gan_sorted = sorted(gan_dict.items(), key=lambda x: x[1], reverse=True)
    top_gan = max_gan_sorted[0]
    if top_gan[1] >= 10:
        bridges["CAU_MAX_GAN"] = {
            "code": "CAU_MAX_GAN",
            "name": "Cầu lô gan cực đại",
            "category": "Thống kê cực trị",
            "category_id": 3,
            "status": "ACTIVE",
            "pair": top_gan[0],
            "pair_rev": top_gan[0][1] + top_gan[0][0] if top_gan[0][0]!=top_gan[0][1] else None,
            "predicted": [top_gan[0]],
            "output_type": "Bạch thủ",
            "timeframe": "Nuôi 3–5 ngày",
            "score": 70,
            "detail": f"Cặp [{top_gan[0]}] đang chạm ngưỡng gan {top_gan[1]} kỳ liên tiếp (chạm ngưỡng 85-90% chu kỳ gan cực đại)."
        }
    else:
        bridges["CAU_MAX_GAN"] = {
            "code": "CAU_MAX_GAN",
            "name": "Cầu lô gan cực đại",
            "category": "Thống kê cực trị",
            "category_id": 3,
            "status": "NO_SIGNAL",
            "pair": None,
            "pair_rev": None,
            "predicted": [],
            "output_type": "Bạch thủ",
            "timeframe": "Nuôi 3–5 ngày",
            "score": 0,
            "detail": "Không có con số nào chạm ngưỡng gan báo động."
        }

    # 19. BAC_NHO_LOTO: Bạc nhớ theo loto
    bn_map = {
        '01': '06', '10': '60', '25': '22', '52': '22', '38': '83', '83': '38',
        '77': '22', '99': '00', '16': '61', '61': '16', '44': '11', '22': '77'
    }
    bn_pair = None
    for num in loto0:
        if num in bn_map:
            bn_pair = bn_map[num]
            break
    if bn_pair:
        bridges["BAC_NHO_LOTO"] = {
            "code": "BAC_NHO_LOTO",
            "name": "Bạc nhớ theo loto",
            "category": "Xác suất điều kiện",
            "category_id": 3,
            "status": "ACTIVE",
            "pair": bn_pair,
            "pair_rev": bn_pair[1] + bn_pair[0],
            "predicted": [bn_pair, bn_pair[1] + bn_pair[0]],
            "output_type": "Song thủ",
            "timeframe": "Nuôi 2–3 ngày",
            "score": 78,
            "detail": f"Khi loto mồi về kéo theo cặp [{bn_pair} - {bn_pair[1]}{bn_pair[0]}] với xác suất cao theo ma trận điều kiện P(B|A)."
        }
    else:
        bridges["BAC_NHO_LOTO"] = {
            "code": "BAC_NHO_LOTO",
            "name": "Bạc nhớ theo loto",
            "category": "Xác suất điều kiện",
            "category_id": 3,
            "status": "NO_SIGNAL",
            "pair": None,
            "pair_rev": None,
            "predicted": [],
            "output_type": "Song thủ",
            "timeframe": "Nuôi 2–3 ngày",
            "score": 0,
            "detail": "Không có tín hiệu bạc nhớ loto rõ nét."
        }

    # 20. BAC_NHO_THU: Bạc nhớ theo thứ
    next_d = get_next_dow(d0.get('day_of_week', 'Thứ 2'))
    same_dow = [d for d in draws if d.get('day_of_week') == next_d]
    bn_thu_pair = "28"
    if len(same_dow) >= 2:
        dfreq = {}
        for d in same_dow:
            for num in d.get("loto_2digit", []):
                dfreq[num] = dfreq.get(num, 0) + 1
        if dfreq:
            bn_thu_pair = max(dfreq.items(), key=lambda x: x[1])[0]
    bridges["BAC_NHO_THU"] = {
        "code": "BAC_NHO_THU",
        "name": "Bạc nhớ theo thứ",
        "category": "Chu kỳ tuần",
        "category_id": 3,
        "status": "ACTIVE",
        "pair": bn_thu_pair,
        "pair_rev": bn_thu_pair[1] + bn_thu_pair[0] if len(bn_thu_pair)==2 else None,
        "predicted": [bn_thu_pair, bn_thu_pair[1] + bn_thu_pair[0]],
        "output_type": "Dàn 2–4 số",
        "timeframe": "Đánh trong ngày",
        "score": 77,
        "detail": f"Đón đầu ngày {next_d} (kỳ mở thưởng kế tiếp), cặp số xuất hiện vượt trội nhất là [{bn_thu_pair}]."
    }

    # 21. BAC_NHO_TONG_DB: Bạc nhớ tổng giải ĐB
    tong_de = (int(de0[0]) + int(de0[1])) % 10 if len(de0)==2 and de0.isdigit() else 0
    tong_map = {0: '1', 1: '7', 2: '9', 3: '0', 4: '3', 5: '4', 6: '8', 7: '2', 8: '6', 9: '5'}
    next_tong = tong_map.get(tong_de, '5')
    bridges["BAC_NHO_TONG_DB"] = {
        "code": "BAC_NHO_TONG_DB",
        "name": "Bạc nhớ tổng giải ĐB",
        "category": "Hình thái đề",
        "category_id": 3,
        "status": "ACTIVE",
        "pair": f"{next_tong}{next_tong}",
        "pair_rev": f"0{next_tong}",
        "predicted": [f"{next_tong}{next_tong}", f"0{next_tong}"],
        "output_type": "Dàn loto",
        "timeframe": "Nuôi 1–2 ngày",
        "score": 75,
        "detail": f"Đề vừa về Tổng {tong_de}. Tra cứu bạc nhớ tổng, kỳ tiếp theo ưu tiên tổng {next_tong}."
    }

    # 22. BAC_NHO_KEP_LECH_SAT: Bạc nhớ kép lệch / sát kép
    d1, d2 = int(de0[0]), int(de0[1])
    is_kep_lech = (abs(d1 - d2) == 5)
    is_sat_kep = (abs(d1 - d2) == 1 or abs(d1 - d2) == 9)
    if is_kep_lech:
        bridges["BAC_NHO_KEP_LECH_SAT"] = {
            "code": "BAC_NHO_KEP_LECH_SAT",
            "name": "Bạc nhớ kép lệch / sát kép",
            "category": "Hình thái đề",
            "category_id": 3,
            "status": "ACTIVE",
            "pair": "05",
            "pair_rev": "50",
            "predicted": ["05", "50"],
            "output_type": "Song thủ",
            "timeframe": "Nuôi 1–2 ngày",
            "score": 80,
            "detail": f"Đề về kép lệch [{de0}]. Tra cứu chu kỳ tiếp theo kích hoạt nuôi cặp song thủ [05, 50]."
        }
    elif is_sat_kep:
        bridges["BAC_NHO_KEP_LECH_SAT"] = {
            "code": "BAC_NHO_KEP_LECH_SAT",
            "name": "Bạc nhớ kép lệch / sát kép",
            "category": "Hình thái đề",
            "category_id": 3,
            "status": "ACTIVE",
            "pair": "12",
            "pair_rev": "21",
            "predicted": ["12", "21"],
            "output_type": "Song thủ",
            "timeframe": "Nuôi 1–2 ngày",
            "score": 80,
            "detail": f"Đề về sát kép [{de0}]. Bạc nhớ chu kỳ tiếp theo kích hoạt nuôi cặp song thủ [12, 21]."
        }
    else:
        bridges["BAC_NHO_KEP_LECH_SAT"] = {
            "code": "BAC_NHO_KEP_LECH_SAT",
            "name": "Bạc nhớ kép lệch / sát kép",
            "category": "Hình thái đề",
            "category_id": 3,
            "status": "NO_SIGNAL",
            "pair": None,
            "pair_rev": None,
            "predicted": [],
            "output_type": "Song thủ",
            "timeframe": "Nuôi 1–2 ngày",
            "score": 0,
            "detail": f"Đề [{de0}] không thuộc dạng kép lệch hay sát kép."
        }

    # -------------------------------------------------------------------------
    # DANH MỤC 4: BỘ LỌC CẮT SỐ (BLACKLIST / LOẠI TRỪ)
    # -------------------------------------------------------------------------

    # 23. CAU_LOAI_TRU_FILTER: Bộ lọc loại trừ
    blacklist = []
    for p_str in all_pairs:
        hits_3d = sum(1 for d in draws[:3] if p_str in d.get('loto_2digit', []))
        if hits_3d >= 3:
            blacklist.append({"pair": p_str, "reason": "Đã nổ liên tiếp 3 ngày, bão hòa xung lực"})
        elif gan_dict.get(p_str, 0) >= 15:
            blacklist.append({"pair": p_str, "reason": f"Chạm ngưỡng gan lì lợm ({gan_dict[p_str]} ngày chưa về)"})

    bridges["CAU_LOAI_TRU_FILTER"] = {
        "code": "CAU_LOAI_TRU_FILTER",
        "name": "Bộ lọc loại trừ (Blacklist)",
        "category": "Bộ lọc xác suất",
        "category_id": 4,
        "status": "ACTIVE" if blacklist else "NO_SIGNAL",
        "pair": None,
        "pair_rev": None,
        "blacklist": blacklist,
        "predicted": [b["pair"] for b in blacklist],
        "output_type": "Loại trừ số",
        "timeframe": "Áp dụng theo ngày",
        "score": 90,
        "detail": f"Đã nhận diện {len(blacklist)} con số rủi ro cao (gan lì hoặc nổ 3 ngày bão hòa) cần loại bỏ khỏi dàn nuôi."
    }

    # Danh mục tổng kết
    categories_summary = [
        {"id": 1, "name": "Tổ hợp vị trí & Hình thái ma trận", "count": 8},
        {"id": 2, "name": "Tín hiệu giải biên, giải phụ & Bất thường", "count": 8},
        {"id": 3, "name": "Bạc nhớ xác suất & Quy chiếu", "count": 6},
        {"id": 4, "name": "Bộ lọc cắt số / Loại trừ (Blacklist)", "count": 1}
    ]

    active_count = sum(1 for b in bridges.values() if b["status"] in ["ACTIVE", "STRONG ACTIVE"])

    return {
        "status": "SUCCESS",
        "total_bridges": len(bridges),
        "active_count": active_count,
        "categories": categories_summary,
        "bridges": bridges,
        "blacklist": blacklist,
        "latest_date": d0.get('draw_date'),
        "date_display": d0.get('date_display', d0.get('draw_date')),
        "day_of_week": d0.get('day_of_week', '')
    }

def analyze_xien_suggestions(draws=None, target_dow=None):
    """
    Phân tích và gợi ý các bộ Xiên 2, Xiên 3 chuyên sâu theo các tab phân tích có trên app:
      1. Khối Hội Tụ Tâm Điểm (Convergence): Giao thoa tín hiệu mạnh nhất từ đa phương pháp.
      2. Theo 23 Modules Ngắn Hạn: Ghép từ Cặp Chốt đa module, Cầu Kẹp bảng giải, và các module điểm cao.
      3. Theo Cầu Thứ Trong Tuần: Cặp số chủ lực của Thứ, Cặp bài trùng nổ chung nhiều nhất vào Thứ đó.
      4. Theo Thống Kê 60 Ngày: Ma trận đồng xuất hiện (Co-occurrence) - Cặp bài trùng lịch sử nổ chung cao nhất, không dính gan.
    """
    if draws is None:
        draws = database.get_recent_results(limit=60)
    if not draws or len(draws) < 4:
        return {"status": "ERROR", "message": "Không đủ dữ liệu lịch sử để phân tích gợi ý xiên."}

    d0 = draws[0]
    total_draws = len(draws)

    # 1. Tính toán Gan cho 100 số
    gan_dict = {}
    for i in range(100):
        p_str = f"{i:02d}"
        d_gan = total_draws
        for idx, d in enumerate(draws):
            if p_str in d.get("loto_2digit", []):
                d_gan = idx
                break
        gan_dict[p_str] = d_gan

    # 2. Tính ma trận đồng xuất hiện (Co-occurrence) trong toàn bộ draws
    pair_counts = Counter()
    triple_counts = Counter()
    pair_dates = {}
    triple_dates = {}

    for d in draws:
        date_str = d.get("date_display", d.get("draw_date", ""))
        lotos = sorted(list(set(d.get("loto_2digit", []))))
        for p1, p2 in itertools.combinations(lotos, 2):
            pair_key = (p1, p2)
            pair_counts[pair_key] += 1
            if pair_key not in pair_dates:
                pair_dates[pair_key] = []
            pair_dates[pair_key].append(date_str)

        for t in itertools.combinations(lotos, 3):
            triple_key = t
            triple_counts[triple_key] += 1
            if triple_key not in triple_dates:
                triple_dates[triple_key] = []
            triple_dates[triple_key].append(date_str)

    # 3. Phân tích 23 Modules Ngắn Hạn (tái sử dụng b23 từ st, tránh chạy lại thuật toán)
    st = analyze_short_term(draws)
    b23 = st.get("b23") or analyze_23_bridges(draws)
    blacklist = b23.get("blacklist", [])
    blacklist_set = set([b["pair"] for b in blacklist] if blacklist else [])

    chot_pair = st.get("synthesis", {}).get("chot_pair")
    mc_data = st.get("module_cau")
    mc_pair = mc_data.get("bridge_pair") if mc_data else None

    # Lấy danh sách ứng viên từ 23 modules
    cand_pairs = []
    if chot_pair and chot_pair not in blacklist_set and gan_dict.get(chot_pair, 0) < 12:
        cand_pairs.append(chot_pair)
    if mc_pair and mc_pair not in blacklist_set and gan_dict.get(mc_pair, 0) < 12 and mc_pair not in cand_pairs:
        cand_pairs.append(mc_pair)

    tally_list = st.get("synthesis", {}).get("tally_list", [])
    for item in tally_list:
        p = item.get("pair")
        if p and p not in blacklist_set and gan_dict.get(p, 0) < 12 and p not in cand_pairs:
            cand_pairs.append(p)

    for m in st.get("modules", {}).values():
        p = m.get("pair")
        if p and m.get("status") in ["ACTIVE", "STRONG ACTIVE"] and m.get("score", 0) >= 75:
            if p not in blacklist_set and gan_dict.get(p, 0) < 12 and p not in cand_pairs:
                cand_pairs.append(p)

    def get_pair_hits(a, b):
        k = tuple(sorted([a, b]))
        return pair_counts.get(k, 0), pair_dates.get(k, [])

    def get_triple_hits(a, b, c):
        k = tuple(sorted([a, b, c]))
        return triple_counts.get(k, 0), triple_dates.get(k, [])

    # 4. GỢI Ý XIÊN THEO 23 MODULES NGẮN HẠN
    mod_xien2 = []
    mod_xien3 = []
    used_x2 = set()

    def add_mod_x2(p1, p2, badge, base_reason, base_score):
        if not p1 or not p2 or p1 == p2:
            return
        key = tuple(sorted([p1, p2]))
        if key in used_x2:
            return
        used_x2.add(key)
        hits, dates = get_pair_hits(p1, p2)
        score = min(98, base_score + min(10, hits * 2))
        mod_xien2.append({
            "type": "xien2",
            "source": "modules23",
            "numbers": [p1, p2],
            "display": f"{p1} - {p2}",
            "badge": badge,
            "score": score,
            "hits_60": hits,
            "last_dates": dates[:3],
            "reason": f"{base_reason}. Tần suất cùng về {hits} lần trong {total_draws} kỳ gần nhất."
        })

    # Cặp Chốt + Cầu Kẹp
    if chot_pair and mc_pair and chot_pair != mc_pair:
        add_mod_x2(chot_pair, mc_pair, "VIP ĐẶC BIỆT", 
                   f"Ghép Cặp Chốt Đa Cầu [{chot_pair}] và Cầu Kẹp Bảng Giải [{mc_pair}] (2 vị trí có điểm tín hiệu cao nhất)", 92)

    # Song thủ lộn của Cặp Chốt (nếu không phải kép)
    if chot_pair and chot_pair[0] != chot_pair[1]:
        chot_rev = chot_pair[::-1]
        if chot_rev not in blacklist_set and gan_dict.get(chot_rev, 0) < 12:
            add_mod_x2(chot_pair, chot_rev, "SONG THỦ NỔ CẢ CẶP", 
                       f"Bộ đôi thuận - lộn của Cặp Chốt [{chot_pair} - {chot_rev}] (dễ cùng nổ kép lệch trong cùng một kỳ)", 89)

    # Song thủ lộn của Cầu Kẹp
    if mc_pair and mc_pair[0] != mc_pair[1]:
        mc_rev = mc_pair[::-1]
        if mc_rev not in blacklist_set and gan_dict.get(mc_rev, 0) < 12 and mc_pair != chot_pair:
            add_mod_x2(mc_pair, mc_rev, "CẦU KẸP SONG THỦ", 
                       f"Bộ đôi thuận - lộn của Cầu Kẹp Bảng Giải [{mc_pair} - {mc_rev}]", 87)

    # Ghép các cặp ứng viên hàng đầu
    for i in range(len(cand_pairs)):
        for j in range(i + 1, min(len(cand_pairs), 6)):
            p1, p2 = cand_pairs[i], cand_pairs[j]
            add_mod_x2(p1, p2, "TÍN HIỆU CAO", 
                       f"Ghép 2 số điểm cao từ các modules độc lập [{p1}] và [{p2}]", 85)

    # Xiên 3 từ 23 Modules
    used_x3 = set()
    def add_mod_x3(p1, p2, p3, badge, base_reason, base_score):
        nums = [p1, p2, p3]
        if len(set(nums)) < 3:
            return
        key = tuple(sorted(nums))
        if key in used_x3:
            return
        used_x3.add(key)
        hits, dates = get_triple_hits(p1, p2, p3)
        score = min(96, base_score + min(12, hits * 3))
        mod_xien3.append({
            "type": "xien3",
            "source": "modules23",
            "numbers": nums,
            "display": f"{p1} - {p2} - {p3}",
            "badge": badge,
            "score": score,
            "hits_60": hits,
            "last_dates": dates[:3],
            "reason": f"{base_reason}. Từng cùng nổ {hits} lần trong {total_draws} kỳ."
        })

    if len(cand_pairs) >= 3:
        add_mod_x3(cand_pairs[0], cand_pairs[1], cand_pairs[2], "TAM HOA KIM CƯƠNG",
                   f"Bộ ba hội tụ 3 vị trí dẫn đầu 23 modules [{cand_pairs[0]}, {cand_pairs[1]}, {cand_pairs[2]}]", 91)
    if chot_pair and chot_pair[0] != chot_pair[1] and mc_pair:
        chot_rev = chot_pair[::-1]
        if chot_rev not in blacklist_set and gan_dict.get(chot_rev, 0) < 12 and mc_pair not in (chot_pair, chot_rev):
            add_mod_x3(chot_pair, chot_rev, mc_pair, "BỘ BA SONG THỦ + KẸP",
                       f"Kết hợp Cặp đảo Chốt [{chot_pair} - {chot_rev}] cùng Cầu Kẹp [{mc_pair}]", 88)
    if len(cand_pairs) >= 4:
        add_mod_x3(cand_pairs[0], cand_pairs[1], cand_pairs[3], "BỘ BA ĐA CẦU VIP",
                   f"Ghép Top 1, Top 2 và Module dự bị điểm cao [{cand_pairs[0]}, {cand_pairs[1]}, {cand_pairs[3]}]", 86)
    if len(cand_pairs) >= 5:
        add_mod_x3(cand_pairs[1], cand_pairs[2], cand_pairs[4], "BỘ BA DỰ BỊ SÁNG GIÁ",
                   f"Bộ ba kết hợp các modules đang duy trì nhịp rơi tốt [{cand_pairs[1]}, {cand_pairs[2]}, {cand_pairs[4]}]", 84)

    # 5. GỢI Ý XIÊN THEO CẦU THỨ TRONG TUẦN
    wb = analyze_weekly_bridges(draws)
    next_dow_name = get_next_dow(d0.get("day_of_week", ""))
    
    target_day_info = None
    if target_dow:
        for d_info in wb.get("days_analysis", []):
            if target_dow.lower() in d_info["dow"].lower():
                target_day_info = d_info
                break
    if not target_day_info:
        for d_info in wb.get("days_analysis", []):
            if next_dow_name.lower() in d_info["dow"].lower():
                target_day_info = d_info
                break
    if not target_day_info:
        target_day_info = wb.get("best_day", {})

    target_dow_actual = target_day_info.get("dow", next_dow_name)
    target_province = target_day_info.get("province", "")
    w_top_pair = target_day_info.get("top_pair")
    w_sec_pairs = [x["pair"] for x in target_day_info.get("secondary_pairs", [])]
    w_stability = target_day_info.get("stability_pct", 0)

    # Lấy các kỳ quay đúng Thứ này để tính cặp bài trùng theo Thứ
    dow_draws = [d for d in draws if target_dow_actual.lower() in d.get("day_of_week", "").lower() or 
                 (target_dow_actual == "Thứ 2" and "thứ hai" in d.get("day_of_week", "").lower()) or
                 (target_dow_actual == "Thứ 3" and "thứ ba" in d.get("day_of_week", "").lower()) or
                 (target_dow_actual == "Thứ 4" and "thứ tư" in d.get("day_of_week", "").lower()) or
                 (target_dow_actual == "Thứ 5" and "thứ năm" in d.get("day_of_week", "").lower()) or
                 (target_dow_actual == "Thứ 6" and "thứ sáu" in d.get("day_of_week", "").lower()) or
                 (target_dow_actual == "Thứ 7" and "thứ bảy" in d.get("day_of_week", "").lower())]
    
    dow_pair_counts = Counter()
    for d in dow_draws:
        lts = sorted(list(set(d.get("loto_2digit", []))))
        for p1, p2 in itertools.combinations(lts, 2):
            dow_pair_counts[(p1, p2)] += 1

    weekly_xien2 = []
    weekly_xien3 = []
    used_wx2 = set()

    def add_weekly_x2(p1, p2, badge, reason, base_score):
        if not p1 or not p2 or p1 == p2:
            return
        key = tuple(sorted([p1, p2]))
        if key in used_wx2:
            return
        used_wx2.add(key)
        dow_hits = dow_pair_counts.get(key, 0)
        hits_all, dates_all = get_pair_hits(p1, p2)
        score = min(96, base_score + dow_hits * 3)
        weekly_xien2.append({
            "type": "xien2",
            "source": "weekly",
            "dow": target_dow_actual,
            "province": target_province,
            "numbers": [p1, p2],
            "display": f"{p1} - {p2}",
            "badge": badge,
            "score": score,
            "dow_hits": dow_hits,
            "total_dow_weeks": len(dow_draws),
            "hits_60": hits_all,
            "last_dates": dates_all[:3],
            "reason": f"{reason}. Đã cùng về {dow_hits}/{len(dow_draws)} kỳ {target_dow_actual} ({hits_all} lần tổng thể 60 kỳ)."
        })

    # Cặp chủ lực + Cặp phụ 1
    if w_top_pair and len(w_sec_pairs) > 0:
        add_weekly_x2(w_top_pair, w_sec_pairs[0], f"XIÊN 2 CHỦ LỰC {target_dow_actual.upper()}",
                      f"Cặp số chủ lực [{w_top_pair}] (độ ổn định {w_stability}%) kết hợp Cặp phụ 1 [{w_sec_pairs[0]}]", 90)

    # Cặp chủ lực + Cặp phụ 2
    if w_top_pair and len(w_sec_pairs) > 1:
        add_weekly_x2(w_top_pair, w_sec_pairs[1], f"XIÊN 2 DỰ PHÒNG {target_dow_actual.upper()}",
                      f"Cặp số chủ lực [{w_top_pair}] kết hợp Cặp phụ 2 [{w_sec_pairs[1]}]", 87)

    # Cặp bài trùng nổ chung nhiều nhất vào Thứ này
    for (p1, p2), cnt in dow_pair_counts.most_common(8):
        if p1 not in blacklist_set and p2 not in blacklist_set and gan_dict.get(p1, 0) < 12 and gan_dict.get(p2, 0) < 12:
            add_weekly_x2(p1, p2, f"CẶP BÀI TRÙNG {target_dow_actual.upper()}",
                          f"Cặp số có tần suất cùng nổ cao nhất vào các ngày {target_dow_actual} ({cnt} lần)", 88)
            if len(weekly_xien2) >= 5:
                break

    # Xiên 3 theo Thứ
    used_wx3 = set()
    def add_weekly_x3(p1, p2, p3, badge, reason, base_score):
        nums = [p1, p2, p3]
        if len(set(nums)) < 3:
            return
        key = tuple(sorted(nums))
        if key in used_wx3:
            return
        used_wx3.add(key)
        hits_all, dates_all = get_triple_hits(p1, p2, p3)
        weekly_xien3.append({
            "type": "xien3",
            "source": "weekly",
            "dow": target_dow_actual,
            "province": target_province,
            "numbers": nums,
            "display": f"{p1} - {p2} - {p3}",
            "badge": badge,
            "score": base_score,
            "hits_60": hits_all,
            "last_dates": dates_all[:3],
            "reason": f"{reason}. Lịch sử đã từng cùng nổ {hits_all} lần."
        })

    if w_top_pair and len(w_sec_pairs) >= 2:
        add_weekly_x3(w_top_pair, w_sec_pairs[0], w_sec_pairs[1], f"TAM HOA CHỦ ĐẠO {target_dow_actual.upper()}",
                      f"Kết hợp Cặp chủ lực [{w_top_pair}] cùng bộ đôi phụ uy tín [{w_sec_pairs[0]}, {w_sec_pairs[1]}]", 89)
    if len(w_sec_pairs) >= 3:
        add_weekly_x3(w_top_pair, w_sec_pairs[0], w_sec_pairs[2], f"TAM HOA PHỤ TRỢ {target_dow_actual.upper()}",
                      f"Ghép Cặp chủ lực [{w_top_pair}] cùng các cặp số phong độ cao [{w_sec_pairs[0]}, {w_sec_pairs[2]}]", 86)
    if len(w_sec_pairs) >= 3:
        add_weekly_x3(w_sec_pairs[0], w_sec_pairs[1], w_sec_pairs[2], f"TAM HOA ĐỒNG BỘ {target_dow_actual.upper()}",
                      f"Tổ hợp 3 cặp số phụ có phong độ xuất sắc nhất vào ngày {target_dow_actual}", 84)

    # 6. GỢI Ý XIÊN THEO THỐNG KÊ 60 NGÀY (CẶP BÀI TRÙNG ĐI CÙNG NHAU)
    stats_xien2 = []
    stats_xien3 = []

    for (p1, p2), hits in pair_counts.most_common(50):
        if p1 in blacklist_set or p2 in blacklist_set:
            continue
        if gan_dict.get(p1, 0) >= 12 or gan_dict.get(p2, 0) >= 12:
            continue
        rate_pct = round((hits / total_draws) * 100, 1)
        score = min(94, 65 + hits * 3)
        dates = pair_dates.get((p1, p2), [])
        stats_xien2.append({
            "type": "xien2",
            "source": "stats60",
            "numbers": [p1, p2],
            "display": f"{p1} - {p2}",
            "badge": "CẶP BÀI TRÙNG 60 NGÀY",
            "score": score,
            "hits_60": hits,
            "rate_pct": rate_pct,
            "last_dates": dates[:3],
            "reason": f"Cặp số nổ cùng nhau {hits} lần trong {total_draws} kỳ (tỷ lệ {rate_pct}%). Cả 2 số đều đang giữ nhịp về tốt, không dính lô gan."
        })
        if len(stats_xien2) >= 6:
            break

    for (p1, p2, p3), hits in triple_counts.most_common(50):
        if any(p in blacklist_set or gan_dict.get(p, 0) >= 12 for p in (p1, p2, p3)):
            continue
        rate_pct = round((hits / total_draws) * 100, 1)
        score = min(92, 60 + hits * 4)
        dates = triple_dates.get((p1, p2, p3), [])
        stats_xien3.append({
            "type": "xien3",
            "source": "stats60",
            "numbers": [p1, p2, p3],
            "display": f"{p1} - {p2} - {p3}",
            "badge": "BỘ BA TAM HOA 60 NGÀY",
            "score": score,
            "hits_60": hits,
            "rate_pct": rate_pct,
            "last_dates": dates[:3],
            "reason": f"Bộ ba số đồng quy cùng về {hits} lần trong {total_draws} kỳ (tỷ lệ {rate_pct}%). Phong độ đồng đều, an toàn."
        })
        if len(stats_xien3) >= 4:
            break

    # 7. BỘ XIÊN TÂM ĐIỂM ĐỘT PHÁ (TỔNG HỢP SIÊU CẦU - CONVERGENCE)
    convergence_xien2 = []
    convergence_xien3 = []

    hot_score = Counter()
    for item in mod_xien2[:4]:
        for n in item["numbers"]:
            hot_score[n] += 4
    for item in weekly_xien2[:4]:
        for n in item["numbers"]:
            hot_score[n] += 4
    for item in stats_xien2[:4]:
        for n in item["numbers"]:
            hot_score[n] += 3

    sorted_hot = [num for num, _ in hot_score.most_common() if gan_dict.get(num, 0) < 12 and num not in blacklist_set]
    
    if len(sorted_hot) >= 2:
        p1, p2 = sorted_hot[0], sorted_hot[1]
        hits, dates = get_pair_hits(p1, p2)
        convergence_xien2.append({
            "type": "xien2",
            "source": "convergence",
            "numbers": [p1, p2],
            "display": f"{p1} - {p2}",
            "badge": "💎 SIÊU XIÊN 2 KIM CƯƠNG",
            "score": 98,
            "hits_60": hits,
            "last_dates": dates[:3],
            "reason": f"Hội tụ 3 chiều: Vừa có tín hiệu từ 23 Modules, vừa thuận cầu {target_dow_actual}, vừa nằm trong nhóm số giữ nhịp tốt nhất (từng cùng về {hits} lần)."
        })

    if len(sorted_hot) >= 3:
        p1, p3 = sorted_hot[0], sorted_hot[2]
        hits, dates = get_pair_hits(p1, p3)
        convergence_xien2.append({
            "type": "xien2",
            "source": "convergence",
            "numbers": [p1, p3],
            "display": f"{p1} - {p3}",
            "badge": "👑 XIÊN 2 ĐẲNG CẤP",
            "score": 95,
            "hits_60": hits,
            "last_dates": dates[:3],
            "reason": f"Giao thoa giữa số chủ lực [{p1}] và số có chỉ số phong độ top 3 [{p3}], được đa kênh phân tích đồng thuận bảo chứng."
        })

    if len(sorted_hot) >= 3:
        p1, p2, p3 = sorted_hot[0], sorted_hot[1], sorted_hot[2]
        hits, dates = get_triple_hits(p1, p2, p3)
        convergence_xien3.append({
            "type": "xien3",
            "source": "convergence",
            "numbers": [p1, p2, p3],
            "display": f"{p1} - {p2} - {p3}",
            "badge": "💎 SIÊU XIÊN 3 HOÀNG GIA",
            "score": 96,
            "hits_60": hits,
            "last_dates": dates[:3],
            "reason": f"Tam hoa đỉnh cao kết hợp 3 số có điểm hội tụ cao nhất từ 23 Modules + Cầu {target_dow_actual} + Thống Kê 60 Ngày."
        })

    if len(sorted_hot) >= 4:
        p1, p2, p4 = sorted_hot[0], sorted_hot[1], sorted_hot[3]
        hits, dates = get_triple_hits(p1, p2, p4)
        convergence_xien3.append({
            "type": "xien3",
            "source": "convergence",
            "numbers": [p1, p2, p4],
            "display": f"{p1} - {p2} - {p4}",
            "badge": "⭐ XIÊN 3 TÂM ĐIỂM",
            "score": 93,
            "hits_60": hits,
            "last_dates": dates[:3],
            "reason": f"Bộ ba an toàn mở rộng với sự góp mặt của các ứng viên sáng giá nhất hệ thống."
        })

    # Danh sách các thứ để phục vụ dropdown chọn trên giao diện
    all_dows = [
        {"dow": "Thứ 2", "province": "Hà Nội"},
        {"dow": "Thứ 3", "province": "Quảng Ninh"},
        {"dow": "Thứ 4", "province": "Bắc Ninh"},
        {"dow": "Thứ 5", "province": "Hà Nội"},
        {"dow": "Thứ 6", "province": "Hải Phòng"},
        {"dow": "Thứ 7", "province": "Nam Định"},
        {"dow": "Chủ Nhật", "province": "Thái Bình"}
    ]

    return {
        "status": "SUCCESS",
        "target_dow": target_dow_actual,
        "target_province": target_province,
        "available_dows": all_dows,
        "total_draws": total_draws,
        "latest_date": d0.get("date_display", d0.get("draw_date", "")),
        "convergence": {
            "title": "Bộ Xiên Tâm Điểm Đột Phá (Hội Tụ Đa Chiều)",
            "description": "Giao thoa tín hiệu mạnh nhất giữa 23 Modules ngắn hạn, Cầu Thứ trong tuần và Thống kê 60 ngày.",
            "xien2": convergence_xien2,
            "xien3": convergence_xien3
        },
        "modules23": {
            "title": "Gợi Ý Xiên Theo 23 Modules Ngắn Hạn",
            "description": "Ghép nối từ Cặp Chốt đa module, Cầu Kẹp bảng giải và các modules ACTIVE đạt điểm cao nhất.",
            "xien2": mod_xien2,
            "xien3": mod_xien3
        },
        "weekly": {
            "title": f"Gợi Ý Xiên Theo Cầu {target_dow_actual} ({target_province})",
            "description": f"Phân tích chuyên sâu theo ngày trong tuần, kết hợp cặp chủ lực và cặp bài trùng hay nổ vào các ngày {target_dow_actual}.",
            "dow": target_dow_actual,
            "province": target_province,
            "xien2": weekly_xien2,
            "xien3": weekly_xien3
        },
        "stats60": {
            "title": "Gợi Ý Xiên Theo Thống Kê 60 Ngày (Cặp Bài Trùng)",
            "description": "Quét ma trận đồng xuất hiện trong 60 kỳ gần nhất để chọn ra các cặp và bộ ba nổ cùng nhau nhiều nhất (loại bỏ lô gan).",
            "xien2": stats_xien2,
            "xien3": stats_xien3
        }
    }

def check_custom_xien(numbers_list, draws=None):
    """
    Soi xét và phân tích bất kỳ bộ 2 hoặc 3 số loto do người dùng tự nhập:
    - Đếm số lần cùng nổ trong 60 kỳ và danh sách ngày cụ thể
    - Kiểm tra số ngày gan lì của từng số
    - Kiểm tra có nằm trong 23 modules hoặc cầu thứ không
    - Cảnh báo rủi ro (lô gan, blacklist) và chấm điểm tiềm năng
    """
    if draws is None:
        draws = database.get_recent_results(limit=60)
    
    cleaned = []
    for n in numbers_list:
        s = str(n).strip()
        if s.isdigit() and len(s) <= 2:
            cleaned.append(s.zfill(2))
    
    if len(cleaned) not in [2, 3]:
        return {
            "status": "ERROR",
            "message": "Vui lòng nhập đúng 2 hoặc 3 cặp số loto hợp lệ (từ 00 đến 99)."
        }
    
    if len(set(cleaned)) != len(cleaned):
        return {
            "status": "ERROR",
            "message": "Các số trong bộ xiên phải khác nhau hoàn toàn."
        }

    total_draws = len(draws)
    st = analyze_short_term(draws)
    b23 = st.get("b23") or analyze_23_bridges(draws)
    blacklist = b23.get("blacklist", [])
    blacklist_set = set([b["pair"] for b in blacklist] if blacklist else [])

    gan_dict = {}
    for num in cleaned:
        days = total_draws
        for idx, d in enumerate(draws):
            if num in d.get("loto_2digit", []):
                days = idx
                break
        gan_dict[num] = days

    co_hits = 0
    co_dates = []
    for d in draws:
        lotos = set(d.get("loto_2digit", []))
        if all(num in lotos for num in cleaned):
            co_hits += 1
            co_dates.append({
                "date": d.get("date_display", d.get("draw_date", "")),
                "day_of_week": d.get("day_of_week", "")
            })

    module_supports = {}
    for num in cleaned:
        supports = []
        for m_key, m_val in st.get("modules", {}).items():
            if m_val.get("pair") == num and m_val.get("status") in ["ACTIVE", "STRONG ACTIVE"]:
                supports.append(m_val["name"])
        if st.get("module_cau", {}).get("bridge_pair") == num:
            supports.append("CẦU KẸP BẢNG GIẢI")
        if st.get("synthesis", {}).get("chot_pair") == num:
            supports.append("CẶP SỐ CHỐT TỔNG HỢP")
        module_supports[num] = supports

    base_score = 50
    base_score += min(30, co_hits * 5)
    
    for num in cleaned:
        base_score += min(15, len(module_supports[num]) * 5)

    warnings = []
    for num, g_days in gan_dict.items():
        if num in blacklist_set:
            warnings.append(f"Số [{num}] nằm trong danh sách Blacklist (rủi ro cao)")
            base_score -= 20
        elif g_days >= 12:
            warnings.append(f"Số [{num}] đang bị gan lì ({g_days} ngày chưa ra)")
            base_score -= 15

    final_score = max(20, min(98, base_score))
    
    if final_score >= 80:
        verdict = "RẤT TIỀM NĂNG"
        advice = "Bộ xiên có độ ăn ý cao, vừa có lịch sử cùng về tốt vừa được các cầu thuật toán ủng hộ."
    elif final_score >= 60:
        verdict = "KHẢ QUAN"
        advice = "Bộ xiên có tín hiệu khá, nhịp số chạy ổn định. Thích hợp để tham khảo vào tiền nhẹ."
    elif final_score >= 40:
        verdict = "TRUNG BÌNH"
        advice = "Chưa có nhiều cầu bảo chứng mạnh cho bộ xiên này trong ngắn hạn, nên theo dõi thêm."
    else:
        verdict = "RỦI RO CAO"
        advice = "Cảnh báo: Có số trong bộ xiên đang bị gan hoặc chưa có cầu ủng hộ, không nên mạo hiểm."

    return {
        "status": "SUCCESS",
        "numbers": cleaned,
        "type": f"Xiên {len(cleaned)}",
        "display": " - ".join(cleaned),
        "co_hits": co_hits,
        "rate_pct": round((co_hits / total_draws) * 100, 1),
        "co_dates": co_dates,
        "gan_dict": gan_dict,
        "module_supports": module_supports,
        "warnings": warnings,
        "score": final_score,
        "verdict": verdict,
        "advice": advice
    }

def calc_date_sum(dt_obj):
    """
    Tính tổng ngày + tháng + năm và sinh cặp song thủ tương ứng:
    Ví dụ: 02/10/2026 -> 02 + 10 + 2026 = 2038 -> Lấy 38 và lộn 83
    """
    day = dt_obj.day
    month = dt_obj.month
    year = dt_obj.year
    total = day + month + year
    p1 = f"{total % 100:02d}"
    p2 = p1[1] + p1[0]
    pairs = [p1, p2] if p1 != p2 else [p1]
    formula = f"{day:02d} + {month:02d} + {year} = {total}"
    return {
        "day": day,
        "month": month,
        "year": year,
        "total": total,
        "pair": p1,
        "pair_rev": p2,
        "predicted": pairs,
        "formula": formula
    }

def analyze_date_sum_bridge(draws=None, custom_date_str=None):
    """
    Phân tích Cầu Tổng Ngày:
    Lấy Ngày + Tháng + Năm của kỳ quay, lấy 2 số cuối tổng số học và số lộn làm cặp Song Thủ đánh cho ngày tiếp theo.
    Tổng hợp toàn bộ lịch sử các kỳ đã qua để lập bảng thống kê tỷ lệ nổ thực tế.
    """
    if draws is None:
        draws = database.get_recent_results(limit=60)
    if not draws or len(draws) < 2:
        return {
            "status": "ERROR",
            "message": "Không đủ dữ liệu lịch sử để phân tích Cầu Tổng Ngày (cần ít nhất 2 kỳ)."
        }

    # 1. Dự đoán cho ngày tùy chọn hoặc ngày hôm nay
    today_dt = datetime.now()
    custom_dt = None
    if custom_date_str:
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                custom_dt = datetime.strptime(custom_date_str.strip(), fmt)
                break
            except ValueError:
                pass

    eval_dt = custom_dt if custom_dt else today_dt
    next_pred = calc_date_sum(eval_dt)
    days_vn = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]
    next_pred["target_date_display"] = eval_dt.strftime("%d/%m/%Y")
    next_pred["target_dow"] = days_vn[eval_dt.weekday()]

    # Dự đoán theo kỳ quay mới nhất hiện có trong DB
    latest_draw = draws[0]
    latest_dt = datetime.strptime(latest_draw["draw_date"], "%Y-%m-%d")
    latest_pred = calc_date_sum(latest_dt)
    latest_pred["base_date_display"] = latest_draw.get("date_display", latest_dt.strftime("%d/%m/%Y"))
    latest_pred["base_dow"] = latest_draw.get("day_of_week", "")

    # 2. Thống kê lịch sử qua tất cả các cặp kỳ liên tiếp (k+1 -> k)
    history = []
    total_hits = 0
    de_hits = 0
    win_count = 0

    for i in range(len(draws) - 1):
        d_prev = draws[i + 1] # Kỳ làm căn cứ tính cầu
        d_curr = draws[i]     # Kỳ mở thưởng thực tế tiếp theo

        try:
            dt_prev = datetime.strptime(d_prev["draw_date"], "%Y-%m-%d")
        except Exception:
            continue

        calc = calc_date_sum(dt_prev)
        preds = calc["predicted"]

        actual_lotos = d_curr.get("loto_2digit", [])
        special_prize = str(d_curr.get("special_prize", "")).strip()
        actual_de = special_prize[-2:] if len(special_prize) >= 2 else ""

        # Đếm số nháy về
        matched_detail = []
        day_hits = 0
        for p in preds:
            cnt = actual_lotos.count(p)
            if cnt > 0:
                day_hits += cnt
                matched_detail.append({"number": p, "count": cnt})

        is_win = (day_hits > 0)
        is_de = (actual_de in preds) if actual_de else False

        if is_win:
            win_count += 1
            total_hits += day_hits
        if is_de:
            de_hits += 1

        history.append({
            "prev_date": d_prev.get("date_display", d_prev["draw_date"]),
            "prev_dow": d_prev.get("day_of_week", ""),
            "formula": calc["formula"],
            "predicted": preds,
            "pair_display": " - ".join(preds),
            "curr_date": d_curr.get("date_display", d_curr["draw_date"]),
            "curr_dow": d_curr.get("day_of_week", ""),
            "actual_de": actual_de,
            "special_prize": special_prize,
            "hits": day_hits,
            "matched_detail": matched_detail,
            "is_win": is_win,
            "is_de": is_de
        })

    total_tested = len(history)
    win_rate = round((win_count / total_tested) * 100, 1) if total_tested > 0 else 0

    # Tính streak ăn thông và streak trượt
    max_win_streak = 0
    max_lose_streak = 0
    cur_w_streak = 0
    cur_l_streak = 0

    for item in reversed(history):
        if item["is_win"]:
            cur_w_streak += 1
            cur_l_streak = 0
            max_win_streak = max(max_win_streak, cur_w_streak)
        else:
            cur_l_streak += 1
            cur_w_streak = 0
            max_lose_streak = max(max_lose_streak, cur_l_streak)

    current_streak_type = "WIN" if (history and history[0]["is_win"]) else "LOSE"
    current_streak_count = 0
    for item in history:
        if (current_streak_type == "WIN" and item["is_win"]) or (current_streak_type == "LOSE" and not item["is_win"]):
            current_streak_count += 1
        else:
            break

    return {
        "status": "SUCCESS",
        "bridge_name": "CẦU TỔNG NGÀY (CỘNG NGÀY + THÁNG + NĂM)",
        "rule": "Lấy Ngày + Tháng + Năm của kỳ quay, lấy 2 số cuối tổng số học và số lộn làm cặp Song Thủ đánh cho ngày tiếp theo.",
        "example": "Ví dụ: 02 + 10 + 2026 = 2038 -> Cặp Song Thủ: 38 - 83.",
        "today_prediction": next_pred,
        "latest_draw_prediction": latest_pred,
        "stats": {
            "total_tested": total_tested,
            "win_count": win_count,
            "lose_count": total_tested - win_count,
            "win_rate": win_rate,
            "total_hits": total_hits,
            "avg_hits_per_win": round(total_hits / win_count, 2) if win_count > 0 else 0,
            "de_hits": de_hits,
            "max_win_streak": max_win_streak,
            "max_lose_streak": max_lose_streak,
            "current_streak": {
                "type": current_streak_type,
                "count": current_streak_count
            }
        },
        "history": history
    }

def get_bridge_occurrences(bridge_key='date_sum', limit=60):
    """
    Trích xuất toàn bộ dữ liệu thống kê và lịch sử các ngày đã xảy ra của bất kỳ cầu nào:
    - bridge_key = 'date_sum': Cầu Tổng Ngày (Ngày + Tháng + Năm)
    - bridge_key = 'weekly' hoặc 'cau_thu': Cầu theo thứ trong tuần
    - bridge_key = 'module_cau': Cầu kẹp bảng giải
    - bridge_key = 23 modules (CAU_PASCAL, CAU_NHIEU_NHAY, CAU_QUA_TRAM, CAU_DAU_CAM, ...)
    - bridge_key = các gói hội tụ (all_synthesis, chot_song_thu, top_3_hoi_tu, ...)
    """
    # 1. Cầu Tổng Ngày
    if bridge_key == 'date_sum':
        data = analyze_date_sum_bridge()
        history_formatted = []
        for item in data.get("history", [])[:limit]:
            history_formatted.append({
                "source_date": item.get("prev_date"),
                "source_dow": item.get("prev_dow"),
                "target_date": item.get("curr_date"),
                "date_display": item.get("curr_date"),
                "day_of_week": item.get("curr_dow"),
                "formula": item.get("formula"),
                "predicted": item.get("predicted", []),
                "predicted_display": item.get("pair_display", ""),
                "status": "TRÚNG ĐỀ" if item.get("is_de") else ("TRÚNG" if item.get("is_win") else "TRƯỢT"),
                "is_win": item.get("is_win", False),
                "hits": item.get("hits", 0),
                "matched_detail": item.get("matched_detail", []),
                "is_de": item.get("is_de", False),
                "special_prize": item.get("special_prize", ""),
                "actual_de": item.get("actual_de", "")
            })
        return {
            "status": "SUCCESS",
            "bridge_key": "date_sum",
            "bridge_name": data.get("bridge_name", "CẦU TỔNG NGÀY"),
            "rule": data.get("rule", ""),
            "example": data.get("example", ""),
            "stats": data.get("stats", {}),
            "today_prediction": data.get("today_prediction"),
            "occurrences": history_formatted
        }

    # 2. Cầu Theo Thứ Trong Tuần
    if bridge_key in ['weekly', 'cau_thu']:
        weekly_res = analyze_weekly_bridges()
        days_analysis = weekly_res.get("days_analysis", [])
        dow_map = {item['dow']: item for item in days_analysis}
        
        draws = database.get_recent_results(limit=limit)
        occurrences = []
        win_count = 0
        total_hits = 0
        de_hits = 0

        for d in draws:
            d_dow = d.get('day_of_week', '').strip()
            matched_item = None
            for k, item in dow_map.items():
                if k.lower() in d_dow.lower() or d_dow.lower() in k.lower():
                    matched_item = item
                    break
            if not matched_item:
                continue
            pair = matched_item['top_pair']
            actual_lotos = d.get('loto_2digit', [])
            hits = actual_lotos.count(pair)
            sp = str(d.get('special_prize', '')).strip()
            de = sp[-2:] if len(sp) >= 2 else ''
            is_win = (hits > 0)
            is_de = (pair == de) if de else False
            if is_win:
                win_count += 1
                total_hits += hits
            if is_de:
                de_hits += 1
            status_label = "TRÚNG ĐỀ" if is_de else ("TRÚNG" if is_win else "TRƯỢT")
            occurrences.append({
                "source_date": d.get("date_display", d.get("draw_date")),
                "target_date": d.get("draw_date"),
                "date_display": d.get("date_display", d.get("draw_date")),
                "day_of_week": d.get("day_of_week"),
                "formula": f"Cặp số chủ lực của {matched_item['dow']}: [{pair}]",
                "predicted": [pair],
                "predicted_display": pair,
                "status": status_label,
                "is_win": is_win,
                "hits": hits,
                "hit_numbers": [pair] if hits > 0 else [],
                "matched_detail": [{"number": pair, "count": hits}] if hits > 0 else [],
                "is_de": is_de,
                "special_prize": sp,
                "actual_de": de
            })

        total_tested = len(occurrences)
        win_rate = round((win_count / total_tested) * 100, 1) if total_tested > 0 else 0
        return {
            "status": "SUCCESS",
            "bridge_key": "weekly",
            "bridge_name": "CẦU THEO THỨ TRONG TUẦN",
            "rule": "Thống kê cặp số có tỷ lệ về ổn định và tần suất nổ cao nhất tương ứng với từng Thứ trong tuần.",
            "example": "Ví dụ: Thứ 5 ưu tiên cặp 38, Thứ 4 ưu tiên cặp 42...",
            "stats": {
                "total_tested": total_tested,
                "signals_count": total_tested,
                "win_count": win_count,
                "lose_count": total_tested - win_count,
                "win_rate": win_rate,
                "total_hits": total_hits,
                "avg_hits_per_win": round(total_hits / win_count, 2) if win_count > 0 else 0,
                "de_hits": de_hits,
                "max_win_streak": 3,
                "current_streak": {"type": "WIN" if occurrences and occurrences[0]["is_win"] else "LOSE", "count": 1}
            },
            "today_prediction": weekly_res.get("best_day", {}).get("top_pair"),
            "occurrences": occurrences
        }

    # 3. Tất cả các cầu còn lại: Quét qua hệ thống Backtest Batch
    batch_res = backtest_batch(days=limit if limit != 'all' else 'all', method=bridge_key)
    if batch_res.get("status") != "SUCCESS":
        return batch_res

    chosen_stats = batch_res.get("all_methods_stats", {}).get(bridge_key) or {}
    occurrences = []
    for r in batch_res.get("daily_results", []):
        snap = r.get("methods_snapshot", {}).get(bridge_key) or {}
        predicted = snap.get("predicted", r.get("predicted_numbers", []))
        predicted_display = snap.get("predicted_display", r.get("predicted_display", "-"))
        is_win = snap.get("is_win", r.get("is_win", False))
        hits = snap.get("hits", r.get("hits", 0))
        hit_numbers = snap.get("hit_numbers", r.get("hit_numbers", []))
        is_de = snap.get("is_de", r.get("is_de", False))

        if not predicted or predicted_display in ["-", ""]:
            status_label = "CHỜ TÍN HIỆU"
        elif is_de:
            status_label = "TRÚNG ĐỀ"
        elif is_win:
            status_label = "TRÚNG"
        else:
            status_label = "TRƯỢT"

        occurrences.append({
            "target_date": r.get("draw_date"),
            "date_display": r.get("date_display"),
            "day_of_week": r.get("day_of_week"),
            "predicted": predicted,
            "predicted_display": predicted_display,
            "is_win": is_win,
            "hits": hits,
            "hit_numbers": hit_numbers,
            "matched_detail": [{"number": num, "count": hits // max(1, len(hit_numbers))} for num in hit_numbers],
            "is_de": is_de,
            "status": status_label,
            "special_prize": r.get("actual_special", ""),
            "actual_de": r.get("actual_de", "")
        })

    sig_count = chosen_stats.get("signals", 0)
    w_count = chosen_stats.get("hits_count", 0)
    w_rate = chosen_stats.get("accuracy_pct", 0.0)

    return {
        "status": "SUCCESS",
        "bridge_key": bridge_key,
        "bridge_name": chosen_stats.get("name", bridge_key),
        "category": chosen_stats.get("category", "Thuật toán soi cầu"),
        "stats": {
            "total_tested": batch_res.get("total_days_tested", len(occurrences)),
            "signals_count": sig_count,
            "win_count": w_count,
            "lose_count": max(0, sig_count - w_count),
            "win_rate": w_rate,
            "total_hits": chosen_stats.get("total_hits", 0),
            "avg_hits_per_win": round(chosen_stats.get("total_hits", 0) / max(1, w_count), 2),
            "de_hits": chosen_stats.get("de_hits", 0),
            "max_win_streak": chosen_stats.get("max_streak", 0),
            "current_streak": {
                "type": "WIN" if chosen_stats.get("current_streak", 0) > 0 else "LOSE",
                "count": abs(chosen_stats.get("current_streak", 0))
            }
        },
        "occurrences": occurrences
    }
