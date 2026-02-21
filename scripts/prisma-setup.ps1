# Uruchamia Prisma (db push + generate) gdy npx nie jest w PATH.
# Użycie: .\scripts\prisma-setup.ps1   (w katalogu pos-karczma)

# 1. Odśwież PATH z rejestru – po instalacji Node (winget) stary terminal nie widzi nowego PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

# 2. Jeśli node jest już w PATH – użyj go
$nodeExe = $null
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) { $nodeExe = $nodeCmd.Source }

# 3. Szukaj node.exe w typowych lokalizacjach (np. C:\Program Files\nodejs)
if (-not $nodeExe) {
    $nodeDirs = @(
        "C:\Program Files\nodejs",
        "C:\Program Files (x86)\nodejs",
        "$env:LOCALAPPDATA\Programs\node"
    )
    foreach ($d in $nodeDirs) {
        $n = Join-Path $d "node.exe"
        if (Test-Path $n) { $nodeExe = $n; break }
    }
}

if (-not $nodeExe) {
    Write-Host "Node.js nie znaleziony. Zainstaluj z https://nodejs.org (LTS) i zrestartuj terminal." -ForegroundColor Red
    Write-Host "Albo dodaj do PATH katalog z node.exe (np. C:\Program Files\nodejs)." -ForegroundColor Yellow
    exit 1
}

$nodeDir = [System.IO.Path]::GetDirectoryName($nodeExe)
$env:PATH = "$nodeDir;$env:PATH"
Set-Location $PSScriptRoot\..

Write-Host "Uzycie Node: $nodeExe" -ForegroundColor Cyan
Write-Host "Prisma db push..." -ForegroundColor Cyan
& npx prisma db push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Prisma generate..." -ForegroundColor Cyan
& npx prisma generate
exit $LASTEXITCODE
