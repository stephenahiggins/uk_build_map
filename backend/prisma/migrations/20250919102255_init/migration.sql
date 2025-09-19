-- CreateTable
CREATE TABLE IF NOT EXISTS `User` (
    `user_id` INTEGER NOT NULL auto_increment,
    `user_name` VARCHAR(256) NOT NULL,
    `user_email` VARCHAR(191) NOT NULL,
    `user_password` VARCHAR(256) NOT NULL,
    `user_refreshToken` text NULL,
    `reset_token` text NULL,
    `reset_token_expiration` datetime(3) NULL,
    `user_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `user_deleted` BOOLEAN NOT NULL DEFAULT FALSE,
    `user_created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user_updated_at` datetime(3) NOT NULL,
    `type` enum(
        'ADMIN',
        'MODERATOR',
        'USER'
    ) NOT NULL DEFAULT 'USER',
    UNIQUE INDEX `User_user_email_key`(`user_email`),
    INDEX `User_user_active_idx`(`user_active`),
    INDEX `User_user_deleted_idx`(`user_deleted`),
    primary key (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CreateTable
CREATE TABLE IF NOT EXISTS `LocalAuthority` (`id` VARCHAR(191) NOT NULL, `name` VARCHAR(191) NOT NULL, `code` VARCHAR(191) NOT NULL, `website` VARCHAR(191) NULL, `countryCode` enum('ENGLAND', 'SCOTLAND', 'WALES', 'NORTHERN_IRELAND') NOT NULL, `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` datetime(3) NOT NULL, `regionId` VARCHAR(191) NOT NULL, UNIQUE INDEX `LocalAuthority_code_key`(`code`), primary key (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CreateTable
CREATE TABLE IF NOT EXISTS `Project` (`id` VARCHAR(191) NOT NULL, `title` text NOT NULL, `description` text NULL, `type` enum('LOCAL_GOV', 'NATIONAL_GOV', 'REGIONAL_GOV') NOT NULL, `regionId` VARCHAR(191) NULL, `localAuthorityId` VARCHAR(191) NULL, `createdById` INTEGER NOT NULL, `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `expectedCompletion` datetime(3) NULL, `status` enum('RED', 'AMBER', 'GREEN') NOT NULL, `statusUpdatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `statusRationale` VARCHAR(191) NULL, `moderationState` VARCHAR(191) NOT NULL DEFAULT 'PENDING', `updatedAt` datetime(3) NOT NULL, `latitude` DECIMAL(10, 7) NULL, `longitude` DECIMAL(10, 7) NULL, `locationDescription` text NULL, `locationSource` text NULL, `locationConfidence` enum('LOW', 'MEDIUM', 'HIGH') NULL, `imageUrl` text NULL, INDEX `Project_regionId_idx`(`regionId`), INDEX `Project_status_idx`(`status`), INDEX `Project_localAuthorityId_idx`(`localAuthorityId`), primary key (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CreateTable
CREATE TABLE IF NOT EXISTS `Objective` (`id` VARCHAR(191) NOT NULL, `projectId` VARCHAR(191) NOT NULL, `title` text NOT NULL, `description` text NULL, `orderIndex` INTEGER NOT NULL, INDEX `Objective_projectId_orderIndex_idx`(`projectId`, `orderIndex`), primary key (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CreateTable
CREATE TABLE IF NOT EXISTS `KeyResult` (`id` VARCHAR(191) NOT NULL, `objectiveId` VARCHAR(191) NOT NULL, `statement` text NOT NULL, `targetMetric` DECIMAL(20, 6) NULL, `currentMetric` DECIMAL(20, 6) NULL, `unit` VARCHAR(191) NULL, `dueDate` datetime(3) NULL, `ragStatus` enum('RED', 'AMBER', 'GREEN') NOT NULL, INDEX `KeyResult_objectiveId_idx`(`objectiveId`), primary key (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CreateTable
CREATE TABLE IF NOT EXISTS `EvidenceItem` (`id` VARCHAR(191) NOT NULL, `projectId` VARCHAR(191) NOT NULL, `submittedById` INTEGER NOT NULL, `type` enum('PDF', 'URL', 'TEXT', 'DATE') NOT NULL, `title` text NOT NULL, `summary` text NULL, `source` VARCHAR(191) NULL, `url` VARCHAR(191) NULL, `datePublished` datetime(3) NULL, `description` VARCHAR(191) NULL, `moderationState` VARCHAR(191) NOT NULL DEFAULT 'PENDING', `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` datetime(3) NOT NULL, `latitude` DECIMAL(10, 7) NULL, `longitude` DECIMAL(10, 7) NULL, INDEX `EvidenceItem_projectId_idx`(`projectId`), INDEX `EvidenceItem_submittedById_idx`(`submittedById`), INDEX `EvidenceItem_moderationState_idx`(`moderationState`), primary key (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CreateTable
CREATE TABLE IF NOT EXISTS `Region` (`id` VARCHAR(191) NOT NULL, `name` VARCHAR(191) NOT NULL, `boundingPolygon` json NULL, UNIQUE INDEX `Region_name_key`(`name`), primary key (`id`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- AddForeignKey
ALTER TABLE
    `Project`
ADD
    constraint `Project_regionId_fkey` foreign key (`regionId`) references `Region`(`id`)
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
