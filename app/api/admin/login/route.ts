import { NextResponse } from 'next/server'
import { signToken } from '@/lib/auth'

export async function POST(req: Request) {
  let body: any = null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const login = String(body?.login ?? '')
  const password = String(body?.password ?? '')

  if (login !== 'lacannelle' || password !== 'lacannelle') {
    return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 })
  }

  let token = ''
  try {
    token = await signToken({ role: 'admin', login })
  } catch (err) {
    console.error('Failed to sign admin token:', err)
    return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day
  })
  return res
}

