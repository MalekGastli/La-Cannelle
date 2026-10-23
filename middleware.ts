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
    // Backend-issued token: the owner (ADMIN) or an invited staff member (STAFF). Real permissions are enforced by the API.
    if (payload.role !== 'ADMIN' && payload.role !== 'STAFF') throw new Error('not team')
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
    '/team/:path*',
  ],
}
