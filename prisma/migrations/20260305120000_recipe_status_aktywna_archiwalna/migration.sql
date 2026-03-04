-- Najpierw ustaw istniejące SEZONOWA/TESTOWA na AKTYWNA
UPDATE `recipes` SET `status` = 'AKTYWNA' WHERE `status` IN ('SEZONOWA', 'TESTOWA');

-- Zmień enum na tylko AKTYWNA, ARCHIWALNA
ALTER TABLE `recipes` MODIFY COLUMN `status` ENUM('AKTYWNA', 'ARCHIWALNA') NOT NULL DEFAULT 'AKTYWNA';
