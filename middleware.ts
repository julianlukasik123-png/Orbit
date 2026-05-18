import { auth } from '@/server/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const isDashboard = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/leads') ||
    pathname.startsWith('/sequences') ||
    pathname.startsWith('/activity') ||
    pathname.startsWith('/settings')

  // Unauthenticated user trying to access protected route
  if (!session && isDashboard) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Authenticated user with no tenant → send to onboarding (unless already there)
  if (session && !session.user?.tenantId && isDashboard) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  // Authenticated user with tenant trying to access auth pages → send to dashboard
  if (session?.user?.tenantId && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|api/trpc).*)'],
}
