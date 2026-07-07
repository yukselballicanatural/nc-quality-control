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

  return NextResponse.next({ request })
}
