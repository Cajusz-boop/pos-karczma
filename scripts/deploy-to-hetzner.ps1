# Deploy POS Karczma na Hetzner VPS
# Uruchom: powershell -ExecutionPolicy Bypass -File .\scripts\deploy-to-hetzner.ps1
# Opcja: -FullZip - wymusza pelny transfer

param([switch]$FullZip)

$ErrorActionPreference = "Continue"
Write-Host "=== deploy-to-hetzner.ps1 (POS Karczma) ===" -ForegroundColor Green
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

if ($FullZip) {
    Write-Host "Tryb: pelny (wymuszone -FullZip)" -ForegroundColor Yellow
} else {
    Write-Host "Tryb: lekki (delta tar+scp)" -ForegroundColor Green
}

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
    $DB_URL      = $DEPLOY_DATABASE_URL
    $DB_USER     = $DEPLOY_DB_USER
    $DB_PASS     = $DEPLOY_DB_PASS
    $DB_NAME     = $DEPLOY_DB_NAME
} else {
    Write-Host "[BLAD] Brak pliku .env.deploy.hetzner" -ForegroundColor Red
    exit 1
}

$SSH_TARGET = $SSH_USER + "@" + $SSH_HOST
$keyPath = $SSH_KEY -replace '~', $env:USERPROFILE

Write-Host ("Cel: " + $SSH_TARGET + ":" + $REMOTE_PATH) -ForegroundColor Yellow
Write-Host ("Domena: " + $DOMAIN) -ForegroundColor Yellow
Write-Host ""

# === 1/6 Prisma generate ===
Write-Host "=== 1/6 Prisma generate ===" -ForegroundColor Cyan
npx prisma generate

# === 2/6 npm run build ===
Write-Host "" ; Write-Host "=== 2/6 npm run build ===" -ForegroundColor Cyan
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

$standaloneCheck = Join-Path (Join-Path $nextDir "standalone") "server.js"
if (-not (Test-Path $standaloneCheck)) {
    Write-Host "[BLAD] Brak .next/standalone/server.js!" -ForegroundColor Red
    exit 1
}
Write-Host "Build OK" -ForegroundColor Green

# Wyczysc smieci ze standalone
$standaloneDir = Join-Path $ProjectRoot ".next\standalone"
$junkPatterns = @("*.zip", "*.tar", "*.tar.gz", "_deploy_*", ".git")
foreach ($pattern in $junkPatterns) {
    Get-ChildItem -Path $standaloneDir -Recurse -Filter $pattern -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
}

