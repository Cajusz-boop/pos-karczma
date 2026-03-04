# Seed na produkcji Hetzner — uruchamia npm run seed na serwerze
# Uruchom: powershell -ExecutionPolicy Bypass -File .\scripts\seed-on-hetzner.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$envFile = Join-Path $ProjectRoot ".env.deploy.hetzner"
if (-not (Test-Path $envFile)) {
    Write-Host "[BLAD] Brak pliku .env.deploy.hetzner" -ForegroundColor Red
    exit 1
}

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
        Set-Variable -Name $matches[1].Trim() -Value $matches[2].Trim() -Scope Script
    }
}

$SSH_USER    = $DEPLOY_SSH_USER
$SSH_HOST    = $DEPLOY_SSH_HOST
$SSH_KEY     = $DEPLOY_SSH_KEY
$REMOTE_PATH = $DEPLOY_REMOTE_PATH
$DB_URL      = $DEPLOY_DATABASE_URL

if (-not $SSH_USER -or -not $SSH_HOST) {
    Write-Host "[BLAD] Brak DEPLOY_SSH_USER lub DEPLOY_SSH_HOST w .env.deploy.hetzner" -ForegroundColor Red
    exit 1
}

$SSH_TARGET = "$SSH_USER@$SSH_HOST"
$keyPath = $SSH_KEY -replace '~', $env:USERPROFILE

Write-Host "=== Seed na Hetzner: $SSH_TARGET`:$REMOTE_PATH ===" -ForegroundColor Cyan

$seedCmd = @"
cd $REMOTE_PATH || exit 1
npx prisma db seed --schema=prisma/schema.prisma
"@

$seedCmd | ssh -i $keyPath $SSH_TARGET "bash -s"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Seed zakonczony na produkcji" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[BLAD] Seed failed" -ForegroundColor Red
    exit 1
}
