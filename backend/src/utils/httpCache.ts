import crypto from 'crypto';
import type { Request, Response } from 'express';

export const PUBLIC_CACHE_CONTROL = 'public, max-age=10, s-maxage=30, stale-while-revalidate=60';
export const PRIVATE_CACHE_CONTROL = 'private, no-store';

/**
 * True when the request comes from a signed-in user (Authorization header) or a team member (admin_token cookie).
 * Such responses must never be shared or stored, so the admin never sees a stale list after editing.
 */
export const isPrivateRequest = (req: Request) => {
  if (req.headers.authorization) return true;
  const cookie = req.headers.cookie;
  return typeof cookie === 'string' && /(?:^|;\s*)admin_token=/.test(cookie);
};

type Serialized = { json: string; etag: string; length: number };
// Cached lists are the same object for 30s, so serialise + hash them once.
const serialized = new WeakMap<object, Serialized>();

const serialize = (body: unknown): Serialized => {
  if (body && typeof body === 'object') {
    const known = serialized.get(body as object);
    if (known) return known;
  }
  const json = JSON.stringify(body ?? null);
  const hash = crypto.createHash('sha1').update(json).digest('base64').slice(0, 27);
  const result = { json, etag: `W/"${hash}"`, length: Buffer.byteLength(json) };
  if (body && typeof body === 'object') serialized.set(body as object, result);
  return result;
};

const matchesEtag = (header: string | undefined, etag: string) => {
  if (!header) return false;
  if (header.trim() === '*') return true;
  const strip = (value: string) => value.trim().replace(/^W\//, '');
  const wanted = strip(etag);
  return header.split(',').some((candidate) => strip(candidate) === wanted);
};

/**
 * Sends a JSON body for a public GET endpoint.
 * - anonymous: Cache-Control public + weak ETag, 304 on If-None-Match
 * - authenticated / admin cookie: Cache-Control private, no-store (no ETag)
 */
export const sendCachedJson = (req: Request, res: Response, body: unknown, status = 200) => {
  // Responses differ by credentials, so shared caches must key on them.
  res.vary('Authorization');
  res.vary('Cookie');

  if (isPrivateRequest(req)) {
    const { json, length } = serialize(body);
    res.status(status);
    res.setHeader('Cache-Control', PRIVATE_CACHE_CONTROL);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Length', length);
    return res.end(json);
  }

  const { json, etag, length } = serialize(body);
  res.setHeader('Cache-Control', PUBLIC_CACHE_CONTROL);
  res.setHeader('ETag', etag);

  if (status === 200 && matchesEtag(req.headers['if-none-match'] as string | undefined, etag)) {
    return res.status(304).end();
  }

  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', length);
  return res.end(req.method === 'HEAD' ? undefined : json);
};
