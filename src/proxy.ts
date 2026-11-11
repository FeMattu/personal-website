import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const intl = createMiddleware(routing)

/**
 * Locale routing for the public site. `/admin`, `/login` and `/api` live outside `/[locale]`.
 * Admin gets only an OPTIMISTIC cookie check here; the real session check runs in every admin
 * page (`requireAdmin`) and server action (`assertAdmin`).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const hasSession =
      request.cookies.has('authjs.session-token') ||
      request.cookies.has('__Secure-authjs.session-token')
    if (!hasSession) {
      const url = new URL('/login', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  return intl(request)
}

export const config = {
  // Everything except API, Next internals, admin/login assets and files with an extension.
  matcher: ['/((?!api|_next|_vercel|login|.*\\..*).*)'],
}
