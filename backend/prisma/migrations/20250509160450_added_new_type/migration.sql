-- AlterTable
ALTER TABLE `KeyResult` MODIFY `ragStatus` ENUM('RED', 'AMBER', 'GREEN') NOT NULL;

-- AlterTable
ALTER TABLE `Project` MODIFY `status` ENUM('RED', 'AMBER', 'GREEN') NOT NULL;
