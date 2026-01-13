import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';
import { getSystemConfig } from '@/lib/postgres/queries';

// Helper function to get guest generation limit from system_configs
async function getGuestGenerationLimit(): Promise<number> {
    try {
        const limit = await getSystemConfig('guest_generation_limit');
        return limit ? parseInt(limit, 10) : 3; // Fallback to 3 if not configured
    } catch (error) {
        console.error('[API] Error fetching guest_generation_limit:', error);
        return 3;
    }
}

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

        // If guest doesn't exist, create with default credits from system_configs
        if (!result || result.length === 0) {
            const defaultCredits = await getGuestGenerationLimit();
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

        let currentCredits = result[0].credits || 0;

        // [INFINITE TRIAL LOGIC]
        // If credits <= 0, refill immediately so UI shows positive balance
        if (currentCredits <= 0) {
            const defaultCredits = await getGuestGenerationLimit();
            await sql`
                UPDATE guest_sessions 
                SET credits = ${defaultCredits}
                WHERE guest_id = ${guestId}
            `;
            currentCredits = defaultCredits;
            console.log(`[API] GET Guest ${guestId}: Refilled to ${defaultCredits} credits`);
        }

        return NextResponse.json({ credits: currentCredits });

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
            const defaultCredits = await getGuestGenerationLimit();
            try {
                await sql`
                    INSERT INTO guest_sessions (guest_id, credits, last_seen)
                    VALUES (${guestId}, ${defaultCredits}, NOW())
                `;
            } catch (e) {
                // Ignore conflict if concurrent insert
            }
        }

        // Atomically check and deduct credits
        let result = await sql`
            UPDATE guest_sessions 
            SET credits = credits - ${amount}, last_seen = NOW()
            WHERE guest_id = ${guestId} AND credits >= ${amount}
            RETURNING credits
        `;

        // [INFINITE TRIAL LOGIC]
        // If insufficient credits, REFILL to default (3) and TRY AGAIN
        if (!result || result.length === 0) {
            console.log(`[API] Guest ${guestId} out of credits. Refilling for Infinite Trial...`);

            // Reset to guest_generation_limit from system_configs
            const defaultCredits = await getGuestGenerationLimit();

            // Refill
            await sql`
                UPDATE guest_sessions 
                SET credits = ${defaultCredits}
                WHERE guest_id = ${guestId}
            `;

            // Retry deduction
            result = await sql`
                UPDATE guest_sessions 
                SET credits = credits - ${amount}, last_seen = NOW()
                WHERE guest_id = ${guestId} AND credits >= ${amount}
                RETURNING credits
            `;

            // If still fails (e.g. amount > default), then error
            if (!result || result.length === 0) {
                const currentData = await sql`
                    SELECT credits FROM guest_sessions WHERE guest_id = ${guestId} LIMIT 1
                `;

                return NextResponse.json({
                    success: false,
                    error: 'Insufficient credits (Refill failed or Request too large)',
                    current: currentData.length > 0 ? currentData[0].credits : 0,
                    required: amount
                }, { status: 402 });
            }
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
