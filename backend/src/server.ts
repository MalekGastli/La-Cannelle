import './env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import orderRoutes from './routes/orders';
import productRoutes from './routes/products';
import menuRoutes from './routes/menus';
import customerRoutes from './routes/customers';
import dashboardRoutes from './routes/dashboard';
import reportsRoutes from './routes/reports';
import systemRoutes from './routes/system';
import favoriteRoutes from './routes/favorites';
import contactRoutes from './routes/contact';
import accessoryRoutes from './routes/accessories';
import serviceRoutes from './routes/services';
import todoRoutes from './routes/todos';
import phoneRoutes from './routes/phone';
import teamRoutes from './routes/team';
import { ensureUploadsDir } from './utils/uploads';
import { prisma } from './prisma';
import { requestId, requestLogger } from './middleware/requestContext';
import {
  authLimiters,
  globalLimiter,
  publicLookupLimiter,
  publicWriteLimiter,
} from './middleware/rateLimit';

const isProduction = process.env.NODE_ENV === 'production';
const isVercel = Boolean(process.env.VERCEL);

// Fail fast on a weak/missing secret in production (Vercel included).
if (isProduction) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET must be set in production');
  }
  // A short secret still works (so an existing deployment keeps running) but should be rotated.
  if (secret.length < 32) {
    console.warn('WARNING: JWT_SECRET is shorter than 32 characters; rotate it to a long random value.');
  }
}

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const stripSlash = (v: string) => v.trim().replace(/\/$/, '');
const allowedOrigins = new Set<string>([
  stripSlash(FRONTEND_URL),
  ...(process.env.CORS_ORIGINS || '').split(',').map(stripSlash).filter(Boolean),
]);
if (!isProduction) {
  allowedOrigins.add('http://localhost:3000');
  allowedOrigins.add('http://127.0.0.1:3000');
}

app.disable('x-powered-by');
// Client IP for rate limiting: Vercel puts exactly one trusted proxy hop (its edge) in front of us.
// Override with TRUST_PROXY (number of hops, or "false") for other deployments.
const trustProxyEnv = process.env.TRUST_PROXY;
app.set(
  'trust proxy',
  trustProxyEnv !== undefined && trustProxyEnv !== ''
    ? (/^\d+$/.test(trustProxyEnv) ? Number(trustProxyEnv) : trustProxyEnv === 'true')
    : isVercel ? 1 : false
);

app.use(requestId);
app.use(requestLogger);
app.use(helmet({
  // JSON API: the frontend lives on another origin and embeds /api/uploads images.
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
  },
}));
app.use(compression({ threshold: 1024 }));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!isProduction || allowedOrigins.has(stripSlash(origin))) return callback(null, true);
    return callback(Object.assign(new Error('Not allowed by CORS'), { code: 'CORS_NOT_ALLOWED' }));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-Id'],
  exposedHeaders: ['X-Total-Count', 'Idempotent-Replay', 'X-Request-Id', 'RateLimit-Remaining', 'Retry-After'],
}));

// Body parsing is mounted per route group. Only routes that accept base64 images get a big limit
// (Vercel rejects bodies > 4.5MB anyway, hence the 4mb default).
const SMALL_LIMIT = process.env.BODY_LIMIT_DEFAULT || '100kb';
const IMAGE_LIMIT = process.env.BODY_LIMIT_IMAGES || process.env.BODY_LIMIT || '4mb';
const bodyParsers = (limit: string) => [
  express.json({ limit }),
  express.urlencoded({ limit, extended: true }),
];
const smallBody = bodyParsers(SMALL_LIMIT);
const imageBody = bodyParsers(IMAGE_LIMIT);

app.use(globalLimiter);

const uploadsDir = ensureUploadsDir();
const staticOptions = { maxAge: '1y', immutable: true, etag: true, lastModified: true, index: false } as const;
app.use('/api/uploads', express.static(uploadsDir, staticOptions));
const legacyUploadsDir = path.join(__dirname, 'uploads');
if (legacyUploadsDir !== uploadsDir && fs.existsSync(legacyUploadsDir)) {
  app.use('/api/uploads', express.static(legacyUploadsDir, staticOptions));
}

// Health checks (before body parsers / limiters: trivial and cheap)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (req, res) => {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('db timeout')), 2000);
      }),
    ]);
    res.json({ status: 'ready', db: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', id: req.id, msg: 'readiness check failed', error: (error as Error).message }));
    res.status(503).json({ status: 'unavailable', db: 'down', timestamp: new Date().toISOString() });
  } finally {
    if (timer) clearTimeout(timer);
  }
});

// Strict limits on credential endpoints (body is parsed first so the key can include the email).
app.post(
  ['/api/auth/login', '/api/auth/register', '/api/auth/admin-login', '/api/team/invites/:token/accept'],
  smallBody,
  ...authLimiters
);
// Public write / lookup endpoints.
app.post(['/api/orders', '/api/contact'], publicWriteLimiter);
app.use('/api/phone', publicLookupLimiter);

// Routes
app.use('/api/auth', smallBody, authRoutes);
app.use('/api/orders', smallBody, orderRoutes);
app.use('/api/products', imageBody, productRoutes);
app.use('/api/menus', imageBody, menuRoutes);
app.use('/api/customers', smallBody, customerRoutes);
app.use('/api/dashboard', smallBody, dashboardRoutes);
app.use('/api/reports', smallBody, reportsRoutes);
app.use('/api/system', imageBody, systemRoutes);
app.use('/api/favorites', smallBody, favoriteRoutes);
app.use('/api/contact', smallBody, contactRoutes);
app.use('/api/accessories', imageBody, accessoryRoutes);
app.use('/api/services', imageBody, serviceRoutes);
app.use('/api/todos', smallBody, todoRoutes);
app.use('/api/phone', smallBody, phoneRoutes);
app.use('/api/team', smallBody, teamRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling (must be last)
app.use(errorHandler);

// On Vercel the platform invokes the exported app (see api/index.ts); only listen when self-hosted.
if (!isVercel) {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend URL: ${FRONTEND_URL}`);
  });

  process.on('unhandledRejection', (reason) => {
    console.error(JSON.stringify({ level: 'error', msg: 'unhandledRejection', reason: String((reason as any)?.stack || reason) }));
  });
  process.on('uncaughtException', (error) => {
    console.error(JSON.stringify({ level: 'fatal', msg: 'uncaughtException', error: error.stack || error.message }));
    shutdown(1);
  });

  let shuttingDown = false;
  function shutdown(code = 0) {
    if (shuttingDown) return;
    shuttingDown = true;
    const force = setTimeout(() => process.exit(code || 1), 10_000);
    force.unref();
    server.close(async () => {
      try {
        await prisma.$disconnect();
      } finally {
        process.exit(code);
      }
    });
  }
  process.on('SIGTERM', () => shutdown(0));
  process.on('SIGINT', () => shutdown(0));
}

export default app;
