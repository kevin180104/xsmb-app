# -*- coding: utf-8 -*-
"""
Pattern Engine - Service Layer
Quản lý vòng đời snapshot bộ nhớ đệm (In-memory caching),
xử lý các yêu cầu API và kết nối giữa Flask routes với core algorithms.
"""
from typing import Dict, Any, Optional, List
import time
from datetime import datetime, timedelta
import database
from .data_model import build_dataset_snapshot, DatasetSnapshot, ALL_COORDS, COORD_BY_INDEX
from .primitives import RuleSpecification, OperationType, TargetType
from .backtest import backtest_rule, BacktestResult, find_matched_locations
from .miner import PatternMiner
from .visualizer import generate_visualization_payload

# Bộ nhớ đệm In-memory
_SNAPSHOT_CACHE: Optional[DatasetSnapshot] = None
_CACHE_TIMESTAMP: float = 0.0
_SCAN_RESULTS_CACHE: Dict[str, Any] = {}

def get_cached_snapshot(
    force_refresh: bool = False,
    limit_draws: Optional[int] = None,
    anchor_date: Optional[str] = None
) -> DatasetSnapshot:
    """
    Lấy hoặc khởi tạo DatasetSnapshot từ database.
    Tự động tái sử dụng nếu chưa có kỳ quay mới.
    Hỗ trợ anchor_date để cắt lát dữ liệu dừng tại một kỳ quay cụ thể trong quá khứ.
    """
    global _SNAPSHOT_CACHE, _CACHE_TIMESTAMP, _SCAN_RESULTS_CACHE
    now = time.time()
    
    # Refresh nếu bị ép buộc hoặc cache đã tồn tại quá 10 phút
    if force_refresh or _SNAPSHOT_CACHE is None or (now - _CACHE_TIMESTAMP > 600):
        draws = database.get_recent_results(limit=1000)
        _SNAPSHOT_CACHE = build_dataset_snapshot(draws)
        _CACHE_TIMESTAMP = now
        _SCAN_RESULTS_CACHE.clear()

    draws_list = _SNAPSHOT_CACHE.draw_records
    if anchor_date:
        target_idx = None
        for idx, dr in enumerate(draws_list):
            if dr.get("draw_date") == anchor_date:
                target_idx = idx
                break
        if target_idx is not None:
            draws_list = draws_list[:target_idx + 1]

    if limit_draws and limit_draws < len(draws_list):
        draws_list = draws_list[-limit_draws:]

    if len(draws_list) != _SNAPSHOT_CACHE.total_draws:
        return build_dataset_snapshot(draws_list)

    return _SNAPSHOT_CACHE

def invalidate_pattern_cache():
    """Hủy cache khi có kết quả mới được cập nhật (Section XIV Live Scanner)"""
    global _SNAPSHOT_CACHE, _SCAN_RESULTS_CACHE
    _SNAPSHOT_CACHE = None
    _SCAN_RESULTS_CACHE.clear()

