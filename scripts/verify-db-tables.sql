-- Weryfikacja tabel w bazie (produkcja/chmura).
-- Uruchom: mysql -u USER -p'PASS' pos_karczma < scripts/verify-db-tables.sql

SET NAMES utf8mb4;

SELECT '=== LISTA WSZYSTKICH TABEL W BAZIE ===' AS info;
SELECT TABLE_NAME AS tabela
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;

SELECT '=== WYMAGANE TABELE FAZA 2 (receptury, imprezy, zaopatrzenie) ===' AS info;
SELECT TABLE_NAME AS tabela,
       CASE WHEN TABLE_NAME IS NOT NULL THEN 'OK' END AS status
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
    'products',
    'unit_conversions',
    'recipes',
    'recipe_ingredients',
    'tags',
    'recipe_tags',
    'recipe_history',
    'event_packages',
    'event_package_items',
    'procurement_calculations',
    'stock_minimums',
    'events',
    'calendar_sync_log',
    'calendar_config'
  )
ORDER BY TABLE_NAME;

SELECT '=== BRAKUJĄCE TABELE (jeśli puste = wszystko OK) ===' AS info;
SELECT t.required AS brakująca_tabela
FROM (
  SELECT 'products' AS required UNION ALL
  SELECT 'unit_conversions' UNION ALL
  SELECT 'recipes' UNION ALL
  SELECT 'recipe_ingredients' UNION ALL
  SELECT 'tags' UNION ALL
  SELECT 'recipe_tags' UNION ALL
  SELECT 'recipe_history' UNION ALL
  SELECT 'event_packages' UNION ALL
  SELECT 'event_package_items' UNION ALL
  SELECT 'procurement_calculations' UNION ALL
  SELECT 'stock_minimums' UNION ALL
  SELECT 'events' UNION ALL
  SELECT 'calendar_sync_log' UNION ALL
  SELECT 'calendar_config'
) t
LEFT JOIN information_schema.TABLES s
  ON s.TABLE_SCHEMA = DATABASE() AND s.TABLE_NAME = t.required
WHERE s.TABLE_NAME IS NULL;

SELECT '=== KOLUMNA recipes.status (powinna być ENUM AKTYWNA, ARCHIWALNA) ===' AS info;
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'recipes'
  AND COLUMN_NAME = 'status';
