import crypto from 'crypto';
import type { Request } from 'express';

/**
 * The website proxy forwards the visitor's IP as `x-client-ip` with an HMAC signature made with the
 * JWT secret both deployments share. Only a correctly signed value is trusted; otherwise we fall back
 * to the socket / proxy-derived address.
 */
export function clientIp(req: Request): string {
  const ip = req.headers['x-client-ip'];
  const sig = req.headers['x-client-ip-sig'];
  const secret = process.env.JWT_SECRET;
  if (secret && typeof ip === 'string' && typeof sig === 'string' && ip.length <= 64) {
    const expected = crypto.createHmac('sha256', secret).update(ip).digest('hex');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return ip;
  }
  return req.ip || 'unknown';
}
