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
            SELECT credits
            FROM guest_sessions
            WHERE guest_id = ${guestId}
        `;

        if (!result || result.length === 0) {
            return NextResponse.json({ credits: 0 });
        }

        return NextResponse.json({ credits: result[0].credits || 0 });
    } catch (error: any) {
        console.error('[API] Error fetching guest credits:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
