import { createHmac } from 'crypto';

/**
 * The backend is a separate Vercel project, so it only sees this site's egress IP. We pass the real
 * visitor IP along, signed with the secret both projects share, so the backend can trust it for rate limiting.
 * Any x-client-ip headers sent by the browser are discarded first.
 */
export const CLIENT_IP_HEADER = 'x-client-ip';
export const CLIENT_IP_SIG_HEADER = 'x-client-ip-sig';

export function visitorIp(headers: Headers): string {
  const vercel = headers.get('x-vercel-forwarded-for');
  const forwarded = headers.get('x-forwarded-for');
  return (vercel || forwarded || '').split(',')[0].trim();
}

export function applyClientIp(target: Headers, source: Headers) {
  target.delete(CLIENT_IP_HEADER);
  target.delete(CLIENT_IP_SIG_HEADER);
  const secret = process.env.JWT_SECRET;
  const ip = visitorIp(source);
  if (!secret || !ip) return;
  target.set(CLIENT_IP_HEADER, ip);
  target.set(CLIENT_IP_SIG_HEADER, createHmac('sha256', secret).update(ip).digest('hex'));
}
