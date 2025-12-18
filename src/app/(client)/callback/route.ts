import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL('/', request.url));
}
