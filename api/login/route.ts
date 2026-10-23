import { NextResponse } from 'next/server'
import { signToken } from '../../lib/auth'

export async function POST(req: Request) {
  const { email, password } = await req.json()

  if (email !== 'admin@email.com' || password !== 'admin123') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = await signToken({ role: 'admin' })

  const res = NextResponse.json({ success: true })
  res.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    path: '/',
  })

  return res
}
