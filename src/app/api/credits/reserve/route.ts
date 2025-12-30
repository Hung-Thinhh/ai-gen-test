import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

/**
 * POST /api/credits/reserve - Atomically reserve credits before generation
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
        const { amount } = body;

        // Validate amount
        if (!amount || amount <= 0 || amount > 100) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Try atomic reservation using RPC function
        const { data, error } = await supabaseAdmin.rpc('reserve_user_credits', {
            p_user_id: user.id,
            p_amount: amount
        });

        if (error) {
            // Check if function doesn't exist, fallback to manual check
            if (error.message?.includes('function') || error.code === '42883') {
                console.warn('[API] reserve_user_credits function not found, using fallback');

                // Manual check and deduct
                const { data: userData } = await supabaseAdmin
                    .from('users')
                    .select('current_credits')
                    .eq('user_id', user.id)
                    .single();

                const currentCredits = userData?.current_credits || 0;

                if (currentCredits < amount) {
                    return NextResponse.json({
                        success: false,
                        error: 'Insufficient credits',
                        current: currentCredits,
                        required: amount
                    }, { status: 402 });
                }

                // Deduct credits
                await supabaseAdmin
                    .from('users')
                    .update({ current_credits: currentCredits - amount })
                    .eq('user_id', user.id);

                return NextResponse.json({
                    success: true,
                    reserved: amount,
                    remaining: currentCredits - amount
                });
            }

            console.error('[API] Error reserving credits:', error);
            return NextResponse.json({ error: 'Failed to reserve credits' }, { status: 500 });
        }

        // RPC function returned boolean
        if (!data) {
            // Get current credits for error message
            const { data: userData } = await supabaseAdmin
                .from('users')
                .select('current_credits')
                .eq('user_id', user.id)
                .single();

            return NextResponse.json({
                success: false,
                error: 'Insufficient credits',
                current: userData?.current_credits || 0,
                required: amount
            }, { status: 402 });
        }

        // Get updated credits
        const { data: userData } = await supabaseAdmin
            .from('users')
            .select('current_credits')
            .eq('user_id', user.id)
            .single();

        return NextResponse.json({
            success: true,
            reserved: amount,
            remaining: userData?.current_credits || 0
        });

    } catch (error: any) {
        console.error('[API] Error in POST /api/credits/reserve:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
