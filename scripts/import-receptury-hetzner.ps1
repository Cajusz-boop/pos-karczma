# Import receptur na Hetzner — uruchom SQL na serwerze
# Uruchom: powershell -ExecutionPolicy Bypass -File .\scripts\import-receptury-hetzner.ps1
# Wymaga: deploy (Prisma db push) wykonany wcześniej

$ErrorActionPreference = "Stop"
Write-Host "=== import-receptury-hetzner.ps1 ===" -ForegroundColor Green
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$envFile = Join-Path $ProjectRoot ".env.deploy.hetzner"
if (-not (Test-Path $envFile)) {
    Write-Host "[BLAD] Brak pliku .env.deploy.hetzner" -ForegroundColor Red
    exit 1
}

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
        $key = $matches[1].Trim(); $val = $matches[2].Trim()
        Set-Variable -Name $key -Value $val -Scope Script
    }
}

$SSH_USER = $DEPLOY_SSH_USER
$SSH_HOST = $DEPLOY_SSH_HOST
$SSH_KEY = $DEPLOY_SSH_KEY
$REMOTE_PATH = $DEPLOY_REMOTE_PATH
$DB_USER = $DEPLOY_DB_USER
$DB_PASS = $DEPLOY_DB_PASS
$DB_NAME = $DEPLOY_DB_NAME

$SSH_TARGET = $SSH_USER + "@" + $SSH_HOST
$keyPath = $SSH_KEY -replace '~', $env:USERPROFILE
$sqlLocal = Join-Path $ProjectRoot "scripts\receptury_import.sql"

if (-not (Test-Path $sqlLocal)) {
    Write-Host "[BLAD] Brak pliku scripts\receptury_import.sql" -ForegroundColor Red
    exit 1
}

Write-Host "Wysylanie receptury_import.sql na serwer..." -ForegroundColor Cyan
scp -i $keyPath $sqlLocal ($SSH_TARGET + ":" + $REMOTE_PATH + "/receptury_import.sql")
if ($LASTEXITCODE -ne 0) {
    Write-Host "[BLAD] scp nie powiodl sie" -ForegroundColor Red
    exit 1
}

Write-Host "Wykonywanie SQL na bazie..." -ForegroundColor Cyan
$mysqlCmd = "cd $REMOTE_PATH && mysql -u $DB_USER -p'$DB_PASS' $DB_NAME < receptury_import.sql && rm -f receptury_import.sql && echo 'IMPORT_OK'"
$mysqlCmd | ssh -i $keyPath $SSH_TARGET "bash -s"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[BLAD] Import SQL nie powiodl sie" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[OK] Import 450 receptur zakonczony!" -ForegroundColor Green
