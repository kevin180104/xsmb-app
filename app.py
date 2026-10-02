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

from flask import Flask, render_template, jsonify, request
import database
import crawler
import analyzer

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
    try:
        limit_val = int(limit)
    except ValueError:
        limit_val = 60
    data = analyzer.get_bridge_occurrences(bridge_key=bridge_key, limit=limit_val)
    return jsonify(data)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print("=" * 60)
    print(f" KHỞI CHẠY ỨNG DỤNG WEB XSMB TẠI CỔNG: {port}")
    print("=" * 60)
    app.run(host='0.0.0.0', port=port, debug=False)
