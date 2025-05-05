/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Region` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `regionId` to the `LocalAuthority` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `LocalAuthority` ADD COLUMN `regionId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Region_name_key` ON `Region`(`name`);
