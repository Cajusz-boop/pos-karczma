# Dodaj alias /next/static/ -> ten sam katalog co /_next/static/
# (niektore requesty ida pod /next/ zamiast /_next/)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $ProjectRoot ".env.deploy.hetzner"

if (!(Test-Path $envFile)) {
    Write-Host "[BLAD] Brak .env.deploy.hetzner" -ForegroundColor Red
    exit 1
}

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
        Set-Variable -Name $matches[1].Trim() -Value $matches[2].Trim() -Scope Script
    }
}

$keyPath = $DEPLOY_SSH_KEY -replace '~', $env:USERPROFILE
$SSH_TARGET = $DEPLOY_SSH_USER + "@" + $DEPLOY_SSH_HOST

$script = @'
set -e
CONF="/etc/nginx/sites-available/pos.karczma-labedz.pl"
[ -f "$CONF" ] || { echo "Blad: brak $CONF"; exit 1; }

if grep -q "location /next/static/" "$CONF"; then
  echo "location /next/static/ juz istnieje. OK."
  sudo nginx -t && sudo systemctl reload nginx
  exit 0
fi

sudo cp "$CONF" "${CONF}.bak2"
sudo python3 << 'PYEOF'
import re
with open("/etc/nginx/sites-available/pos.karczma-labedz.pl") as f:
    c = f.read()
block = """    location /next/static/ {
        alias /var/www/pos/standalone/.next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
"""
# Wstaw po bloku /_next/static/
pattern = r'(location /_next/static/ \{[^}]+})\s*'
match = re.search(pattern, c, re.DOTALL)
if match:
    c = c.replace(match.group(0), match.group(0) + block)
    with open("/etc/nginx/sites-available/pos.karczma-labedz.pl", "w") as f:
        f.write(c)
    print("Dodano location /next/static/")
else:
    print("Nie znaleziono bloku /_next/static/ - wstawiam przed location /")
    c = re.sub(r'(\s+location / \{)', block + r'\1', c, count=1)
    with open("/etc/nginx/sites-available/pos.karczma-labedz.pl", "w") as f:
        f.write(c)
PYEOF

sudo nginx -t && sudo systemctl reload nginx && echo "=== Nginx OK ==="
'@

Write-Host "Dodawanie aliasu /next/static/ na serwerze..." -ForegroundColor Cyan
$script | ssh -i $keyPath $SSH_TARGET "bash -s"
