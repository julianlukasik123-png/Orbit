import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isDashboard =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/leads') ||
    pathname.startsWith('/sequences') ||
    pathname.startsWith('/activity') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/sms')

  const token = await getToken({ req, secret: process.env.AUTH_SECRET })

  if (!token && isDashboard) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (token && !token.tenantId && isDashboard) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  if (token?.tenantId && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|api/).*)'],
}
