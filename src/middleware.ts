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
        try {
            // Get session token from cookies
            const token = request.cookies.get('sb-access-token')?.value ||
                request.cookies.get('sb-dmxmzannb-auth-token')?.value;

            if (!token) {
                console.log('[Middleware] No auth token found, redirecting to home');
                const redirectUrl = new URL('/', request.url);
                redirectUrl.searchParams.set('error', 'login_required');
                return NextResponse.redirect(redirectUrl);
            }

            // Create Supabase client to verify token
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

            const supabase = createClient(supabaseUrl, supabaseAnonKey);

            // Verify token and get user
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);

            if (authError || !user) {
                console.log('[Middleware] Invalid token, redirecting to home');
                const redirectUrl = new URL('/', request.url);
                redirectUrl.searchParams.set('error', 'invalid_session');
                return NextResponse.redirect(redirectUrl);
            }

            // Get user role from database
            const { data: userData, error: dbError } = await supabase
                .from('users')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (dbError || !userData || userData.role !== 'admin') {
                console.log('[Middleware] User is not admin, redirecting to home');
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
