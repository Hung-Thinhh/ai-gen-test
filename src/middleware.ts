import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const url = request.nextUrl;
    const pathname = url.pathname;

    // Skip logging for static assets to reduce noise
    const isStaticAsset = pathname.match(/\.(woff2?|ttf|otf|eot|css|js|map|ico|svg|png|jpg|jpeg|gif|webp)$/);
    if (!isStaticAsset) {
        console.log('[Middleware] 🚀 EXECUTING for:', pathname);
    }
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
