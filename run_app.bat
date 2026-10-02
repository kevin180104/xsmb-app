@echo off
chcp 65001 > NUL
title App Thống Kê & Phân Tích XSMB
echo ============================================================
echo   ĐANG KHỞI CHẠY ỨNG DỤNG WEB XSMB...
echo ============================================================
echo.
echo   Trình duyệt sẽ tự động mở địa chỉ: http://localhost:8080
echo   Bấm Ctrl+C trong cửa sổ này nếu muốn dừng server.
echo.
start http://localhost:8080
python app.py
pause
