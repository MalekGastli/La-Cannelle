import { NextResponse } from 'next/server'
import { applyClientIp } from '@/lib/server/clientIp'

const backendBase = () =>
  (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '')

/**
 * Team sign-in. The backend checks email + password (owner or invited staff) and issues the JWT;
 * it is stored in an httpOnly cookie and attached to API calls by the /api proxy.
 */
export async function POST(req: Request) {
  let body: any = null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const email = String(body?.login ?? body?.email ?? '').trim()
  const password = String(body?.password ?? '')
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: 'Email and password required' }, { status: 400 })
  }

  const forwardHeaders = new Headers({ 'Content-Type': 'application/json' })
  applyClientIp(forwardHeaders, req.headers)

  let backend: Response
  try {
    backend = await fetch(`${backendBase()}/auth/admin-login`, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Backend unavailable' }, { status: 503 })
  }

  if (backend.status === 401 || backend.status === 403) {
    return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 })
  }
  if (backend.status === 429) {
    return NextResponse.json({ ok: false, error: 'Too many attempts. Please wait a few minutes and try again.' }, { status: 429 })
  }
  if (!backend.ok) {
    return NextResponse.json({ ok: false, error: `Login failed (${backend.status})` }, { status: 502 })
  }

  const data = (await backend.json()) as { token?: string }
  if (!data.token) {
    return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_token', data.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.headers.get('x-forwarded-proto') === 'https' || new URL(req.url).protocol === 'https:',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day, same as the token
  })
  // Readable by the browser so admin screens can bypass the public CDN cache (contains no secret)
  res.cookies.set('admin_hint', '1', {
    httpOnly: false,
    sameSite: 'lax',
    secure: req.headers.get('x-forwarded-proto') === 'https' || new URL(req.url).protocol === 'https:',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
  return res
}
