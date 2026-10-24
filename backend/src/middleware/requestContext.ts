import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    id?: string;
  }
}

const SAFE_ID = /^[A-Za-z0-9._-]{8,64}$/;

/** Assigns/echoes X-Request-Id (accepts a sane incoming one, e.g. from Vercel/proxies). */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const incoming = req.headers['x-request-id'];
  const candidate = Array.isArray(incoming) ? incoming[0] : incoming;
  const id = candidate && SAFE_ID.test(candidate) ? candidate : crypto.randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
};

/** One-line structured access log. Never logs bodies, headers, or query strings (may hold tokens). */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.LOG_REQUESTS === 'false') return next();
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const path = (req.originalUrl || req.url).split('?')[0];
    console.log(
      JSON.stringify({
        t: new Date().toISOString(),
        level: 'info',
        id: req.id,
        method: req.method,
        path,
        status: res.statusCode,
        ms: Math.round(ms * 10) / 10,
      })
    );
  });
  next();
};
