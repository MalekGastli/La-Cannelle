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

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
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

  console.error('Unexpected error:', err);
  return res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { message: err.message })
  });
};
