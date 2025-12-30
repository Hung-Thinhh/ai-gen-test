import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

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
        const { data, error } = await supabaseAdmin
            .from('guest_sessions')
            .select('credits')
            .eq('guest_id', guestId)
            .maybeSingle();

        if (error) {
            console.error('[API] Error fetching guest credits:', error);
            return NextResponse.json({ credits: 0 });
        }

        // If guest doesn't exist, create with default credits
        if (!data) {
            const defaultCredits = 3;
            const { data: newGuest, error: createError } = await supabaseAdmin
                .from('guest_sessions')
                .insert({ guest_id: guestId, credits: defaultCredits })
                .select('credits')
                .single();

            if (createError) {
                console.error('[API] Error creating guest session:', createError);
                return NextResponse.json({ credits: 0 });
            }

            return NextResponse.json({ credits: newGuest?.credits || defaultCredits });
        }

        return NextResponse.json({ credits: data?.credits || 0 });

    } catch (error: any) {
        console.error('[API] Error in GET /api/credits/guest:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/credits/guest/reserve - Reserve guest credits atomically
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
        const { data: guestData } = await supabaseAdmin
            .from('guest_sessions')
            .select('credits')
            .eq('guest_id', guestId)
            .maybeSingle();

        if (!guestData) {
            // Create guest with default credits
            const defaultCredits = 3;
            await supabaseAdmin
                .from('guest_sessions')
                .insert({ guest_id: guestId, credits: defaultCredits });
        }

        // Try atomic reservation
        const { data, error } = await supabaseAdmin.rpc('reserve_guest_credits', {
            p_guest_id: guestId,
            p_amount: amount
        });

        if (error) {
            // Fallback if function doesn't exist
            if (error.message?.includes('function') || error.code === '42883') {
                const { data: currentData } = await supabaseAdmin
                    .from('guest_sessions')
                    .select('credits')
                    .eq('guest_id', guestId)
                    .single();

                const currentCredits = currentData?.credits || 0;

                if (currentCredits < amount) {
                    return NextResponse.json({
                        success: false,
                        error: 'Insufficient credits',
                        current: currentCredits,
                        required: amount
                    }, { status: 402 });
                }

                await supabaseAdmin
                    .from('guest_sessions')
                    .update({ credits: currentCredits - amount })
                    .eq('guest_id', guestId);

                return NextResponse.json({
                    success: true,
                    reserved: amount,
                    remaining: currentCredits - amount
                });
            }

            console.error('[API] Error reserving guest credits:', error);
            return NextResponse.json({ error: 'Failed to reserve credits' }, { status: 500 });
        }

        if (!data) {
            const { data: currentData } = await supabaseAdmin
                .from('guest_sessions')
                .select('credits')
                .eq('guest_id', guestId)
                .single();

            return NextResponse.json({
                success: false,
                error: 'Insufficient credits',
                current: currentData?.credits || 0,
                required: amount
            }, { status: 402 });
        }

        const { data: updatedData } = await supabaseAdmin
            .from('guest_sessions')
            .select('credits')
            .eq('guest_id', guestId)
            .single();

        return NextResponse.json({
            success: true,
            reserved: amount,
            remaining: updatedData?.credits || 0
        });

    } catch (error: any) {
        console.error('[API] Error in POST /api/credits/guest/reserve:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
