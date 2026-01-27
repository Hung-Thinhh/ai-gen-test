import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';
import type { CreatePaymentRequest, CreatePaymentResponse } from '@/types/payment';

export async function POST(req: NextRequest) {
    try {
        const body: CreatePaymentRequest = await req.json();
        const { packageId, userId } = body;

        console.log('[SePay] Creating payment for package:', packageId, 'user:', userId);

        // 0. Cleanup expired pending transactions (older than 10 minutes)
        try {
            const cleanupCount = await sql`
                DELETE FROM payment_transactions 
                WHERE status = 'pending' 
                AND created_at < (NOW() - INTERVAL '10 minutes')
            `;
            if (cleanupCount && cleanupCount.length > 0) {
                console.log(`[SePay] Cleaned up ${cleanupCount.length} expired pending transactions`);
            }
        } catch (cleanupError) {
            console.error('[SePay] Cleanup error (non-fatal):', cleanupError);
            // We continue even if cleanup fails to not block new payments
        }

        // 1. Validate input
        if (!packageId || !userId) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' } as CreatePaymentResponse,
                { status: 400 }
            );
        }

        // 2. Verify user session (skip in dev mode for test users)
        const isDev = process.env.NODE_ENV === 'development';
        const isTestUser = userId.startsWith('test-user-');

        if (!isDev || !isTestUser) {
            const authHeader = req.headers.get('authorization');
            if (!authHeader) {
                return NextResponse.json(
                    { success: false, error: 'Unauthorized' } as CreatePaymentResponse,
                    { status: 401 }
                );
            }
        } else {
            console.log('[SePay] DEV MODE: Using test user ID:', userId);
        }

        // 3. Get package details from Database
        // Check if packageId is purely numeric
        const isNumericId = /^\d+$/.test(String(packageId));
        let selectedPackage = null;

        if (isNumericId) {
            const result = await sql`
                SELECT * FROM packages 
                WHERE package_key = ${packageId} OR id = ${packageId}
                LIMIT 1
             `;
            if (result.length > 0) selectedPackage = result[0];
        } else {
            const result = await sql`
                SELECT * FROM packages 
                WHERE package_key = ${packageId}
                LIMIT 1
             `;
            if (result.length > 0) selectedPackage = result[0];
        }

        if (!selectedPackage) {
            console.error('[SePay] Package not found:', packageId);
            return NextResponse.json(
                { success: false, error: 'Invalid package' } as CreatePaymentResponse,
                { status: 400 }
            );
        }

        // 4. Skip payment for free packages
        if (selectedPackage.package_key === 'free' || Number(selectedPackage.price_vnd) === 0) {
            return NextResponse.json(
                { success: false, error: 'This package does not require payment' } as CreatePaymentResponse,
                { status: 400 }
            );
        }

        let price = Number(selectedPackage.price_vnd);
        if (!price || price <= 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid package price' } as CreatePaymentResponse,
                { status: 400 }
            );
        }

        // 4.5. DEV MODE: Override price to 2000 VND for all paid packages
        if (isDev) {
            console.log(`[SePay] DEV MODE: Overriding price from ${price} to 2000 VND`);
            price = 2000;
        }

        // 5. Create unique order ID
        const timestamp = Date.now();
        const userShort = userId.substring(0, 8);
        const orderId = `DUKY_${timestamp}_${userShort}`;

        console.log('[SePay] Generated order ID:', orderId);

        // 6. Create test user in database if in dev mode
        if (isDev && isTestUser) {
            console.log('[SePay] DEV MODE: Checking if test user exists...');

            const existingUser = await sql`
                SELECT user_id FROM users WHERE user_id = ${userId} LIMIT 1
            `;

            if (existingUser.length === 0) {
                console.log('[SePay] DEV MODE: Creating test user in database...');
                try {
                    await sql`
                        INSERT INTO users (
                            user_id, user_type, email, display_name, 
                            current_credits, role, is_active, created_at
                        ) VALUES (
                            ${userId}, 'registered', ${`${userId}@test.dev`}, 
                            'Test User (Dev Mode)', 100, 'user', true, NOW()
                        )
                    `;
                    console.log('[SePay] ✅ Test user created successfully!');
                } catch (userCreateError: any) {
                    console.error('[SePay] Failed to create test user:', userCreateError);
                    return NextResponse.json(
                        { success: false, error: `Test user creation failed` } as CreatePaymentResponse,
                        { status: 500 }
                    );
                }
            } else {
                console.log('[SePay] Test user already exists');
            }
        }

        // 7. Create pending transaction in database
        // Need to generate UUID for transaction PK since Neon doesn't always auto-gen if not configured? 
        // Or assume table has gen_random_uuid() default? 
        // Schema says: id uuid NOT NULL. Usually needs default or explicit value.
        // I will use gen_random_uuid() in SQL.

        const transactionResult = await sql`
            INSERT INTO payment_transactions (
                id,
                user_id,
                order_id,
                package_id,
                amount,
                credits,
                status,
                transaction_id,
                created_at
            ) VALUES (
                gen_random_uuid(),
                ${userId},
                ${orderId},
                ${packageId},
                ${price},
                ${selectedPackage.credits_included || 0},
                'pending',
                ${`PENDING_${timestamp}`}, -- Temporary transaction_id, updated on webhook
                NOW()
            )
            RETURNING id
        `;

        if (!transactionResult || transactionResult.length === 0) {
            console.error('[SePay] Database insert error');
            return NextResponse.json(
                { success: false, error: 'Failed to create transaction' } as CreatePaymentResponse,
                { status: 500 }
            );
        }

        console.log('[SePay] Transaction created:', transactionResult[0].id);

        // 7. Generate VA Payment Info (VietQR)
        const vaAccount = process.env.SEPAY_VA_ACCOUNT || '02627122301';
        const vaBankCode = process.env.SEPAY_VA_BANK_CODE || '970423';
        const vaName = process.env.SEPAY_VA_NAME || 'TRAN THANH NGAN';
        const vaBank = process.env.SEPAY_VA_BANK || 'TPBank';
        const vaPrefix = process.env.SEPAY_VA_PREFIX || 'TKP102';

        // Generate payment content (nội dung chuyển khoản)
        const paymentContent = `${vaPrefix} ${orderId}`;

        // Generate VietQR link  
        const qrUrl = `https://qr.sepay.vn/img?acc=${vaAccount}&bank=${vaBankCode}&amount=${price}&des=${encodeURIComponent(paymentContent)}`;

        console.log('[SePay VA] Generated QR URL:', qrUrl);

        return NextResponse.json({
            success: true,
            payment_type: 'VA',
            qr_url: qrUrl,
            bank_info: {
                bank: vaBank,
                bank_code: vaBankCode,
                account: vaAccount,
                name: vaName,
                amount: price,
                content: paymentContent
            },
            order_id: orderId,
            expires_in: 600 // 10 minutes
        } as CreatePaymentResponse);

    } catch (error: any) {
        console.error('[SePay] Payment creation error:', error);

        const errorMessage = error.message || 'Payment creation failed';
        const isCloudflareError = errorMessage.includes('403') || errorMessage.includes('Cloudflare');

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                details: isCloudflareError ? {
                    type: 'CLOUDFLARE_BLOCKED',
                    message: 'SePay API blocked',
                    solution: 'Contact support checked IP',
                    timestamp: new Date().toISOString()
                } : undefined
            } as CreatePaymentResponse,
            { status: 500 }
        );
    }
}
