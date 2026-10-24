# Database guide (PostgreSQL on Neon, Prisma 5, Vercel serverless)

## 1. Pooled vs unpooled connection strings

| Variable | Host | Used by | Params |
|---|---|---|---|
| `DATABASE_URL` | Neon **pooled** (`ep-xxx-pooler.<region>.aws.neon.tech`) | the running API (`src/prisma.ts`) | `?sslmode=require&pgbouncer=true&connection_limit=1` (optionally `&pool_timeout=15`) |
| `DATABASE_URL_UNPOOLED` | Neon **direct** (no `-pooler`) | `prisma migrate deploy`, `scripts/backup-db.sh`, restores | `?sslmode=require` |

Why: every serverless instance has its own Prisma client. `connection_limit=1` caps each instance at one
connection and PgBouncer multiplexes them onto a small number of real Postgres connections, so a traffic
spike cannot exhaust `max_connections`. DDL, advisory locks (used by `migrate deploy`) and `pg_dump` do
not work reliably through PgBouncer in transaction mode, so they use the direct host.

`scripts/vercel-build.sh` already runs `DATABASE_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}" prisma migrate deploy`.
`directUrl` is deliberately **not** set in `schema.prisma`: Prisma 5 needs that env var at `generate`
time and it would break any build/CI where it is absent. Revisit if the variable is guaranteed everywhere.

`src/prisma.ts` exports a `globalThis` singleton client (logs `warn`/`error` only; set
`PRISMA_LOG_QUERIES=1` in development to see queries) and `withRetry(fn)` which retries
P1001/P1002/P1008/P1017/P2024 twice with jittered backoff. Use it only for idempotent reads (or writes
protected by a unique key); the dashboard, reports, customers, orders list and system status already do.

## 2. Migration policy

- Migrations are applied only by `prisma migrate deploy` during the Vercel build. Never run
  `prisma migrate reset` / `db push --force-reset` against anything but a throw-away local DB.
- **Never edit or rename a migration that has been applied anywhere.** Fix forward with a new one.
- Expand / contract: ship additive changes first (new nullable column, new table, new index), deploy code
  that works with both shapes, backfill, and only in a later release drop the old column/constraint.
  Never combine a destructive change with the code that stops using it in one release: the previous
  deployment is still serving traffic while the build runs.
- Hand-written SQL should be idempotent (`IF NOT EXISTS`, guarded `DO` blocks), as in
  `20261025090000_perf_indexes_constraints`. Use Prisma's index naming (`<table>_<cols>_idx`) so
  `prisma migrate diff` shows no drift.
- On big tables create indexes `CONCURRENTLY` in a separate migration (cannot run in a transaction block).
  Current tables are small, so plain `CREATE INDEX` is fine.
- CHECK constraints are added `NOT VALID` (enforced for new writes, legacy rows not scanned). After verifying
  there are no violating rows run `ALTER TABLE ... VALIDATE CONSTRAINT ...;` (takes only a SHARE UPDATE EXCLUSIVE lock).
- Before a risky migration: take a backup (section 4) or create a Neon branch.

## 3. Index rationale (migration `20261025090000_perf_indexes_constraints`)

| Index | Query it serves |
|---|---|
| `orders(userId, createdAt)` | customer order lists, `GET /orders?customerId=`, per-customer stats groupBy |
| `orders(status, createdAt)` | admin list filtered by status, newest first; dashboard status counts |
| `orders(createdAt)` | default list ordering, dashboard revenue windows, reports date range |
| `orders(eventDate)` | list filter by event date range, "today's events" on the dashboard |
| `orders(serviceId)` | FK (service delete `SET NULL`), joins |
| `orders(contactEmail, createdAt)` | duplicate-submission guard in order creation, admin search by email prefix/equality |
| `orders(idempotencyKey)` UNIQUE | order idempotency (see 5); NULLs are allowed many times |
| `order_items(orderId)`, `(productId)` | FKs: loading an order's items, cascade delete, reports join, product delete check. Measured: seq scan of 24k rows 2.2 ms -> index 0.1 ms |
| `products(category, available)`, `(available, popularity)` | catalogue filters and `ORDER BY popularity DESC` |
| `menus(isActive, createdAt)`, `services(isActive, occasion)`, `accessories(isActive, updatedAt)` | public catalogue lists |
| `menu_products(productId)`, `menu_services(serviceId)`, `favorites(productId)` | reverse FK lookups / cascades (the composite unique already covers the leading column) |
| `users(role, createdAt)`, `users(roleId)` | customers and team lists, role membership counts |
| `invites(roleId)`, `(invitedById)`, `(expiresAt)` | FKs, expiry pruning (email and tokenHash already unique) |
| `audit_logs(userId, createdAt)`, `(action, createdAt)`, `(createdAt)` | per-actor / per-action review, retention pruning |
| `todos(completed, updatedAt)` | the todo list ordering |

