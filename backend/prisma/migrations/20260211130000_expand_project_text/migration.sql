-- Expand Project text columns to avoid truncation errors
ALTER TABLE `Project`
  MODIFY `description` TEXT NULL,
  MODIFY `statusRationale` TEXT NULL;
