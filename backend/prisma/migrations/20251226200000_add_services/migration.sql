-- Create services and menu_services, and link orders to a selected service (optional).

CREATE TABLE `services` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `occasion` ENUM('BUSINESS','PRIVATE','BOTH') NOT NULL,
  `description` TEXT NULL,
  `image` VARCHAR(191) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `services_slug_key`(`slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `menu_services` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `menuId` INTEGER NOT NULL,
  `serviceId` INTEGER NOT NULL,

  UNIQUE INDEX `menu_services_menuId_serviceId_key`(`menuId`, `serviceId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `menu_services`
  ADD CONSTRAINT `menu_services_menuId_fkey` FOREIGN KEY (`menuId`) REFERENCES `menus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `menu_services_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `orders` ADD COLUMN `serviceId` INTEGER NULL;
ALTER TABLE `orders` ADD CONSTRAINT `orders_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

