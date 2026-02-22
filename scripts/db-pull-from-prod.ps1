# =============================================================================
# POS Karczma — Pobierz bazę z produkcji i przywróć lokalnie
# =============================================================================
#
# Użycie:
#   powershell -ExecutionPolicy Bypass -File .\scripts\db-pull-from-prod.ps1
#   powershell -ExecutionPolicy Bypass -File .\scripts\db-pull-from-prod.ps1 -Force  # bez pytania
#
# Wymaga: .env.deploy.hetzner z DEPLOY_SSH_* i DEPLOY_REMOTE_PATH
# Na serwerze: skrypt backup-db.sh (lub mysqldump/mariadb-dump)
#
# Efekt: backup z produkcji w backups/, potem restore do lokalnej bazy z .env
# =============================================================================

param([switch]$Force)
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "=== db-pull-from-prod.ps1 ===" -ForegroundColor Green
Write-Host ""

# 1. Wczytaj konfigurację deploy
$envFile = Join-Path $ProjectRoot ".env.deploy.hetzner"
if (-not (Test-Path $envFile)) {
    Write-Host "[BLAD] Brak pliku .env.deploy.hetzner" -ForegroundColor Red
    Write-Host "Skopiuj .env.deploy.hetzner.example i uzupelnij." -ForegroundColor Yellow
    exit 1
}

$vars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
        $val = $matches[2].Trim() -replace "`r", ""
        $vars[$matches[1].Trim()] = $val
    }
}
$SSH_USER = $vars["DEPLOY_SSH_USER"]
$SSH_HOST = $vars["DEPLOY_SSH_HOST"]
$SSH_KEY = $vars["DEPLOY_SSH_KEY"] -replace '~', $env:USERPROFILE
$REMOTE_PATH = $vars["DEPLOY_REMOTE_PATH"]
if (-not $SSH_USER -or -not $SSH_HOST -or -not (Test-Path $SSH_KEY)) {
    Write-Host "[BLAD] Brak DEPLOY_SSH_USER, DEPLOY_SSH_HOST lub DEPLOY_SSH_KEY w .env.deploy.hetzner" -ForegroundColor Red
    exit 1
}

$SSH_TARGET = "${SSH_USER}@${SSH_HOST}"
Write-Host "Serwer: $SSH_TARGET" -ForegroundColor Cyan
Write-Host "Sciezka: $REMOTE_PATH" -ForegroundColor Cyan
Write-Host ""

# 2. Utwórz backup na serwerze
Write-Host "=== 1/4 Tworzenie backupu na serwerze ===" -ForegroundColor Cyan
$remotePath = $REMOTE_PATH.Trim()
# bash -l ładuje .profile/.bashrc (PATH z dockerem); sh -c '' = hasło wewnątrz kontenera
$backupCmd = 'bash -l -c "cd ' + $remotePath + ' && mkdir -p backups && (docker compose exec -T db sh -c ''mariadb-dump -u root -p\"\$MARIADB_ROOT_PASSWORD\" --single-transaction pos_karczma 2>/dev/null'' | gzip > backups/backup_$(date +%Y-%m-%d_%H%M%S).sql.gz) || bash scripts/backup-db.sh 2>/dev/null; ls -t backups/backup_*.sql.gz 2>/dev/null | head -1"'
$lastBackup = ssh -i $SSH_KEY $SSH_TARGET $backupCmd

$lastBackup = ($lastBackup -replace "`r", "").Trim()
if (-not $lastBackup) {
    Write-Host "[BLAD] Nie udalo sie utworzyc backupu na serwerze." -ForegroundColor Red
    Write-Host "Sprawdz: 1) docker compose dziala na serwerze  2) scripts/backup-db.sh istnieje" -ForegroundColor Yellow
    exit 1
}
$remoteFile = $lastBackup -replace '.*/', ''
Write-Host "Utworzono: $remoteFile" -ForegroundColor Green

