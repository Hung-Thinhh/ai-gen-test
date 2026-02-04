import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const url = request.nextUrl;
    const pathname = url.pathname;
    const userAgent = request.headers.get('user-agent') || '';

    // Detect Zalo or Messenger in-app browser
    const isZalo = userAgent.toLowerCase().includes('zalo');
    const isMessenger = userAgent.toLowerCase().includes('messenger') || userAgent.toLowerCase().includes('fban') || userAgent.toLowerCase().includes('fbav');
    const isInAppBrowser = isZalo || isMessenger;

    // Skip logging for static assets to reduce noise
    const isStaticAsset = pathname.match(/\.(woff2?|ttf|otf|eot|css|js|map|ico|svg|png|jpg|jpeg|gif|webp)$/);
    if (!isStaticAsset) {
        console.log('[Middleware] 🚀 Request:', pathname, isInAppBrowser ? `(In-app: ${isZalo ? 'Zalo' : 'Messenger'})` : '');
    }

    // Create response with modified headers for in-app browsers
    const response = NextResponse.next();

    if (isInAppBrowser) {
        // Use Lax SameSite for OAuth compatibility while maintaining security
        response.headers.set('Set-Cookie', 'SameSite=Lax; Secure');
        // Remove X-Frame-Options for in-app browsers to ensure compatibility
        // Zalo/Messenger don't use iframes but some features may need this
        response.headers.delete('X-Frame-Options');
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except static files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
