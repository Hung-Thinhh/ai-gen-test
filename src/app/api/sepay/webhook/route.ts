import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import type { SepayWebhookPayload } from '@/types/payment';

// Create Supabase client with service role
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Verify SePay webhook signature
 */
function verifySignature(payload: any, signature: string): boolean {
    const secretKey = process.env.SEPAY_SECRET_KEY;
    if (!secretKey) {
        console.warn('[Webhook] Secret key not configured, skipping signature verification');
        return true; // Allow in development
    }

    try {
        const data = JSON.stringify(payload);
        const hash = crypto
            .createHmac('sha256', secretKey)
            .update(data)
            .digest('hex');

        return hash === signature;
    } catch (error) {
        console.error('[Webhook] Signature verification error:', error);
        return false;
    }
}

/**
 * SePay Webhook Handler
 * Receives payment notifications from SePay
 */
export async function POST(req: NextRequest) {
    try {
        const body: SepayWebhookPayload = await req.json();
        const signature = req.headers.get('X-Sepay-Signature') || req.headers.get('x-sepay-signature') || '';

        console.log('[Webhook] Received notification:', {
            order_id: body.order_id,
            transaction_id: body.transaction_id,
            status: body.status,
            amount: body.amount
        });

        // 1. Verify signature (skip in development)
        if (process.env.NODE_ENV === 'production' && !verifySignature(body, signature)) {
            console.error('[Webhook] Invalid signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        const { transaction_id, order_id, amount, status, payment_method } = body;

        if (!order_id || !status) {
            console.error('[Webhook] Missing required fields');
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 2. Check if transaction already processed (idempotency)
        if (transaction_id) {
            const { data: existingTx } = await supabaseAdmin
                .from('payment_transactions')
                .select('*')
                .eq('transaction_id', transaction_id)
                .eq('status', 'completed')
                .single();

            if (existingTx) {
                console.log('[Webhook] Transaction already processed:', transaction_id);
                return NextResponse.json({ success: true, message: 'Already processed' });
            }
        }

        // 3. Get transaction from database
        const { data: transaction, error: fetchError } = await supabaseAdmin
            .from('payment_transactions')
            .select('*')
            .eq('order_id', order_id)
            .single();

        if (fetchError || !transaction) {
            console.error('[Webhook] Transaction not found:', order_id, fetchError);
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        console.log('[Webhook] Found transaction:', {
            id: transaction.id,
            user_id: transaction.user_id,
            credits: transaction.credits,
            current_status: transaction.status
        });

        // 4. Process based on payment status
        if (status === 'success' || status === 'completed') {
            console.log('[Webhook] Processing successful payment...');

            // 4.1. Get current user credits
            const { data: user, error: userError } = await supabaseAdmin
                .from('users')
                .select('current_credits')
                .eq('user_id', transaction.user_id)
                .single();

            if (userError) {
                console.error('[Webhook] Error fetching user:', userError);
                throw new Error('Failed to fetch user');
            }

            const currentCredits = user?.current_credits || 0;
            const newCredits = currentCredits + transaction.credits;

            console.log('[Webhook] Updating credits:', {
                current: currentCredits,
                adding: transaction.credits,
                new: newCredits
            });

            // 4.2. Update user credits
            const { error: updateError } = await supabaseAdmin
                .from('users')
                .update({ current_credits: newCredits })
                .eq('user_id', transaction.user_id);

            if (updateError) {
                console.error('[Webhook] Error updating credits:', updateError);
                throw new Error('Failed to update credits');
            }

            // 4.3. Update transaction status
            const { error: txUpdateError } = await supabaseAdmin
                .from('payment_transactions')
                .update({
                    transaction_id: transaction_id || `TX_${Date.now()}`,
                    status: 'completed',
                    payment_method: payment_method,
                    completed_at: new Date().toISOString(),
                    sepay_response: body
                })
                .eq('order_id', order_id);

            if (txUpdateError) {
                console.error('[Webhook] Error updating transaction:', txUpdateError);
                throw new Error('Failed to update transaction');
            }

            console.log(`✅ [Webhook] Payment completed: ${transaction.credits} credits added to user ${transaction.user_id}`);

        } else if (status === 'failed' || status === 'cancelled' || status === 'cancel') {
            console.log('[Webhook] Processing failed/cancelled payment...');

            // Mark transaction as failed/cancelled
            const newStatus = status === 'failed' ? 'failed' : 'cancelled';

            const { error: txUpdateError } = await supabaseAdmin
                .from('payment_transactions')
                .update({
                    transaction_id: transaction_id || `TX_${Date.now()}`,
                    status: newStatus,
                    payment_method: payment_method,
                    sepay_response: body
                })
                .eq('order_id', order_id);

            if (txUpdateError) {
                console.error('[Webhook] Error updating transaction:', txUpdateError);
            }

            console.log(`❌ [Webhook] Payment ${newStatus}:`, order_id);
        } else {
            console.log('[Webhook] Unknown status:', status);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[Webhook] Processing error:', error);
        return NextResponse.json(
            {
                error: 'Webhook processing failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Also support GET for webhook verification
export async function GET(req: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        message: 'SePay webhook endpoint is active'
    });
}
