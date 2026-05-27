import NextAuth from 'next-auth'
import { authConfig } from '@/server/auth.config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const isDashboard = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/leads') ||
    pathname.startsWith('/sequences') ||
    pathname.startsWith('/activity') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/sms')

  if (!session && isDashboard) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (session && !session.user?.tenantId && isDashboard) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  if (session?.user?.tenantId && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|api/).*)'],
}
