/*
  Warnings:

  - You are about to alter the column `moderationState` on the `EvidenceItem` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(8))`.
  - You are about to alter the column `moderationState` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(8))`.

*/
-- AlterTable
ALTER TABLE `EvidenceItem` MODIFY `moderationState` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `Project` MODIFY `moderationState` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING';
