-- AlterTable
ALTER TABLE `User` ADD COLUMN `reset_token` TEXT NULL,
    ADD COLUMN `reset_token_expiration` DATETIME(3) NULL;
