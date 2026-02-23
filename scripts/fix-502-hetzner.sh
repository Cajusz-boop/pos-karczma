#!/bin/bash
# Szybka naprawa 502 Bad Gateway na serwerze Hetzner
# Uruchom na serwerze: bash fix-502-hetzner.sh
# Lub z Windows: ssh -i key root@65.108.245.25 "curl -sL https://raw.../fix-502-hetzner.sh | bash"
# Lub: scp scripts/fix-502-hetzner.sh root@65.108.245.25:/tmp/ && ssh root@65.108.245.25 "bash /tmp/fix-502-hetzner.sh"

set -e
echo "=== Fix 502 - POS Karczma ==="

cd /var/www/pos 2>/dev/null || { echo "Blad: brak /var/www/pos"; exit 1; }

echo "1. PM2 status..."
pm2 status

echo ""
echo "2. Restart pos-karczma..."
pm2 restart pos-karczma --update-env
pm2 save

echo ""
echo "3. Czekam 10s na start..."
sleep 10

echo ""
echo "4. Health check..."
if curl -sf --max-time 15 http://127.0.0.1:3001/api/health; then
  echo ""
  echo "=== OK - aplikacja odpowiada ==="
else
  echo ""
  echo "=== BLAD - aplikacja nie odpowiada ==="
  echo "Ostatnie logi:"
  pm2 logs pos-karczma --lines 30 --nostream
  exit 1
fi
