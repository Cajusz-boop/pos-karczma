@echo off
REM =============================================================================
REM Automatyczna aktualizacja pos-karczma - uruchamiana przez Task Scheduler
REM Sprawdza czy są nowe zmiany na GitHub i aktualizuje jeśli tak
REM =============================================================================

cd /d E:\pos-karczma

REM Sprawdź czy są nowe zmiany
git fetch origin master >nul 2>&1
if %errorlevel% neq 0 git fetch origin main >nul 2>&1

for /f %%i in ('git rev-parse HEAD') do set LOCAL=%%i
for /f %%i in ('git rev-parse origin/master 2^>nul ^|^| git rev-parse origin/main') do set REMOTE=%%i

if "%LOCAL%"=="%REMOTE%" (
    exit /b 0
)

REM Są zmiany - aktualizuj
echo %date% %time% - Wykryto zmiany, aktualizuję... >> E:\pos-karczma\logs\auto-update.log

call git pull >> E:\pos-karczma\logs\auto-update.log 2>&1
if %errorlevel% neq 0 (
    echo %date% %time% - BLAD: git pull >> E:\pos-karczma\logs\auto-update.log
    exit /b 1
)

call npm install >> E:\pos-karczma\logs\auto-update.log 2>&1
call npx prisma generate >> E:\pos-karczma\logs\auto-update.log 2>&1

call pm2 stop pos-karczma >> E:\pos-karczma\logs\auto-update.log 2>&1
call npm run build >> E:\pos-karczma\logs\auto-update.log 2>&1

if %errorlevel% neq 0 (
    echo %date% %time% - BLAD: npm run build >> E:\pos-karczma\logs\auto-update.log
    call pm2 restart pos-karczma >> E:\pos-karczma\logs\auto-update.log 2>&1
    exit /b 1
)

call pm2 restart pos-karczma >> E:\pos-karczma\logs\auto-update.log 2>&1

echo %date% %time% - Aktualizacja zakonczona pomyslnie >> E:\pos-karczma\logs\auto-update.log
exit /b 0
