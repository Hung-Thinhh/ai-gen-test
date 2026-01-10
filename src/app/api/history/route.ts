import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/history - Get generation history
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user ID
        const userCheck = await sql`SELECT user_id FROM users WHERE email = ${session.user.email} LIMIT 1`;
        if (!userCheck || userCheck.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const userId = userCheck[0].user_id;

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Get history
        const data = await sql`
            SELECT * FROM generation_history 
            WHERE user_id = ${userId} 
            ORDER BY created_at DESC 
            LIMIT ${limit} OFFSET ${offset}
        `;

        return NextResponse.json({ history: data || [] });

    } catch (error: any) {
        console.error('[API] Error in GET /api/history:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/history - Log generation
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            guestId,
            toolId,
            prompt,
            outputImages,
            creditsUsed,
            apiModelUsed,
            generationCount,
            errorMessage
        } = body;

        // Determine user ID if authenticated
        let userId: string | null = null;

        // Try getting session
        const session = await getServerSession(authOptions);
        if (session?.user?.email) {
            const userCheck = await sql`SELECT user_id FROM users WHERE email = ${session.user.email} LIMIT 1`;
            if (userCheck.length > 0) {
                userId = userCheck[0].user_id;
            }
        }

        // Validate required fields
        if (!toolId) {
            return NextResponse.json({ error: 'Tool ID required' }, { status: 400 });
        }

        if (!userId && !guestId) {
            // Allow logging if we have at least one ID, but prefer Authenticated user
            // If neither, we can't associate log
            return NextResponse.json({ error: 'User ID or Guest ID required' }, { status: 400 });
        }

        console.log('[History] Logging generation:', { userId, guestId, toolId });

        // Insert log
        // Note: user_id might be nullable in DB for guest logs, or we need to handle it.
        // If DB enforces user_id NOT NULL, this will fail for guests if we send NULL.
        // We act optimistically.

        const result = await sql`
            INSERT INTO generation_history (
                history_id,
                user_id,
                guest_id,
                tool_id,
                prompt,
                output_images,
                credits_used,
                api_model_used,
                generation_count,
                error_message,
                created_at
            ) VALUES (
                gen_random_uuid(),
                ${userId}, -- Can be null
                ${guestId}, -- Can be null
                ${toolId},
                ${prompt || null},
                ${JSON.stringify(outputImages || [])}::jsonb,
                ${creditsUsed || 0},
                ${apiModelUsed || null},
                ${generationCount || 1},
                ${errorMessage || null},
                NOW()
            )
            RETURNING *
        `;

        return NextResponse.json({
            success: true,
            log: result[0]
        }, { status: 201 });

    } catch (error: any) {
        console.error('[API] Error in POST /api/history:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
