# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
import requests
import json

BASE = 'http://127.0.0.1:8080'

def test_all():
    print("Bắt đầu kiểm thử toàn diện hệ thống Auto Pattern Discovery & SVG Visualization...")

    # 1. Kiểm tra trang chủ và tài nguyên
    r_home = requests.get(BASE + '/')
    assert r_home.status_code == 200, f"Trang chủ lỗi: {r_home.status_code}"
    assert 'sec-auto_pattern' in r_home.text, "Thiếu section sec-auto_pattern"
    assert 'pattern_visualizer.js' in r_home.text, "Thiếu file script pattern_visualizer.js"
    assert 'html2canvas' in r_home.text, "Thiếu script html2canvas"
    print("  [✓] Giao diện trang chủ và template HTML đã nạp đầy đủ components.")

    # 2. Kiểm tra tọa độ 107 vị trí
    r_coords = requests.get(BASE + '/api/patterns/coords')
    assert r_coords.status_code == 200, f"API Coords lỗi: {r_coords.status_code}"
    coords = r_coords.json()['coords']
    assert len(coords) == 107, f"Số lượng tọa độ không đúng: {len(coords)}"
    print(f"  [✓] Hệ tọa độ 107 vị trí chữ số XSMB chuẩn xác: {coords[0]['label']} -> {coords[-1]['label']}.")

    # 3. Kiểm tra quét tự động (Auto Discovery)
    r_scan = requests.get(BASE + '/api/patterns/scan?days=60&min_confidence=0.40&top_n=10')
    assert r_scan.status_code == 200, f"API Scan lỗi: {r_scan.status_code}"
    scan_data = r_scan.json()
    summary = scan_data['scanSummary']
    patterns = scan_data['patterns']
    print(f"  [✓] Đào tìm pattern tự động thành công:")
    print(f"      - Đã kiểm tra: {summary['candidatesChecked']:,} candidate rules")
    print(f"      - Đã loại (yếu): {summary['rejectedCount']:,}")
    print(f"      - Đạt tiêu chuẩn: {summary['passedCount']}")
    print(f"      - Phân loại: Mạnh={summary['strongCount']}, Khá={summary['mediumCount']}, Yếu={summary['weakCount']}, Overfit={summary['overfitCount']}")
    print(f"      - Thời gian quét vector hóa: {summary['elapsedSeconds']} giây.")

    # 4. Kiểm tra dữ liệu đồ thị SVG & Draw cards
    top1 = patterns[0]
    pa = top1['sources'][0]['globalIndex']
    pb = top1['sources'][1]['globalIndex']
    op = top1['operation']
    r_det = requests.get(f"{BASE}/api/patterns/details?pos_a={pa}&pos_b={pb}&op={op}&draws=8")
    assert r_det.status_code == 200, f"API Details lỗi: {r_det.status_code}"
    det_data = r_det.json()
    draw_cards = det_data['drawCards']
    graph = det_data['graph']
    assert len(draw_cards) == 8, "Số thẻ kỳ quay không đúng"
    assert len(graph['nodes']) > 0, "Đồ thị không có đỉnh (nodes)"
    assert len(graph['edges']) > 0, "Đồ thị không có cạnh (edges)"
    print(f"  [✓] Cấu trúc đồ thị SVG & Bảng kết quả:")
    print(f"      - Số kỳ quay xếp dọc: {len(draw_cards)} kỳ")
    print(f"      - Số đỉnh đồ thị (Nodes): {len(graph['nodes'])}")
    print(f"      - Số cạnh nối đường cầu (Edges): {len(graph['edges'])}")
    print(f"      - Top 1 Pattern: {top1['name']} | Trúng {top1['hits']}/{top1['occurrences']} ({top1['metrics']['rawHitRate']*100:.1f}%) | Wilson Conf: {top1['metrics']['confidenceScore']*100:.1f}% | Lift: {top1['metrics']['lift']}x | Dự đoán kỳ tới: {top1['nextPrediction']}")

    print("\n===> TẤT CẢ CÁC BƯỚC KIỂM THỬ TÍCH HỢP ĐỀU THÀNH CÔNG RỰC RỠ! <===")

if __name__ == '__main__':
    test_all()
