-- AlterTable
ALTER TABLE `EvidenceItem` MODIFY `description` TEXT NULL,
    MODIFY `title` TEXT NOT NULL,
    MODIFY `source` TEXT NULL,
    MODIFY `url` TEXT NULL,
    MODIFY `summary` TEXT NULL;

-- AlterTable
ALTER TABLE `KeyResult` MODIFY `statement` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `Objective` MODIFY `title` TEXT NOT NULL,
    MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `Project` MODIFY `title` TEXT NOT NULL;
