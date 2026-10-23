-- AlterTable
ALTER TABLE `products`
  ADD COLUMN `nameDe` VARCHAR(191) NULL,
  ADD COLUMN `descriptionDe` TEXT NULL;

-- AlterTable
ALTER TABLE `menus`
  ADD COLUMN `nameDe` VARCHAR(191) NULL,
  ADD COLUMN `descriptionDe` TEXT NULL;

-- AlterTable
ALTER TABLE `services`
  ADD COLUMN `nameDe` VARCHAR(191) NULL,
  ADD COLUMN `descriptionDe` TEXT NULL;