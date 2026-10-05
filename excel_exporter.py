# -*- coding: utf-8 -*-
"""
XSMB Excel Exporter Module
Xuất dữ liệu thống kê cầu và đối chiếu kết quả ra file Excel chuẩn (.xlsx)
Hỗ trợ:
1. Xuất chi tiết 1 ngày cụ thể (Bảng cầu tổng hợp + Đối chiếu kết quả)
2. Xuất thống kê đa ngày (N ngày gần nhất: Tổng quan hàng ngày + Bảng xếp hạng phong độ từng cầu + Chi tiết từng kỳ quay)
"""
import io
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

import database
import analyzer

# ==============================================================================
# HẰNG SỐ ĐỊNH DẠNG MÀU SẮC & PHÔNG CHỮ (PALETTE STYLES)
# ==============================================================================
FONT_NAME = "Calibri"

F_TITLE = Font(name=FONT_NAME, size=14, bold=True, color="0F172A")
F_SUBTITLE = Font(name=FONT_NAME, size=10, italic=True, color="475569")
F_HEADER = Font(name=FONT_NAME, size=11, bold=True, color="FFFFFF")
F_DATA = Font(name=FONT_NAME, size=10, color="0F172A")
F_DATA_BOLD = Font(name=FONT_NAME, size=10, bold=True, color="0F172A")
F_MONO = Font(name="Consolas", size=10, color="0F172A")
F_MONO_BOLD = Font(name="Consolas", size=10, bold=True, color="0F172A")
F_TOTAL = Font(name=FONT_NAME, size=11, bold=True, color="0F172A")

# Fills
FILL_HEADER = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")       # Slate 800
FILL_HEADER_ALT = PatternFill(start_color="334155", end_color="334155", fill_type="solid")   # Slate 700
FILL_BANNER = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")       # Slate 50
FILL_TOTAL = PatternFill(start_color="FEF9C3", end_color="FEF9C3", fill_type="solid")        # Yellow 100

# Status Fills & Fonts
FILL_WIN = PatternFill(start_color="D1FAE5", end_color="D1FAE5", fill_type="solid")          # Emerald 100
F_WIN = Font(name=FONT_NAME, size=10, bold=True, color="065F46")

FILL_DE = PatternFill(start_color="FEF08A", end_color="FEF08A", fill_type="solid")           # Yellow 200
F_DE = Font(name=FONT_NAME, size=10, bold=True, color="854D0E")

FILL_LOSE = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid")         # Rose 100
F_LOSE = Font(name=FONT_NAME, size=10, color="991B1B")

FILL_PENDING = PatternFill(start_color="E0F2FE", end_color="E0F2FE", fill_type="solid")      # Sky 100
F_PENDING = Font(name=FONT_NAME, size=10, italic=True, color="0369A1")

# Borders
BORDER_THIN_SIDE = Side(border_style="thin", color="CBD5E1")
BORDER_THIN = Border(top=BORDER_THIN_SIDE, left=BORDER_THIN_SIDE, right=BORDER_THIN_SIDE, bottom=BORDER_THIN_SIDE)
BORDER_TOP_DOUBLE = Border(
    top=Side(border_style="double", color="64748B"),
    bottom=Side(border_style="thin", color="64748B"),
    left=BORDER_THIN_SIDE,
    right=BORDER_THIN_SIDE
)

# Alignments
ALIGN_CENTER = Alignment(horizontal="center", vertical="center", wrap_text=True)
ALIGN_LEFT = Alignment(horizontal="left", vertical="center", wrap_text=True)
ALIGN_RIGHT = Alignment(horizontal="right", vertical="center", wrap_text=True)


def auto_fit_columns(ws, min_width=10, max_width=50):
    """Tự động căn chỉnh độ rộng cột theo nội dung"""
    for col in ws.columns:
        col_letter = get_column_letter(col[0].column)
        max_len = 0
        for cell in col:
            val = cell.value
            if val is not None:
                # Tránh các cell bị merge dài như tiêu đề A1
                if cell.row in [1, 2, 3] and ws.merged_cells:
                    continue
                s_val = str(val)
                lines = s_val.split("\n")
                line_max = max(len(l) for l in lines) if lines else 0
                max_len = max(max_len, line_max)
        width = max(min_width, min(max_len + 3, max_width))
        ws.column_dimensions[col_letter].width = width


