@echo off
chcp 65001 > NUL
title Đẩy code lên GitHub
cd /d "%~dp0"
echo ============================================================
echo   ĐANG ĐẨY CODE LÊN GITHUB: xsmb-app
echo ============================================================
echo.
git push -u origin main
echo.
pause
