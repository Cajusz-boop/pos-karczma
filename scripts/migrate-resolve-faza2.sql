-- Skrypt naprawczy: event_packages już istnieje, migracja 20260304120000 się wywala.
-- Uruchom na serwerze PRZED ponownym deployem (albo jako część SSH w deploy).
-- Użycie: mysql -u pos -p pos_karczma < migrate-resolve-faza2.sql

-- 1. Utwórz brakujące tabele (event_packages już jest)
CREATE TABLE IF NOT EXISTS `event_package_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `packageId` INTEGER NOT NULL,
    `recipeDishId` INTEGER NOT NULL,
    `portionsPerPerson` DOUBLE NOT NULL DEFAULT 1,
    `notes` VARCHAR(200) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    CONSTRAINT `event_package_items_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `event_packages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `event_package_items_recipeDishId_fkey` FOREIGN KEY (`recipeDishId`) REFERENCES `recipes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `procurement_calculations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `weekStart` DATETIME(3) NOT NULL,
    `weekEnd` DATETIME(3) NOT NULL,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `calculatedBy` VARCHAR(100) NOT NULL,
    `result` JSON NOT NULL,
    `emailSentAt` DATETIME(3) NULL,
    `emailSentTo` VARCHAR(200) NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stock_minimums` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `minimum` DOUBLE NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `stock_minimums_productId_key`(`productId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `stock_minimums_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Po uruchomieniu SQL: npx prisma migrate resolve --applied "20260304120000_add_faza2_kalkulator_tables"
