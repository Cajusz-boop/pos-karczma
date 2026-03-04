-- Dopasowanie tabel do schematu Prisma (brakujące kolumny po imporcie receptury_import_v2.sql)
ALTER TABLE recipes ADD COLUMN status ENUM('AKTYWNA','ARCHIWALNA') NOT NULL DEFAULT 'AKTYWNA' AFTER portionUnit;
ALTER TABLE recipe_ingredients MODIFY COLUMN productId INT NULL;
ALTER TABLE recipe_ingredients ADD COLUMN subRecipeId INT NULL AFTER productId;
ALTER TABLE recipe_ingredients ADD COLUMN sortOrder INT NOT NULL DEFAULT 0;
