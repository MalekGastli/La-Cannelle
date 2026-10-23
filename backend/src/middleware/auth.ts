import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { AppError } from './errorHandler';
import { can, resolveGrants, type Grants, type Permission, type Resource } from '../utils/permissions';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: 'ADMIN' | 'STAFF' | 'CLIENT';
  };
  grants?: Grants;
}

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction) => {
  // Soft authentication: only attach the user when a valid token is provided.
  // Routes that need a user use requireAuth / requireStaff / requirePermission.
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return next();

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');

    req.user = jwt.verify(token, secret) as NonNullable<AuthRequest['user']>;
  } catch {
    // invalid or expired token: continue as anonymous
  }
  next();
};

/** Loads the user fresh from the database, so a deactivated account or a changed role takes effect immediately. */
async function loadStaff(req: AuthRequest): Promise<Grants> {
  if (!req.user) throw new AppError('Authentication required', 401);
  if (req.grants) return req.grants;

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      role: true,
      isActive: true,
      permissions: { select: { resource: true, action: true, allow: true } },
      teamRole: { select: { permissions: { select: { resource: true, action: true } } } },
    },
  });
  if (!user || !user.isActive || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
    throw new AppError('Not allowed', 403);
  }
  req.grants = resolveGrants({
    isOwner: user.role === 'ADMIN',
    rolePermissions: user.teamRole?.permissions ?? [],
    overrides: user.permissions,
  });
  return req.grants;
}

export const requireAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new AppError('Authentication required', 401));
  next();
};

/** Any active team member (owner or staff). */
export const requireStaff = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    await loadStaff(req);
    next();
  } catch (error) {
    next(error);
  }
};

export const requirePermission = (permission: Permission) =>
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      const grants = await loadStaff(req);
      if (!can(grants, permission)) throw new AppError(`Missing permission: ${permission}`, 403);
      next();
    } catch (error) {
      next(error);
    }
  };

/** Maps the HTTP method to an action: GET view, POST create, PUT/PATCH edit, DELETE delete. */
export const requireResource = (resource: Resource) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    const action =
      req.method === 'GET' || req.method === 'HEAD' ? 'view'
      : req.method === 'POST' ? 'create'
      : req.method === 'DELETE' ? 'delete'
      : 'edit';
    return requirePermission(`${resource}.${action}` as Permission)(req, res, next);
  };

/** Owner only. */
export const requireAdmin = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const grants = await loadStaff(req);
    if (!grants.isOwner) throw new AppError('Owner access required', 403);
    next();
  } catch (error) {
    next(error);
  }
};

export const requireClient = requireAuth;

export { loadStaff };
