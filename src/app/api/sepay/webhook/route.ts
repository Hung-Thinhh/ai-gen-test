import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * SePay Webhook Handler
 * Receives payment notifications from SePay
 * 
 * SePay sends data in this format:
 * {
 *   "id": 92704,
 *   "gateway": "Vietcombank",
 *   "transactionDate": "2023-03-25 14:02:37",
 *   "accountNumber": "0123499999",
 *   "code": null,
 *   "content": "TKP102 DUKY_1766211544386_test-use",
 *   "transferType": "in",
 *   "transferAmount": 2277000,
 *   "accumulated": 19077000,
 *   "subAccount": null,
 *   "referenceCode": "MBVCB.3278907687",
 *   "description": ""
 * }
 */
export async function POST(req: NextRequest) {
    try {
        // Parse SePay webhook payload
        const rawBody = await req.text();
        console.log('[Webhook] Raw body:', rawBody);

        const sepayPayload = JSON.parse(rawBody);
        console.log('[Webhook] SePay payload:', sepayPayload);

        // Extract data from SePay format
        const {
            id: sepayTransactionId,
            content,
            transferAmount,
            transferType,
            gateway,
            transactionDate
        } = sepayPayload;

        console.log('[Webhook] Extracted:', {
            sepayTransactionId,
            content,
            transferAmount,
            transferType
        });

        // Validate: Must be incoming transfer with content
        if (!content || !transferAmount || transferType !== 'in') {
            console.error('[Webhook] Invalid webhook data:', {
                content,
                transferAmount,
                transferType
            });
            return NextResponse.json(
                { error: 'Invalid webhook data or not an incoming transfer' },
                { status: 400 }
            );
        }

        // Extract order_id from content
        // Format examples:
        // - With underscore: "TKP102 DUKY_1766211816252_test-use"
        // - Without underscore: "TKP102 DUKY1766211816252testuse"
        const orderIdMatch = content.match(/DUKY[_]?\d+[_]?[\w-]+/);
        if (!orderIdMatch) {
            console.error('[Webhook] Could not extract order_id from content:', content);
            return NextResponse.json(
                { error: 'Order ID not found in transfer content' },
                { status: 400 }
            );
        }

        const order_id = orderIdMatch[0];
        const transaction_id = `SEPAY_${sepayTransactionId}`;
        const amount = transferAmount;
        const payment_method = gateway || 'Bank Transfer';

        console.log('[Webhook] Parsed notification:', {
            order_id,
            transaction_id,
            amount,
            payment_method
        });

        // Check if transaction already processed (idempotency)
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

        // Get transaction from database
        // Try both formats: with and without underscores
        let transaction, fetchError;

        // First try exact match
        const exactResult = await supabaseAdmin
            .from('payment_transactions')
            .select('*')
            .eq('order_id', order_id)
            .single();

        if (!exactResult.error && exactResult.data) {
            transaction = exactResult.data;
            fetchError = null;
        } else {
            // Try normalized match (remove all non-alphanumeric except DUKY)
            // Search for pattern DUKY + timestamp + suffix
            const timestampMatch = order_id.match(/\d{13,}/); // Extract timestamp

            if (timestampMatch) {
                console.log('[Webhook] Trying fuzzy match with timestamp:', timestampMatch[0]);

                const fuzzyResult = await supabaseAdmin
                    .from('payment_transactions')
                    .select('*')
                    .like('order_id', `%${timestampMatch[0]}%`)
                    .single();

                transaction = fuzzyResult.data;
                fetchError = fuzzyResult.error;
            } else {
                transaction = null;
                fetchError = exactResult.error;
            }
        }

        if (fetchError || !transaction) {
            console.error('[Webhook] Transaction not found for order_id:', order_id);
            console.error('[Webhook] Database error:', fetchError);
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

        // Process successful payment (transferType === 'in' means money received)
        console.log('[Webhook] Processing successful payment...');

        // Get current user credits
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

        // Update user credits
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ current_credits: newCredits })
            .eq('user_id', transaction.user_id);

        if (updateError) {
            console.error('[Webhook] Error updating credits:', updateError);
            throw new Error('Failed to update credits');
        }

        // Update transaction status (use transaction.id since order_id format may differ)
        const { error: txUpdateError } = await supabaseAdmin
            .from('payment_transactions')
            .update({
                transaction_id: transaction_id,
                status: 'completed',
                payment_method: payment_method,
                completed_at: new Date().toISOString(),
                sepay_response: sepayPayload
            })
            .eq('id', transaction.id); // Use transaction.id instead of order_id!

        if (txUpdateError) {
            console.error('[Webhook] Error updating transaction:', txUpdateError);
            throw new Error('Failed to update transaction');
        }

        console.log(`✅ [Webhook] Payment completed: ${transaction.credits} credits added to user ${transaction.user_id}`);

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

// Support GET for webhook verification
export async function GET(req: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        message: 'SePay webhook endpoint is active'
    });
}
