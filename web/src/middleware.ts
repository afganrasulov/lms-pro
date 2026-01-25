import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    let res = NextResponse.next({
        request: {
            headers: req.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value))
                    res = NextResponse.next({
                        request: {
                            headers: req.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        res.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    console.log('Middleware: Path', req.nextUrl.pathname)
    // console.log('Middleware: User', user?.id) // Reduce noise

    // AuthSessionMissingError is normal for unauthenticated users in newer Supabase SSR versions
    if (error && !error.message.includes('Auth session missing')) {
        console.error('Middleware: Auth Error', error)
    }

    // 1. Redirect logged-in users away from the root gate
    if (user && req.nextUrl.pathname === '/') {
        console.log('Middleware: Redirecting logged-in user to /dashboard')
        const url = req.nextUrl.clone()
        url.pathname = '/dashboard'
        const redirectRes = NextResponse.redirect(url)

        // Copy cookies from the 'res' object (which collects updates) to the redirect response
        // This ensures that if the session was refreshed during getUser, the browser gets the new token
        const allCookies = res.cookies.getAll()
        allCookies.forEach(cookie => redirectRes.cookies.set(cookie))

        return redirectRes
    }

    // 2. Protect authenticated routes
    const isProtectedPath = ['/dashboard', '/courses', '/settings', '/leaderboard', '/admin', '/profile'].some(path =>
        req.nextUrl.pathname.startsWith(path)
    )

    if (!user && isProtectedPath) {
        console.log('Middleware: Redirecting global guest to /')
        const url = req.nextUrl.clone()
        url.pathname = '/'
        const redirectRes = NextResponse.redirect(url)

        // Even when kicking out, good practice to sync cookies (though likely clearing them)
        const allCookies = res.cookies.getAll()
        allCookies.forEach(cookie => redirectRes.cookies.set(cookie))

        return redirectRes
    }

    return res
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
