-- Przywrócenie integracji hotelowej na produkcji (Hetzner)
-- Konfiguracja: baseUrl 127.0.0.1:3000 (hotel-pms na tym samym serwerze), apiKey z HotelSystem
--
-- Uruchom na serwerze:
-- mysql -u [user] -p'[pass]' pos_karczma < scripts/setup-hotel-production.sql
--
-- Lub jeden wiersz (podstaw user/pass z .env.deploy.hetzner):
-- mysql -u pos -p'PosPMS2024#Secure' pos_karczma -e "INSERT INTO SystemConfig (id, \`key\`, value) VALUES (CONCAT('fix-', SUBSTRING(MD5(RAND()), 1, 20)), 'hotel_integration', JSON_OBJECT('enabled', true, 'baseUrl', 'http://127.0.0.1:3000', 'apiKey', 'a89f3281-8ae4-4c06-a351-987b35caa4f')) ON DUPLICATE KEY UPDATE value = JSON_OBJECT('enabled', true, 'baseUrl', 'http://127.0.0.1:3000', 'apiKey', 'a89f3281-8ae4-4c06-a351-987b35caa4f');"

INSERT INTO SystemConfig (id, `key`, value)
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
