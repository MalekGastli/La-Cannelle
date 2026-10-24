import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

/**
 * Public list endpoints must never carry base64 blobs. Images are always URL strings; legacy rows that still
 * hold a data: URL in the database are replaced by a small URL served from GET /api/<resource>/:id/image.
 */

export type ImageTable = 'products' | 'menus' | 'services' | 'accessories';

// Table names are interpolated into SQL, so they are limited to this fixed list.
const TABLES: Record<ImageTable, Prisma.Sql> = {
  products: Prisma.raw('"products"'),
  menus: Prisma.raw('"menus"'),
  services: Prisma.raw('"services"'),
  accessories: Prisma.raw('"accessories"'),
};

export const isDataUrl = (value: unknown): value is string => typeof value === 'string' && /^data:/i.test(value);

/** Maps id -> image URL (or null). The database never sends the blob itself: data: values come back as a marker. */
export const loadImageUrls = async (table: ImageTable, ids: number[]) => {
  const map = new Map<number, string | null>();
  if (!ids.length) return map;
  const rows = await prisma.$queryRaw<Array<{ id: number; image: string | null; version: string | null; isData: boolean }>>(
    Prisma.sql`SELECT "id",
        CASE WHEN "image" LIKE 'data:%' THEN NULL ELSE "image" END AS "image",
        CASE WHEN "image" LIKE 'data:%' THEN left(md5("image"), 8) ELSE NULL END AS "version",
        COALESCE("image" LIKE 'data:%', false) AS "isData"
      FROM ${TABLES[table]} WHERE "id" IN (${Prisma.join(ids)})`
  );
  for (const row of rows) {
    map.set(row.id, row.isData ? `/api/${table}/${row.id}/image?v=${row.version}` : row.image);
  }
  return map;
};

/** Adds `image` (always a URL string or null) to rows that were selected without it. */
export const withImageUrls = async <T extends { id: number }>(table: ImageTable, rows: T[]) => {
  const images = await loadImageUrls(table, rows.map((row) => row.id));
  return rows.map((row) => ({ ...row, image: images.get(row.id) ?? null }));
};

/** GET /:id/image handler for legacy data: images (also redirects plain URLs). */
export const sendStoredImage = (table: ImageTable) => async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) throw new AppError('Image not found', 404);
  const rows = await prisma.$queryRaw<Array<{ image: string | null }>>(
    Prisma.sql`SELECT "image" FROM ${TABLES[table]} WHERE "id" = ${id}`
  );
  const image = rows[0]?.image;
  if (!image) throw new AppError('Image not found', 404);

  const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  if (!match) {
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.redirect(302, image);
  }
  const buffer = Buffer.from(image.slice(match[0].length), 'base64');
  res.setHeader('Content-Type', match[1]);
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (match[1] === 'image/svg+xml') res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  return res.end(buffer);
};

/**
 * The admin UI sends the image it received back on every save. For legacy data: rows that value is our own
 * /api/<resource>/:id/image URL and must not overwrite the stored image.
 */
export const isOwnImageUrl = (value: unknown) =>
  typeof value === 'string' && /^\/api\/(products|menus|services|accessories)\/\d+\/image(\?|$)/.test(value.trim());
