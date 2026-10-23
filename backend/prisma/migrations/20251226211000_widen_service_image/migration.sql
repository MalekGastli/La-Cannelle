-- Allow storing data URLs / long image strings on services.
ALTER TABLE `services` MODIFY `image` LONGTEXT NULL;