# 3. Pobierz plik
Write-Host ""
Write-Host "=== 2/4 Pobieranie pliku ===" -ForegroundColor Cyan
$backupsDir = Join-Path $ProjectRoot "backups"
if (-not (Test-Path $backupsDir)) { New-Item -ItemType Directory -Path $backupsDir | Out-Null }
$localFile = Join-Path $backupsDir $remoteFile
scp -i $SSH_KEY "${SSH_TARGET}:${REMOTE_PATH}/${lastBackup}" $localFile
if (-not (Test-Path $localFile)) {
    Write-Host "[BLAD] Pobieranie nie powiodlo sie." -ForegroundColor Red
    exit 1
}
Write-Host "Pobrano: $localFile" -ForegroundColor Green

# 4. Wczytaj lokalny DATABASE_URL z .env
Write-Host ""
Write-Host "=== 3/4 Przygotowanie restore ===" -ForegroundColor Cyan
$envLocal = Join-Path $ProjectRoot ".env"
$dbUrl = $null
if (Test-Path $envLocal) {
    Get-Content $envLocal | ForEach-Object {
        if ($_ -match '^\s*DATABASE_URL=["'']?(.+?)["'']?\s*$') { $dbUrl = $matches[1].Trim() }
    }
}
if (-not $dbUrl) {
    Write-Host "[BLAD] Brak DATABASE_URL w .env" -ForegroundColor Red
    exit 1
}
# Parsuj URL mysql:// lub mariadb://
if ($dbUrl -match '(?:mysql|mariadb)://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)') {
    $dbUser = $matches[1]
    $dbPass = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
} elseif ($dbUrl -match '(?:mysql|mariadb)://([^@]+)@([^:]+):(\d+)/(.+)') {
    $dbUser = $matches[1]
    $dbPass = ""
    $dbHost = $matches[2]
    $dbPort = $matches[3]
    $dbName = $matches[4]
} else {
    Write-Host "[BLAD] Nie mozna sparsowac DATABASE_URL" -ForegroundColor Red
    exit 1
}

# 5. Restore
Write-Host ""
Write-Host "=== 4/4 Restore do lokalnej bazy ===" -ForegroundColor Cyan
Write-Host "Cel: $dbName @ ${dbHost}:${dbPort}" -ForegroundColor Yellow
Write-Host "UWAGA: Ta operacja NADPISZE lokalna baze!" -ForegroundColor Yellow
if (-not $Force) {
    $confirm = Read-Host "Kontynuowac? (tak/nie)"
} else {
    $confirm = "tak"
}
if ($confirm -ne "tak") {
    Write-Host "Anulowano. Backup zachowany: $localFile" -ForegroundColor Yellow
    exit 0
}

$mysqlExe = "mariadb"
if (-not (Get-Command $mysqlExe -ErrorAction SilentlyContinue)) { $mysqlExe = "mysql" }
if (-not (Get-Command $mysqlExe -ErrorAction SilentlyContinue)) {
    Write-Host "[BLAD] Brak mariadb lub mysql w PATH. Zainstaluj MariaDB/MySQL client." -ForegroundColor Red
    exit 1
}

Write-Host "Importowanie..." -ForegroundColor Yellow
$sqlFile = $localFile
if ($localFile -match '\.gz$') {
    $sqlFile = "$env:TEMP\pos_restore.sql"
    if (Get-Command gunzip -ErrorAction SilentlyContinue) {
        gunzip -c $localFile > $sqlFile 2>$null
    } else {
        $inStream = [System.IO.File]::OpenRead($localFile)
        $gzip = New-Object System.IO.Compression.GZipStream($inStream, [System.IO.Compression.CompressionMode]::Decompress)
        $outStream = [System.IO.File]::Create($sqlFile)
        $gzip.CopyTo($outStream)
        $outStream.Close(); $gzip.Close(); $inStream.Close()
    }
}
$mysqlArgs = @("-h", $dbHost, "-P", $dbPort, "-u", $dbUser, $dbName)
if ($dbPass) { $mysqlArgs += @("-p$dbPass") }
Get-Content $sqlFile -Raw -ErrorAction SilentlyContinue | & $mysqlExe $mysqlArgs 2>&1
if ($sqlFile -ne $localFile -and (Test-Path $sqlFile)) { Remove-Item $sqlFile -Force }

Write-Host ""
Write-Host "Restore zakonczony. Uruchom: npx prisma generate" -ForegroundColor Green
Write-Host "Nastepnie: npm run dev" -ForegroundColor Green
