# Operations

## Run

- Dev: `npm run dev` (tsx watch). Build: `npm run build`; start: `npm start`.
- Vercel: `api/index.ts` exports the Express app; no `listen()`, no signal handlers.
- Self-hosted: `listen()` on `PORT`, logs unhandled rejections/exceptions, graceful shutdown on SIGTERM/SIGINT (closes server, `prisma.$disconnect()`, 10s hard stop).

## Environment variables

| Var | Default | Notes |
| --- | --- | --- |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `JWT_SECRET` | - | Required. In production the server refuses to start unless it is >= 32 chars |
| `NODE_ENV` | - | `production` enables strict CORS and hides error details |
| `PORT` | 3001 | self-hosted only |
| `FRONTEND_URL` | http://localhost:3000 | Allowed CORS origin in production |
| `CORS_ORIGINS` | - | Extra allowed origins, comma separated (production) |
| `TRUST_PROXY` | 1 on Vercel, else off | Number of proxy hops, or `true`/`false` |
| `BODY_LIMIT_DEFAULT` | 100kb | JSON limit for non-image routes |
| `BODY_LIMIT_IMAGES` | 4mb | Limit for products, menus, accessories, services, system (base64 images). Vercel hard limit is 4.5MB |
| `RATE_LIMIT_AUTH_MAX` / `RATE_LIMIT_AUTH_WINDOW_MS` | 10 / 15min | per IP+email on login, admin-login, register, invite accept |
| `RATE_LIMIT_AUTH_IP_MAX` | 50 | per IP across all emails, same window |
| `RATE_LIMIT_PUBLIC_MAX` / `RATE_LIMIT_PUBLIC_WINDOW_MS` | 20 / 10min | POST /api/orders, POST /api/contact, per IP |
| `RATE_LIMIT_LOOKUP_MAX` | 60/min | /api/phone |
| `RATE_LIMIT_GLOBAL_MAX` | 300/min | everything else, per IP (health and uploads exempt) |
| `RATE_LIMIT_DISABLED` | false | `true` disables all limiters (tests only) |
| `LOG_REQUESTS` | true | `false` silences the access log |

## Rate limiting

Responses over the limit are `429 {"error": "...", "requestId": "..."}` with standard `RateLimit-*` headers.

Important: the default store is in-memory and per instance. On Vercel each warm function instance counts separately, so the effective limit is roughly `limit x instances`. It slows brute force and bursts but is not a hard cap. For a shared limit, call `setRateLimitStoreFactory(prefix => new RedisStore(...))` from `src/middleware/rateLimit.ts` before the limiters are used (e.g. rate-limit-redis / Upstash), or use Vercel Firewall rate limiting at the edge.

## Request ids and logs

Every response carries `X-Request-Id` (an incoming id is reused if it looks safe). Access logs are one JSON line per request: `{t, level, id, method, path, status, ms}`; no bodies, headers or query strings. Errors are logged with the same `id`; stacks only go to logs, never to clients (dev mode excepted).

## Errors

413 payload too large, 400 invalid JSON, 403 disallowed CORS origin (production), 429 rate limited, 5xx generic "Internal server error" in production.

## Health

- `GET /health`: always 200, no dependencies.
- `GET /health/ready`: runs `SELECT 1` with a 2s timeout; 200 `{status:"ready"}` or 503 `{status:"unavailable"}`.

## Uploads

`/api/uploads/*` is served with `Cache-Control: public, max-age=31536000, immutable` and an ETag. Only safe because files are written under unique names; never overwrite a file in place.
