-- DropForeignKey
ALTER TABLE `Project` DROP FOREIGN KEY `Project_regionId_fkey`;

-- AlterTable
ALTER TABLE `Project` MODIFY `regionId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `Region`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
