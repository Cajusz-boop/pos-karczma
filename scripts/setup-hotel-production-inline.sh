#!/bin/bash
# Uruchom na serwerze: bash scripts/setup-hotel-production-inline.sh
cd /var/www/pos 2>/dev/null || true
mysql pos_karczma -e "
INSERT INTO systemconfig (id, \`key\`, value)
VALUES (
  CONCAT('fix-', SUBSTRING(MD5(RAND()), 1, 20)),
  'hotel_integration',
  JSON_OBJECT(
    'enabled', true,
    'baseUrl', 'http://127.0.0.1:3000',
    'apiKey', 'a89f3281-8ae4-4c06-a351-987b35caa4f'
  )
)
ON DUPLICATE KEY UPDATE
  value = JSON_OBJECT(
    'enabled', true,
    'baseUrl', 'http://127.0.0.1:3000',
    'apiKey', 'a89f3281-8ae4-4c06-a351-987b35caa4f'
  );
"
echo "Done. Exit: $?"
