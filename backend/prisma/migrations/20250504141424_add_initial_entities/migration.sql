-- AlterTable
ALTER TABLE
    `User`
ADD
    column `type` enum(
        'ADMIN',
        'MODERATOR',
        'USER'
    ) NOT NULL DEFAULT 'USER';
-- CreateTable
    CREATE TABLE `LocalAuthority` (`id` VARCHAR(191) NOT NULL, `name` VARCHAR(191) NOT NULL, `code` VARCHAR(191) NOT NULL, `website` VARCHAR(191) NULL, `countryCode` enum('ENGLAND', 'SCOTLAND', 'WALES', 'NORTHERN_IRELAND') NOT NULL, `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` datetime(3) NOT NULL, UNIQUE INDEX `LocalAuthority_code_key`(`code`), primary key (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CreateTable
    CREATE TABLE `Project` (`id` VARCHAR(191) NOT NULL, `title` VARCHAR(191) NOT NULL, `description` VARCHAR(191) NULL, `type` enum('LOCAL_GOV', 'NATIONAL_GOV', 'REGIONAL_GOV') NOT NULL, `ownerOrg` VARCHAR(191) NULL, `regionId` VARCHAR(191) NOT NULL, `localAuthorityId` VARCHAR(191) NULL, `createdById` INTEGER NOT NULL, `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `expectedCompletion` datetime(3) NULL, `status` enum('AMBER', 'GREEN') NOT NULL, `statusUpdatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `statusRationale` VARCHAR(191) NULL, `latitude` DECIMAL(10, 7) NULL, `longitude` DECIMAL(10, 7) NULL, INDEX `Project_regionId_idx`(`regionId`), INDEX `Project_status_idx`(`status`), INDEX `Project_localAuthorityId_idx`(`localAuthorityId`), primary key (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CreateTable
    CREATE TABLE `Objective` (`id` VARCHAR(191) NOT NULL, `projectId` VARCHAR(191) NOT NULL, `title` VARCHAR(191) NOT NULL, `description` VARCHAR(191) NULL, `orderIndex` INTEGER NOT NULL, INDEX `Objective_projectId_orderIndex_idx`(`projectId`, `orderIndex`), primary key (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CreateTable
    CREATE TABLE `KeyResult` (`id` VARCHAR(191) NOT NULL, `objectiveId` VARCHAR(191) NOT NULL, `statement` VARCHAR(191) NOT NULL, `targetMetric` DECIMAL(20, 6) NULL, `currentMetric` DECIMAL(20, 6) NULL, `unit` VARCHAR(191) NULL, `dueDate` datetime(3) NULL, `ragStatus` enum('AMBER', 'GREEN') NOT NULL, INDEX `KeyResult_objectiveId_idx`(`objectiveId`), primary key (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CreateTable
    CREATE TABLE `EvidenceItem` (`id` VARCHAR(191) NOT NULL, `projectId` VARCHAR(191) NOT NULL, `submittedById` INTEGER NOT NULL, `type` enum('PDF', 'URL', 'TEXT') NOT NULL, `urlOrBlobId` VARCHAR(191) NOT NULL, `caption` VARCHAR(191) NULL, `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `moderationState` enum('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING', `latitude` DECIMAL(10, 7) NULL, `longitude` DECIMAL(10, 7) NULL, INDEX `EvidenceItem_projectId_idx`(`projectId`), INDEX `EvidenceItem_submittedById_idx`(`submittedById`), INDEX `EvidenceItem_moderationState_idx`(`moderationState`), primary key (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CreateTable
    CREATE TABLE `Region` (`id` VARCHAR(191) NOT NULL, `name` VARCHAR(191) NOT NULL, `boundingPolygon` json NULL, primary key (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CreateTable
    CREATE TABLE `DiscoveredProject` (`id` VARCHAR(191) NOT NULL, `rawContentHash` VARCHAR(191) NOT NULL, `sourceUrl` VARCHAR(191) NOT NULL, `crawledAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `linkedProjectId` VARCHAR(191) NULL, UNIQUE INDEX `DiscoveredProject_rawContentHash_key`(`rawContentHash`), INDEX `DiscoveredProject_linkedProjectId_idx`(`linkedProjectId`), primary key (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CreateTable
    CREATE TABLE `LLMSummary` (`id` VARCHAR(191) NOT NULL, `discoveredProjectId` VARCHAR(191) NOT NULL, `summaryJson` json NOT NULL, `confidence` DOUBLE NOT NULL, primary key (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- AddForeignKey
ALTER TABLE
    `Project`
ADD
    constraint `Project_regionId_fkey` foreign key (`regionId`) references `Region`(`id`)
    ON
DELETE
    restrict
    ON
UPDATE
    CASCADE;
-- AddForeignKey
ALTER TABLE
    `Project`
ADD
    constraint `Project_localAuthorityId_fkey` foreign key (`localAuthorityId`) references `LocalAuthority`(`id`)
    ON
DELETE
    SET NULL
    ON
UPDATE
    CASCADE;
-- AddForeignKey
ALTER TABLE
    `Project`
ADD
    constraint `Project_createdById_fkey` foreign key (`createdById`) references `User`(`user_id`)
    ON
DELETE
    restrict
    ON
UPDATE
    CASCADE;
-- AddForeignKey
ALTER TABLE
    `Objective`
ADD
    constraint `Objective_projectId_fkey` foreign key (`projectId`) references `Project`(`id`)
    ON
DELETE
    CASCADE
    ON
UPDATE
    CASCADE;
-- AddForeignKey
ALTER TABLE
    `KeyResult`
ADD
    constraint `KeyResult_objectiveId_fkey` foreign key (`objectiveId`) references `Objective`(`id`)
    ON
DELETE
    CASCADE
    ON
UPDATE
    CASCADE;
-- AddForeignKey
ALTER TABLE
    `EvidenceItem`
ADD
    constraint `EvidenceItem_projectId_fkey` foreign key (`projectId`) references `Project`(`id`)
    ON
DELETE
    CASCADE
    ON
UPDATE
    CASCADE;
-- AddForeignKey
ALTER TABLE
    `EvidenceItem`
ADD
    constraint `EvidenceItem_submittedById_fkey` foreign key (`submittedById`) references `User`(`user_id`)
    ON
DELETE
    restrict
    ON
UPDATE
    CASCADE;
-- AddForeignKey
ALTER TABLE
    `DiscoveredProject`
ADD
    constraint `DiscoveredProject_linkedProjectId_fkey` foreign key (`linkedProjectId`) references `Project`(`id`)
    ON
DELETE
    SET NULL
    ON
UPDATE
    CASCADE;
-- AddForeignKey
ALTER TABLE
    `LLMSummary`
ADD
    constraint `LLMSummary_discoveredProjectId_fkey` foreign key (`discoveredProjectId`) references `DiscoveredProject`(`id`)
    ON
DELETE
    CASCADE
    ON
UPDATE
    CASCADE;
