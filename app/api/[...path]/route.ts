import { NextRequest, NextResponse } from 'next/server'

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
]);

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

  const method = req.method.toUpperCase();
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
    responseHeaders.set('Cache-Control', 'no-store');

    const responseBody = method === 'HEAD' ? null : await backendResponse.arrayBuffer();

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
