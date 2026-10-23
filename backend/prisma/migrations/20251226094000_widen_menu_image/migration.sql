-- Widen menus.image to avoid P2000 errors when storing long image strings (e.g. base64/data URLs).
ALTER TABLE `menus` MODIFY `image` LONGTEXT NULL;

