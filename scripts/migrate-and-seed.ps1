# Migracja + seed — uruchom gdy MySQL działa (np. lokalnie na localhost:3306).
# Upewnij się, że w .env jest ustawione DATABASE_URL (mysql://USER:PASSWORD@localhost:3306/pos_karczma).

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "Migracja bazy..." -ForegroundColor Cyan
npx prisma migrate dev --name init
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`nSeed danych startowych..." -ForegroundColor Cyan
npm run seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`nGotowe." -ForegroundColor Green
