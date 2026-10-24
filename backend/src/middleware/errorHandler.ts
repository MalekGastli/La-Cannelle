import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const isProd = () => process.env.NODE_ENV === 'production';
const isDev = () => process.env.NODE_ENV === 'development';

const logError = (req: Request, status: number, err: unknown) => {
  const e = err as any;
  console.error(
    JSON.stringify({
      t: new Date().toISOString(),
      level: 'error',
      id: req.id,
      method: req.method,
      path: (req.originalUrl || req.url).split('?')[0],
      status,
      name: e?.name,
      code: e?.code,
      message: e?.message,
      // stack only outside production logs' hot path: kept in logs (server side), never in responses
      stack: status >= 500 ? e?.stack : undefined,
    })
  );
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) return next(err);
  const anyErr = err as any;
  const requestId = req.id;

  // CORS rejection (see server.ts)
  if (anyErr?.code === 'CORS_NOT_ALLOWED') {
    logError(req, 403, err);
    return res.status(403).json({ error: 'Origin not allowed', requestId });
  }

  // body-parser / raw-body errors
  if (anyErr?.type === 'entity.too.large' || anyErr?.status === 413 || anyErr?.statusCode === 413) {
    logError(req, 413, err);
    return res.status(413).json({ error: 'Payload too large', requestId });
  }
  if (anyErr?.type === 'entity.parse.failed' || (err instanceof SyntaxError && anyErr?.status === 400)) {
    logError(req, 400, err);
    return res.status(400).json({ error: 'Invalid JSON body', requestId });
  }
  if (
    typeof anyErr?.type === 'string' &&
    anyErr.type.startsWith('encoding.') ||
    anyErr?.type === 'request.aborted' ||
    anyErr?.type === 'request.size.invalid' ||
    anyErr?.type === 'stream.encoding.set' ||
    anyErr?.type === 'charset.unsupported'
  ) {
    logError(req, 400, err);
    return res.status(400).json({ error: 'Invalid request', requestId });
  }

  if (err instanceof AppError) {
    logError(req, err.statusCode, err);
    // AppError messages are intentionally user-facing, but 5xx ones are hidden in production.
    const message = isProd() && err.statusCode >= 500 ? 'Internal server error' : err.message;
    return res.status(err.statusCode).json({
      error: message,
      requestId,
      ...(isDev() && { stack: err.stack })
    });
  }

  const prismaErr = err as any;
  const isPrismaError =
    prismaErr &&
    typeof prismaErr === 'object' &&
    typeof prismaErr.name === 'string' &&
    prismaErr.name.startsWith('PrismaClient');

  if (isPrismaError) {
    // Validation errors usually mean the request payload doesn't match the Prisma schema/client
    // (e.g. backend code deployed but Prisma Client not regenerated).
    if (prismaErr.name === 'PrismaClientValidationError') {
      console.error('Prisma validation error:', {
        id: req.id,
        name: prismaErr.name,
        message: prismaErr.message
      });
      return res.status(400).json({
        error: 'Invalid request payload. Ensure the backend Prisma Client is generated and the database is migrated.',
        ...(process.env.NODE_ENV === 'development' && { message: prismaErr.message })
      });
    }

    // Common production issue: code deployed but DB migrations not applied.
    // https://www.prisma.io/docs/reference/api-reference/error-reference
    if (prismaErr.code === 'P2022') {
      console.error('Prisma schema mismatch (missing column):', {
        id: req.id,
        code: prismaErr.code,
        message: prismaErr.message,
        meta: prismaErr.meta
      });
      return res.status(500).json({
        error: 'Database schema is out of date. Please run migrations on the production database.',
        ...(process.env.NODE_ENV === 'development' && { message: prismaErr.message, meta: prismaErr.meta })
      });
    }

    // MySQL enum mismatch (e.g. quantityMode missing CLIENT) often surfaces as a query error.
    if (typeof prismaErr.message === 'string' && prismaErr.message.toLowerCase().includes('data truncated')) {
      console.error('Prisma query failed (possible enum mismatch):', {
        id: req.id,
        code: prismaErr.code,
        message: prismaErr.message,
        meta: prismaErr.meta
      });
      return res.status(500).json({
        error:
          'Database rejected the update (possible schema mismatch). Ensure all migrations are applied and the database enum values match the code.',
        ...(process.env.NODE_ENV === 'development' && { message: prismaErr.message, meta: prismaErr.meta })
      });
    }
  }

  logError(req, 500, err);
  return res.status(500).json({
    error: 'Internal server error',
    requestId,
    ...(process.env.NODE_ENV === 'development' && { message: err.message })
  });
};