# === 3/6 Upload plikow ===
if (-not $FullZip) {
    Write-Host "" ; Write-Host "=== 3/6 Wysylanie plikow (delta tar+scp) ===" -ForegroundColor Cyan

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    $manifestLocal = Join-Path $ProjectRoot "_deploy_manifest_local.txt"
    $manifestRemote = Join-Path $ProjectRoot "_deploy_manifest_remote.txt"
    $changedList = Join-Path $ProjectRoot "_deploy_changed.txt"
    $deletedList = Join-Path $ProjectRoot "_deploy_deleted.txt"
    $deltaTar = Join-Path $ProjectRoot "_deploy_delta.tar.gz"

    @($manifestLocal, $manifestRemote, $changedList, $deletedList, $deltaTar) | ForEach-Object {
        if (Test-Path $_) { Remove-Item $_ -Force -ErrorAction SilentlyContinue }
    }

    # Generuj manifest lokalny
    Write-Host "Generowanie manifestu lokalnego..." -ForegroundColor Yellow
    $rootNorm = $ProjectRoot.TrimEnd('\', '/') + '\'
    $allFiles = [System.Collections.ArrayList]::new()
    $excludePatterns = @("*.zip", "*.tar", "*.tar.gz", "_deploy_*")
    $standalonePath = Join-Path $ProjectRoot ".next\standalone"
    if (Test-Path $standalonePath) {
        Get-ChildItem -Path $standalonePath -Recurse -File -Exclude $excludePatterns | Where-Object { $_.Name -match '^[\x20-\x7E]+$' } | ForEach-Object { [void]$allFiles.Add($_.FullName) }
    }
    $staticPath = Join-Path $ProjectRoot ".next\static"
    if (Test-Path $staticPath) {
        Get-ChildItem -Path $staticPath -Recurse -File -Exclude $excludePatterns | Where-Object { $_.Name -match '^[\x20-\x7E]+$' } | ForEach-Object { [void]$allFiles.Add($_.FullName) }
    }
    $publicPath = Join-Path $ProjectRoot "public"
    if (Test-Path $publicPath) {
        Get-ChildItem -Path $publicPath -Recurse -File -Exclude $excludePatterns | Where-Object { $_.Name -match '^[\x20-\x7E]+$' } | ForEach-Object { [void]$allFiles.Add($_.FullName) }
    }
    $prismaPath = Join-Path $ProjectRoot "prisma"
    if (Test-Path $prismaPath) {
        Get-ChildItem -Path $prismaPath -Recurse -File -Exclude $excludePatterns | Where-Object { $_.Name -match '^[\x20-\x7E]+$' } | ForEach-Object { [void]$allFiles.Add($_.FullName) }
    }

    $manifestLines = @()
    $maxParallel = [Math]::Max(4, [System.Environment]::ProcessorCount - 1)
    $runspacePool = [runspacefactory]::CreateRunspacePool(1, $maxParallel)
    $runspacePool.Open()
    try {
        $jobs = New-Object System.Collections.ArrayList
        foreach ($fullPath in $allFiles) {
            $pathCopy = $fullPath
            $scriptBlock = {
                param([string]$path, [string]$root)
                $h = Get-FileHash -Path $path -Algorithm MD5 -ErrorAction SilentlyContinue
                if ($h) {
                    $rel = $path.Replace($root, "").Replace("\", "/")
                    return $h.Hash.ToLower() + "  " + $rel
                }
                return $null
            }
            $ps = [powershell]::Create().AddScript($scriptBlock).AddArgument($pathCopy).AddArgument($rootNorm)
            $ps.RunspacePool = $runspacePool
            [void]$jobs.Add([pscustomobject]@{ Pipe = $ps; Handle = $ps.BeginInvoke() })
        }
        foreach ($j in $jobs) {
            $r = $j.Pipe.EndInvoke($j.Handle)
            if ($r) { $manifestLines += $r }
            $j.Pipe.Dispose()
        }
    } finally {
        $runspacePool.Close()
        $runspacePool.Dispose()
    }

    [System.IO.File]::WriteAllLines($manifestLocal, $manifestLines, $utf8NoBom)
    Write-Host ("Manifest: " + $manifestLines.Count + " plikow") -ForegroundColor Gray

    # Pobierz manifest z serwera
    Write-Host "Pobieranie manifestu z serwera..." -ForegroundColor Yellow
    scp -i $keyPath ($SSH_TARGET + ":" + $REMOTE_PATH + "/_deploy_manifest.txt") $manifestRemote 2>$null | Out-Null
    $hasRemoteManifest = Test-Path $manifestRemote
    if (-not $hasRemoteManifest) {
        Write-Host "Brak manifestu na serwerze - pelny transfer (pierwszy deploy)." -ForegroundColor Yellow
    }

    # Porownaj manifesty
    $changedFiles = @()
    $deletedFiles = @()

    if ($hasRemoteManifest) {
        $remoteLines = Get-Content $manifestRemote | Where-Object { $_.Trim() -ne "" }
        $remoteMap = @{}
        foreach ($line in $remoteLines) {
            if ($line -match '^([a-f0-9]{32})\s+(.+)$') {
                $remoteMap[$matches[2].Trim()] = $matches[1]
            }
        }
        $localLines = Get-Content $manifestLocal | Where-Object { $_.Trim() -ne "" }
        $localMap = @{}
        foreach ($line in $localLines) {
            if ($line -match '^([a-f0-9]{32})\s+(.+)$') {
                $localMap[$matches[2].Trim()] = $matches[1]
            }
        }
        foreach ($path in $localMap.Keys) {
            if (-not $remoteMap.ContainsKey($path) -or $remoteMap[$path] -ne $localMap[$path]) {
                $changedFiles += $path
            }
        }
        foreach ($path in $remoteMap.Keys) {
            if (-not $localMap.ContainsKey($path)) {
                $deletedFiles += $path
            }
        }
    } else {
        $changedFiles = $manifestLines | ForEach-Object {
            if ($_ -match '^[a-f0-9]{32}\s+(.+)$') { $matches[1].Trim() }
        } | Where-Object { $_ }
    }

    Write-Host ("Zmienionych/nowych: " + $changedFiles.Count + ", do usuniecia: " + $deletedFiles.Count) -ForegroundColor Cyan

    # Pakuj i wyslij zmienione pliki
    if ($changedFiles.Count -gt 0) {
        $validPaths = @()
        foreach ($p in $changedFiles) {
            $winPath = $p.Replace("/", [System.IO.Path]::DirectorySeparatorChar)
            $fullPath = Join-Path $ProjectRoot $winPath
            if (Test-Path $fullPath -PathType Leaf) {
                $validPaths += $p
            }
        }
        if ($validPaths.Count -gt 0) {
            [System.IO.File]::WriteAllLines($changedList, $validPaths, $utf8NoBom)
            if (Test-Path $deltaTar) { Remove-Item $deltaTar -Force -ErrorAction SilentlyContinue }
            $tarErr = & tar -czf $deltaTar -C $ProjectRoot -T $changedList 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Host "[BLAD] tar delta nie powiodl sie!" -ForegroundColor Red
                exit 1
            }
            $sizeMB = [math]::Round((Get-Item $deltaTar).Length / 1MB, 1)
            Write-Host ("Delta: " + $validPaths.Count + " plikow, " + $sizeMB + " MB") -ForegroundColor Green

            Write-Host "Wysylanie delta na serwer..." -ForegroundColor Yellow
            scp -i $keyPath $deltaTar ($SSH_TARGET + ":" + $REMOTE_PATH + "/")
            if ($LASTEXITCODE -ne 0) {
                Write-Host "[BLAD] scp delta nie powiodl sie!" -ForegroundColor Red
                exit 1
            }
            Write-Host "Rozpakowywanie delta na serwerze..." -ForegroundColor Yellow
            ssh -i $keyPath $SSH_TARGET ("cd " + $REMOTE_PATH + " && rm -rf .next/standalone/.next/static .next/standalone/public && tar -xzf _deploy_delta.tar.gz && rm -f _deploy_delta.tar.gz && mkdir -p .next/standalone/.next && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/")
            Write-Host "Delta OK" -ForegroundColor Green
        }
    } else {
        Write-Host "Brak zmienionych plikow - pomijam transfer." -ForegroundColor Green
    }

    # Usun pliki ktore zniknely
    if ($deletedFiles.Count -gt 0) {
        [System.IO.File]::WriteAllLines($deletedList, $deletedFiles, $utf8NoBom)
        scp -i $keyPath $deletedList ($SSH_TARGET + ":" + $REMOTE_PATH + "/_deploy_deleted.txt")
        if ($LASTEXITCODE -eq 0) {
            ssh -i $keyPath $SSH_TARGET ("cd " + $REMOTE_PATH + " && while read -r f; do rm -f `"`$f`"; done < _deploy_deleted.txt; rm -f _deploy_deleted.txt")
            Write-Host ("Usunieto " + $deletedFiles.Count + " plikow na serwerze.") -ForegroundColor Green
        }
    }

    # Zapisz nowy manifest na serwerze
    scp -i $keyPath $manifestLocal ($SSH_TARGET + ":" + $REMOTE_PATH + "/_deploy_manifest.txt")

    # Posprzataj
    @($manifestLocal, $manifestRemote, $changedList, $deletedList, $deltaTar) | ForEach-Object {
        if (Test-Path $_) { Remove-Item $_ -Force -ErrorAction SilentlyContinue }
    }
    Write-Host "Transfer zakonczony." -ForegroundColor Green

} else {
    # Pelny transfer
    Write-Host "" ; Write-Host "=== 3/6 Upload plikow (pelny tar+scp) ===" -ForegroundColor Cyan

    $tarFile = Join-Path $ProjectRoot "_deploy_hetzner.tar.gz"
    if (Test-Path $tarFile) { Remove-Item $tarFile -Force }

    Write-Host "Pakowanie..." -ForegroundColor Yellow
    tar -czf $tarFile -C $ProjectRoot --exclude=".git" ".next/standalone" ".next/static" "public" "prisma"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[BLAD] tar nie powiodl sie!" -ForegroundColor Red
        exit 1
    }

    $sizeMB = [math]::Round((Get-Item $tarFile).Length / 1MB, 1)
    Write-Host ("Archiwum: " + $sizeMB + " MB") -ForegroundColor Green

    Write-Host "Wysylanie na serwer..." -ForegroundColor Yellow
    scp -i $keyPath $tarFile ($SSH_TARGET + ":" + $REMOTE_PATH + "/")
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[BLAD] scp nie powiodl sie!" -ForegroundColor Red
        exit 1
    }

    ssh -i $keyPath $SSH_TARGET ("cd " + $REMOTE_PATH + " && rm -rf .next && tar -xzf _deploy_hetzner.tar.gz && rm -f _deploy_hetzner.tar.gz && mkdir -p .next/standalone/.next && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/")
    
    if (Test-Path $tarFile) { Remove-Item $tarFile -Force }
    Write-Host "Transfer zakonczony." -ForegroundColor Green
}

