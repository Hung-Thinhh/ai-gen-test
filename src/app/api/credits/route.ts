import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/credits - Get current user's credits
 */
export async function GET(req: NextRequest) {
    try {
        // Get auth token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Get user credits
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('current_credits')
            .eq('user_id', user.id)
            .single();

        if (error) {
            console.error('[API] Error fetching credits:', error);
            return NextResponse.json({ credits: 0 });
        }

        return NextResponse.json({ credits: data?.current_credits || 0 });

    } catch (error: any) {
        console.error('[API] Error in GET /api/credits:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/credits/add - Add credits to user (admin or purchase)
 */
export async function POST(req: NextRequest) {
    try {
        // Get auth token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await req.json();
        const { amount, targetUserId } = body;

        // Validate amount
        if (!amount || amount <= 0 || amount > 1000) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // If adding to another user, check admin permission
        const userId = targetUserId || user.id;
        if (targetUserId && targetUserId !== user.id) {
            const { data: userData } = await supabaseAdmin
                .from('users')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (userData?.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        // Add credits
        const { data, error } = await supabaseAdmin
            .from('users')
            .update({
                current_credits: supabaseAdmin.rpc('increment', { x: amount })
            })
            .eq('user_id', userId)
            .select('current_credits')
            .single();

        if (error) {
            console.error('[API] Error adding credits:', error);
            return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            credits: data?.current_credits,
            added: amount
        });

    } catch (error: any) {
        console.error('[API] Error in POST /api/credits/add:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
