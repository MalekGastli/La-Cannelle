-- DropForeignKey
ALTER TABLE `favorites` DROP FOREIGN KEY `favorites_productId_fkey`;

-- DropForeignKey
ALTER TABLE `favorites` DROP FOREIGN KEY `favorites_userId_fkey`;

-- DropForeignKey
ALTER TABLE `menu_products` DROP FOREIGN KEY `menu_products_productId_fkey`;

-- DropForeignKey
ALTER TABLE `menu_products` DROP FOREIGN KEY `menu_products_menuId_fkey`;

-- DropForeignKey
ALTER TABLE `menu_services` DROP FOREIGN KEY `menu_services_serviceId_fkey`;

-- DropForeignKey
ALTER TABLE `menu_services` DROP FOREIGN KEY `menu_services_menuId_fkey`;

-- DropForeignKey
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_orderId_fkey`;

-- DropForeignKey
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_productId_fkey`;

-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_serviceId_fkey`;

-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_userId_fkey`;

-- DropIndex
DROP INDEX `favorites_productId_fkey` ON `favorites`;

-- DropIndex
DROP INDEX `menu_products_productId_fkey` ON `menu_products`;

-- DropIndex
DROP INDEX `menu_services_serviceId_fkey` ON `menu_services`;

-- DropIndex
DROP INDEX `order_items_orderId_fkey` ON `order_items`;

-- DropIndex
DROP INDEX `order_items_productId_fkey` ON `order_items`;

-- DropIndex
DROP INDEX `orders_serviceId_fkey` ON `orders`;

-- DropIndex
DROP INDEX `orders_userId_fkey` ON `orders`;

-- AddForeignKey
ALTER TABLE `menu_services` ADD CONSTRAINT `menu_services_menuId_fkey` FOREIGN KEY (`menuId`) REFERENCES `menus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menu_services` ADD CONSTRAINT `menu_services_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menu_products` ADD CONSTRAINT `menu_products_menuId_fkey` FOREIGN KEY (`menuId`) REFERENCES `menus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menu_products` ADD CONSTRAINT `menu_products_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
