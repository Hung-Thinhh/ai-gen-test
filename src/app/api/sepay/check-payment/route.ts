import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role for admin operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get('order_id');

        if (!orderId) {
            return NextResponse.json(
                { success: false, error: 'Missing order_id' },
                { status: 400 }
            );
        }

        console.log('[Check Payment] Checking status for order:', orderId);

        // Query transaction from database
        const { data: transaction, error } = await supabaseAdmin
            .from('payment_transactions')
            .select('*')
            .eq('order_id', orderId)
            .single();

        if (error) {
            console.error('[Check Payment] Database error:', error);
            return NextResponse.json(
                { success: false, error: 'Transaction not found' },
                { status: 404 }
            );
        }

        console.log('[Check Payment] Transaction status:', transaction.status);

        return NextResponse.json({
            success: true,
            status: transaction.status,
            amount: transaction.amount,
            credits: transaction.credits,
            created_at: transaction.created_at,
            completed_at: transaction.completed_at
        });

    } catch (error) {
        console.error('[Check Payment] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Check payment failed'
            },
            { status: 500 }
        );
    }
}
