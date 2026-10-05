# -*- coding: utf-8 -*-
"""
XSMB Web Application - Clean Controller Layer (MVC Architecture)
Tối ưu hóa:
- Phân tách hoàn toàn View (templates/index.html, static/css/, static/js/) khỏi Controller.
- Khởi tạo cơ sở dữ liệu một lần duy nhất khi ứng dụng nạp.
- Chuẩn hóa mã phản hồi REST API và xử lý ngoại lệ.
"""
import os
import sys
import re
sys.stdout.reconfigure(encoding='utf-8')

from flask import Flask, render_template, jsonify, request, send_file
import database
import crawler
import analyzer
import excel_exporter
import pattern_engine
from pattern_engine.service import (
    scan_patterns_service, get_pattern_visualization_service,
    invalidate_pattern_cache
)

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True

# Khởi tạo bảng dữ liệu một lần duy nhất khi ứng dụng nạp (không gọi lặp lại ở từng route)
database.init_db()

@app.route('/')
def index():
    """Trang chủ: Hiển thị bảng kết quả và giao diện chính"""
    results = database.get_recent_results(limit=60)
    latest = results[0] if results else None
    return render_template('index.html', latest=latest, results=results)

@app.route('/api/results')
def api_results():
    """Lấy danh sách 60 kỳ quay gần nhất dạng JSON"""
    results = database.get_recent_results(limit=60)
    return jsonify(results)

@app.route('/api/analyze')
def api_analyze():
    """Phân tích 23 Modules soi cầu ngắn hạn"""
    analysis_data = analyzer.analyze_short_term()
    return jsonify(analysis_data)

@app.route('/api/quick-check')
def api_quick_check():
    """Báo cáo tóm tắt nhanh dạng văn bản"""
    text_response = analyzer.quick_check_response()
    return jsonify({"response": text_response})

@app.route('/api/weekly-analysis')
def api_weekly_analysis():
    """Phân tích chu kỳ cầu ổn định theo các Thứ trong tuần"""
    data = analyzer.analyze_weekly_bridges()
    return jsonify(data)

@app.route('/api/stats')
def api_stats():
    """Thống kê tần suất về nhiều nhất và Lô Gan trong 60 kỳ"""
    results = database.get_recent_results(limit=60)
    if not results:
        return jsonify({"top_frequent": [], "top_gan": []})

    freq = {f"{i:02d}": 0 for i in range(100)}
    last_seen = {f"{i:02d}": None for i in range(100)}

    for idx, row in enumerate(results):
        for num in row.get("loto_2digit", []):
            if num in freq:
                freq[num] += 1
                if last_seen[num] is None:
                    last_seen[num] = idx

    sorted_freq = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    top_frequent = [{"number": k, "count": v} for k, v in sorted_freq[:10]]

    gan_list = [
        {"number": num, "days_gan": days if days is not None else len(results)}
        for num, days in last_seen.items()
    ]
    sorted_gan = sorted(gan_list, key=lambda x: x["days_gan"], reverse=True)
    top_gan = sorted_gan[:10]

    return jsonify({
        "top_frequent": top_frequent,
        "top_gan": top_gan
    })

@app.route('/api/crawl-today', methods=['POST'])
def api_crawl_today():
    """Kích hoạt cào và cập nhật kết quả mới nhất hôm nay"""
    try:
        updated = crawler.update_missing_results()
        if updated:
            invalidate_pattern_cache()
            dates_str = ", ".join([item["date_display"] for item in updated])
            return jsonify({
                "success": True,
                "count": len(updated),
                "message": f"Đã cập nhật thành công {len(updated)} kỳ quay mới: {dates_str}!"
            })
        return jsonify({
            "success": False,
            "count": 0,
            "message": "Dữ liệu đã ở trạng thái mới nhất! (Chưa có kết quả mới hôm nay hoặc chưa tới giờ mở thưởng 18h30)."
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "count": 0,
            "message": f"Lỗi khi cập nhật dữ liệu: {str(e)}"
        }), 500

@app.route('/api/backtest/dates')
def api_backtest_dates():
    """Lấy danh sách các ngày khả dụng có đủ dữ liệu lịch sử để backtest"""
    dates = database.get_available_backtest_dates(min_prior_draws=4)
    return jsonify(dates)

@app.route('/api/backtest/single')
def api_backtest_single():
    """Chạy backtest dự đoán đối chiếu cho 1 ngày cụ thể"""
    target_date = request.args.get('date')
    if not target_date:
        return jsonify({"status": "ERROR", "message": "Thiếu tham số 'date' (định dạng YYYY-MM-DD)."}), 400
    res = analyzer.backtest_single_date(target_date)
    return jsonify(res)

@app.route('/api/backtest/batch')
def api_backtest_batch():
    """Chạy backtest hàng loạt qua N ngày gần nhất (tối ưu In-Memory Slicing)"""
    days = request.args.get('days', '14')
    method = request.args.get('method', 'all_synthesis')
    res = analyzer.backtest_batch(days=days, method=method)
    return jsonify(res)

@app.route('/api/bridges-catalog')
def api_bridges_catalog():
    """Lấy toàn bộ từ điển và tín hiệu của 23 cầu kinh điển"""
    data = analyzer.analyze_23_bridges()
    return jsonify(data)

@app.route('/api/xien-suggestions')
def api_xien_suggestions():
    """Gợi ý các bộ Xiên 2 và Xiên 3 tiềm năng cao nhất"""
    dow = request.args.get('dow')
    data = analyzer.analyze_xien_suggestions(target_dow=dow)
    return jsonify(data)

