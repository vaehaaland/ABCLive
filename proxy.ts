import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isLoginPage = pathname === '/login'
  // TODO: migrate routing from /dashboard/* to /app/* — update matcher and all isDashboard checks
  // New structure: /app/gigs, /app/resource/equipment, /app/resource/persons, /app/calendar, /app/profile, /app/admin/*
  const isDashboard = pathname.startsWith('/dashboard')

  if (!user && isDashboard) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Only redirect logged-in users away from the login page itself, not from
  // /forgot-password or /reset-password (needed to complete the reset flow)
  if (user && isLoginPage) {
    // TODO: change redirect target to '/app/gigs'
    return NextResponse.redirect(new URL('/dashboard/gigs', request.url))
  }

  return supabaseResponse
}

export const config = {
  // TODO: update matcher to '/app/:path*' when route migration is complete
  matcher: ['/dashboard/:path*', '/login', '/forgot-password', '/reset-password'],
}
