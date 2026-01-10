import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/credits - Get current user's credits
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user credits
        // Assuming email is unique, which is standard
        const result = await sql`
            SELECT current_credits FROM users 
            WHERE email = ${session.user.email} 
            LIMIT 1
        `;

        if (!result || result.length === 0) {
            // Should not happen if session exists, but handle fallback
            return NextResponse.json({ credits: 0 });
        }

        return NextResponse.json({ credits: result[0].current_credits || 0 });

    } catch (error: any) {
        console.error('[API] Error in GET /api/credits:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/credits/add - Add credits to user (admin only for others)
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { amount, targetUserId } = body;

        // Validate amount
        if (!amount || amount <= 0 || amount > 1000) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Get current user info to check constraints/permissions
        const currentUserResult = await sql`
            SELECT user_id, role, current_credits 
            FROM users 
            WHERE email = ${session.user.email} 
            LIMIT 1
        `;

        if (!currentUserResult || currentUserResult.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const currentUser = currentUserResult[0];

        // If adding to another user or excessive amount, check admin permission
        // NOTE: The original Supabase code allowed users to add credits to themselves? 
        // Logic was: if targetUserId exists and !== user.id, check admin.
        // If targetUserId is missing or === user.id, it proceeded?
        // This seems to imply a "free daily credit" or similar mechanic if unprotected?
        // But the previous code didn't check for "daily" limit here. 
        // It just checked `amount > 1000`.
        // I will replicate the logic: users can add < 1000 credits to themselves? 
        // This sounds insecure for a public API, but I will maintain parity.
        // Wait, maybe this endpoint is protected by middleware/client logic.

        let targetId = currentUser.user_id;

        if (targetUserId && targetUserId !== currentUser.user_id) {
            // Check if user is admin
            if (currentUser.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            targetId = targetUserId;
        }

        // Add credits using SQL
        // We update and return the new value
        const updateResult = await sql`
            UPDATE users 
            SET current_credits = current_credits + ${amount} 
            WHERE user_id = ${targetId} 
            RETURNING current_credits
        `;

        if (!updateResult || updateResult.length === 0) {
            return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            credits: updateResult[0].current_credits,
            added: amount
        });

    } catch (error: any) {
        console.error('[API] Error in POST /api/credits:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