# ==============================================================================
# 1. XUẤT BẢNG THỐNG KÊ 1 NGÀY CỤ THỂ
# ==============================================================================
def generate_single_date_excel(target_date_str=None):
    """
    Tạo file Excel kết quả cầu tổng hợp và đối chiếu cho 1 ngày cụ thể.
    Bao gồm 2 sheet:
    - Sheet 1: Bảng tổng hợp các cầu và kết quả đối chiếu
    - Sheet 2: Bảng kết quả xổ số chi tiết (nếu ngày đó đã mở thưởng)
    """
    summary = analyzer.get_all_bridges_summary(target_date_str=target_date_str)
    if summary.get("status") == "ERROR":
        raise ValueError(summary.get("message", "Lỗi lấy dữ liệu bảng cầu"))

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Thong_Ke_Cau"
    ws.views.sheetView[0].showGridLines = True

    target_date = summary.get("target_date", "")
    target_display = summary.get("target_date_display", "")
    target_dow = summary.get("day_of_week", "")
    is_pending = summary.get("is_pending", True)
    actual = summary.get("actual_result")
    stats = summary.get("overall_stats", {})
    hero = summary.get("hero_chot", {})

    # Title
    ws.merge_cells("A1:J1")
    ws["A1"] = f"BẢNG KẾT QUẢ CẦU TỔNG HỢP XSMB - {target_dow.upper()}, NGÀY {target_display.upper()}"
    ws["A1"].font = F_TITLE
    ws["A1"].alignment = ALIGN_CENTER
    ws.row_dimensions[1].height = 28

    ws.merge_cells("A2:J2")
    ws["A2"] = f"Xuất bản lúc: {datetime.now().strftime('%H:%M:%S %d/%m/%Y')} | Trạng thái: {'Chờ mở thưởng lúc 18h30' if is_pending else 'Đã có kết quả mở thưởng'}"
    ws["A2"].font = F_SUBTITLE
    ws["A2"].alignment = ALIGN_CENTER
    ws.row_dimensions[2].height = 18

    # Metadata Banner (Rows 4-6)
    row_idx = 4
    if not is_pending and actual:
        ws.merge_cells(f"A{row_idx}:E{row_idx}")
        ws[f"A{row_idx}"] = f"🎯 GIẢI ĐẶC BIỆT: {actual.get('special_prize', '-')}  |  ĐỀ (2 SỐ CUỐI): {actual.get('actual_de', '-')}"
        ws[f"A{row_idx}"].font = F_DATA_BOLD
        ws[f"A{row_idx}"].fill = FILL_BANNER
        ws[f"A{row_idx}"].alignment = ALIGN_LEFT

        ws.merge_cells(f"F{row_idx}:J{row_idx}")
        ws[f"F{row_idx}"] = f"📊 TỔNG KẾT: {stats.get('win_bridges', 0)}/{stats.get('total_bridges', 0)} Cầu nổ ({stats.get('win_rate', 0)}%)  |  Tổng nháy: {stats.get('total_hits', 0)} nháy  |  Đề: {'ĂN ĐỀ' if stats.get('de_bridges', 0) > 0 else 'Trượt'}"
        ws[f"F{row_idx}"].font = F_DATA_BOLD
        ws[f"F{row_idx}"].fill = FILL_BANNER
        ws[f"F{row_idx}"].alignment = ALIGN_RIGHT
        ws.row_dimensions[row_idx].height = 22

        row_idx += 1
        st_ev = hero.get("song_thu_eval", {})
        bt_ev = hero.get("bach_thu_eval", {})
        t5_ev = hero.get("top5_eval", {})

        st_str = f"Song Thủ: [{', '.join(hero.get('song_thu', []))}] -> {st_ev.get('status_badge', 'CHỜ')}"
        bt_str = f"Bạch Thủ: [{hero.get('bach_thu', '-')}] -> {bt_ev.get('status_badge', 'CHỜ')}"
        t5_str = f"Top 5: [{', '.join(hero.get('top5', []))}] -> {t5_ev.get('status_badge', 'CHỜ')}"

        ws.merge_cells(f"A{row_idx}:J{row_idx}")
        ws[f"A{row_idx}"] = f"⭐ HERO CHỐT:  {st_str}   |   {bt_str}   |   {t5_str}"
        ws[f"A{row_idx}"].font = F_DATA_BOLD
        ws[f"A{row_idx}"].fill = FILL_BANNER
        ws[f"A{row_idx}"].alignment = ALIGN_LEFT
        ws.row_dimensions[row_idx].height = 20
        row_idx += 2
    else:
        ws.merge_cells(f"A{row_idx}:J{row_idx}")
        ws[f"A{row_idx}"] = "⏳ KỲ QUAY ĐANG CHỜ MỞ THƯỞNG LÚC 18H30 HÔM NAY"
        ws[f"A{row_idx}"].font = F_DATA_BOLD
        ws[f"A{row_idx}"].fill = FILL_BANNER
        ws[f"A{row_idx}"].alignment = ALIGN_CENTER
        ws.row_dimensions[row_idx].height = 22
        row_idx += 2

    # Table Header
    headers = [
        ("STT", 6, ALIGN_CENTER),
        ("Tab / Phân Loại", 16, ALIGN_LEFT),
        ("Tên Thuật Toán / Cầu", 32, ALIGN_LEFT),
        ("Cơ Chế Soi Cầu", 36, ALIGN_LEFT),
        ("Cặp Số Dự Đoán", 18, ALIGN_CENTER),
        ("Độ Tin Cậy", 12, ALIGN_CENTER),
        ("Tín Hiệu", 18, ALIGN_CENTER),
        ("Kết Quả Đối Chiếu", 20, ALIGN_CENTER),
        ("Số Nháy Nổ", 12, ALIGN_CENTER),
        ("Danh Sách Số Trúng", 18, ALIGN_CENTER),
    ]

    for col_idx, (h_title, _, h_align) in enumerate(headers, start=1):
        cell = ws.cell(row=row_idx, column=col_idx, value=h_title)
        cell.font = F_HEADER
        cell.fill = FILL_HEADER
        cell.alignment = h_align
        cell.border = BORDER_THIN
    ws.row_dimensions[row_idx].height = 24
    row_idx += 1

    # Table Data Rows
    bridge_rows = summary.get("bridge_rows", [])
    for idx, row in enumerate(bridge_rows, start=1):
        status_type = row.get("status_type", "pending")
        preds = row.get("predicted", [])
        pred_str = " - ".join(preds) if preds else "-"
        hit_nums = row.get("hit_numbers", [])
        hit_str = ", ".join(hit_nums) if hit_nums else "-"
        hits = row.get("hits", 0)

        r_stt = ws.cell(row=row_idx, column=1, value=idx)
        r_stt.alignment = ALIGN_CENTER
        r_stt.border = BORDER_THIN

        r_tab = ws.cell(row=row_idx, column=2, value=row.get("tab_name", ""))
        r_tab.alignment = ALIGN_LEFT
        r_tab.border = BORDER_THIN

        r_name = ws.cell(row=row_idx, column=3, value=row.get("bridge_name", ""))
        r_name.alignment = ALIGN_LEFT
        r_name.font = F_DATA_BOLD
        r_name.border = BORDER_THIN

        stats_sum = row.get("stats_summary", "")
        rule_sum = row.get("rule_summary", "")
        rule_full = f"{rule_sum} ({stats_sum})".strip() if stats_sum else rule_sum
        r_rule = ws.cell(row=row_idx, column=4, value=rule_full)
        r_rule.alignment = ALIGN_LEFT
        r_rule.border = BORDER_THIN

        r_pred = ws.cell(row=row_idx, column=5, value=pred_str)
        r_pred.alignment = ALIGN_CENTER
        r_pred.font = F_MONO_BOLD
        r_pred.border = BORDER_THIN

        r_score = ws.cell(row=row_idx, column=6, value=f"{row.get('score', 0)}/100")
        r_score.alignment = ALIGN_CENTER
        r_score.font = F_MONO
        r_score.border = BORDER_THIN

        r_sig = ws.cell(row=row_idx, column=7, value=row.get("signal", ""))
        r_sig.alignment = ALIGN_CENTER
        r_sig.border = BORDER_THIN

        # Cột Kết Quả Đối Chiếu
        r_res = ws.cell(row=row_idx, column=8, value=row.get("status_badge", "CHỜ"))
        r_res.alignment = ALIGN_CENTER
        r_res.border = BORDER_THIN

        # Cột Số Nháy
        r_hits = ws.cell(row=row_idx, column=9, value=hits if not is_pending else "-")
        r_hits.alignment = ALIGN_CENTER
        r_hits.font = F_MONO_BOLD
        r_hits.border = BORDER_THIN

        # Cột Số Trúng
        r_hitnums = ws.cell(row=row_idx, column=10, value=hit_str if not is_pending else "-")
        r_hitnums.alignment = ALIGN_CENTER
        r_hitnums.font = F_MONO_BOLD
        r_hitnums.border = BORDER_THIN

        # Tô màu trạng thái
        if status_type == "de":
            r_res.fill = FILL_DE
            r_res.font = F_DE
            r_pred.fill = FILL_DE
        elif status_type == "win":
            r_res.fill = FILL_WIN
            r_res.font = F_WIN
            r_pred.fill = FILL_WIN
        elif status_type == "lose":
            r_res.fill = FILL_LOSE
            r_res.font = F_LOSE
        else:
            r_res.fill = FILL_PENDING
            r_res.font = F_PENDING

        ws.row_dimensions[row_idx].height = 22
        row_idx += 1

    # Dòng Tổng Cộng
    if not is_pending and bridge_rows:
        ws.cell(row=row_idx, column=1, value="")
        ws.cell(row=row_idx, column=2, value="")
        ws.cell(row=row_idx, column=3, value="TỔNG KẾT").font = F_TOTAL
        ws.cell(row=row_idx, column=4, value="")
        ws.cell(row=row_idx, column=5, value="")
        ws.cell(row=row_idx, column=6, value="")
        ws.cell(row=row_idx, column=7, value="")
        r_tot_res = ws.cell(row=row_idx, column=8, value=f"{stats.get('win_bridges', 0)}/{stats.get('total_bridges', 0)} Cầu nổ ({stats.get('win_rate', 0)}%)")
        r_tot_res.font = F_TOTAL
        r_tot_res.alignment = ALIGN_CENTER

        r_tot_hits = ws.cell(row=row_idx, column=9, value=f"{stats.get('total_hits', 0)} nháy")
        r_tot_hits.font = F_TOTAL
        r_tot_hits.alignment = ALIGN_CENTER

        ws.cell(row=row_idx, column=10, value="")

        for c_idx in range(1, 11):
            cell = ws.cell(row=row_idx, column=c_idx)
            cell.border = BORDER_TOP_DOUBLE
            cell.fill = FILL_TOTAL
        ws.row_dimensions[row_idx].height = 24

    auto_fit_columns(ws)

    # Sheet 2: Kết quả mở thưởng chi tiết (nếu có)
    if not is_pending and actual:
        ws_kq = wb.create_sheet(title="Ket_Qua_Mo_Thuong")
        ws_kq.views.sheetView[0].showGridLines = True

        ws_kq.merge_cells("A1:F1")
        ws_kq["A1"] = f"CHI TIẾT KẾT QUẢ XỔ SỐ MIỀN BẮC - {target_dow.upper()}, NGÀY {target_display}"
        ws_kq["A1"].font = F_TITLE
        ws_kq["A1"].alignment = ALIGN_CENTER
        ws_kq.row_dimensions[1].height = 28

        # Lấy bản ghi đầy đủ từ DB
        draw_record = database.get_result_by_date(target_date)
        if draw_record:
            prizes = [
                ("Giải Đặc Biệt", draw_record.get("special_prize", "")),
                ("Giải Nhất", draw_record.get("prize_1", "")),
                ("Giải Nhì", draw_record.get("prize_2", "")),
                ("Giải Ba", draw_record.get("prize_3", "")),
                ("Giải Tư", draw_record.get("prize_4", "")),
                ("Giải Năm", draw_record.get("prize_5", "")),
                ("Giải Sáu", draw_record.get("prize_6", "")),
                ("Giải Bảy", draw_record.get("prize_7", "")),
                ("27 Số Lô Tô", ", ".join(draw_record.get("loto_2digit", []))),
            ]
            r_kq = 3
            for p_name, p_val in prizes:
                ws_kq.cell(row=r_kq, column=1, value=p_name).font = F_DATA_BOLD
                ws_kq.cell(row=r_kq, column=1).fill = FILL_BANNER
                ws_kq.cell(row=r_kq, column=1).border = BORDER_THIN

                ws_kq.merge_cells(f"B{r_kq}:F{r_kq}")
                str_val = ", ".join(str(x) for x in p_val) if isinstance(p_val, list) else str(p_val or "")
                val_cell = ws_kq.cell(row=r_kq, column=2, value=str_val)
                val_cell.font = F_MONO_BOLD if "Đặc Biệt" in p_name else F_MONO
                val_cell.border = BORDER_THIN
                if "Đặc Biệt" in p_name:
                    val_cell.fill = FILL_DE
                ws_kq.row_dimensions[r_kq].height = 22
                r_kq += 1

            auto_fit_columns(ws_kq)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    filename = f"Thong_Ke_Cau_XSMB_{target_date}.xlsx"
    return buf, filename


