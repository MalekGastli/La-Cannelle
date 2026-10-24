import type { AuthRequest } from '../middleware/auth';

/** Team member (owner/staff) according to the verified JWT. Customers and anonymous visitors get the public view. */
export const isStaffRequest = (req: AuthRequest) => req.user?.role === 'ADMIN' || req.user?.role === 'STAFF';

/** Parses ?limit / ?offset into non-negative integers (undefined when absent or invalid). */
export const parsePaging = (query: Record<string, unknown>) => {
  const toInt = (value: unknown) => {
    if (value === undefined || value === '') return undefined;
    const parsed = parseInt(String(value), 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
  };
  return { limit: toInt(query.limit), offset: toInt(query.offset) };
};
