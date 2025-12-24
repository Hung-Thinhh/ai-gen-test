import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const url = request.nextUrl;
    const pathname = url.pathname;

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
