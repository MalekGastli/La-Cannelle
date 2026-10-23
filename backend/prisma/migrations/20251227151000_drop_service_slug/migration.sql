-- Remove slug from services (no longer used)

DROP INDEX `services_slug_key` ON `services`;
ALTER TABLE `services` DROP COLUMN `slug`;

