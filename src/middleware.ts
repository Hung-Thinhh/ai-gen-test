import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const url = request.nextUrl;
    const pathname = url.pathname;

    // Skip logging for static assets to reduce noise
    const isStaticAsset = pathname.match(/\.(woff2?|ttf|otf|eot|css|js|map|ico|svg|png|jpg|jpeg|gif|webp)$/);
    if (!isStaticAsset) {
        console.log('[Middleware] 🚀 Request:', pathname);
    }

    // Let Next.js handle routing naturally
    // Invalid routes will automatically show 404 page
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
