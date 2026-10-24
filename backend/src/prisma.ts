import './env';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Prisma client for a Vercel serverless deployment backed by Neon PostgreSQL.
 *
 * CONNECTION STRINGS (see docs/DATABASE.md)
 * - DATABASE_URL must be the Neon POOLED url (host contains `-pooler`) with
 *   `?sslmode=require&pgbouncer=true&connection_limit=1`.  Every serverless instance opens
 *   at most one connection and PgBouncer multiplexes them, so a traffic spike cannot exhaust
 *   Postgres' max_connections.  Optionally add `&pool_timeout=15`.
 * - Migrations (`prisma migrate deploy`) need the UNPOOLED url (advisory locks / DDL do not work
 *   through PgBouncer in transaction mode).  scripts/vercel-build.sh exports
 *   DATABASE_URL_UNPOOLED over DATABASE_URL for the migrate step only.  We deliberately do not
 *   declare `directUrl` in schema.prisma: Prisma 5 requires that env var at generate time and
 *   would break builds where it is absent.
 */

const isProd = process.env.NODE_ENV === 'production';

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

function createClient(): PrismaClient {
  return new PrismaClient({
    // Query logging is expensive and leaks data; production logs warn/error only.
    log: isProd ? ['warn', 'error'] : ['warn', 'error', ...(process.env.PRISMA_LOG_QUERIES === '1' ? (['query'] as const) : [])],
  });
}

// Singleton: reuse across hot reloads (dev) and across warm invocations / repeated imports.
export const prisma: PrismaClient = globalForPrisma.__prisma ?? createClient();
globalForPrisma.__prisma = prisma;

// ---------------------------------------------------------------------------------------------
// Retry helper for transient connection errors
// ---------------------------------------------------------------------------------------------

/** P1001 unreachable, P1002 timeout, P1008 op timeout, P1017 server closed connection, P2024 pool timeout. */
const TRANSIENT_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024']);

export function isTransientDbError(error: unknown): boolean {
  const e = error as { code?: string; name?: string } | null;
  if (!e) return false;
  if (typeof e.code === 'string' && TRANSIENT_CODES.has(e.code)) return true;
  // Errors raised before a request can be classified (cold Neon compute waking up).
  return error instanceof Prisma.PrismaClientInitializationError;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Run `fn`, retrying up to `retries` times (default 2) on transient connection errors with
 * jittered exponential backoff (~100-200ms, ~200-400ms).
 *
 * ONLY wrap idempotent work (reads, or writes protected by a unique key).  Never wrap a
 * non-idempotent write: a P1017 can occur after the server committed.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const retries = opts.retries ?? 2;
  const base = opts.baseDelayMs ?? 100;
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries || !isTransientDbError(error)) throw error;
      attempt += 1;
      const backoff = base * 2 ** (attempt - 1);
      await sleep(backoff + Math.random() * backoff);
    }
  }
}
