@echo off
chcp 65001 >nul 2>&1
title Tworzenie pakietu skanera
echo.
echo ========================================
echo   Tworzenie pakietu do przeniesienia
echo ========================================
echo.

set PAKIET=pos_skaner_pakiet.zip

REM Usun stary pakiet jesli istnieje
if exist "%PAKIET%" del "%PAKIET%"

REM Uzyj PowerShell do kompresji
powershell -Command "Compress-Archive -Path '%~dp0pos_env_scanner.py', '%~dp0uruchom_skaner.bat', '%~dp0INSTALACJA.txt', '%~dp0README.md' -DestinationPath '%~dp0%PAKIET%' -Force"

if exist "%~dp0%PAKIET%" (
    echo.
    echo [OK] Pakiet utworzony: %PAKIET%
    echo.
    echo Skopiuj ten plik ZIP na docelowy komputer,
    echo rozpakuj i uruchom "uruchom_skaner.bat"
    echo.
) else (
    echo [BLAD] Nie udalo sie utworzyc pakietu
)

echo.
pause
