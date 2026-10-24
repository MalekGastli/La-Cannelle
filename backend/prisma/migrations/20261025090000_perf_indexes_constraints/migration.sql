-- Performance indexes, order idempotency key and data-integrity CHECK constraints.
-- Written by hand and fully idempotent (IF NOT EXISTS / guarded DO blocks), expand-only:
-- nothing is dropped or rewritten, so it is safe to run while the previous release is live.
-- Index names follow Prisma's convention so `prisma migrate dev` sees no drift.

-- Orders: idempotency key (nullable; multiple NULLs allowed by the unique index)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "orders_idempotencyKey_key" ON "orders"("idempotencyKey");

-- Orders
CREATE INDEX IF NOT EXISTS "orders_userId_createdAt_idx" ON "orders"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "orders_status_createdAt_idx" ON "orders"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "orders_createdAt_idx" ON "orders"("createdAt");
CREATE INDEX IF NOT EXISTS "orders_eventDate_idx" ON "orders"("eventDate");
CREATE INDEX IF NOT EXISTS "orders_serviceId_idx" ON "orders"("serviceId");
CREATE INDEX IF NOT EXISTS "orders_contactEmail_createdAt_idx" ON "orders"("contactEmail", "createdAt");

-- Order items (FK columns were unindexed: every order load / cascade delete scanned the table)
CREATE INDEX IF NOT EXISTS "order_items_orderId_idx" ON "order_items"("orderId");
CREATE INDEX IF NOT EXISTS "order_items_productId_idx" ON "order_items"("productId");

-- Catalogue
CREATE INDEX IF NOT EXISTS "products_category_available_idx" ON "products"("category", "available");
CREATE INDEX IF NOT EXISTS "products_available_popularity_idx" ON "products"("available", "popularity");
CREATE INDEX IF NOT EXISTS "menus_isActive_createdAt_idx" ON "menus"("isActive", "createdAt");
CREATE INDEX IF NOT EXISTS "services_isActive_occasion_idx" ON "services"("isActive", "occasion");
CREATE INDEX IF NOT EXISTS "menu_products_productId_idx" ON "menu_products"("productId");
CREATE INDEX IF NOT EXISTS "menu_services_serviceId_idx" ON "menu_services"("serviceId");
CREATE INDEX IF NOT EXISTS "accessories_isActive_updatedAt_idx" ON "accessories"("isActive", "updatedAt");

-- Favorites (reverse FK, used by product delete cascade)
CREATE INDEX IF NOT EXISTS "favorites_productId_idx" ON "favorites"("productId");

-- Users / team
CREATE INDEX IF NOT EXISTS "users_roleId_idx" ON "users"("roleId");
CREATE INDEX IF NOT EXISTS "users_role_createdAt_idx" ON "users"("role", "createdAt");
CREATE INDEX IF NOT EXISTS "invites_roleId_idx" ON "invites"("roleId");
CREATE INDEX IF NOT EXISTS "invites_invitedById_idx" ON "invites"("invitedById");
CREATE INDEX IF NOT EXISTS "invites_expiresAt_idx" ON "invites"("expiresAt");

-- Audit log (retention pruning by createdAt, per-actor and per-action lookups)
CREATE INDEX IF NOT EXISTS "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- Todos
CREATE INDEX IF NOT EXISTS "todos_completed_updatedAt_idx" ON "todos"("completed", "updatedAt");

-- CHECK constraints. Added NOT VALID: they are enforced for every new/updated row immediately,
-- but existing rows are not scanned, so the migration cannot fail on legacy data.
-- Run `ALTER TABLE <t> VALIDATE CONSTRAINT <c>;` later once the data has been verified clean.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_price_nonneg_chk') THEN
    ALTER TABLE "products" ADD CONSTRAINT "products_price_nonneg_chk" CHECK ("price" >= 0 AND "cost" >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_quantity_price_chk') THEN
    ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_price_chk" CHECK ("quantity" >= 0 AND "price" >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_amounts_chk') THEN
    ALTER TABLE "orders" ADD CONSTRAINT "orders_amounts_chk" CHECK ("guests" >= 0 AND "total" >= 0 AND "subtotal" >= 0 AND "serviceFee" >= 0) NOT VALID;
  END IF;
END
$$;
