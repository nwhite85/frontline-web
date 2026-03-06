import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface CookieToSet {
  name: string
  value: string
  options?: Record<string, unknown>
}

const PUBLIC_API_PREFIXES = [
  '/api/login',
  '/api/signup-client',
  '/api/send-password-reset',
  '/api/auth/',
  '/api/webhooks/',
  '/api/bookings/trialist',
  '/api/calendar/',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip public API routes
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  let res = NextResponse.next({
    request: { headers: req.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }: CookieToSet) => {
            req.cookies.set(name, value)
          })
          res = NextResponse.next({
            request: { headers: req.headers },
          })
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Use getSession() in middleware — reads JWT from cookie locally, no network call.
  // getUser() (with network validation) is used in page/API code where it matters.
  // Wrap in try/catch with timeout — if Supabase is unreachable, fail open on public
  // routes and redirect to login on protected routes rather than hanging.
  let session = null
  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('auth_timeout')), 3000)
      ),
    ]) as Awaited<ReturnType<typeof supabase.auth.getSession>>
    session = result.data.session
  } catch {
    // Supabase unreachable — redirect protected routes to login, allow public through
    if (pathname.startsWith('/dashboard')) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/dashboard-login'
      return NextResponse.redirect(loginUrl)
    }
    return res
  }

  // Protect dashboard routes — redirect to trainer login
  if (pathname.startsWith('/dashboard') && !session) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/dashboard-login'
    return NextResponse.redirect(loginUrl)
  }

  // Protect API routes — return 401
  if (pathname.startsWith('/api/') && !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
}
