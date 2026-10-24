import { NextRequest, NextResponse } from 'next/server'
import { applyClientIp } from '@/lib/server/clientIp'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getBackendApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL || 'http://localhost:3001/api';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
  // fetch() hands us a decoded body, so the original encoding/validators no longer apply
  'content-encoding',
  'etag',
]);

// Public catalogue reads may be cached by the CDN; everything else (and every signed-in request) is never cached.
const CACHEABLE_PREFIXES = new Set(['products', 'menus', 'services', 'accessories']);

const forward = async (
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) => {
  const { path } = await context.params;
  const base = getBackendApiBaseUrl().replace(/\/+$/, '');
  const backendUrl = new URL(`${base}/${path.map(encodeURIComponent).join('/')}`);
  backendUrl.search = req.nextUrl.search;

  const headers = new Headers(req.headers);
  for (const headerName of HOP_BY_HOP_HEADERS) headers.delete(headerName);

  // Team members sign in through an httpOnly cookie; it takes precedence over any customer token in the browser
  const adminToken = req.cookies.get('admin_token')?.value;
  if (adminToken) headers.set('authorization', `Bearer ${adminToken}`);
  headers.delete('accept-encoding');
  applyClientIp(headers, req.headers);

  const method = req.method.toUpperCase();
  const cacheable =
    (method === 'GET' || method === 'HEAD') &&
    CACHEABLE_PREFIXES.has(path[0]) &&
    !adminToken &&
    !req.headers.get('authorization') &&
    !req.nextUrl.searchParams.has('_adm');
  if (!cacheable) {
    headers.delete('if-none-match');
    headers.delete('if-modified-since');
  }

  const maybeBody = method === 'GET' || method === 'HEAD' ? null : req.body;
  const body = maybeBody ?? undefined;

  try {
    const init: RequestInit = {
      method,
      headers,
      body,
      redirect: 'manual',
      cache: 'no-store',
    };
    if (body) (init as any).duplex = 'half';

    const backendResponse = await fetch(backendUrl, init);

    const responseHeaders = new Headers(backendResponse.headers);
    for (const headerName of HOP_BY_HOP_HEADERS) responseHeaders.delete(headerName);
    if (cacheable && (backendResponse.ok || backendResponse.status === 304)) {
      // keep the backend's Cache-Control and ETag so browsers and the CDN can revalidate cheaply
      const etag = backendResponse.headers.get('etag');
      if (etag) responseHeaders.set('ETag', etag);
      if (!responseHeaders.get('Cache-Control')) responseHeaders.set('Cache-Control', 'no-store');
    } else {
      responseHeaders.set('Cache-Control', 'no-store');
    }

    const bodyless = method === 'HEAD' || [204, 205, 304].includes(backendResponse.status);
    const responseBody = bodyless ? null : await backendResponse.arrayBuffer();

    return new Response(responseBody, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { error: 'Backend unavailable (check that it is running on port 3001)' },
      { status: 503 }
    );
  }
};

export const GET = forward;
export const HEAD = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const OPTIONS = forward;