Not indexed on purpose: `ILIKE '%term%'` searches (orders/customers search) cannot use a btree. If
search becomes slow, enable `pg_trgm` on Neon and add GIN trigram indexes on `clientName`/`contactEmail`/`email`.
Every extra index slows writes, so add new ones only against a measured query (`EXPLAIN (ANALYZE)`).

CHECK constraints (NOT VALID): `products.price/cost >= 0`, `order_items.quantity > 0 and price >= 0`,
`orders.guests > 0 and total/subtotal/serviceFee >= 0`.

## 4. Backup and restore

### Logical backup
```
DATABASE_URL_UNPOOLED='postgres://user:pw@ep-xxx.region.aws.neon.tech/db?sslmode=require' \
  ./scripts/backup-db.sh ./backups
```
Custom format, timestamped (`lacannelle-YYYYMMDDThhmmssZ.dump`), refuses to overwrite, verifies the archive,
read-only against the database. Use a `pg_dump` with the same major version as the server. Keep dumps out of git
and store them encrypted off-site (they contain customer data). Run it before risky migrations and on a schedule (cron/CI).

### Restore into a scratch database (always rehearse here first)
```
createdb lacannelle_restore
pg_restore --no-owner --no-privileges --exit-on-error -d lacannelle_restore backups/lacannelle-XXXX.dump
psql lacannelle_restore -c 'select count(*) from orders'
DATABASE_URL=postgresql://.../lacannelle_restore npx prisma migrate status   # must say "up to date"
```
Restoring over a live database: restore into a new Neon branch/database, verify, then switch `DATABASE_URL`
(and `DATABASE_URL_UNPOOLED`) in Vercel and redeploy. Do not `pg_restore --clean` on production.

### Neon point-in-time restore and branching
- Neon keeps WAL history for the project's restore window (plan dependent). In the console: Project -> Branches ->
  pick the branch -> **Restore** -> choose a timestamp (or LSN). Neon first saves the current state as a backup
  branch, so the operation can be undone.
- Safer for investigation: **Create branch** from the main branch *at a past timestamp*. It is an instant
  copy-on-write copy with its own connection string; inspect/export what you need, or point a preview deployment at it.
- Also branch before any destructive migration (`neon branches create --name pre-migration-<date>`), and delete it after.
- Neon backups do not protect against everything (e.g. a bad deploy that corrupts data noticed after the window): keep the
  periodic `pg_dump` too.

## 5. Order creation safety (`orderService.createOrder`)

- Body validated with zod: guests >= 10, subtotal >= 199, bounded quantities / amounts, <= 300 lines.
- Product name and price are read from the DB inside the transaction; client-sent item prices/names are ignored.
  Unknown or `available = false` products are rejected, `minOrderQuantity` enforced, duplicate lines merged.
  Service fee is a server constant (`ORDER_SERVICE_FEE`, default 48.90).
- Limitation: the payload contains no menu id or accessories, so `subtotal` (menu base price x guests, extras) and
  the accessories part of `total` cannot be recomputed server-side yet. They are bounds-checked, and `total` can never be
  below `subtotal + serviceFee`. To close this gap the checkout should also send `menuId` and `accessories: [{id, quantity}]`.
- Idempotency: send header `Idempotency-Key: <8-128 chars>` (or body `idempotencyKey`). The key is stored as
  `"<email>|<key>"` in `orders.idempotencyKey` (unique), so a retry returns the original order (HTTP 200 with
  `Idempotent-Replay: true`, first call is 201) and concurrent duplicates are resolved by the unique index.
  Without a key, an identical submission (same email, event date, guests, total) within 30 s is serialised with a
  transaction-scoped advisory lock and returns the first order.

## 6. Audit log and retention

`src/utils/audit.ts` never throws and waits at most 2 s; secrets (`password`, `token`, ...) are redacted from
`detail` and `detail` is capped at 4 KB. Retention: keep 13 months (indexed by `createdAt`). Prune periodically, e.g.
```
DELETE FROM audit_logs WHERE "createdAt" < now() - interval '13 months';
```
(run in batches of ~10k rows if the table is large), ideally from a scheduled job after an export to cold storage.
`auth.login` entries are the fastest growing; consider a shorter window for them (`WHERE action = 'auth.login'`).

## 7. List endpoint pagination

`GET /orders` and `GET /customers` still return a plain JSON array. Without query params the newest 200 rows are
returned. With `limit` (max 100) and `page` or `offset`, that page is returned together with an `X-Total-Count` header.
Team members/roles/invites (500/200/500), todos and favorites (500), closed dates (2000) are capped.
