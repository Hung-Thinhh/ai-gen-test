import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon/client';

/**
 * GET /api/credits/guest?guestId=xxx - Get guest credits
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const guestId = searchParams.get('guestId');

        if (!guestId) {
            return NextResponse.json({ error: 'Guest ID required' }, { status: 400 });
        }

        // Get guest credits
        const result = await sql`
            SELECT credits FROM guest_sessions 
            WHERE guest_id = ${guestId} 
            LIMIT 1
        `;

        // If guest doesn't exist, create with default credits
        if (!result || result.length === 0) {
            const defaultCredits = 3;
            // Use upsert-like logic or just insert since we checked it doesn't exist
            // But concurrency might be an issue, usage of ON CONFLICT is better if guest_id is PK/Unique
            // Assuming guest_id is compatible with ON CONFLICT or just try INSERT

            try {
                const newGuest = await sql`
                    INSERT INTO guest_sessions (guest_id, credits, last_seen)
                    VALUES (${guestId}, ${defaultCredits}, NOW())
                    RETURNING credits
                `;
                return NextResponse.json({ credits: newGuest[0].credits });
            } catch (insertError) {
                // If concurrent insert happened, fetch again
                const retryResult = await sql`
                    SELECT credits FROM guest_sessions 
                    WHERE guest_id = ${guestId} 
                    LIMIT 1
                `;
                return NextResponse.json({ credits: retryResult[0]?.credits || defaultCredits });
            }
        }

        return NextResponse.json({ credits: result[0].credits || 0 });

    } catch (error: any) {
        console.error('[API] Error in GET /api/credits/guest:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/credits/guest - Reserve guest credits atomically (or create guest)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { guestId, amount } = body;

        if (!guestId) {
            return NextResponse.json({ error: 'Guest ID required' }, { status: 400 });
        }

        if (!amount || amount <= 0 || amount > 100) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Ensure guest session exists
        const checkGuest = await sql`
            SELECT credits FROM guest_sessions WHERE guest_id = ${guestId} LIMIT 1
        `;

        if (!checkGuest || checkGuest.length === 0) {
            // Create guest with default credits - amount?
            // If they are generating, they need credits. 
            // Default usually 3. If cost is 1, they have 2 left.
            // But if cost > 3, they fail immediately.
            const defaultCredits = 3;
            await sql`
                INSERT INTO guest_sessions (guest_id, credits, last_seen)
                VALUES (${guestId}, ${defaultCredits}, NOW())
            `;
        }

        // Atomically check and deduct credits
        const result = await sql`
            UPDATE guest_sessions 
            SET credits = credits - ${amount}, last_seen = NOW()
            WHERE guest_id = ${guestId} AND credits >= ${amount}
            RETURNING credits
        `;

        if (!result || result.length === 0) {
            // Insufficient credits or user issue
            const currentData = await sql`
                SELECT credits FROM guest_sessions WHERE guest_id = ${guestId} LIMIT 1
            `;

            return NextResponse.json({
                success: false,
                error: 'Insufficient credits',
                current: currentData.length > 0 ? currentData[0].credits : 0,
                required: amount
            }, { status: 402 });
        }

        return NextResponse.json({
            success: true,
            reserved: amount,
            remaining: result[0].credits
        });

    } catch (error: any) {
        console.error('[API] Error in POST /api/credits/guest:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
