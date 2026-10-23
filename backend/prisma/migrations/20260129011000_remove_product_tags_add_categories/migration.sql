-- Add new categories to ProductCategory enum and remove product tag columns.
-- Note: Prisma Migrate generated SQL is usually preferred, but this repo uses SQL migrations directly.

-- 1) Expand `products.category` enum to include SOUP and FINGERFOOD
ALTER TABLE `products`
  MODIFY `category` ENUM('STARTER','SOUP','MAIN','FINGERFOOD','DESSERT','BEVERAGE','SIDE') NOT NULL;

-- 2) Drop tag columns (no longer used by order system)
ALTER TABLE `products`
  DROP COLUMN `productCategories`,
  DROP COLUMN `productCategoriesDe`;

