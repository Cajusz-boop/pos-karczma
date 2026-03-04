-- Tabela events już istnieje - tworzymy tylko brakujące
CREATE TABLE IF NOT EXISTS `calendar_sync_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `eventsAdded` INTEGER NOT NULL DEFAULT 0,
    `eventsUpdated` INTEGER NOT NULL DEFAULT 0,
    `eventsCancelled` INTEGER NOT NULL DEFAULT 0,
    `error` TEXT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `calendar_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `calendarId` VARCHAR(200) NOT NULL,
    `calendarName` VARCHAR(100) NOT NULL,
    `eventType` ENUM('WESELE', 'POPRAWINY', 'CHRZCINY', 'KOMUNIA', 'URODZINY_ROCZNICA', 'STYPA', 'IMPREZA_FIRMOWA', 'CATERING', 'SPOTKANIE', 'SYLWESTER', 'INNE') NOT NULL,
    `roomName` VARCHAR(100) NULL,
    `defaultPackageId` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    UNIQUE INDEX `calendar_config_calendarId_key`(`calendarId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
