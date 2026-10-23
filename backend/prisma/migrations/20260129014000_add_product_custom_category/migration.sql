-- Add a free-form custom category label for products (admin-managed).
ALTER TABLE `products`
  ADD COLUMN `customCategory` VARCHAR(191) NULL;

