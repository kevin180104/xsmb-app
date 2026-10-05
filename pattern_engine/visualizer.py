# -*- coding: utf-8 -*-
"""
Pattern Engine - Pattern Visualizer & Graph Generator
Tạo cấu trúc dữ liệu đồ họa (Nodes, Edges, Draw Cards, Coordinate Mapping)
để frontend vẽ đường cầu trực quan bằng SVG overlay giống 100% hình mẫu tham khảo:
- Sắp xếp ngày gần nhất lên trên cùng (DESC)
- Có thẻ và hộp dự đoán cho ngày kế tiếp (sắp mở thưởng)
- Đường nối SVG chỉ thẳng từ kỳ gần nhất lên hộp dự đoán tiếp theo
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import numpy as np

from .data_model import DatasetSnapshot, ALL_COORDS, COORD_BY_INDEX, BONG_DUONG
from .primitives import RuleSpecification, OperationType, TargetType
from .backtest import BacktestResult, backtest_rule

def explain_digit_operation(rule: RuleSpecification, da: int, db: int, predicted_numbers: List[str]) -> str:
    """Tạo văn bản giải thích rõ ràng cơ chế ghép số / bóng / tổng của 2 chữ số cụ thể"""
    lbl_a = rule.coord_a.label
    lbl_b = rule.coord_b.label
    pred_str = " - ".join(predicted_numbers)
    
    if rule.operation == OperationType.CONCAT_PAIR:
        return f"Ghép {lbl_a}={da} & {lbl_b}={db} ➔ Cặp [{pred_str}]"
    elif rule.operation == OperationType.BONG_PAIR:
        ba = BONG_DUONG.get(da, (da + 5) % 10)
        bb = BONG_DUONG.get(db, (db + 5) % 10)
        return f"Bóng {lbl_a}={da} là {ba} & Bóng {lbl_b}={db} là {bb} ➔ Cặp [{pred_str}]"
    elif rule.operation == OperationType.SUM_DIFF_PAIR:
        s = (da + db) % 10
        df = abs(da - db)
        return f"Tổng ({da}+{db})%10={s} & Hiệu |{da}-{db}|={df} ➔ Cặp [{pred_str}]"
    elif rule.operation == OperationType.SUM_PAIR:
        s = (da + db) % 10
        return f"Tổng ({da}+{db})%10={s} ➔ Dàn tổng {s}"
    elif rule.operation == OperationType.DIFF_PAIR:
        df = abs(da - db)
        return f"Hiệu |{da}-{db}|={df} ➔ Dàn hiệu {df}"
    elif rule.operation == OperationType.CHAM_PAIR:
        return f"Chạm {da} hoặc {db}"
    return f"{rule.formula_display} ➔ [{pred_str}]"

def generate_visualization_payload(
    snapshot: DatasetSnapshot,
    backtest_res: BacktestResult,
    num_display_draws: int = 8
) -> Dict[str, Any]:
    """
    Sinh payload chi tiết cho hiển thị trực quan hóa đường cầu:
    1. upcomingCard: Thẻ dự đoán ngày sắp xổ kết quả tiếp theo (đặt ở trên cùng)
    2. drawCards: Danh sách N kỳ quay gần nhất sắp xếp từ mới nhất ở trên xuống cũ hơn ở dưới (DESC).
       Mỗi card có cấu trúc minh bạch:
       - incoming: Kết quả đối chiếu với cầu từ kỳ trước (T-1) báo sang (Trúng số nào, trượt số nào)
       - outgoing: Cầu báo kỳ này cho kỳ kế tiếp (T+1) với công thức giải nghĩa chi tiết
    3. nodes & edges: Toàn bộ các đỉnh (sources, targets) và các cạnh nối giữa các chữ số và giữa các ngày liên tiếp.
    4. explainText: Bản giải thích từng bước mạch lạc cho người dùng.
    """
    rule = backtest_res.rule
    pos_a = rule.pos_a
    pos_b = rule.pos_b
    coord_a = COORD_BY_INDEX[pos_a]
    coord_b = COORD_BY_INDEX[pos_b]

    n_total = snapshot.total_draws
    slice_count = min(num_display_draws, n_total)
    # Lấy N kỳ gần nhất theo thứ tự thời gian tăng dần để dựng liên kết
    draw_slice = snapshot.draw_records[-slice_count:]

    # Tìm tập hợp các cặp số trúng / dự đoán theo từng ngày
    history_by_src_date = {h.source_date: h for h in backtest_res.history}

    # Ngày sắp mở thưởng tiếp theo (Upcoming)
    latest_draw = draw_slice[-1]
    latest_dt = latest_draw.get("draw_date", "")
    latest_dt_disp = latest_draw.get("date_display", latest_dt)
    latest_da = int(snapshot.digit_matrix[snapshot.dates.index(latest_dt), pos_a]) if latest_dt in snapshot.dates else 0
    latest_db = int(snapshot.digit_matrix[snapshot.dates.index(latest_dt), pos_b]) if latest_dt in snapshot.dates else 0

    try:
        dt_obj = datetime.strptime(latest_dt, "%Y-%m-%d")
        next_dt_obj = dt_obj + timedelta(days=1)
        next_dt_str = next_dt_obj.strftime("%Y-%m-%d")
        next_dt_disp = next_dt_obj.strftime("%d/%m/%Y")
        dow_names = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]
        next_dow = dow_names[next_dt_obj.weekday()]
    except Exception:
        next_dt_str = "next"
        next_dt_disp = "Kỳ Kế Tiếp"
        next_dow = "Hôm nay"

    draw_cards = []
    nodes = []
    edges = []

    # Bản đồ theo dõi từng kỳ (từ cũ đến mới)
    for d_idx, draw in enumerate(draw_slice):
        dt = draw.get("draw_date", "")
        dt_disp = draw.get("date_display", dt)
        dow = draw.get("day_of_week", "")

        # 1. Chữ số tại 2 vị trí cầu trên kỳ này
        if dt in snapshot.dates:
            dt_matrix_idx = snapshot.dates.index(dt)
            curr_da = int(snapshot.digit_matrix[dt_matrix_idx, pos_a])
            curr_db = int(snapshot.digit_matrix[dt_matrix_idx, pos_b])
        else:
            curr_da = 0
            curr_db = 0

        curr_pred_ints = rule.predict_for_digits(curr_da, curr_db)
        curr_pred_strs = [f"{x:02d}" for x in curr_pred_ints]
        curr_formula_explain = explain_digit_operation(rule, curr_da, curr_db, curr_pred_strs)

        # 2. Xử lý phần OUTGOING (Cầu báo kỳ này cho kỳ kế tiếp)
        if d_idx < slice_count - 1:
            next_draw = draw_slice[d_idx + 1]
            tgt_dt = next_draw.get("draw_date", "")
            tgt_disp = next_draw.get("date_display", tgt_dt)
            is_upcoming_target = False
        else:
            tgt_dt = next_dt_str
            tgt_disp = f"{next_dt_disp} (Sắp mở thưởng)"
            is_upcoming_target = True

        outgoing_info = {
            "targetDate": tgt_dt,
            "targetDateDisplay": tgt_disp,
            "isUpcomingTarget": is_upcoming_target,
            "digitA": curr_da,
            "digitB": curr_db,
            "labelA": coord_a.label,
            "labelB": coord_b.label,
            "predictedNumbers": curr_pred_strs,
            "predictionDisplay": " - ".join(curr_pred_strs),
            "formulaExplain": curr_formula_explain
        }

        # 3. Xử lý phần INCOMING (Đối chiếu kết quả từ kỳ trước báo sang)
        incoming_info = {
            "hasIncoming": False,
            "prevDate": "",
            "prevDateDisplay": "",
            "predictedByPrev": [],
            "isHit": False,
            "matchedNumbers": [],
            "statusText": "Kỳ gốc bắt đầu theo dõi cầu"
        }

        if d_idx > 0:
            prev_draw = draw_slice[d_idx - 1]
            prev_dt = prev_draw.get("draw_date", "")
            prev_disp = prev_draw.get("date_display", prev_dt)
            prev_hist = history_by_src_date.get(prev_dt)

            if prev_hist:
                incoming_info["hasIncoming"] = True
                incoming_info["prevDate"] = prev_dt
                incoming_info["prevDateDisplay"] = prev_disp
                incoming_info["predictedByPrev"] = prev_hist.predicted_numbers
                incoming_info["isHit"] = prev_hist.hit
                incoming_info["matchedNumbers"] = prev_hist.matched_numbers
                if prev_hist.hit:
                    incoming_info["statusText"] = f"Ăn Lô [{', '.join(prev_hist.matched_numbers)}] (TRÚNG)"
                else:
                    incoming_info["statusText"] = f"Trượt [{', '.join(prev_hist.predicted_numbers)}] (TRƯỢT)"

        # 4. Build cấu trúc prizes có ID cho từng chữ số
        curr_g_idx = 0
        prizes_annotated = {}

        # 4.1. ĐB
        sp = str(draw.get("special_prize", "")).strip()
        sp_digits = []
        for c in sp[:5]:
            is_src_a = (curr_g_idx == pos_a)
            is_src_b = (curr_g_idx == pos_b)
            sp_digits.append({
                "char": c,
                "globalIndex": curr_g_idx,
                "domId": f"cell-d-{dt}-{curr_g_idx}",
                "isSourceA": is_src_a,
                "isSourceB": is_src_b,
                "isSource": (is_src_a or is_src_b)
            })
            curr_g_idx += 1
        prizes_annotated["special_prize"] = [{"value": sp, "digits": sp_digits}]

        # 4.2. G1..G7
        p_specs = [
            ("prize_1", 1, 5),
            ("prize_2", 2, 5),
            ("prize_3", 6, 5),
            ("prize_4", 4, 4),
            ("prize_5", 6, 4),
            ("prize_6", 3, 3),
            ("prize_7", 4, 2),
        ]
        for p_key, count, length in p_specs:
            raw_items = draw.get(p_key, [])
            if isinstance(raw_items, str):
                raw_items = [raw_items]
            sub_list = []
            for sub in range(count):
                item_str = str(raw_items[sub]) if sub < len(raw_items) else ""
                digits_list = []
                for c in item_str[:length]:
                    is_src_a = (curr_g_idx == pos_a)
                    is_src_b = (curr_g_idx == pos_b)
                    digits_list.append({
                        "char": c,
                        "globalIndex": curr_g_idx,
                        "domId": f"cell-d-{dt}-{curr_g_idx}",
                        "isSourceA": is_src_a,
                        "isSourceB": is_src_b,
                        "isSource": (is_src_a or is_src_b)
                    })
                    curr_g_idx += 1
                sub_list.append({
                    "value": item_str,
                    "digits": digits_list,
                    "subIndex": sub
                })
            prizes_annotated[p_key] = sub_list

        # 5. Bảng Lô tô 2 số gom nhóm theo Đầu (0..9)
        loto_list = draw.get("loto_2digit", [])
        loto_by_heads = {h: [] for h in range(10)}
        for item in loto_list:
            s = str(item).strip().zfill(2)
            if s.isdigit() and len(s) >= 2:
                head = int(s[0])
                # Đánh dấu isHit CHÍNH XÁC: Chỉ khi số này là số trúng từ kỳ trước báo sang!
                is_hit_num = (incoming_info["hasIncoming"] and s in incoming_info["matchedNumbers"])

                loto_by_heads[head].append({
                    "number": s,
                    "domId": f"loto-{dt}-{s}",
                    "isHit": is_hit_num
                })

        draw_cards.append({
            "drawDate": dt,
            "dateDisplay": dt_disp,
            "dayOfWeek": dow,
            "prizes": prizes_annotated,
            "lotoHeads": [{"head": h, "numbers": loto_by_heads[h]} for h in range(10)],
            "incoming": incoming_info,
            "outgoing": outgoing_info,
            # Tương thích ngược cho các binding cũ
            "hasPrediction": True,
            "prediction": curr_pred_strs,
            "hitStatus": incoming_info["isHit"] if incoming_info["hasIncoming"] else None
        })

    # Dựng Graph Nodes và Edges nối đường cầu
    for i in range(len(draw_slice) - 1):
        src_dt = draw_slice[i].get("draw_date", "")
        tgt_dt = draw_slice[i + 1].get("draw_date", "")
        hist_rec = history_by_src_date.get(src_dt)
        if not hist_rec:
            continue

        node_a_id = f"cell-d-{src_dt}-{pos_a}"
        node_b_id = f"cell-d-{src_dt}-{pos_b}"

        # Đỉnh A và B trên kỳ nguồn
        nodes.append({
            "id": node_a_id,
            "drawDate": src_dt,
            "role": "source_a",
            "globalIndex": pos_a,
            "label": coord_a.label,
            "value": hist_rec.digit_a
        })
        nodes.append({
            "id": node_b_id,
            "drawDate": src_dt,
            "role": "source_b",
            "globalIndex": pos_b,
            "label": coord_b.label,
            "value": hist_rec.digit_b
        })

        # Cạnh nối ngang giữa Source A và Source B trên cùng kỳ
        edges.append({
            "from": node_a_id,
            "to": node_b_id,
            "type": "source_pair",
            "date": src_dt,
            "status": "ACTIVE"
        })

        # Cạnh nối từ Source sang Target trúng thưởng của ngày tiếp theo
        if hist_rec.hit and hist_rec.matched_numbers:
            for hit_idx, hit_num in enumerate(hist_rec.matched_numbers):
                target_dom_id = f"loto-{tgt_dt}-{hit_num}"
                nodes.append({
                    "id": target_dom_id,
                    "drawDate": tgt_dt,
                    "role": "target_hit",
                    "value": hit_num,
                    "hit": True
                })
                # Nối mũi tên từ source sang số trúng (nối số đầu tiên để tránh rối)
                if hit_idx == 0:
                    edges.append({
                        "from": node_b_id,
                        "to": target_dom_id,
                        "type": "bridge_hit",
                        "sourceDate": src_dt,
                        "targetDate": tgt_dt,
                        "status": "HIT",
                        "matchedNumber": hit_num
                    })

    # Cầu cho kỳ mới nhất tới kỳ sắp mở thưởng (Upcoming Draw)
    upcoming_target_id = f"upcoming-box-{next_dt_str}"
    upcoming_explain = explain_digit_operation(rule, latest_da, latest_db, backtest_res.next_prediction)

    upcoming_card = {
        "isUpcoming": True,
        "drawDate": next_dt_str,
        "dateDisplay": next_dt_disp,
        "dayOfWeek": next_dow,
        "prediction": backtest_res.next_prediction,
        "formula": rule.formula_display,
        "formulaExplain": upcoming_explain,
        "sourceValues": f"{coord_a.label}={latest_da} & {coord_b.label}={latest_db}",
        "sourceDate": latest_dt,
        "sourceDateDisplay": latest_dt_disp,
        "targetDomId": upcoming_target_id,
        "status": "PENDING"
    }

    # Đỉnh Source trên kỳ gần nhất
    nodes.append({
        "id": f"cell-d-{latest_dt}-{pos_a}",
        "drawDate": latest_dt,
        "role": "source_a",
        "globalIndex": pos_a,
        "label": coord_a.label,
        "value": latest_da
    })
    nodes.append({
        "id": f"cell-d-{latest_dt}-{pos_b}",
        "drawDate": latest_dt,
        "role": "source_b",
        "globalIndex": pos_b,
        "label": coord_b.label,
        "value": latest_db
    })
    edges.append({
        "from": f"cell-d-{latest_dt}-{pos_a}",
        "to": f"cell-d-{latest_dt}-{pos_b}",
        "type": "source_pair",
        "date": latest_dt,
        "status": "PENDING_NEXT"
    })

    # Đỉnh đích đến của hộp dự đoán (Không khoanh tròn SVG vòng quanh hộp)
    nodes.append({
        "id": upcoming_target_id,
        "drawDate": next_dt_str,
        "role": "upcoming_box",
        "skipCircle": True,
        "value": " - ".join(backtest_res.next_prediction)
    })
    edges.append({
        "from": f"cell-d-{latest_dt}-{pos_b}",
        "to": upcoming_target_id,
        "type": "bridge_upcoming",
        "sourceDate": latest_dt,
        "targetDate": next_dt_str,
        "status": "UPCOMING",
        "prediction": backtest_res.next_prediction
    })

    # Chuẩn bị văn bản giải thích chi tiết
    explanation_steps = []
    for h in backtest_res.history[-6:]:
        st = "TRÚNG" if h.hit else "TRƯỢT"
        matched_txt = f", về số [{', '.join(h.matched_numbers)}]" if h.hit else ""
        step_expl = explain_digit_operation(rule, h.digit_a, h.digit_b, h.predicted_numbers)
        explanation_steps.append(
            f"• Kỳ {h.source_date_display}: {step_expl}. "
            f"Sang kỳ {h.target_date_display}: {st}{matched_txt}."
        )

    # ĐẢO NGƯỢC THỨ TỰ: Ngày gần nhất ở TRÊN CÙNG (DESC), cũ dần xuống dưới
    draw_cards_desc = list(reversed(draw_cards))

    return {
        "pattern": backtest_res.to_dict(include_history_limit=15),
        "upcomingCard": upcoming_card,
        "drawCards": draw_cards_desc,
        "graph": {
            "nodes": nodes,
            "edges": edges
        },
        "explanation": {
            "summary": f"Đường cầu xuất phát từ 2 vị trí: {coord_a.display_prize} [{coord_a.label}] và {coord_b.display_prize} [{coord_b.label}].",
            "operation": rule.formula_display,
            "currentStreak": backtest_res.current_streak,
            "nextPrediction": backtest_res.next_prediction,
            "steps": explanation_steps
        }
    }