def scan_patterns_service(
    days: str = "60",
    min_occurrences: int = 10,
    min_confidence: float = 0.40,
    min_streak: int = 0,
    exact_streak: Optional[int] = 4,
    target_type: str = "loto_2digit",
    day_offset: int = 1,
    top_n: int = 30,
    anchor_date: Optional[str] = None,
    force_refresh: bool = False
) -> Dict[str, Any]:
    """
    Dịch vụ quét tự động tìm đường cầu và quản lý snapshot đề xuất Top 3 theo ngày.
    - anchor_date: Ngày mục tiêu mà hệ thống đề xuất cầu tới (target_date).
    - force_refresh: Nếu False (mặc định), hệ thống ưu tiên đọc snapshot đã lưu cố định trong SQLite.
      Chỉ khi force_refresh=True mới chạy lại thuật toán dò tìm và cập nhật snapshot.
    - Cắt lát dữ liệu: Nghiêm ngặt lấy dữ liệu kỳ quay xảy ra TRƯỚC ngày mục tiêu (draw_date < target_date)
      để đảm bảo không có Lookahead Bias và kết quả đề xuất là bất biến qua các ngày.
    """
    # 1. Xác định target_date (ngày dự đoán)
    if anchor_date and anchor_date not in ('latest', ''):
        target_date = anchor_date
    else:
        # Nếu không có anchor_date, lấy ngày kế tiếp của kỳ mới nhất trong DB
        recent_draws = database.get_recent_results(limit=1)
        if recent_draws:
            latest_dt = recent_draws[0]["draw_date"]
            try:
                dt_obj = datetime.strptime(latest_dt, "%Y-%m-%d")
                target_date = (dt_obj + timedelta(days=1)).strftime("%Y-%m-%d")
            except Exception:
                target_date = latest_dt
        else:
            target_date = datetime.now().strftime("%Y-%m-%d")

    # Xác định chuỗi ngày hiển thị chuẩn (DD/MM/YYYY)
    target_draw_record = database.get_result_by_date(target_date)
    if target_draw_record:
        target_date_disp = target_draw_record.get("date_display", target_date)
    else:
        try:
            target_date_disp = datetime.strptime(target_date, "%Y-%m-%d").strftime("%d/%m/%Y")
        except Exception:
            target_date_disp = target_date

    # 2. KIỂM TRA SNAPSHOT ĐÃ LƯU TRONG DATABASE (Bảo đảm tính bất biến)
    if not force_refresh:
        saved_snapshot = database.get_top3_snapshot(target_date)
        if saved_snapshot:
            patterns = saved_snapshot.get("patterns", [])
            scan_summary = saved_snapshot.get("scan_summary", {})
            source_date = saved_snapshot.get("source_date")
            actual_result = database.get_result_by_date(target_date)

            # Nếu ngày target_date đã mở thưởng thực tế, cập nhật trạng thái nổ/trượt
            if actual_result:
                actual_lotos = set(actual_result.get("loto_2digit", []))
                for p in patterns:
                    preds = p.get("nextPrediction", [])
                    matched = [n for n in preds if n in actual_lotos]
                    is_hit = len(matched) > 0
                    hit_locs = find_matched_locations([int(x) for x in matched], actual_result) if is_hit else []

                    # Cập nhật trong recentHistory
                    hist_list = p.get("recentHistory", [])
                    found = False
                    for h in hist_list:
                        if h.get("targetDate") == target_date:
                            h["hit"] = is_hit
                            h["matchedNumbers"] = matched
                            h["hitLocations"] = hit_locs
                            h["isPending"] = False
                            found = True
                            break
                    if not found:
                        hist_list.insert(0, {
                            "sourceDate": source_date,
                            "sourceDateDisplay": database.get_result_by_date(source_date).get("date_display", source_date) if source_date else source_date,
                            "targetDate": target_date,
                            "targetDateDisplay": target_date_disp,
                            "predictedNumbers": preds,
                            "predictionDisplay": " - ".join(preds),
                            "hit": is_hit,
                            "matchedNumbers": matched,
                            "hitLocations": hit_locs,
                            "isPending": False
                        })
            else:
                for p in patterns:
                    hist_list = p.get("recentHistory", [])
                    for h in hist_list:
                        if h.get("targetDate") == target_date:
                            h["hit"] = None
                            h["matchedNumbers"] = []
                            h["hitLocations"] = []
                            h["isPending"] = True
                            break

            return {
                "status": "SUCCESS",
                "isSnapshot": True,
                "isHistorical": (actual_result is not None),
                "targetDate": target_date,
                "anchorDate": target_date,
                "anchorDateDisplay": target_date_disp,
                "sourceDate": source_date,
                "scanSummary": scan_summary,
                "patterns": patterns
            }

    # 3. CHƯA CÓ SNAPSHOT (Hoặc người dùng bấm force_refresh=True để tính lại)
    # Tìm kỳ quay nguồn: kỳ gần nhất có draw_date < target_date
    prior_draws = database.get_results_before_date(target_date, limit=1000)
    if not prior_draws:
        prior_draws = database.get_recent_results(limit=1000)

    if not prior_draws:
        return {"status": "ERROR", "message": "Không đủ dữ liệu lịch sử để quét pattern."}

    source_record = prior_draws[0]
    source_date = source_record["draw_date"]
    source_date_disp = source_record.get("date_display", source_date)

    limit_draws = 60
    if days != "all":
        try:
            limit_draws = int(days)
        except ValueError:
            limit_draws = 60

    draws_subset = prior_draws[:limit_draws]
    subset_snapshot = build_dataset_snapshot(draws_subset)

    miner = PatternMiner(subset_snapshot)
    results = miner.auto_discover(
        min_occurrences=min_occurrences,
        min_confidence=min_confidence,
        min_streak=min_streak,
        exact_streak=exact_streak,
        target_type_str=target_type,
        day_offset=day_offset,
        top_n=top_n
    )

    patterns = results.get("patterns", [])
    scan_summary = results.get("scanSummary", {})

    # Đối chiếu kết quả thực tế của target_date nếu ngày đó đã mở thưởng
    actual_result = database.get_result_by_date(target_date)
    if actual_result:
        actual_lotos = set(actual_result.get("loto_2digit", []))
        for p in patterns:
            preds = p.get("nextPrediction", [])
            matched = [n for n in preds if n in actual_lotos]
            is_hit = len(matched) > 0
            hit_locs = find_matched_locations([int(x) for x in matched], actual_result) if is_hit else []
            hist_list = p.get("recentHistory", [])
            hist_list.insert(0, {
                "sourceDate": source_date,
                "sourceDateDisplay": source_date_disp,
                "targetDate": target_date,
                "targetDateDisplay": target_date_disp,
                "predictedNumbers": preds,
                "predictionDisplay": " - ".join(preds),
                "hit": is_hit,
                "matchedNumbers": matched,
                "hitLocations": hit_locs,
                "isPending": False
            })

    # 4. LƯU SNAPSHOT CỐ ĐỊNH VÀO DATABASE
    database.save_top3_snapshot(
        target_date=target_date,
        date_display=target_date_disp,
        source_date=source_date,
        patterns=patterns,
        scan_summary=scan_summary
    )

    return {
        "status": "SUCCESS",
        "isSnapshot": True,
        "justGenerated": True,
        "isHistorical": (actual_result is not None),
        "targetDate": target_date,
        "anchorDate": target_date,
        "anchorDateDisplay": target_date_disp,
        "sourceDate": source_date,
        "scanSummary": scan_summary,
        "patterns": patterns
    }


