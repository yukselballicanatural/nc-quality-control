import { NextResponse, type NextRequest } from 'next/server'

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(cookie => cookie.name.startsWith('sb-') && cookie.name.includes('auth-token'))
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/auth')
  const isApiRoute = pathname.startsWith('/api/')

  if (isApiRoute) {
    return NextResponse.next({ request })
  }

  const hasSession = hasSupabaseSessionCookie(request)

  if (!hasSession && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (hasSession && (pathname === '/login' || pathname === '/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Never let a page document be served from browser/proxy cache. Hashed JS/CSS
  // under /_next/static (excluded by the matcher) keep their long immutable
  // cache, but the HTML must always be fresh so it can never reference a chunk
  // filename from an old deploy that no longer exists → ChunkLoadError.
  const response = NextResponse.next({ request })
  response.headers.set('Cache-Control', 'no-store, must-revalidate')
  return response
}
