# Caching of the public catalogue endpoints

Covers `GET /api/products`, `/api/menus`, `/api/services`, `/api/accessories` (lists and `/:id`).

## Layers

1. **HTTP cache (main lever)** - `src/utils/httpCache.ts`
   - Anonymous requests: `Cache-Control: public, max-age=30, s-maxage=60, stale-while-revalidate=300`, a weak `ETag` (sha1 of the JSON body) and `304` on a matching `If-None-Match`. `Vary: Authorization, Cookie`.
   - Requests with an `Authorization` header or an `admin_token` cookie: `Cache-Control: private, no-store`, no ETag. The admin never sees a stale list after editing.
   - With s-maxage=60 + SWR 300, a change can take up to ~1 min (up to ~6 min while a revalidation runs) to reach visitors through a CDN. That is the intended trade-off.
2. **In-memory cache (best-effort)** - `src/utils/cache.ts`
   - TTL 30 s + 30 s stale-while-revalidate, single-flight (concurrent identical requests share one DB query), max 200 entries (LRU), `invalidate(prefix)`.
   - Serverless instances do not share memory: each warm instance has its own copy, so this only absorbs bursts hitting the same instance. Never rely on it for correctness.
   - Team members (JWT role ADMIN/STAFF) bypass it, so they always read the database. Free-text `?search=` is never cached.
3. **Image URLs** - list endpoints never return `data:` URLs. Legacy rows that still hold base64 are exposed as `/api/<resource>/:id/image?v=<hash>` (served with a 1-day cache header). The admin UI echoing that URL back on save does not overwrite the stored image.

## Invalidation

Every write in the services calls `invalidateCatalog(...)` (also when the write fails, so a half-applied write cannot leave stale data):

| Write | Invalidates |
| --- | --- |
| create/update/delete/duplicate/bulk product | `products:`, `menus:` (menus embed `productId`s) |
| create/update/delete/duplicate menu, restore defaults/legacy | `menus:`, `products:` (products embed `menuProducts`) |
| service writes | `services:`, `menus:` |
| accessory writes | `accessories:` |

Invalidation only affects the instance that handled the write; other instances converge within the TTL.

## No external calls or writes on read

`DEEPL_AUTO_TRANSLATE_ON_READ` now defaults to **off**. When set to `true`, a cache miss schedules a fire-and-forget backfill (never awaited, errors swallowed, at most one run per resource per minute per instance, max 20 rows, skipped while a run is active). Admin saves still translate synchronously (8 s timeout).

## Lists

`?limit` (default 500, max 1000) and `?offset` on products and menus; the response stays a plain array. Services and accessories are hard-capped at 1000 rows. Product `cost` is only returned to team members.

## Next.js proxy (`app/api/[...path]/route.ts`)

It overwrites `Cache-Control` with `no-store`, drops `etag` and strips `if-none-match`, so browsers and the CDN never cache through it. To benefit from the headers above it should, for GET/HEAD requests without an Authorization header or admin cookie, keep the backend `Cache-Control` and `ETag` and forward `If-None-Match`; admin requests should keep `no-store`.
