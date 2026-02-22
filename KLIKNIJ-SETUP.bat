@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   POS KARCZMA - Uruchamiam setup...
echo ========================================
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\setup-new-computer.ps1"
pause
