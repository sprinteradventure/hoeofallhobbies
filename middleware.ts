import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const HOLIDAY_HOSTS = new Set([
  'hoeofallholidays.com',
  'www.hoeofallholidays.com',
  'localhost:3001', // for local dev of holidays site
])

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const isHoliday = HOLIDAY_HOSTS.has(host.toLowerCase())
  const siteType = isHoliday ? 'holidays' : 'hobbies'

  const response = NextResponse.next()

  // Set a cookie so client components can read the site type
  response.cookies.set('site-type', siteType, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  })

  // Also set a header for server components
  response.headers.set('x-site-type', siteType)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
