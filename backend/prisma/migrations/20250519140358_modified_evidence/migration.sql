/*
  Warnings:

  - You are about to drop the column `caption` on the `EvidenceItem` table. All the data in the column will be lost.
  - Added the required column `title` to the `EvidenceItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `EvidenceItem` DROP COLUMN `caption`,
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `title` VARCHAR(191) NOT NULL,
    MODIFY `type` ENUM('PDF', 'URL', 'TEXT', 'DATE') NOT NULL;
