-- Use maximum length for Project description and statusRationale (LONGTEXT = 4GB)
ALTER TABLE `Project`
  MODIFY `description` LONGTEXT NULL,
  MODIFY `statusRationale` LONGTEXT NULL;
