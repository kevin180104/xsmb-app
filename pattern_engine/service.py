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
    force_refresh: bool = False,
    saved_only: bool = False
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
    streak_val = exact_streak if exact_streak is not None else 4
    if saved_only or not force_refresh:
        saved_snapshot = database.get_top3_snapshot(target_date, streak=streak_val)
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
                "exactStreak": streak_val,
                "targetDate": target_date,
                "anchorDate": target_date,
                "anchorDateDisplay": target_date_disp,
                "sourceDate": source_date,
                "scanSummary": scan_summary,
                "patterns": patterns
            }

    if saved_only:
        return {"status": "NOT_FOUND", "message": "Chưa có dự đoán được lưu cho ngày này."}

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
        scan_summary=scan_summary,
        streak=streak_val
    )

    return {
        "status": "SUCCESS",
        "isSnapshot": True,
        "justGenerated": True,
        "isHistorical": (actual_result is not None),
        "exactStreak": streak_val,
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


def get_top3_history_service(limit: int = 30, streak: int = 4) -> Dict[str, Any]:
    """
    Lấy danh sách các snapshot Top 3 theo từng ngày và chuỗi thông (mặc định streak=4),
    kèm theo đối chiếu kết quả thực tế (Hit/Miss, số nháy nổ) cho mỗi ngày.
    """
    raw_snapshots = database.get_all_top3_snapshots(limit=limit, streak=streak)
    history = []

    for snap in raw_snapshots:
        target_date = snap["target_date"]
        target_disp = snap.get("date_display", target_date)
        source_date = snap.get("source_date", "")

        actual_result = database.get_result_by_date(target_date)

        def evaluate_pair(pair_str, lotos_list):
            if not pair_str or not lotos_list:
                return {"hit": False, "matched": [], "hits_count": 0}
            nums = [n.strip() for n in pair_str.split("-") if n.strip()]
            matched = [n for n in nums if n in lotos_list]
            hits_count = sum(lotos_list.count(n) for n in matched)
            return {
                "hit": len(matched) > 0,
                "matched": matched,
                "hits_count": hits_count
            }

        actual_lotos = actual_result.get("loto_2digit", []) if actual_result else []
        is_pending = (actual_result is None)

        top1_eval = evaluate_pair(snap.get("top1_pair", ""), actual_lotos) if not is_pending else {"hit": None, "matched": [], "hits_count": 0}
        top2_eval = evaluate_pair(snap.get("top2_pair", ""), actual_lotos) if not is_pending else {"hit": None, "matched": [], "hits_count": 0}
        top3_eval = evaluate_pair(snap.get("top3_pair", ""), actual_lotos) if not is_pending else {"hit": None, "matched": [], "hits_count": 0}

        total_hit_pairs = sum(1 for ev in (top1_eval, top2_eval, top3_eval) if ev.get("hit"))
        total_hits_count = sum(ev.get("hits_count", 0) for ev in (top1_eval, top2_eval, top3_eval))

        history.append({
            "targetDate": target_date,
            "targetDateDisplay": target_disp,
            "sourceDate": source_date,
            "isPending": is_pending,
            "top1": {
                "pair": snap.get("top1_pair", ""),
                "name": snap.get("top1_name", ""),
                "eval": top1_eval
            },
            "top2": {
                "pair": snap.get("top2_pair", ""),
                "name": snap.get("top2_name", ""),
                "eval": top2_eval
            },
            "top3": {
                "pair": snap.get("top3_pair", ""),
                "name": snap.get("top3_name", ""),
                "eval": top3_eval
            },
            "summary": {
                "hitPairs": total_hit_pairs,
                "totalPairs": 3,
                "totalHits": total_hits_count,
                "isWin": (total_hit_pairs > 0) if not is_pending else None
            },
            "createdAt": snap.get("created_at", "")
        })

    return {
        "status": "SUCCESS",
        "streak": streak,
        "total": len(history),
        "history": history
    }


def get_unified_prediction_history(
    source: str = "all",
    time_range: str = "all",
    status_filter: str = "all",
    streak: int = 4,
    page: int = 1,
    limit: int = 50,
    search: str = ""
) -> Dict[str, Any]:
    """
    Adapter Service tổng hợp và chuẩn hóa lịch sử dự đoán từ 2 nguồn snapshot:
    1. TOP_4_KY (từ bảng daily_streak_top3_snapshots)
    2. TRA_CUU_4_NGAY (từ bảng daily_streak_bridges_snapshots)
    Đối chiếu trực tiếp với kết quả XSMB thực tế (xsmb_results) và find_matched_locations().
    Không duplicate database, tuân thủ nguyên tắc Single Source of Truth và Immutability.
    """
    def _format_vn_date(date_str: str) -> str:
        if not date_str:
            return ""
        try:
            return datetime.strptime(date_str, "%Y-%m-%d").strftime("%d/%m/%Y")
        except Exception:
            return date_str

    cutoff_date = None
    if time_range == "7d":
        cutoff_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    elif time_range == "30d":
        cutoff_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    elif time_range == "90d":
        cutoff_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")

    all_records = []

    # Cache kết quả mở thưởng theo target_date để tối ưu query
    results_cache: Dict[str, Optional[Dict[str, Any]]] = {}

    def _get_actual(target_dt: str) -> Optional[Dict[str, Any]]:
        if target_dt not in results_cache:
            results_cache[target_dt] = database.get_result_by_date(target_dt)
        return results_cache[target_dt]

    # -------------------------------------------------------------
    # 1. NGUỒN TOP_4_KY (daily_streak_top3_snapshots)
    # -------------------------------------------------------------
    raw_top3_snaps = database.get_all_top3_snapshots(limit=500, streak=streak)
    for snap in raw_top3_snaps:
        target_date = snap.get("target_date", "")
        if not target_date:
            continue
        if cutoff_date and target_date < cutoff_date:
            continue

        source_date = snap.get("source_date", "")
        target_disp = snap.get("date_display") or _format_vn_date(target_date)
        source_disp = _format_vn_date(source_date)
        actual = _get_actual(target_date)
        is_pending = (actual is None)
        actual_lotos = actual.get("loto_2digit", []) if actual else []

        for rank, key, name_key in [
            (1, "top1_pair", "top1_name"),
            (2, "top2_pair", "top2_name"),
            (3, "top3_pair", "top3_name")
        ]:
            pair_str = snap.get(key, "").strip()
            if not pair_str:
                continue

            nums = [n.strip() for n in pair_str.split("-") if n.strip()]
            numbers_detail = []
            pair_hits = 0

            for num in nums:
                cnt = actual_lotos.count(num) if not is_pending else 0
                try:
                    locs = find_matched_locations([int(num)], actual) if (not is_pending and cnt > 0) else []
                except Exception:
                    locs = []
                pair_hits += cnt
                numbers_detail.append({
                    "number": num,
                    "hit_count": cnt,
                    "is_hit": (cnt > 0) if not is_pending else None,
                    "hit_locations": locs
                })

            pair_is_hit = (pair_hits > 0) if not is_pending else None
            status = "PENDING" if is_pending else ("WIN" if pair_is_hit else "LOSE")

            all_records.append({
                "id": f"TOP4_{target_date}_{rank}",
                "target_date": target_date,
                "target_date_display": target_disp,
                "source_date": source_date,
                "source_date_display": source_disp,
                "source_type": "TOP_4_KY",
                "source_label": f"TOP {streak} Kỳ VIP",
                "rank": rank,
                "pair": pair_str,
                "predicted_numbers": nums,
                "pair_is_hit": pair_is_hit,
                "pair_total_hits": pair_hits,
                "status": status,
                "is_pending": is_pending,
                "meta": {
                    "pattern_name": snap.get(name_key, f"Cầu Top #{rank}"),
                    "streak": streak,
                    "rank": rank
                },
                "numbers_detail": numbers_detail,
                "created_at": snap.get("created_at", "")
            })

    # -------------------------------------------------------------
    # 2. NGUỒN TRA_CUU_4_NGAY (daily_streak_bridges_snapshots)
    # -------------------------------------------------------------
    raw_streak_snaps = database.get_all_streak_bridges_snapshots(
        streak=streak, exact_streak=True, target_type="loto_2digit", limit=200
    )
    for s_snap in raw_streak_snaps:
        target_date = s_snap.get("target_date", "")
        if not target_date or target_date == "next":
            continue
        if cutoff_date and target_date < cutoff_date:
            continue

        query_date = s_snap.get("query_date", "")
        snap_data = s_snap.get("data", {})
        target_disp = snap_data.get("targetDateDisplay") or _format_vn_date(target_date)
        source_disp = snap_data.get("queryDateDisplay") or _format_vn_date(query_date)
        actual = _get_actual(target_date)
        is_pending = (actual is None)
        actual_lotos = actual.get("loto_2digit", []) if actual else []

        bridges = snap_data.get("bridges", [])
        for idx, bridge in enumerate(bridges):
            pair_str = bridge.get("predictionDisplay", "").strip()
            nums = bridge.get("predictedNumbers", [])
            if not pair_str and nums:
                pair_str = " - ".join(nums)

            numbers_detail = []
            pair_hits = 0

            for num in nums:
                cnt = actual_lotos.count(num) if not is_pending else 0
                try:
                    locs = find_matched_locations([int(num)], actual) if (not is_pending and cnt > 0) else []
                except Exception:
                    locs = []
                pair_hits += cnt
                numbers_detail.append({
                    "number": num,
                    "hit_count": cnt,
                    "is_hit": (cnt > 0) if not is_pending else None,
                    "hit_locations": locs
                })

            pair_is_hit = (pair_hits > 0) if not is_pending else None
            status = "PENDING" if is_pending else ("WIN" if pair_is_hit else "LOSE")
            bridge_id = bridge.get("patternId", f"P_{idx}")

            all_records.append({
                "id": f"TRA4_{target_date}_{bridge_id}_{idx}",
                "target_date": target_date,
                "target_date_display": target_disp,
                "source_date": query_date,
                "source_date_display": source_disp,
                "source_type": "TRA_CUU_4_NGAY",
                "source_label": f"Tra Cứu {streak} Ngày",
                "rank": idx + 1,
                "pair": pair_str,
                "predicted_numbers": nums,
                "pair_is_hit": pair_is_hit,
                "pair_total_hits": pair_hits,
                "status": status,
                "is_pending": is_pending,
                "meta": {
                    "pattern_id": bridge_id,
                    "label_a": bridge.get("labelA", ""),
                    "label_b": bridge.get("labelB", ""),
                    "display_prize_a": bridge.get("displayPrizeA", ""),
                    "display_prize_b": bridge.get("displayPrizeB", ""),
                    "streak": bridge.get("streak", streak),
                    "digits": bridge.get("digits", [])
                },
                "numbers_detail": numbers_detail,
                "created_at": s_snap.get("created_at", "")
            })

    # -------------------------------------------------------------
    # 3. TÍNH TOÁN KPI ĐỘC LẬP THEO TỪNG NGUỒN VÀ TỔNG
    # -------------------------------------------------------------
    def _calc_kpi(rec_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        unique_days = len(set(r["target_date"] for r in rec_list))
        total_pairs = len(rec_list)
        pending_pairs = sum(1 for r in rec_list if r["is_pending"])
        completed_recs = [r for r in rec_list if not r["is_pending"]]
        completed_pairs = len(completed_recs)
        hit_pairs = sum(1 for r in completed_recs if r["pair_is_hit"] is True)
        miss_pairs = completed_pairs - hit_pairs
        total_hits = sum(r["pair_total_hits"] for r in completed_recs)
        # Công thức nghiêm ngặt: không tính PENDING vào mẫu số
        hit_rate = round((hit_pairs / completed_pairs) * 100, 1) if completed_pairs > 0 else 0.0

        return {
            "total_days": unique_days,
            "total_pairs": total_pairs,
            "completed_pairs": completed_pairs,
            "pending_pairs": pending_pairs,
            "hit_pairs": hit_pairs,
            "miss_pairs": miss_pairs,
            "total_hits": total_hits,
            "hit_rate": hit_rate
        }

    kpi = {
        "all": _calc_kpi(all_records),
        "top_4_ky": _calc_kpi([r for r in all_records if r["source_type"] == "TOP_4_KY"]),
        "tra_cuu_4_ngay": _calc_kpi([r for r in all_records if r["source_type"] == "TRA_CUU_4_NGAY"])
    }

    # -------------------------------------------------------------
    # 4. LỌC VÀ PHÂN TRANG (FILTERING & PAGINATION)
    # -------------------------------------------------------------
    filtered = all_records

    # Lọc theo Nguồn
    source_clean = (source or "all").lower()
    if source_clean in ("top_4_ky", "top4", "top3"):
        filtered = [r for r in filtered if r["source_type"] == "TOP_4_KY"]
    elif source_clean in ("tra_cuu_4_ngay", "streak", "tracuu"):
        filtered = [r for r in filtered if r["source_type"] == "TRA_CUU_4_NGAY"]

    # Lọc theo Trạng thái
    status_clean = (status_filter or "all").lower()
    if status_clean == "win":
        filtered = [r for r in filtered if r["status"] == "WIN"]
    elif status_clean == "lose":
        filtered = [r for r in filtered if r["status"] == "LOSE"]
    elif status_clean == "pending":
        filtered = [r for r in filtered if r["status"] == "PENDING"]

    # Lọc theo Tìm kiếm
    if search:
        s_low = search.strip().lower()
        filtered = [
            r for r in filtered if (
                s_low in r["target_date"].lower()
                or s_low in r["target_date_display"].lower()
                or s_low in r["pair"].lower()
                or any(s_low in n for n in r["predicted_numbers"])
                or s_low in r["meta"].get("pattern_name", "").lower()
                or s_low in r["meta"].get("label_a", "").lower()
                or s_low in r["meta"].get("label_b", "").lower()
            )
        ]

    # Sắp xếp mới nhất lên đầu: target_date DESC, source_type ASC, rank ASC
    filtered.sort(key=lambda r: (r["target_date"], 0 if r["source_type"] == "TOP_4_KY" else 1, -r["rank"]), reverse=True)

    # Phân trang
    total_records = len(filtered)
    limit_val = total_records if (limit == "all" or limit is None or int(limit) <= 0) else max(1, int(limit))
    page_val = max(1, int(page or 1))
    total_pages = max(1, (total_records + limit_val - 1) // limit_val)
    start_idx = (page_val - 1) * limit_val
    end_idx = start_idx + limit_val
    page_records = filtered[start_idx:end_idx]

    # Gom nhóm theo ngày để frontend render dạng Grouped theo nhu cầu
    day_groups: List[Dict[str, Any]] = []
    current_day_dict: Dict[str, Dict[str, Any]] = {}

    for r in page_records:
        t_dt = r["target_date"]
        s_type = r["source_type"]
        group_key = f"{t_dt}_{s_type}"

        if group_key not in current_day_dict:
            current_day_dict[group_key] = {
                "target_date": t_dt,
                "target_date_display": r["target_date_display"],
                "source_date": r["source_date"],
                "source_date_display": r["source_date_display"],
                "source_type": s_type,
                "source_label": r["source_label"],
                "is_pending": r["is_pending"],
                "items": [],
                "day_hits": 0,
                "day_wins": 0,
                "day_total": 0
            }
        g = current_day_dict[group_key]
        g["items"].append(r)
        g["day_total"] += 1
        g["day_hits"] += r["pair_total_hits"]
        if r["pair_is_hit"] is True:
            g["day_wins"] += 1

    day_groups = list(current_day_dict.values())

    # -------------------------------------------------------------
    # 5. XÂY DỰNG DAY SUMMARIES (MÔ HÌNH: NGÀY -> NGUỒN -> TÓM TẮT)
    # -------------------------------------------------------------
    day_map: Dict[str, Dict[str, Any]] = {}
    for r in filtered:
        t_dt = r["target_date"]
        s_type = r["source_type"]
        g_key = f"{t_dt}_{s_type}"

        if g_key not in day_map:
            day_map[g_key] = {
                "id": g_key,
                "target_date": t_dt,
                "target_date_display": r["target_date_display"],
                "source_date": r["source_date"],
                "source_date_display": r["source_date_display"],
                "source_type": s_type,
                "source_label": r["source_label"],
                "is_pending": r["is_pending"],
                "items": [],
                "distinct_pairs_set": set(),
                "wins_count": 0,
                "misses_count": 0,
                "pending_count": 0,
                "total_hits": 0,
            }
        dm = day_map[g_key]
        dm["items"].append(r)
        dm["distinct_pairs_set"].add(r["pair"])
        dm["total_hits"] += r["pair_total_hits"]
        if r["is_pending"]:
            dm["pending_count"] += 1
        elif r["status"] == "WIN":
            dm["wins_count"] += 1
        elif r["status"] == "LOSE":
            dm["misses_count"] += 1

    all_day_summaries: List[Dict[str, Any]] = []
    for g_key, dm in day_map.items():
        items = dm["items"]
        s_type = dm["source_type"]
        total_items = len(items)
        wins = dm["wins_count"]
        misses = dm["misses_count"]
        is_pend = dm["is_pending"] or (dm["pending_count"] == total_items)
        
        completed_items = wins + misses
        hit_rate = round((wins / completed_items * 100), 1) if completed_items > 0 else 0.0

        summary_entry: Dict[str, Any] = {
            "id": dm["id"],
            "target_date": dm["target_date"],
            "target_date_display": dm["target_date_display"],
            "source_date": dm["source_date"],
            "source_date_display": dm["source_date_display"],
            "source_type": s_type,
            "source_label": dm["source_label"],
            "is_pending": is_pend,
            "total_items": total_items,
            "distinct_pairs_count": len(dm["distinct_pairs_set"]),
            "wins_count": wins,
            "misses_count": misses,
            "total_hits": dm["total_hits"],
            "hit_rate": hit_rate,
            "items": items
        }

        if s_type == "TOP_4_KY":
            top_dict = {it["rank"]: it for it in items}
            summary_entry["top1"] = top_dict.get(1)
            summary_entry["top2"] = top_dict.get(2)
            summary_entry["top3"] = top_dict.get(3)
        elif s_type == "TRA_CUU_4_NGAY":
            pair_bridge_counts: Dict[str, Dict[str, Any]] = {}
            for it in items:
                p_str = it["pair"]
                if p_str not in pair_bridge_counts:
                    pair_bridge_counts[p_str] = {
                        "pair": p_str,
                        "bridges_count": 0,
                        "status": it["status"],
                        "pair_total_hits": it["pair_total_hits"],
                        "predicted_numbers": it["predicted_numbers"],
                        "numbers_detail": it["numbers_detail"],
                        "sample_bridges": []
                    }
                pbc = pair_bridge_counts[p_str]
                pbc["bridges_count"] += 1
                pbc["sample_bridges"].append({
                    "id": it["id"],
                    "pattern_id": it["meta"].get("pattern_id"),
                    "label_a": it["meta"].get("label_a"),
                    "label_b": it["meta"].get("label_b"),
                    "display_prize_a": it["meta"].get("display_prize_a"),
                    "display_prize_b": it["meta"].get("display_prize_b"),
                })
            
            sorted_consensus = sorted(
                pair_bridge_counts.values(),
                key=lambda x: (x["bridges_count"], x["pair_total_hits"]),
                reverse=True
            )
            summary_entry["consensus_pairs"] = sorted_consensus

        all_day_summaries.append(summary_entry)

    all_day_summaries.sort(
        key=lambda d: (d["target_date"], 0 if d["source_type"] == "TOP_4_KY" else 1),
        reverse=True
    )

    return {
        "status": "SUCCESS",
        "streak": streak,
        "kpi": kpi,
        "pagination": {
            "page": page_val,
            "limit": limit_val,
            "total_records": total_records,
            "total_pages": total_pages,
            "total_days": len(all_day_summaries)
        },
        "records": page_records,
        "day_summaries": all_day_summaries,
        "day_groups": day_groups
    }
