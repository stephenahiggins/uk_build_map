-- AlterTable
ALTER TABLE `User` ADD COLUMN `type` ENUM('ADMIN', 'MODERATOR', 'USER') NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE `LocalAuthority` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `website` VARCHAR(191) NULL,
    `countryCode` ENUM('ENGLAND', 'SCOTLAND', 'WALES', 'NORTHERN_IRELAND') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LocalAuthority_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` ENUM('LOCAL_GOV', 'NATIONAL_GOV', 'REGIONAL_GOV') NOT NULL,
    `ownerOrg` VARCHAR(191) NULL,
    `regionId` VARCHAR(191) NOT NULL,
    `localAuthorityId` VARCHAR(191) NULL,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expectedCompletion` DATETIME(3) NULL,
    `status` ENUM('AMBER', 'GREEN') NOT NULL,
    `statusUpdatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `statusRationale` VARCHAR(191) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,

    INDEX `Project_regionId_idx`(`regionId`),
    INDEX `Project_status_idx`(`status`),
    INDEX `Project_localAuthorityId_idx`(`localAuthorityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Objective` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `orderIndex` INTEGER NOT NULL,

    INDEX `Objective_projectId_orderIndex_idx`(`projectId`, `orderIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KeyResult` (
    `id` VARCHAR(191) NOT NULL,
    `objectiveId` VARCHAR(191) NOT NULL,
    `statement` VARCHAR(191) NOT NULL,
    `targetMetric` DECIMAL(20, 6) NULL,
    `currentMetric` DECIMAL(20, 6) NULL,
    `unit` VARCHAR(191) NULL,
    `dueDate` DATETIME(3) NULL,
    `ragStatus` ENUM('AMBER', 'GREEN') NOT NULL,

    INDEX `KeyResult_objectiveId_idx`(`objectiveId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EvidenceItem` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `submittedById` INTEGER NOT NULL,
    `type` ENUM('PDF', 'URL', 'TEXT') NOT NULL,
    `urlOrBlobId` VARCHAR(191) NOT NULL,
    `caption` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `moderationState` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,

    INDEX `EvidenceItem_projectId_idx`(`projectId`),
    INDEX `EvidenceItem_submittedById_idx`(`submittedById`),
    INDEX `EvidenceItem_moderationState_idx`(`moderationState`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Region` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `boundingPolygon` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DiscoveredProject` (
    `id` VARCHAR(191) NOT NULL,
    `rawContentHash` VARCHAR(191) NOT NULL,
    `sourceUrl` VARCHAR(191) NOT NULL,
    `crawledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `linkedProjectId` VARCHAR(191) NULL,

    UNIQUE INDEX `DiscoveredProject_rawContentHash_key`(`rawContentHash`),
    INDEX `DiscoveredProject_linkedProjectId_idx`(`linkedProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LLMSummary` (
    `id` VARCHAR(191) NOT NULL,
    `discoveredProjectId` VARCHAR(191) NOT NULL,
    `summaryJson` JSON NOT NULL,
    `confidence` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `Region`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_localAuthorityId_fkey` FOREIGN KEY (`localAuthorityId`) REFERENCES `LocalAuthority`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Objective` ADD CONSTRAINT `Objective_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KeyResult` ADD CONSTRAINT `KeyResult_objectiveId_fkey` FOREIGN KEY (`objectiveId`) REFERENCES `Objective`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvidenceItem` ADD CONSTRAINT `EvidenceItem_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvidenceItem` ADD CONSTRAINT `EvidenceItem_submittedById_fkey` FOREIGN KEY (`submittedById`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscoveredProject` ADD CONSTRAINT `DiscoveredProject_linkedProjectId_fkey` FOREIGN KEY (`linkedProjectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LLMSummary` ADD CONSTRAINT `LLMSummary_discoveredProjectId_fkey` FOREIGN KEY (`discoveredProjectId`) REFERENCES `DiscoveredProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
