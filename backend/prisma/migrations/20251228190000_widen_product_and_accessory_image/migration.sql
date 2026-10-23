-- Allow storing data URLs / long image strings on products and accessories.
ALTER TABLE `products` MODIFY `image` LONGTEXT NULL;
ALTER TABLE `accessories` MODIFY `image` LONGTEXT NULL;

