-- AlterTable
ALTER TABLE `accessories`
  MODIFY `quantityMode` ENUM('GUEST_COUNT', 'FIXED', 'CLIENT') NOT NULL DEFAULT 'GUEST_COUNT';

