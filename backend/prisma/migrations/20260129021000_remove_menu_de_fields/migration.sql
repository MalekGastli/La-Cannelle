-- Remove German menu name/description fields (no longer used).
ALTER TABLE `menus`
  DROP COLUMN `nameDe`,
  DROP COLUMN `descriptionDe`;