def get_pattern_visualization_service(
    pos_a: int,
    pos_b: int,
    operation_str: str = "CONCAT_PAIR",
    target_type_str: str = "loto_2digit",
    day_offset: int = 1,
    num_display_draws: int = 8,
    anchor_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Dịch vụ tạo dữ liệu trực quan hóa đồ họa SVG cho 1 pattern.
    Hỗ trợ tham số anchor_date để neo bảng vẽ theo một kỳ quay bất kỳ trong quá khứ.
    """
    snapshot = get_cached_snapshot()
    op = OperationType(operation_str)
    target_type = TargetType(target_type_str)
    rule_id = f"P_{op.value}_{pos_a}_{pos_b}"

    rule = RuleSpecification(
        rule_id=rule_id,
        pos_a=pos_a,
        pos_b=pos_b,
        operation=op,
        target_type=target_type,
        day_offset=day_offset
    )

    bt = backtest_rule(snapshot, rule)
    if not bt:
        return {
            "status": "ERROR",
            "message": "Không đủ dữ liệu lịch sử để kiểm thử đường cầu này."
        }

    payload = generate_visualization_payload(
        snapshot=snapshot,
        backtest_res=bt,
        num_display_draws=num_display_draws,
        anchor_date=anchor_date
    )
    payload["status"] = "SUCCESS"
    return payload


def get_streak_bridges_service(
    target_date_str: Optional[str] = "yesterday",
    streak: int = 4,
    exact_streak: bool = True,
    target_type_str: str = "loto_2digit",
    op_str: str = "CONCAT_PAIR",
    limit: int = 300,
    force_refresh: bool = False
) -> Dict[str, Any]:
    """
    Tra cứu toàn bộ các đường cầu đạt chuỗi ăn thông (ví dụ 4 ngày thông)
    tính đến một ngày cụ thể (mặc định hôm qua hoặc kỳ bất kỳ tự chọn),
    đồng thời đối chiếu kết quả mở thưởng của ngày tiếp theo (Thắng/Gãy/Chờ kết quả).
    Hỗ trợ lưu và đọc snapshot cố định theo ngày.
    """
    snapshot = get_cached_snapshot()
    dates = snapshot.dates
    n_dates = len(dates)
    if n_dates < 2:
        return {
            "status": "ERROR",
            "message": "Không đủ dữ liệu lịch sử để tra cứu cầu thông."
        }

    # Danh sách các ngày mở thưởng có sẵn (Mới nhất lên đầu)
    available_dates = []
    for i in range(n_dates - 1, -1, -1):
        dt = dates[i]
        rec = snapshot.draw_records[i]
        available_dates.append({
            "drawDate": dt,
            "dateDisplay": snapshot.date_display_map.get(dt, dt),
            "dayOfWeek": rec.get("day_of_week", ""),
            "isLatest": (i == n_dates - 1),
            "isYesterday": (i == n_dates - 2)
        })

    # Xác định chỉ số ngày được chọn (k)
    if not target_date_str or target_date_str == "yesterday":
        k = max(0, n_dates - 2)
    elif target_date_str == "latest":
        k = n_dates - 1
    elif target_date_str in dates:
        k = dates.index(target_date_str)
    else:
        k = max(0, n_dates - 2)

    selected_date = dates[k]
    selected_record = snapshot.draw_records[k]
    selected_date_disp = snapshot.date_display_map.get(selected_date, selected_date)
    selected_dow = selected_record.get("day_of_week", "")

    # Ngày mở thưởng tiếp theo (Kỳ đối chiếu kết quả)
    if k + 1 < n_dates:
        target_date = dates[k + 1]
        target_record = snapshot.draw_records[k + 1]
        target_date_disp = snapshot.date_display_map.get(target_date, target_date)
        target_dow = target_record.get("day_of_week", "")
        is_target_pending = False
    else:
        try:
            dt_obj = datetime.strptime(selected_date, "%Y-%m-%d")
            next_dt = dt_obj + timedelta(days=1)
            target_date = next_dt.strftime("%Y-%m-%d")
            target_date_disp = next_dt.strftime("%d/%m/%Y")
            dow_names = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]
            target_dow = dow_names[next_dt.weekday()]
        except Exception:
            target_date = "next"
            target_date_disp = "Kỳ Kế Tiếp"
            target_dow = "Hôm nay"
        target_record = None
        is_target_pending = True

    try:
        op = OperationType(op_str)
    except Exception:
        op = OperationType.CONCAT_PAIR

    try:
        target_type = TargetType(target_type_str)
    except Exception:
        target_type = TargetType.LOTO_2DIGIT

    # Kiểm tra snapshot đã lưu cố định
    if not force_refresh:
        cached_data = database.get_streak_bridges_snapshot(selected_date, streak, exact_streak, target_type.value)
        if cached_data:
            # Nếu lúc lưu đang chờ kết quả mà nay kỳ đó đã mở thưởng, cập nhật đối chiếu
            if cached_data.get("isTargetPending") and target_date in dates:
                cached_data["isTargetPending"] = False
                cached_data["availableDates"] = available_dates[:60]
            return cached_data

    miner = PatternMiner(snapshot)
    if op == OperationType.BONG_PAIR:
        hits_matrix = miner._screen_bong_pairs(day_offset=1, target_type=target_type)
    elif op == OperationType.SUM_DIFF_PAIR:
        hits_matrix = miner._screen_sum_diff_pairs(day_offset=1, target_type=target_type)
    else:
        hits_matrix = miner._screen_concat_pairs(day_offset=1, target_type=target_type)

    bridges = []
    # Quét chuỗi ăn thông tính lùi từ kỳ k (tức là lần trúng cuối là k-1 dự đoán cho k)
    for p_idx in range(miner.num_pairs):
        s_count = 0
        for r in range(k - 1, -1, -1):
            if hits_matrix[r, p_idx]:
                s_count += 1
            else:
                break

        if exact_streak:
            if s_count != streak:
                continue
        else:
            if s_count < streak:
                continue

        pa = int(miner.p_a[p_idx])
        pb = int(miner.p_b[p_idx])
        ca = COORD_BY_INDEX[pa]
        cb = COORD_BY_INDEX[pb]
        da = int(snapshot.digit_matrix[k, pa])
        db = int(snapshot.digit_matrix[k, pb])

        # Sinh số dự đoán cho kỳ kế tiếp
        if op == OperationType.BONG_PAIR:
            ba = (da + 5) % 10
            bb = (db + 5) % 10
            p1 = ba * 10 + bb
            p2 = bb * 10 + ba
        elif op == OperationType.SUM_DIFF_PAIR:
            s = (da + db) % 10
            df = abs(da - db)
            p1 = s * 10 + df
            p2 = df * 10 + s
        else:
            p1 = da * 10 + db
            p2 = db * 10 + da

        pred_ints = [p1] if p1 == p2 else [p1, p2]
        pred_strs = [f"{x:02d}" for x in pred_ints]

        if not is_target_pending and target_record:
            if target_type == TargetType.LOTO_2DIGIT:
                matched_ints = [p for p in pred_ints if snapshot.loto_hits_matrix[k + 1, p]]
            else:
                sp_val = int(snapshot.special_last2_array[k + 1])
                matched_ints = [p for p in pred_ints if p == sp_val]
            is_hit = len(matched_ints) > 0
            hit_locs = find_matched_locations(matched_ints, target_record) if is_hit else []
            hit_count = len(hit_locs) if target_type == TargetType.LOTO_2DIGIT else (1 if is_hit else 0)
        else:
            is_hit = None
            matched_ints = []
            hit_locs = []
            hit_count = 0

        # Trích xuất lịch sử từng ngày của chuỗi ăn thông (s_count kỳ trước) và kỳ đối chiếu tiếp theo
        streak_history = []
        for day_offset_idx in range(s_count, -1, -1):
            src_idx = k - day_offset_idx
            tgt_idx = src_idx + 1
            if src_idx < 0:
                continue
            src_dt = dates[src_idx]
            da_hist = int(snapshot.digit_matrix[src_idx, pa])
            db_hist = int(snapshot.digit_matrix[src_idx, pb])

            if op == OperationType.BONG_PAIR:
                ba_h = (da_hist + 5) % 10
                bb_h = (db_hist + 5) % 10
                hp1 = ba_h * 10 + bb_h
                hp2 = bb_h * 10 + ba_h
            elif op == OperationType.SUM_DIFF_PAIR:
                hs = (da_hist + db_hist) % 10
                hdf = abs(da_hist - db_hist)
                hp1 = hs * 10 + hdf
                hp2 = hdf * 10 + hs
            else:
                hp1 = da_hist * 10 + db_hist
                hp2 = db_hist * 10 + da_hist

            h_preds = [hp1] if hp1 == hp2 else [hp1, hp2]
            h_pred_strs = [f"{x:02d}" for x in h_preds]

            if tgt_idx < n_dates:
                tgt_dt = dates[tgt_idx]
                tgt_disp = snapshot.date_display_map.get(tgt_dt, tgt_dt)
                tgt_rec_h = snapshot.draw_records[tgt_idx]
                if target_type == TargetType.LOTO_2DIGIT:
                    h_matched = [p for p in h_preds if snapshot.loto_hits_matrix[tgt_idx, p]]
                else:
                    sp_val_h = int(snapshot.special_last2_array[tgt_idx])
                    h_matched = [p for p in h_preds if p == sp_val_h]
                h_hit = len(h_matched) > 0
                h_locs = find_matched_locations(h_matched, tgt_rec_h) if h_hit else []
                h_is_pending = False
            else:
                try:
                    dt_o = datetime.strptime(src_dt, "%Y-%m-%d") + timedelta(days=1)
                    tgt_dt = dt_o.strftime("%Y-%m-%d")
                    tgt_disp = dt_o.strftime("%d/%m/%Y")
                except Exception:
                    tgt_dt = "next"
                    tgt_disp = "Kỳ Kế Tiếp"
                h_matched = []
                h_hit = None
                h_locs = []
                h_is_pending = True

            streak_history.append({
                "sourceDate": src_dt,
                "sourceDateDisplay": snapshot.date_display_map.get(src_dt, src_dt),
                "targetDate": tgt_dt,
                "targetDateDisplay": tgt_disp,
                "digits": [da_hist, db_hist],
                "predictedNumbers": h_pred_strs,
                "predictionDisplay": " - ".join(h_pred_strs),
                "isHit": h_hit,
                "matchedNumbers": [f"{x:02d}" for x in h_matched],
                "hitLocations": h_locs,
                "hitCount": len(h_locs),
                "isOutcomeDay": (src_idx == k),
                "isPending": h_is_pending
            })

        bridges.append({
            "patternId": f"P_{op.value}_{pa}_{pb}",
            "posA": pa,
            "posB": pb,
            "operation": op.value,
            "labelA": ca.label,
            "labelB": cb.label,
            "displayPrizeA": ca.display_prize,
            "displayPrizeB": cb.display_prize,
            "digits": [da, db],
            "predictedNumbers": pred_strs,
            "predictionDisplay": " - ".join(pred_strs),
            "streak": s_count,
            "isHit": is_hit,
            "matchedNumbers": [f"{x:02d}" for x in matched_ints],
            "hitLocations": hit_locs,
            "hitCount": hit_count,
            "streakHistory": streak_history
        })

    # Sắp xếp: Ưu tiên các cầu trúng thưởng lên đầu
    if not is_target_pending:
        bridges.sort(key=lambda b: (1 if b["isHit"] else 0, b["hitCount"], b["streak"]), reverse=True)
    else:
        bridges.sort(key=lambda b: b["streak"], reverse=True)

    total_bridges = len(bridges)
    win_count = sum(1 for b in bridges if b["isHit"] is True)
    lose_count = sum(1 for b in bridges if b["isHit"] is False)
    win_rate = round(win_count / total_bridges * 100, 1) if total_bridges > 0 else 0.0

    # Thống kê tần suất xuất hiện và tỷ lệ trúng của các con số được dự đoán
    num_map = {}
    for b in bridges:
        for p in b["predictedNumbers"]:
            if p not in num_map:
                num_map[p] = {"number": p, "bridgesCount": 0, "hitBridgesCount": 0, "isHit": False}
            num_map[p]["bridgesCount"] += 1
            if b["isHit"]:
                num_map[p]["hitBridgesCount"] += 1
                num_map[p]["isHit"] = True

    top_numbers = sorted(num_map.values(), key=lambda x: (x["hitBridgesCount"], x["bridgesCount"]), reverse=True)

    res_payload = {
        "status": "SUCCESS",
        "queryDate": selected_date,
        "queryDateDisplay": selected_date_disp,
        "queryDayOfWeek": selected_dow,
        "targetDate": target_date,
        "targetDateDisplay": target_date_disp,
        "targetDayOfWeek": target_dow,
        "isTargetPending": is_target_pending,
        "streak": streak,
        "exactStreak": exact_streak,
        "targetType": target_type.value,
        "operation": op.value,
        "totalBridges": total_bridges,
        "winCount": win_count,
        "loseCount": lose_count,
        "winRate": win_rate,
        "topNumbers": top_numbers[:10],
        "bridges": bridges[:limit],
        "availableDates": available_dates[:60]
    }

    # Lưu snapshot cố định vào database
    database.save_streak_bridges_snapshot(
        query_date=selected_date,
        streak=streak,
        exact_streak=exact_streak,
        target_type=target_type.value,
        target_date=target_date,
        data_dict=res_payload
    )

    return res_payload

