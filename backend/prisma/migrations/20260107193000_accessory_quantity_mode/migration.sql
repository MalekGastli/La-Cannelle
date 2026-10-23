-- AlterTable
ALTER TABLE `accessories`
  ADD COLUMN `quantityMode` ENUM('GUEST_COUNT', 'FIXED') NOT NULL DEFAULT 'GUEST_COUNT',
  ADD COLUMN `fixedQuantity` INTEGER NULL;

