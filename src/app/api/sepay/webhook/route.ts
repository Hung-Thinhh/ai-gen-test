import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';

/**
 * Verify SePay webhook API Key
 * SePay sends API Key in "Authorization" header with format: "Apikey API_KEY"
 */
function verifySePayApiKey(authHeader: string | null): boolean {
    const SEPAY_API_KEY = process.env.SEPAY_API_KEY;

    if (!SEPAY_API_KEY) {
        console.error('[Webhook] SEPAY_API_KEY not configured');
        return false;
    }

    if (!authHeader) {
        console.error('[Webhook] Missing Authorization header');
        return false;
    }

    // Parse Authorization header
    // Format: "Apikey API_KEY_CUA_BAN"
    const parts = authHeader.trim().split(' ');
    if (parts.length !== 2) {
        console.error('[Webhook] Invalid Authorization header format');
        return false;
    }

    const [scheme, apiKey] = parts;

    // Check scheme (case-insensitive)
    if (scheme.toLowerCase() !== 'apikey') {
        console.error('[Webhook] Invalid Authorization scheme:', scheme);
        return false;
    }

    // Constant-time comparison to prevent timing attacks
    try {
        const expectedKey = Buffer.from(SEPAY_API_KEY);
        const receivedKey = Buffer.from(apiKey);

        if (expectedKey.length !== receivedKey.length) {
            return false;
        }

        // Use timing-safe comparison
        const crypto = require('crypto');
        return crypto.timingSafeEqual(expectedKey, receivedKey);
    } catch (error) {
        // Fallback to simple comparison (less secure but works)
        return apiKey === SEPAY_API_KEY;
    }
}

/**
 * SePay Webhook Handler
 * Receives payment notifications from SePay
 */
export async function POST(req: NextRequest) {
    try {
        // Get Authorization header
        const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');

        // Parse SePay webhook payload
        const rawBody = await req.text();
        console.log('[Webhook] Raw body:', rawBody);

        // Verify API Key
        if (!verifySePayApiKey(authHeader)) {
            console.error('[Webhook] Invalid API Key');
            return NextResponse.json(
                { error: 'Unauthorized - Invalid API Key' },
                { status: 401 }
            );
        }

        console.log('[Webhook] API Key verified successfully');

        let sepayPayload;
        try {
            sepayPayload = JSON.parse(rawBody);
        } catch (e) {
            console.error('[Webhook] Failed to parse JSON:', e);
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

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
            console.error('[Webhook] Invalid webhook data:', { content, transferAmount, transferType });
            return NextResponse.json(
                { error: 'Invalid webhook data or not an incoming transfer' },
                { status: 400 }
            );
        }

        // Extract order_id from content
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

        // Check if transaction already processed (idempotency - check any status)
        const existingTx = await sql`
            SELECT id, status, amount FROM payment_transactions
            WHERE transaction_id = ${transaction_id}
            LIMIT 1
        `;

        if (existingTx && existingTx.length > 0) {
            console.log('[Webhook] Transaction already exists:', transaction_id, 'Status:', existingTx[0].status);
            return NextResponse.json({ success: true, message: 'Already processed' });
        }

        // Get pending transaction from database
        let transaction = null;

        // First try exact match
        const exactResult = await sql`
            SELECT * FROM payment_transactions 
            WHERE order_id = ${order_id} 
            LIMIT 1
        `;

        if (exactResult && exactResult.length > 0) {
            transaction = exactResult[0];
        } else {
            // Try normalized match (remove all non-alphanumeric except DUKY)
            const timestampMatch = order_id.match(/\d{13,}/); // Extract timestamp
            if (timestampMatch) {
                console.log('[Webhook] Trying fuzzy match with timestamp:', timestampMatch[0]);
                const fuzzyResult = await sql`
                    SELECT * FROM payment_transactions 
                    WHERE order_id LIKE ${`%${timestampMatch[0]}%`}
                    LIMIT 1
                `;
                if (fuzzyResult && fuzzyResult.length > 0) {
                    transaction = fuzzyResult[0];
                }
            }
        }

        if (!transaction) {
            console.error('[Webhook] Transaction not found for order_id:', order_id);
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        // Verify amount matches expected amount (allow small tolerance for fees)
        const expectedAmount = transaction.amount;
        const tolerance = 1000; // 1000 VND tolerance
        if (Math.abs(amount - expectedAmount) > tolerance) {
            console.error('[Webhook] Amount mismatch:', {
                received: amount,
                expected: expectedAmount,
                order_id
            });
            return NextResponse.json(
                { error: 'Amount mismatch' },
                { status: 400 }
            );
        }

        console.log('[Webhook] Found transaction:', {
            id: transaction.id,
            user_id: transaction.user_id,
            credits: transaction.credits,
            package_id: transaction.package_id,
            current_status: transaction.status
        });

        // Process successful payment
        console.log('[Webhook] Processing successful payment...');

        // Get current user credits
        const userResult = await sql`
            SELECT current_credits, subscription_type, total_spent_vnd 
            FROM users 
            WHERE user_id = ${transaction.user_id} 
            LIMIT 1
        `;

        if (!userResult || userResult.length === 0) {
            console.error('[Webhook] User not found:', transaction.user_id);
            throw new Error('Failed to fetch user');
        }

        const user = userResult[0];
        const currentCredits = user.current_credits || 0;
        const newCredits = currentCredits + (transaction.credits || 0);
        const currentTotalSpent = user.total_spent_vnd || 0;
        const newTotalSpent = currentTotalSpent + (transaction.amount || 0);

        console.log('[Webhook] Updating user:', {
            user_id: transaction.user_id,
            credits_adding: transaction.credits,
            package_id: transaction.package_id,
            new_credits: newCredits,
            new_total_spent: newTotalSpent
        });

        // Update user credits and subscription info
        // Store package_id in subscription_type column as requested
        await sql`
            UPDATE users SET 
                current_credits = ${newCredits},
                total_spent_vnd = ${newTotalSpent},
                subscription_type = ${transaction.package_id},
                updated_at = NOW()
            WHERE user_id = ${transaction.user_id}
        `;

        // Update transaction status
        await sql`
            UPDATE payment_transactions SET
                transaction_id = ${transaction_id},
                status = 'completed',
                payment_method = ${payment_method},
                completed_at = ${new Date().toISOString()},
                sepay_response = ${JSON.stringify(sepayPayload)}
            WHERE id = ${transaction.id}
        `;

        console.log(`✅ [Webhook] Payment completed: ${transaction.credits} credits added to user ${transaction.user_id}`);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Webhook] Processing error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Support GET for webhook verification
export async function GET(req: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        message: 'SePay webhook endpoint is active (Neon)'
    });
}
