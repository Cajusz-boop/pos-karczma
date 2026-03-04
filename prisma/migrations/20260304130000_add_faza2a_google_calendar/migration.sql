-- CreateEnum (EventType for Event)
-- EventStatus, GuestCountSource

-- CreateTable
CREATE TABLE `events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `googleEventId` VARCHAR(200) NOT NULL,
    `googleCalendarId` VARCHAR(200) NOT NULL,
    `calendarName` VARCHAR(100) NOT NULL,
    `eventType` ENUM('WESELE', 'POPRAWINY', 'CHRZCINY', 'KOMUNIA', 'URODZINY_ROCZNICA', 'STYPA', 'IMPREZA_FIRMOWA', 'CATERING', 'SPOTKANIE', 'SYLWESTER', 'INNE') NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `googleEventUrl` VARCHAR(500) NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `roomName` VARCHAR(100) NULL,
    `guestCount` INTEGER NULL,
    `guestCountSource` ENUM('PARSED', 'MANUAL') NOT NULL DEFAULT 'MANUAL',
    `packageId` INTEGER NULL,
    `notes` TEXT NULL,
    `status` ENUM('DRAFT', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `events_googleEventId_key`(`googleEventId`),
    INDEX `events_startDate_idx`(`startDate`),
    INDEX `events_eventType_idx`(`eventType`),
    INDEX `events_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `calendar_sync_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `eventsAdded` INTEGER NOT NULL DEFAULT 0,
    `eventsUpdated` INTEGER NOT NULL DEFAULT 0,
    `eventsCancelled` INTEGER NOT NULL DEFAULT 0,
    `error` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `calendar_config` (
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

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `event_packages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_config` ADD CONSTRAINT `calendar_config_defaultPackageId_fkey` FOREIGN KEY (`defaultPackageId`) REFERENCES `event_packages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
