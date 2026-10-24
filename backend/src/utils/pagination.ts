import type { Response } from 'express';

export const MAX_PAGE_SIZE = 100;
/** Safety cap applied to list endpoints when the caller did not ask for pagination. */
// Admin screens load these lists in one go; indexed queries keep this cheap. Use ?limit&page for paging.
export const DEFAULT_LIST_CAP = 2000;

export interface Pagination {
  take: number;
  skip: number;
  /** true when the caller explicitly passed limit/page/offset */
  paginated: boolean;
}

const toInt = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Math.trunc(Number(Array.isArray(value) ? value[0] : value));
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Backwards compatible pagination: without `limit`/`page`/`offset` the first DEFAULT_LIST_CAP
 * rows are returned (the old unbounded behaviour, capped). With them, page size is hard-limited
 * to MAX_PAGE_SIZE. The response body stays a plain array; the total is sent as X-Total-Count.
 */
export function parsePagination(query: Record<string, unknown>): Pagination {
  const limit = toInt(query.limit ?? query.pageSize);
  const page = toInt(query.page);
  const offset = toInt(query.offset);
  if (limit === undefined && page === undefined && offset === undefined) {
    return { take: DEFAULT_LIST_CAP, skip: 0, paginated: false };
  }
  const take = Math.min(Math.max(limit ?? 50, 1), MAX_PAGE_SIZE);
  const skip = offset !== undefined ? Math.max(offset, 0) : Math.max((page ?? 1) - 1, 0) * take;
  return { take, skip, paginated: true };
}

export function setTotalCount(res: Response, total: number) {
  res.setHeader('X-Total-Count', String(total));
  res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
}
