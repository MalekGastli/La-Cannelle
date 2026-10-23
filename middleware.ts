import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname === '/login' || pathname.startsWith('/api/admin')) {
    return NextResponse.next()
  }

  const token = req.cookies.get('admin_token')?.value
  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set(
      'next',
      `${req.nextUrl.pathname}${req.nextUrl.search}`
    )
    return NextResponse.redirect(url)
  }

  try {
    const payload = await verifyToken(token)
    if (payload.role !== 'admin') throw new Error('not admin')
    return NextResponse.next()
  } catch {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set(
      'next',
      `${req.nextUrl.pathname}${req.nextUrl.search}`
    )
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/orders/:path*',
    '/menu_management/:path*',
    '/services_management/:path*',
    '/accessories/:path*',
    '/system_control/:path*',
    '/customers/:path*',
    '/reports/:path*',
  ],
}
