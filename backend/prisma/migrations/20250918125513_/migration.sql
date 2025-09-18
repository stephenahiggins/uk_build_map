/*
  Warnings:

  - You are about to drop the `DiscoveredProject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LLMSummary` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `DiscoveredProject` DROP FOREIGN KEY `DiscoveredProject_linkedProjectId_fkey`;

-- DropForeignKey
ALTER TABLE `LLMSummary` DROP FOREIGN KEY `LLMSummary_discoveredProjectId_fkey`;

-- DropTable
DROP TABLE `DiscoveredProject`;

-- DropTable
DROP TABLE `LLMSummary`;
