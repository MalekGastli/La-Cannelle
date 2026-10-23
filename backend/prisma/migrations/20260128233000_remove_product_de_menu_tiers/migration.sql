-- AlterTable
ALTER TABLE `products`
  DROP COLUMN `nameDe`,
  DROP COLUMN `descriptionDe`,
  DROP COLUMN `tier`;

-- AlterTable
ALTER TABLE `orders`
  DROP COLUMN `menuTier`;

