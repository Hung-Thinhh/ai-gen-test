import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * POST /api/credits/reserve - Atomically reserve credits before generation
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { amount } = body;

        // Validate amount
        if (!amount || amount <= 0 || amount > 100) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Atomically check and deduct credits
        // Only updates if current_credits >= amount
        const result = await sql`
            UPDATE users 
            SET current_credits = current_credits - ${amount}
            WHERE email = ${session.user.email} AND current_credits >= ${amount}
            RETURNING current_credits
        `;

        // If no rows updated, it means either user not found or insufficient credits
        if (!result || result.length === 0) {
            // Check current credits to provide detailed error
            const userCheck = await sql`
                SELECT current_credits FROM users WHERE email = ${session.user.email} LIMIT 1
            `;

            const currentBalance = userCheck.length > 0 ? userCheck[0].current_credits : 0;

            return NextResponse.json({
                success: false,
                error: 'Insufficient credits',
                current: currentBalance,
                required: amount
            }, { status: 402 });
        }

        const remaining = result[0].current_credits;

        return NextResponse.json({
            success: true,
            reserved: amount,
            remaining: remaining
        });

    } catch (error: any) {
        console.error('[API] Error in POST /api/credits/reserve:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
