# Zastosuj konfigurację nginx dla static (przez SSH)
# Uruchom: powershell -ExecutionPolicy Bypass -File .\scripts\fix-nginx-static-ssh.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $ProjectRoot ".env.deploy.hetzner"

if (!(Test-Path $envFile)) {
    Write-Host "[BLAD] Brak .env.deploy.hetzner" -ForegroundColor Red
    exit 1
}

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
        $key = $matches[1].Trim(); $val = $matches[2].Trim()
        Set-Variable -Name $key -Value $val -Scope Script
    }
}

$keyPath = $DEPLOY_SSH_KEY -replace '~', $env:USERPROFILE
$SSH_TARGET = $DEPLOY_SSH_USER + "@" + $DEPLOY_SSH_HOST

$patchScript = @'
set -e
CONF="/etc/nginx/sites-available/pos.karczma-labedz.pl"
[ -f "$CONF" ] || { echo "Blad: brak $CONF"; exit 1; }
grep -q "location /_next/static/" "$CONF" && { echo "Bloki juz istnieja. OK."; sudo nginx -t && sudo systemctl reload nginx; exit 0; }
sudo cp "$CONF" "${CONF}.bak"
sudo python3 -c "
import re
with open('$CONF') as f: c = f.read()
block = '''    # Next.js static — serwuj z dysku
    location /_next/static/ {
        alias /var/www/pos/standalone/.next/static/;
        expires 365d;
        add_header Cache-Control \"public, immutable\";
    }
    # Public (manifest, favicon, icons, sw.js)
    location ~ ^/(manifest\\.json|favicon\\.ico|icon-192\\.png|icon-512\\.png|sw\\.js) {
        root /var/www/pos/standalone/public;
        expires 7d;
    }

'''
c = re.sub(r'(\s+location / \{)', block + r'\1', c, count=1)
with open('$CONF', 'w') as f: f.write(c)
"
echo "Dodano bloki static"
sudo nginx -t && sudo systemctl reload nginx && echo "=== Nginx OK ==="
'@

Write-Host "Laczenie z $SSH_TARGET i aktualizacja nginx..." -ForegroundColor Cyan
$patchScript | ssh -i $keyPath $SSH_TARGET "bash -s"
