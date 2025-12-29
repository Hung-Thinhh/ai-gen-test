import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
    const url = request.nextUrl;
    const pathname = url.pathname;

    // ============================================
    // ADMIN ROUTE PROTECTION
    // ============================================
    if (pathname.startsWith('/admin')) {
        console.log('[Middleware] Admin route accessed:', pathname);

        try {
            const cookies = request.cookies;
            const allCookies = cookies.getAll();

            console.log('[Middleware] Total cookies:', allCookies.length);
            console.log('[Middleware] Cookie names:', allCookies.map(c => c.name).join(', '));

            let authToken: string | undefined;

            // Try multiple patterns to find auth token
            for (const cookie of allCookies) {
                console.log(`[Middleware] Checking cookie: ${cookie.name}`);

                // Pattern 1: sb-*-auth-token (Supabase standard)
                if (cookie.name.match(/^sb-.*-auth-token$/)) {
                    console.log('[Middleware] Found Supabase auth cookie:', cookie.name);
                    try {
                        const parsed = JSON.parse(cookie.value);
                        if (parsed.access_token) {
                            authToken = parsed.access_token;
                            console.log('[Middleware] Extracted access_token from JSON');
                            break;
                        }
                    } catch (e) {
                        console.log('[Middleware] Cookie is not JSON, using raw value');
                        authToken = cookie.value;
                        break;
                    }
                }

                // Pattern 2: Direct token cookies
                if (cookie.name === 'sb-access-token' || cookie.name === 'access-token') {
                    console.log('[Middleware] Found direct access token cookie');
                    authToken = cookie.value;
                    break;
                }
            }

            if (!authToken) {
                console.log('[Middleware] ❌ No auth token found after checking all cookies');
                const redirectUrl = new URL('/', request.url);
                redirectUrl.searchParams.set('error', 'login_required');
                return NextResponse.redirect(redirectUrl);
            }

            console.log('[Middleware] ✅ Auth token found, length:', authToken.length);
            console.log('[Middleware] Token preview:', authToken.substring(0, 20) + '...');

            // Create Supabase client to verify token
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

            console.log('[Middleware] Creating Supabase client...');
            const supabase = createClient(supabaseUrl, supabaseAnonKey);

            // Verify token and get user
            console.log('[Middleware] Verifying token with Supabase...');
            const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);

            if (authError || !user) {
                console.log('[Middleware] ❌ Token verification failed:', authError?.message);
                const redirectUrl = new URL('/', request.url);
                redirectUrl.searchParams.set('error', 'invalid_session');
                return NextResponse.redirect(redirectUrl);
            }

            console.log('[Middleware] ✅ User verified:', user.id);

            // Get user role from database
            const { data: userData, error: dbError } = await supabase
                .from('users')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (dbError || !userData || userData.role !== 'admin') {
                console.log('[Middleware] User is not admin. Role:', userData?.role || 'none');
                const redirectUrl = new URL('/', request.url);
                redirectUrl.searchParams.set('error', 'unauthorized');
                return NextResponse.redirect(redirectUrl);
            }

            console.log('[Middleware] Admin access granted for user:', user.id);
            // Allow access to admin panel
            return NextResponse.next();

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
        '/payment', // Payment routes (success, cancel, va)
        '/studio',
        '/pricing'
    ];

    // Check if the route is valid (matches exact or starts with prefix)
    const isValidRoute = validPrefixes.some(prefix => {
        if (prefix === '/') return pathname === '/';
        return pathname.startsWith(prefix);
    });

    // Check if it's a valid static asset or Next.js route
    const isAsset = pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|json|woff|woff2|ttf|eot)$/);
    const isNextRoute = pathname.startsWith('/_next') || pathname.startsWith('/api');

    // Skip middleware for Vite/Workbox dev tools
    const isDevTool = pathname.startsWith('/@') || pathname.includes('workbox');

    // If route is not valid and not an asset/Next.js route, redirect to home
    if (!isValidRoute && !isAsset && !isNextRoute && !isDevTool) {
        console.log(`[Middleware] Unknown route: ${pathname}, redirecting to home`);
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Handle OAuth callback with code param
    if (url.searchParams.has('code')) {
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
