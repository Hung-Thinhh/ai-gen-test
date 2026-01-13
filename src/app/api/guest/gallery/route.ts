import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const guestId = searchParams.get('guestId');

        if (!guestId) {
            return NextResponse.json(
                { error: 'Guest ID is required' },
                { status: 400 }
            );
        }

        const { sql } = await import('@/lib/postgres/client');
        const result = await sql`
            SELECT history
            FROM guest_sessions
            WHERE guest_id = ${guestId}
        `;

        if (!result || result.length === 0) {
            return NextResponse.json({ gallery: [] }, {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                    'Pragma': 'no-cache'
                }
            });
        }

        const history = result[0].history;
        if (history && Array.isArray(history)) {
            // Extract URLs and reverse
            const gallery = history.map((item: any) => item.url).reverse();
            return NextResponse.json({ gallery }, {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                    'Pragma': 'no-cache'
                }
            });
        }

        return NextResponse.json({ gallery: [] });
    } catch (error: any) {
        console.error('[API] Error fetching guest gallery:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
