import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
    const url = request.nextUrl;
    const pathname = url.pathname;

    console.log('[Middleware] 🚀 EXECUTING for:', pathname);

    // ============================================
    // ADMIN ROUTE PROTECTION
    // ============================================
    if (pathname.startsWith('/admin')) {
        console.log('[Middleware] Admin route accessed:', pathname);

        try {
            let response = NextResponse.next({
                request: {
                    headers: request.headers,
                },
            });

            // Create Supabase Server Client (handles cookies automatically)
            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        get(name: string) {
                            return request.cookies.get(name)?.value;
                        },
                        set(name: string, value: string, options: CookieOptions) {
                            request.cookies.set({
                                name,
                                value,
                                ...options,
                            });
                            response = NextResponse.next({
                                request: {
                                    headers: request.headers,
                                },
                            });
                            response.cookies.set({
                                name,
                                value,
                                ...options,
                            });
                        },
                        remove(name: string, options: CookieOptions) {
                            request.cookies.set({
                                name,
                                value: '',
                                ...options,
                            });
                            response = NextResponse.next({
                                request: {
                                    headers: request.headers,
                                },
                            });
                            response.cookies.set({
                                name,
                                value: '',
                                ...options,
                            });
                        },
                    },
                }
            );

            console.log('[Middleware] Getting user session...');
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                console.log('[Middleware] ❌ No authenticated user:', authError?.message || 'No user');
                const redirectUrl = new URL('/', request.url);
                redirectUrl.searchParams.set('error', 'login_required');
                return NextResponse.redirect(redirectUrl);
            }

            console.log('[Middleware] ✅ User authenticated:', user.id);

            // Get user role from database
            const { data: userData, error: dbError } = await supabase
                .from('users')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (dbError || !userData || userData.role !== 'admin') {
                console.log('[Middleware] ❌ User is not admin. Role:', userData?.role || 'none');
                const redirectUrl = new URL('/', request.url);
                redirectUrl.searchParams.set('error', 'unauthorized');
                return NextResponse.redirect(redirectUrl);
            }

            console.log('[Middleware] ✅ Admin access granted for user:', user.id);
            return response;

        } catch (error) {
            console.error('[Middleware] Error checking admin access:', error);
            const redirectUrl = new URL('/', request.url);
            redirectUrl.searchParams.set('error', 'server_error');
            return NextResponse.redirect(redirectUrl);
        }
    }

    // ============================================
    // ROUTE VALIDATION (existing logic)
    // ============================================
    // List of valid route prefixes
    const validPrefixes = [
        '/',
        '/tool',
        '/gallery',
        '/prompt-library',
        '/storyboarding',
        '/settings',
        '/profile',
        '/history',
        '/auth',
        '/admin',  // Admin panel routes
        '/studio',
        '/pricing',
        '/payment',
        '/api',
        '/_next',
    ];

    // Check if pathname starts with any valid prefix
    const isValidRoute = validPrefixes.some(prefix => pathname.startsWith(prefix));

    if (!isValidRoute) {
        console.log(`[Middleware] Invalid route: ${pathname}, redirecting to home`);
        const redirectUrl = new URL('/', request.url);
        return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except static files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
