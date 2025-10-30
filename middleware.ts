import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  // Don't apply middleware to static files, API routes, or auth routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||
    pathname.includes('.') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // Client area protection - only protect routes that are NOT the login page
  if (pathname.startsWith('/client') && pathname !== '/client/login') {
    if (!token || token.userType !== 'CLIENT') {
      return NextResponse.redirect(new URL('/client/login', request.url))
    }
  }

  // Admin area protection
  if (pathname.startsWith('/admin')) {
    if (!token || (token.userType !== 'USER' && token.role !== 'ADMIN')) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
  }

  // Kiosk protected routes - require client authentication
  if (pathname.startsWith('/kiosk/welcome')) {
    if (!token || token.userType !== 'CLIENT') {
      return NextResponse.redirect(new URL('/kiosk/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
