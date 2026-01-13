import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';

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
        const result = await sql`
            SELECT * FROM payment_transactions 
            WHERE order_id = ${orderId} 
            LIMIT 1
        `;

        if (!result || result.length === 0) {
            console.error('[Check Payment] Transaction not found:', orderId);
            return NextResponse.json(
                { success: false, error: 'Transaction not found' },
                { status: 404 }
            );
        }

        const transaction = result[0];
        console.log('[Check Payment] Transaction status:', transaction.status);

        return NextResponse.json({
            success: true,
            status: transaction.status,
            amount: transaction.amount,
            credits: transaction.credits,
            created_at: transaction.created_at,
            completed_at: transaction.completed_at
        });

    } catch (error: any) {
        console.error('[Check Payment] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Check payment failed'
            },
            { status: 500 }
        );
    }
}
