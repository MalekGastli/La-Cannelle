import type { Request, RequestHandler } from 'express';
import { clientIp } from '../utils/clientIp';
import rateLimit, { type Options, type Store } from 'express-rate-limit';

/**
 * NOTE (serverless): the default store is in-memory and PER INSTANCE. On Vercel every
 * concurrent function instance has its own counters, so the effective limit is
 * (limit x number of warm instances). It still blunts brute force and bursts from a
 * single client (who usually hits the same warm instance) but is not a hard guarantee.
 * For a shared limit, call `setRateLimitStoreFactory()` at startup with a factory
 * returning a shared store (e.g. rate-limit-redis / Upstash), or enforce limits at the
 * edge (Vercel Firewall rate limiting).
 */
let storeFactory: ((prefix: string) => Store | undefined) | undefined;
export const setRateLimitStoreFactory = (factory: (prefix: string) => Store | undefined) => {
  storeFactory = factory;
};

const envInt = (name: string, fallback: number) => {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

const disabled = () => process.env.RATE_LIMIT_DISABLED === 'true';

const make = (prefix: string, opts: Partial<Options>): RequestHandler =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => disabled(),
    store: storeFactory?.(prefix),
    validate: { xForwardedForHeader: false },
    handler: (req, res, _next, options) => {
      res.status(options.statusCode).json({
        error: 'Too many requests, please try again later.',
        requestId: req.id,
      });
    },
    ...opts,
  });

const ip = (req: Request) => clientIp(req);

const emailOf = (req: Request): string => {
  const email = req.body && typeof req.body === 'object' ? (req.body as any).email : undefined;
  return typeof email === 'string' ? email.trim().toLowerCase().slice(0, 254) : '';
};

/** Strict: login / register / invite accept. Counts per IP + email, and failed+successful alike. */
export const authLimiter = make('auth', {
  windowMs: envInt('RATE_LIMIT_AUTH_WINDOW_MS', 15 * 60 * 1000),
  limit: envInt('RATE_LIMIT_AUTH_MAX', 10),
  keyGenerator: (req) => `${ip(req)}|${emailOf(req)}`,
});

/** Backstop per IP for auth endpoints regardless of email (stops email-rotation attacks). */
export const authIpLimiter = make('auth-ip', {
  windowMs: envInt('RATE_LIMIT_AUTH_WINDOW_MS', 15 * 60 * 1000),
  limit: envInt('RATE_LIMIT_AUTH_IP_MAX', 50),
  keyGenerator: (req) => ip(req),
});

/** Public write endpoints (orders, contact). */
export const publicWriteLimiter = make('public-write', {
  windowMs: envInt('RATE_LIMIT_PUBLIC_WINDOW_MS', 10 * 60 * 1000),
  limit: envInt('RATE_LIMIT_PUBLIC_MAX', 20),
  keyGenerator: (req) => ip(req),
});

/** Public cheap lookups (phone validation). */
export const publicLookupLimiter = make('public-lookup', {
  windowMs: 60 * 1000,
  limit: envInt('RATE_LIMIT_LOOKUP_MAX', 60),
  keyGenerator: (req) => ip(req),
});

/** Generous global limiter for everything else. */
export const globalLimiter = make('global', {
  windowMs: 60 * 1000,
  limit: envInt('RATE_LIMIT_GLOBAL_MAX', 300),
  keyGenerator: (req) => ip(req),
  skip: (req) => disabled() || req.path === '/health' || req.path.startsWith('/health/'),
});

export const authLimiters: RequestHandler[] = [authIpLimiter, authLimiter];
