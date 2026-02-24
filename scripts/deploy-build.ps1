# Deploy build .next na Hetzner (build lokalnie, upload tylko .next)
# Uruchom: powershell -ExecutionPolicy Bypass -File .\scripts\deploy-build.ps1
# Wymaga: webhook najpierw zrobil git pull + npm ci (zaleznosci)

$ErrorActionPreference = "Stop"
Write-Host "=== deploy-build.ps1 (build lokalnie, upload .next) ===" -ForegroundColor Green
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

# Wczytaj zmienne z .env.deploy.hetzner
$envFile = Join-Path $ProjectRoot ".env.deploy.hetzner"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)=(.*)$') {
            $key = $matches[1].Trim(); $val = $matches[2].Trim()
            Set-Variable -Name $key -Value $val -Scope Script
        }
    }
    $SSH_USER    = $DEPLOY_SSH_USER
    $SSH_HOST    = $DEPLOY_SSH_HOST
    $SSH_KEY     = $DEPLOY_SSH_KEY
    $REMOTE_PATH = $DEPLOY_REMOTE_PATH
    $DOMAIN      = $DEPLOY_DOMAIN
} else {
    Write-Host "[BLAD] Brak pliku .env.deploy.hetzner" -ForegroundColor Red
    exit 1
}

$SSH_TARGET = $SSH_USER + "@" + $SSH_HOST
$keyPath = $SSH_KEY -replace '~', $env:USERPROFILE

Write-Host ("Cel: " + $SSH_TARGET + ":" + $REMOTE_PATH) -ForegroundColor Yellow
Write-Host ""

# === 1. Build lokalnie ===
Write-Host "=== 1/3 npm run build (lokalnie) ===" -ForegroundColor Cyan
$nextDir = Join-Path $ProjectRoot ".next"
if (Test-Path $nextDir) {
    Write-Host "Usuwanie starego .next..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $nextDir
}
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[BLAD] Build nie powiodl sie!" -ForegroundColor Red
    exit 1
}
Write-Host "Build OK" -ForegroundColor Green

# Standalone: wymaga static + public w katalogu standalone
Write-Host "Kopiowanie static i public do standalone..." -ForegroundColor Yellow
$standaloneNext = Join-Path $ProjectRoot ".next/standalone/.next"
if (!(Test-Path $standaloneNext)) { New-Item -ItemType Directory -Path $standaloneNext -Force }
Copy-Item -Recurse (Join-Path $ProjectRoot ".next/static") (Join-Path $standaloneNext "static") -Force
Copy-Item -Recurse (Join-Path $ProjectRoot "public") (Join-Path $ProjectRoot ".next/standalone/public") -Force
Write-Host "Kopiowanie OK" -ForegroundColor Green

# === 2. Upload standalone na serwer ===
Write-Host "" ; Write-Host "=== 2/3 Upload standalone na serwer ===" -ForegroundColor Cyan

$tarFile = Join-Path $ProjectRoot "_deploy_next.tar.gz"
if (Test-Path $tarFile) { Remove-Item $tarFile -Force }

Write-Host "Pakowanie standalone..." -ForegroundColor Yellow
tar -czf $tarFile -C (Join-Path $ProjectRoot ".next") "standalone"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[BLAD] tar nie powiodl sie!" -ForegroundColor Red
    exit 1
}

$sizeMB = [math]::Round((Get-Item $tarFile).Length / 1MB, 1)
Write-Host ("Archiwum: " + $sizeMB + " MB") -ForegroundColor Gray

Write-Host "Wysylanie na serwer (scp)..." -ForegroundColor Yellow
scp -i $keyPath $tarFile ($SSH_TARGET + ":" + $REMOTE_PATH + "/")
if ($LASTEXITCODE -ne 0) {
    Write-Host "[BLAD] scp nie powiodl sie!" -ForegroundColor Red
    if (Test-Path $tarFile) { Remove-Item $tarFile -Force }
    exit 1
}

Write-Host "Rozpakowywanie na serwerze..." -ForegroundColor Yellow
$extractCmd = "cd $REMOTE_PATH && rm -rf standalone && tar -xzf _deploy_next.tar.gz && rm -f _deploy_next.tar.gz && (test -f .env && cp .env standalone/.env || echo 'Brak .env - DATABASE_URL musi byc w zmiennych srodowiskowych')"
ssh -i $keyPath $SSH_TARGET $extractCmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "[BLAD] Rozpakowanie nie powiodlo sie!" -ForegroundColor Red
    exit 1
}

if (Test-Path $tarFile) { Remove-Item $tarFile -Force }
Write-Host "Upload OK" -ForegroundColor Green

# === 3. PM2 restart (force ecosystem.config.js — usuwa stary wpis z .next/standalone) ===
Write-Host "" ; Write-Host "=== 3/3 PM2 restart ===" -ForegroundColor Cyan

$restartCmd = @"
cd $REMOTE_PATH
pm2 delete pos-karczma 2>/dev/null || true
pm2 start ecosystem.config.js --only pos-karczma
pm2 save

# Health check
for i in 1 2 3 4 5; do
  sleep 5
  if curl -sf --max-time 10 http://127.0.0.1:3001/api/health >/dev/null; then
    echo "Health OK"
    exit 0
  fi
  echo "Proba \$i/5..."
done
echo "UWAGA: Health check nie przeszedl. Sprawdz: pm2 logs pos-karczma"
exit 1
"@

$restartCmd | ssh -i $keyPath $SSH_TARGET "bash -s"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[BLAD] PM2 restart / health check nie powiodl sie" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "[OK] Deploy build zakonczony!" -ForegroundColor Green
Write-Host ("Strona: https://" + $DOMAIN) -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