@app.route('/api/check-xien')
def api_check_xien():
    """Kiểm tra và đánh giá rủi ro cho bộ số xiên do người dùng tự nhập"""
    raw_nums = request.args.get('numbers', '')
    if not raw_nums:
        return jsonify({"status": "ERROR", "message": "Vui lòng nhập các cặp số cần kiểm tra."}), 400
    tokens = [t.strip() for t in re.split(r'[,;\s\-_|/]+', raw_nums) if t.strip()]
    res = analyzer.check_custom_xien(tokens)
    return jsonify(res)

@app.route('/api/date-sum-bridge')
def api_date_sum_bridge():
    """Phân tích Cầu Tổng Ngày và lấy thống kê lịch sử kết quả"""
    custom_date = request.args.get('date')
    data = analyzer.analyze_date_sum_bridge(custom_date_str=custom_date)
    return jsonify(data)

@app.route('/api/bridge-occurrences')
def api_bridge_occurrences():
    """Lấy dữ liệu thống kê và toàn bộ lịch sử các ngày đã xảy ra của bất kỳ cầu nào"""
    bridge_key = request.args.get('bridge', 'date_sum')
    limit = request.args.get('limit', '60')
    if limit == 'all':
        limit_val = 'all'
    else:
        try:
            limit_val = int(limit)
        except ValueError:
            limit_val = 60
    data = analyzer.get_bridge_occurrences(bridge_key=bridge_key, limit=limit_val)
    return jsonify(data)

@app.route('/api/summary-all-bridges')
def api_summary_all_bridges():
    """Lấy bảng kết quả cầu tổng hợp từ tất cả các tab cầu cho ngày được chọn hoặc ngày hôm nay"""
    target_date = request.args.get('date')
    data = analyzer.get_all_bridges_summary(target_date_str=target_date)
    return jsonify(data)

@app.route('/api/export/excel')
def api_export_excel():
    """
    Xuất bảng thống kê cầu và kết quả đối chiếu ra file Excel (.xlsx).
    Tham số:
    - mode: 'single' (1 ngày) hoặc 'multi' (nhiều ngày)
    - date: Ngày cần xuất (ví dụ 2026-10-01 hoặc 'today')
    - days: Số ngày cần xuất (ví dụ 7, 14, 30 hoặc 'all')
    """
    mode = request.args.get('mode', 'single')
    date_val = request.args.get('date', 'today')
    days_val = request.args.get('days', '14')

    try:
        if mode == 'multi' or (request.args.get('days') and not request.args.get('date')):
            buf, filename = excel_exporter.generate_multi_date_excel(
                days=days_val,
                end_date_str=date_val if date_val and date_val != 'today' else None
            )
        else:
            buf, filename = excel_exporter.generate_single_date_excel(target_date_str=date_val)

        return send_file(
            buf,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({
            "status": "ERROR",
            "message": f"Lỗi khi xuất file Excel: {str(e)}"
        }), 500

@app.route('/api/patterns/coords')
def api_pattern_coords():
    """Lấy danh sách định nghĩa 107 vị trí chữ số chuẩn XSMB"""
    coords = [c.to_dict() for c in pattern_engine.ALL_COORDS]
    return jsonify({"coords": coords, "total": len(coords)})

@app.route('/api/patterns/scan', methods=['GET', 'POST'])
def api_patterns_scan():
    """Tự động đào tìm và xếp hạng các đường cầu lặp lại tiềm năng nhất (Pattern Mining)"""
    args = request.args if request.method == 'GET' else (request.get_json(silent=True) or request.form)
    days = args.get('days', '60')
    min_occ = int(args.get('min_occurrences', 10))
    min_conf = float(args.get('min_confidence', 0.40))
    min_streak = int(args.get('min_streak', 0))
    target_type = args.get('target_type', 'loto_2digit')
    day_offset = int(args.get('day_offset', 1))
    top_n = int(args.get('top_n', 30))

    res = scan_patterns_service(
        days=days,
        min_occurrences=min_occ,
        min_confidence=min_conf,
        min_streak=min_streak,
        target_type=target_type,
        day_offset=day_offset,
        top_n=top_n
    )
    return jsonify(res)

@app.route('/api/patterns/details')
def api_pattern_details():
    """Lấy cấu trúc dữ liệu đồ thị SVG (nodes, edges, draw cards) để vẽ đường cầu trực quan"""
    try:
        pos_a = int(request.args.get('pos_a', 0))
        pos_b = int(request.args.get('pos_b', 1))
        op = request.args.get('op', 'CONCAT_PAIR')
        target_type = request.args.get('target_type', 'loto_2digit')
        day_offset = int(request.args.get('day_offset', 1))
        draws_count = int(request.args.get('draws', 8))

        payload = get_pattern_visualization_service(
            pos_a=pos_a,
            pos_b=pos_b,
            operation_str=op,
            target_type_str=target_type,
            day_offset=day_offset,
            num_display_draws=draws_count
        )
        return jsonify(payload)
    except Exception as e:
        return jsonify({"status": "ERROR", "message": str(e)}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print("=" * 60)
    print(f" KHỞI CHẠY ỨNG DỤNG WEB XSMB TẠI CỔNG: {port}")
    print("=" * 60)
    app.run(host='0.0.0.0', port=port, debug=False)