# ==============================================================================
# 2. XUẤT BẢNG THỐNG KÊ ĐA NGÀY (MULTI-DAY BATCH EXPORT)
# ==============================================================================
def generate_multi_date_excel(days=14, end_date_str=None):
    """
    Tạo file Excel thống kê cầu qua nhiều ngày liên tiếp (N kỳ gần nhất).
    Bao gồm 3 sheet:
    - Sheet 1: `Tong_Quan_Cac_Ngay`: Mỗi dòng là 1 ngày, thống kê tỷ lệ trúng, nháy, Đề, Hero Chốt
    - Sheet 2: `Xep_Hang_Phong_Do_Cau`: Đánh giá hiệu suất phong độ của từng loại cầu qua N ngày
    - Sheet 3: `Chi_Tiet_Tung_Ky_Quay`: Toàn bộ các dòng cầu của từng ngày
    """
    available_dates = database.get_available_backtest_dates(include_pending=False)
    if not available_dates:
        raise ValueError("Chưa có đủ dữ liệu lịch sử để xuất thống kê đa ngày")

    # Lọc danh sách ngày
    if end_date_str:
        idx_start = next((i for i, d in enumerate(available_dates) if d["draw_date"] <= end_date_str), 0)
        selected_dates = available_dates[idx_start:]
    else:
        selected_dates = available_dates

    if str(days).lower() != "all":
        try:
            limit_n = int(days)
            selected_dates = selected_dates[:limit_n]
        except ValueError:
            selected_dates = selected_dates[:14]

    if not selected_dates:
        raise ValueError("Không tìm thấy kỳ quay nào phù hợp để xuất dữ liệu")

    # Thu thập kết quả từng ngày
    daily_summaries = []
    bridge_stats_map = {}  # {bridge_name: {count, wins, de_wins, hits, ...}}
    all_detail_rows = []

    for d_obj in selected_dates:
        d_str = d_obj["draw_date"]
        s_data = analyzer.get_all_bridges_summary(target_date_str=d_str)
        if s_data.get("status") == "SUCCESS":
            daily_summaries.append(s_data)

            # Thu thập chi tiết từng cầu
            b_rows = s_data.get("bridge_rows", [])
            for r in b_rows:
                b_name = r.get("bridge_name", "Khác")
                tab_name = r.get("tab_name", "")
                if b_name not in bridge_stats_map:
                    bridge_stats_map[b_name] = {
                        "bridge_name": b_name,
                        "tab_name": tab_name,
                        "total_draws": 0,
                        "wins": 0,
                        "de_wins": 0,
                        "loses": 0,
                        "total_hits": 0
                    }
                bridge_stats_map[b_name]["total_draws"] += 1
                if r.get("is_de"):
                    bridge_stats_map[b_name]["de_wins"] += 1
                if r.get("is_win"):
                    bridge_stats_map[b_name]["wins"] += 1
                    bridge_stats_map[b_name]["total_hits"] += r.get("hits", 0)
                elif r.get("is_win") is False:
                    bridge_stats_map[b_name]["loses"] += 1

                all_detail_rows.append({
                    "date": s_data.get("target_date", ""),
                    "dow": s_data.get("day_of_week", ""),
                    "date_display": s_data.get("target_date_display", ""),
                    "tab_name": tab_name,
                    "bridge_name": b_name,
                    "predicted": " - ".join(r.get("predicted", [])),
                    "score": r.get("score", 0),
                    "status_badge": r.get("status_badge", ""),
                    "status_type": r.get("status_type", ""),
                    "hits": r.get("hits", 0),
                    "hit_numbers": ", ".join(r.get("hit_numbers", [])),
                    "special_prize": s_data.get("actual_result", {}).get("special_prize", ""),
                    "actual_de": s_data.get("actual_result", {}).get("actual_de", "")
                })

    if not daily_summaries:
        raise ValueError("Không thể thu thập dữ liệu phân tích các ngày")

    wb = openpyxl.Workbook()

    # ==========================================================================
    # SHEET 1: TỔNG QUAN HÀNG NGÀY
    # ==========================================================================
    ws1 = wb.active
    ws1.title = "Tong_Quan_Cac_Ngay"
    ws1.views.sheetView[0].showGridLines = True

    date_newest = daily_summaries[0].get("target_date", "")
    date_oldest = daily_summaries[-1].get("target_date", "")

    ws1.merge_cells("A1:N1")
    ws1["A1"] = f"BẢNG THỐNG KÊ HIỆU QUẢ CẦU XSMB QUA {len(daily_summaries)} KỲ QUAY ({date_oldest} ➔ {date_newest})"
    ws1["A1"].font = F_TITLE
    ws1["A1"].alignment = ALIGN_CENTER
    ws1.row_dimensions[1].height = 28

    ws1.merge_cells("A2:N2")
    ws1["A2"] = f"Xuất bản lúc: {datetime.now().strftime('%H:%M:%S %d/%m/%Y')} | Dữ liệu đối chiếu kết quả thực tế từ CSDL SQLite XSMB"
    ws1["A2"].font = F_SUBTITLE
    ws1["A2"].alignment = ALIGN_CENTER
    ws1.row_dimensions[2].height = 18

    headers_ws1 = [
        ("STT", 6, ALIGN_CENTER),
        ("Ngày Quay", 14, ALIGN_CENTER),
        ("Thứ", 12, ALIGN_CENTER),
        ("Giải ĐB", 12, ALIGN_CENTER),
        ("Đề 2 Số", 10, ALIGN_CENTER),
        ("Tổng Cầu", 10, ALIGN_CENTER),
        ("Cầu Nổ", 10, ALIGN_CENTER),
        ("Tỷ Lệ Trúng", 14, ALIGN_CENTER),
        ("Tổng Nháy", 12, ALIGN_CENTER),
        ("Ăn Đề", 12, ALIGN_CENTER),
        ("Song Thủ Chốt", 16, ALIGN_CENTER),
        ("KQ Song Thủ", 18, ALIGN_CENTER),
        ("Bạch Thủ Chốt", 14, ALIGN_CENTER),
        ("KQ Bạch Thủ", 18, ALIGN_CENTER),
    ]

    r1_idx = 4
    for c_idx, (h_title, _, h_align) in enumerate(headers_ws1, start=1):
        cell = ws1.cell(row=r1_idx, column=c_idx, value=h_title)
        cell.font = F_HEADER
        cell.fill = FILL_HEADER
        cell.alignment = h_align
        cell.border = BORDER_THIN
    ws1.row_dimensions[r1_idx].height = 24
    r1_idx += 1

    sum_total_bridges = 0
    sum_win_bridges = 0
    sum_total_hits = 0
    sum_de_days = 0
    sum_st_wins = 0
    sum_bt_wins = 0

    for idx, d_data in enumerate(daily_summaries, start=1):
        actual_res = d_data.get("actual_result") or {}
        st = d_data.get("overall_stats") or {}
        hero_obj = d_data.get("hero_chot") or {}
        st_ev = hero_obj.get("song_thu_eval") or {}
        bt_ev = hero_obj.get("bach_thu_eval") or {}

        tot_b = st.get("total_bridges", 0)
        win_b = st.get("win_bridges", 0)
        w_pct = st.get("win_rate", 0)
        t_hits = st.get("total_hits", 0)
        is_de_day = st.get("de_bridges", 0) > 0

        sum_total_bridges += tot_b
        sum_win_bridges += win_b
        sum_total_hits += t_hits
        if is_de_day:
            sum_de_days += 1
        if st_ev.get("is_win"):
            sum_st_wins += 1
        if bt_ev.get("is_win"):
            sum_bt_wins += 1

        ws1.cell(row=r1_idx, column=1, value=idx).alignment = ALIGN_CENTER
        ws1.cell(row=r1_idx, column=2, value=d_data.get("target_date", "")).alignment = ALIGN_CENTER
        ws1.cell(row=r1_idx, column=3, value=d_data.get("day_of_week", "")).alignment = ALIGN_CENTER

        c_sp = ws1.cell(row=r1_idx, column=4, value=actual_res.get("special_prize", ""))
        c_sp.alignment = ALIGN_CENTER
        c_sp.font = F_MONO_BOLD

        c_de = ws1.cell(row=r1_idx, column=5, value=actual_res.get("actual_de", ""))
        c_de.alignment = ALIGN_CENTER
        c_de.font = F_MONO_BOLD

        ws1.cell(row=r1_idx, column=6, value=tot_b).alignment = ALIGN_CENTER
        ws1.cell(row=r1_idx, column=7, value=win_b).alignment = ALIGN_CENTER

        c_pct = ws1.cell(row=r1_idx, column=8, value=f"{w_pct}%")
        c_pct.alignment = ALIGN_CENTER
        c_pct.font = F_DATA_BOLD

        c_hits = ws1.cell(row=r1_idx, column=9, value=f"{t_hits}N")
        c_hits.alignment = ALIGN_CENTER
        c_hits.font = F_MONO_BOLD

        # Cột Ăn Đề
        c_de_status = ws1.cell(row=r1_idx, column=10, value="🏆 ĂN ĐỀ" if is_de_day else "Trượt")
        c_de_status.alignment = ALIGN_CENTER
        if is_de_day:
            c_de_status.fill = FILL_DE
            c_de_status.font = F_DE

        # Song thủ
        c_st = ws1.cell(row=r1_idx, column=11, value=" - ".join(hero_obj.get("song_thu", [])))
        c_st.alignment = ALIGN_CENTER
        c_st.font = F_MONO

        c_st_res = ws1.cell(row=r1_idx, column=12, value=st_ev.get("status_badge", ""))
        c_st_res.alignment = ALIGN_CENTER
        if st_ev.get("is_de"):
            c_st_res.fill = FILL_DE
            c_st_res.font = F_DE
        elif st_ev.get("is_win"):
            c_st_res.fill = FILL_WIN
            c_st_res.font = F_WIN

        # Bạch thủ
        c_bt = ws1.cell(row=r1_idx, column=13, value=hero_obj.get("bach_thu", "-"))
        c_bt.alignment = ALIGN_CENTER
        c_bt.font = F_MONO

        c_bt_res = ws1.cell(row=r1_idx, column=14, value=bt_ev.get("status_badge", ""))
        c_bt_res.alignment = ALIGN_CENTER
        if bt_ev.get("is_de"):
            c_bt_res.fill = FILL_DE
            c_bt_res.font = F_DE
        elif bt_ev.get("is_win"):
            c_bt_res.fill = FILL_WIN
            c_bt_res.font = F_WIN

        # Borders
        for c_idx in range(1, 15):
            ws1.cell(row=r1_idx, column=c_idx).border = BORDER_THIN

        ws1.row_dimensions[r1_idx].height = 21
        r1_idx += 1

    # Dòng Tổng Hợp / Trung Bình
    n_days = len(daily_summaries)
    avg_win_pct = round((sum_win_bridges / sum_total_bridges * 100), 1) if sum_total_bridges > 0 else 0
    st_win_pct = round((sum_st_wins / n_days * 100), 1) if n_days > 0 else 0
    bt_win_pct = round((sum_bt_wins / n_days * 100), 1) if n_days > 0 else 0

    ws1.cell(row=r1_idx, column=1, value="")
    ws1.cell(row=r1_idx, column=2, value="TỔNG KẾT").font = F_TOTAL
    ws1.cell(row=r1_idx, column=3, value=f"{n_days} kỳ").font = F_TOTAL
    ws1.cell(row=r1_idx, column=4, value="")
    ws1.cell(row=r1_idx, column=5, value="")
    ws1.cell(row=r1_idx, column=6, value=sum_total_bridges).font = F_TOTAL
    ws1.cell(row=r1_idx, column=7, value=sum_win_bridges).font = F_TOTAL

    r_avg = ws1.cell(row=r1_idx, column=8, value=f"TB: {avg_win_pct}%")
    r_avg.font = F_TOTAL
    r_avg.alignment = ALIGN_CENTER

    r_hits_tot = ws1.cell(row=r1_idx, column=9, value=f"{sum_total_hits} nháy")
    r_hits_tot.font = F_TOTAL
    r_hits_tot.alignment = ALIGN_CENTER

    r_de_tot = ws1.cell(row=r1_idx, column=10, value=f"Ăn {sum_de_days}/{n_days} kỳ")
    r_de_tot.font = F_TOTAL
    r_de_tot.alignment = ALIGN_CENTER

    ws1.cell(row=r1_idx, column=11, value="")
    r_st_tot = ws1.cell(row=r1_idx, column=12, value=f"Ăn {sum_st_wins}/{n_days} ({st_win_pct}%)")
    r_st_tot.font = F_TOTAL
    r_st_tot.alignment = ALIGN_CENTER

    ws1.cell(row=r1_idx, column=13, value="")
    r_bt_tot = ws1.cell(row=r1_idx, column=14, value=f"Ăn {sum_bt_wins}/{n_days} ({bt_win_pct}%)")
    r_bt_tot.font = F_TOTAL
    r_bt_tot.alignment = ALIGN_CENTER

    for c_idx in range(1, 15):
        cell = ws1.cell(row=r1_idx, column=c_idx)
        cell.border = BORDER_TOP_DOUBLE
        cell.fill = FILL_TOTAL
    ws1.row_dimensions[r1_idx].height = 24

    auto_fit_columns(ws1)

    # ==========================================================================
    # SHEET 2: XẾP HẠNG PHONG ĐỘ HIỆU QUẢ CÁC CẦU
    # ==========================================================================
    ws2 = wb.create_sheet(title="Xep_Hang_Phong_Do_Cau")
    ws2.views.sheetView[0].showGridLines = True

    ws2.merge_cells("A1:J1")
    ws2["A1"] = f"BẢNG XẾP HẠNG PHONG ĐỘ & ĐỘ ỔN ĐỊNH CÁC THUẬT TOÁN SOI CẦU ({n_days} KỲ)"
    ws2["A1"].font = F_TITLE
    ws2["A1"].alignment = ALIGN_CENTER
    ws2.row_dimensions[1].height = 28

    ws2.merge_cells("A2:J2")
    ws2["A2"] = "Sắp xếp theo tỷ lệ trúng kỳ và tổng số nháy nổ để tìm ra phương pháp hiệu quả nhất"
    ws2["A2"].font = F_SUBTITLE
    ws2["A2"].alignment = ALIGN_CENTER
    ws2.row_dimensions[2].height = 18

    headers_ws2 = [
        ("Hạng", 8, ALIGN_CENTER),
        ("Tên Phương Pháp / Thuật Toán", 34, ALIGN_LEFT),
        ("Tab / Nhóm", 16, ALIGN_LEFT),
        ("Số Kỳ Báo", 12, ALIGN_CENTER),
        ("Số Kỳ Nổ (Win)", 14, ALIGN_CENTER),
        ("Tỷ Lệ Nổ (%)", 14, ALIGN_CENTER),
        ("Số Lần Ăn Đề", 14, ALIGN_CENTER),
        ("Tổng Nháy Nổ", 14, ALIGN_CENTER),
        ("Nháy TB / Kỳ", 14, ALIGN_CENTER),
        ("Đánh Giá Phong Độ", 22, ALIGN_CENTER),
    ]

    r2_idx = 4
    for c_idx, (h_title, _, h_align) in enumerate(headers_ws2, start=1):
        cell = ws2.cell(row=r2_idx, column=c_idx, value=h_title)
        cell.font = F_HEADER
        cell.fill = FILL_HEADER_ALT
        cell.alignment = h_align
        cell.border = BORDER_THIN
    ws2.row_dimensions[r2_idx].height = 24
    r2_idx += 1

    # Sắp xếp các cầu theo win_rate và total_hits
    sorted_bridges = list(bridge_stats_map.values())
    for b in sorted_bridges:
        tot = b["total_draws"]
        b["win_rate"] = round((b["wins"] / tot * 100), 1) if tot > 0 else 0
        b["avg_hits"] = round((b["total_hits"] / tot), 2) if tot > 0 else 0

    sorted_bridges.sort(key=lambda x: (x["win_rate"], x["total_hits"]), reverse=True)

    for rank, b in enumerate(sorted_bridges, start=1):
        wr = b["win_rate"]
        if wr >= 65:
            rating = "🌟 XUẤT SẮC"
            rating_fill = FILL_WIN
            rating_font = F_WIN
        elif wr >= 50:
            rating = "⭐ RẤT TỐT"
            rating_fill = FILL_WIN
            rating_font = F_WIN
        elif wr >= 38:
            rating = "ỔN ĐỊNH"
            rating_fill = None
            rating_font = F_DATA
        else:
            rating = "CẦN THEO DÕI"
            rating_fill = FILL_LOSE
            rating_font = F_LOSE

        c_rank = ws2.cell(row=r2_idx, column=1, value=rank)
        c_rank.alignment = ALIGN_CENTER
        c_rank.font = F_DATA_BOLD

        c_name = ws2.cell(row=r2_idx, column=2, value=b["bridge_name"])
        c_name.alignment = ALIGN_LEFT
        c_name.font = F_DATA_BOLD

        ws2.cell(row=r2_idx, column=3, value=b["tab_name"]).alignment = ALIGN_LEFT
        ws2.cell(row=r2_idx, column=4, value=b["total_draws"]).alignment = ALIGN_CENTER
        ws2.cell(row=r2_idx, column=5, value=b["wins"]).alignment = ALIGN_CENTER

        c_wr = ws2.cell(row=r2_idx, column=6, value=f"{wr}%")
        c_wr.alignment = ALIGN_CENTER
        c_wr.font = F_DATA_BOLD

        c_de = ws2.cell(row=r2_idx, column=7, value=b["de_wins"])
        c_de.alignment = ALIGN_CENTER
        if b["de_wins"] > 0:
            c_de.font = F_DE
            c_de.fill = FILL_DE

        ws2.cell(row=r2_idx, column=8, value=b["total_hits"]).alignment = ALIGN_CENTER
        ws2.cell(row=r2_idx, column=9, value=b["avg_hits"]).alignment = ALIGN_CENTER

        c_rating = ws2.cell(row=r2_idx, column=10, value=rating)
        c_rating.alignment = ALIGN_CENTER
        c_rating.font = rating_font
        if rating_fill:
            c_rating.fill = rating_fill

        for c_idx in range(1, 11):
            ws2.cell(row=r2_idx, column=c_idx).border = BORDER_THIN

        ws2.row_dimensions[r2_idx].height = 22
        r2_idx += 1

    auto_fit_columns(ws2)

    # ==========================================================================
    # SHEET 3: CHI TIẾT TỪNG KỲ QUAY
    # ==========================================================================
    ws3 = wb.create_sheet(title="Chi_Tiet_Tung_Ky")
    ws3.views.sheetView[0].showGridLines = True

    ws3.merge_cells("A1:K1")
    ws3["A1"] = f"CHI TIẾT TOÀN BỘ CÁC CẦU VÀ KẾT QUẢ ĐỐI CHIẾU ({len(all_detail_rows)} DÒNG DỮ LIỆU)"
    ws3["A1"].font = F_TITLE
    ws3["A1"].alignment = ALIGN_CENTER
    ws3.row_dimensions[1].height = 28

    headers_ws3 = [
        ("STT", 6, ALIGN_CENTER),
        ("Ngày Quay", 14, ALIGN_CENTER),
        ("Thứ", 12, ALIGN_CENTER),
        ("Tab Cầu", 16, ALIGN_LEFT),
        ("Tên Thuật Toán / Cầu", 32, ALIGN_LEFT),
        ("Cặp Số Dự Đoán", 18, ALIGN_CENTER),
        ("GĐB Thực Tế", 14, ALIGN_CENTER),
        ("Đề 2 Số", 10, ALIGN_CENTER),
        ("Kết Quả Đối Chiếu", 18, ALIGN_CENTER),
        ("Số Nháy Nổ", 12, ALIGN_CENTER),
        ("Số Trúng", 16, ALIGN_CENTER),
    ]

    r3_idx = 3
    for c_idx, (h_title, _, h_align) in enumerate(headers_ws3, start=1):
        cell = ws3.cell(row=r3_idx, column=c_idx, value=h_title)
        cell.font = F_HEADER
        cell.fill = FILL_HEADER
        cell.alignment = h_align
        cell.border = BORDER_THIN
    ws3.row_dimensions[r3_idx].height = 24
    r3_idx += 1

    for idx, d_row in enumerate(all_detail_rows, start=1):
        status_type = d_row.get("status_type", "")
        hits = d_row.get("hits", 0)

        ws3.cell(row=r3_idx, column=1, value=idx).alignment = ALIGN_CENTER
        ws3.cell(row=r3_idx, column=2, value=d_row.get("date", "")).alignment = ALIGN_CENTER
        ws3.cell(row=r3_idx, column=3, value=d_row.get("dow", "")).alignment = ALIGN_CENTER
        ws3.cell(row=r3_idx, column=4, value=d_row.get("tab_name", "")).alignment = ALIGN_LEFT

        c_name = ws3.cell(row=r3_idx, column=5, value=d_row.get("bridge_name", ""))
        c_name.alignment = ALIGN_LEFT

        c_pred = ws3.cell(row=r3_idx, column=6, value=d_row.get("predicted", ""))
        c_pred.alignment = ALIGN_CENTER
        c_pred.font = F_MONO_BOLD

        ws3.cell(row=r3_idx, column=7, value=d_row.get("special_prize", "")).alignment = ALIGN_CENTER
        ws3.cell(row=r3_idx, column=8, value=d_row.get("actual_de", "")).alignment = ALIGN_CENTER

        c_status = ws3.cell(row=r3_idx, column=9, value=d_row.get("status_badge", ""))
        c_status.alignment = ALIGN_CENTER

        c_hits = ws3.cell(row=r3_idx, column=10, value=hits).alignment = ALIGN_CENTER
        c_hits_num = ws3.cell(row=r3_idx, column=11, value=d_row.get("hit_numbers", "")).alignment = ALIGN_CENTER

        if status_type == "de":
            c_status.fill = FILL_DE
            c_status.font = F_DE
            c_pred.fill = FILL_DE
        elif status_type == "win":
            c_status.fill = FILL_WIN
            c_status.font = F_WIN
            c_pred.fill = FILL_WIN
        elif status_type == "lose":
            c_status.fill = FILL_LOSE
            c_status.font = F_LOSE

        for c_idx in range(1, 12):
            ws3.cell(row=r3_idx, column=c_idx).border = BORDER_THIN

        ws3.row_dimensions[r3_idx].height = 20
        r3_idx += 1

    auto_fit_columns(ws3)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    filename = f"Thong_Ke_Cau_XSMB_{n_days}_Ngay_{date_oldest}_{date_newest}.xlsx"
    return buf, filename
