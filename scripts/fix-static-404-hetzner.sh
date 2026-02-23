#!/bin/bash
# Naprawa 404 na /_next/static/ — nginx serwuje pliki z dysku
# Uruchom na serwerze: bash fix-static-404-hetzner.sh
# Lub: scp scripts/fix-static-404-hetzner.sh root@HOST:/tmp/ && ssh root@HOST "bash /tmp/fix-static-404-hetzner.sh"

set -e
CONF="/etc/nginx/sites-available/pos.karczma-labedz.pl"

echo "=== Fix 404 static - POS Karczma ==="

if [ ! -f "$CONF" ]; then
  echo "Blad: brak $CONF"
  exit 1
fi

if grep -q "location /_next/static/" "$CONF"; then
  echo "Location /_next/static/ juz istnieje. OK."
  exit 0
fi

if [ ! -d "/var/www/pos/standalone/.next/static" ]; then
  echo "UWAGA: Brak /var/www/pos/standalone/.next/static"
  echo "Uruchom: .\\scripts\\deploy-build.ps1"
  exit 1
fi

echo ""
echo "Dodaj do $CONF (PRZED blokiem 'location /'):"
echo ""
cat << 'EOF'
    # Next.js static — serwuj z dysku
    location /_next/static/ {
        alias /var/www/pos/standalone/.next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
    # Public (manifest, favicon, icons, sw.js)
    location ~ ^/(manifest\.json|favicon\.ico|icon-192\.png|icon-512\.png|sw\.js) {
        root /var/www/pos/standalone/public;
        expires 7d;
    }

EOF
echo "Potem: sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "Lub edytuj recznie: sudo nano $CONF"
