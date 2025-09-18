ALTER TABLE `Project`
  ADD COLUMN `locationDescription` TEXT NULL,
  ADD COLUMN `locationSource` TEXT NULL,
  ADD COLUMN `locationConfidence` ENUM('LOW', 'MEDIUM', 'HIGH') NULL;
