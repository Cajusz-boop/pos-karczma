@echo off
chcp 65001 >nul 2>&1
title POS Karczma - Skaner Srodowiskowy v3.0

echo.
echo ====================================================================
echo   POS KARCZMA - SKANER SRODOWISKOWY v3.0
echo ====================================================================
echo.

:: Sprawdz Python
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [X] BLAD: Python nie jest zainstalowany!
    echo.
    echo     Ten skaner wymaga Python 3.8 lub nowszego.
    echo.
    echo     Pobierz Python z: https://www.python.org/downloads/
    echo.
    echo     WAZNE: Podczas instalacji zaznacz opcje:
    echo            [x] Add Python to PATH
    echo            [x] Install for all users
    echo.
    set /p "OPEN_URL=Otworzyc strone pobierania? (T/N): "
    if /i "%OPEN_URL%"=="T" start https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

:: Sprawdz wersje Python
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYVER=%%i
echo [OK] Python %PYVER% zainstalowany
echo.

:: Sprawdz uprawnienia administratora
net session >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Uruchomiono jako Administrator
) else (
    echo [!] UWAGA: Uruchom jako Administrator dla pelnych wynikow
    echo     Kliknij prawym przyciskiem i wybierz "Uruchom jako administrator"
    echo.
)

:: Uruchom skaner
echo.
echo Uruchamiam skaner...
echo ====================================================================
echo.

python "%~dp0pos_env_scanner.py"

echo.
echo ====================================================================
echo Skanowanie zakonczone!
echo.
echo Plik raportu JSON zostal zapisany w biezacym katalogu.
echo Mozesz go otworzyc w edytorze tekstu lub przeslac do administratora.
echo ====================================================================
echo.
pause