# === 4/6 Konfiguracja na serwerze ===
Write-Host "" ; Write-Host "=== 4/6 Konfiguracja serwera ===" -ForegroundColor Cyan

$configCmd = @"
cd $REMOTE_PATH || exit 1

# Utwórz .env jeśli nie istnieje
if [ ! -f .env ]; then
    echo "DATABASE_URL=$DB_URL" > .env
    echo "NODE_ENV=production" >> .env
    echo "PORT=3001" >> .env
    echo "Utworzono .env"
fi

# Utwórz ecosystem.config.js dla PM2
cat > ecosystem.config.js << 'PMEOF'
module.exports = {
  apps: [{
    name: 'pos-karczma',
    script: 'server.js',
    cwd: '/var/www/pos/.next/standalone',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_file: '/var/www/pos/.env',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M'
  }]
};
PMEOF

echo "CONFIG_OK"
"@

$configCmd | ssh -i $keyPath $SSH_TARGET "bash -s"

# === 5/6 Prisma db push ===
Write-Host "" ; Write-Host "=== 5/6 Prisma db push ===" -ForegroundColor Cyan

$prismaCmd = @"
cd $REMOTE_PATH || exit 1
export DATABASE_URL="$DB_URL"

# Prisma db push (tworzy/aktualizuje tabele)
npx prisma db push --schema=prisma/schema.prisma --accept-data-loss 2>&1 || echo "Prisma push warning (kontynuuje)"
echo "PRISMA_OK"
"@

$prismaCmd | ssh -i $keyPath $SSH_TARGET "bash -s"

# === 6/6 Restart PM2 ===
Write-Host "" ; Write-Host "=== 6/6 Restart PM2 ===" -ForegroundColor Cyan

$restartCmd = @"
cd $REMOTE_PATH
export DATABASE_URL="$DB_URL"

if pm2 list | grep -q pos-karczma; then
    echo "Restart aplikacji..."
    pm2 restart pos-karczma --update-env
else
    echo "Pierwsza konfiguracja PM2..."
    cd .next/standalone
    pm2 start server.js --name pos-karczma --env production
    pm2 save
fi

pm2 list
echo "DEPLOY_OK"
"@

$restartCmd | ssh -i $keyPath $SSH_TARGET "bash -s"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "[OK] Deploy na Hetzner zakonczony!" -ForegroundColor Green
Write-Host ("Strona: https://" + $DOMAIN) -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
