import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PRICING_PACKAGES } from '@/types/payment';
import type { CreatePaymentRequest, CreatePaymentResponse } from '@/types/payment';

// Create Supabase client with service role for admin operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const body: CreatePaymentRequest = await req.json();
        const { packageId, userId } = body;

        console.log('[SePay] Creating payment for package:', packageId, 'user:', userId);

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

        // 3. Get package details
        const selectedPackage = PRICING_PACKAGES.find(p => p.id === packageId);
        if (!selectedPackage) {
            return NextResponse.json(
                { success: false, error: 'Invalid package' } as CreatePaymentResponse,
                { status: 400 }
            );
        }

        // 4. Skip payment for free and enterprise packages
        if (selectedPackage.id === 'free' || selectedPackage.id === 'enterprise') {
            return NextResponse.json(
                { success: false, error: 'This package does not require payment' } as CreatePaymentResponse,
                { status: 400 }
            );
        }

        // 5. Create unique order ID
        const timestamp = Date.now();
        const userShort = userId.substring(0, 8);
        const orderId = `DUKY_${timestamp}_${userShort}`;

        console.log('[SePay] Generated order ID:', orderId);

        // 6. Create test user in database if in dev mode and user doesn't exist
        if (isDev && isTestUser) {
            console.log('[SePay] DEV MODE: Checking if test user exists...');

            const { data: existingUser } = await supabaseAdmin
                .from('users')
                .select('user_id')
                .eq('user_id', userId)
                .single();

            if (!existingUser) {
                console.log('[SePay] DEV MODE: Creating test user in database...');

                const { error: userCreateError } = await supabaseAdmin
                    .from('users')
                    .insert({
                        user_id: userId,
                        user_type: 'registered', // REQUIRED field
                        email: `${userId}@test.dev`,
                        display_name: 'Test User (Dev Mode)',
                        current_credits: 100,
                        role: 'user',
                        is_active: true,
                        created_at: new Date().toISOString()
                    });

                if (userCreateError) {
                    console.error('[SePay] Failed to create test user:', userCreateError);
                    return NextResponse.json(
                        { success: false, error: `Test user creation failed: ${userCreateError.message}` } as CreatePaymentResponse,
                        { status: 500 }
                    );
                } else {
                    console.log('[SePay] ✅ Test user created successfully!');
                }
            } else {
                console.log('[SePay] Test user already exists');
            }
        }

        // 7. Create pending transaction in database
        const { data: transaction, error: insertError } = await supabaseAdmin
            .from('payment_transactions')
            .insert({
                user_id: userId,
                order_id: orderId,
                package_id: packageId,
                amount: selectedPackage.price,
                credits: selectedPackage.credits,
                status: 'pending'
            })
            .select()
            .single();

        if (insertError) {
            console.error('[SePay] Database insert error:', insertError);
            return NextResponse.json(
                { success: false, error: 'Failed to create transaction' } as CreatePaymentResponse,
                { status: 500 }
            );
        }

        console.log('[SePay] Transaction created:', transaction.id);

        // 7. Generate VA Payment Info (VietQR)
        const vaAccount = process.env.SEPAY_VA_ACCOUNT || '02627122301';
        const vaBankCode = process.env.SEPAY_VA_BANK_CODE || '970423';
        const vaName = process.env.SEPAY_VA_NAME || 'TRAN THANH NGAN';
        const vaBank = process.env.SEPAY_VA_BANK || 'TPBank';
        const vaPrefix = process.env.SEPAY_VA_PREFIX || 'TKP102';

        // Generate payment content (nội dung chuyển khoản)
        const paymentContent = `${vaPrefix} ${orderId}`;

        // Generate VietQR link  
        const qrUrl = `https://qr.sepay.vn/img?acc=${vaAccount}&bank=${vaBankCode}&amount=${selectedPackage.price}&des=${encodeURIComponent(paymentContent)}`;

        console.log('[SePay VA] Generated QR URL:', qrUrl);
        console.log('[SePay VA] Payment content:', paymentContent);

        return NextResponse.json({
            success: true,
            payment_type: 'VA',
            qr_url: qrUrl,
            bank_info: {
                bank: vaBank,
                bank_code: vaBankCode,
                account: vaAccount,
                name: vaName,
                amount: selectedPackage.price,
                content: paymentContent
            },
            order_id: orderId,
            expires_in: 600 // 10 minutes
        } as CreatePaymentResponse);

    } catch (error) {
        console.error('[SePay] Payment creation error:', error);

        // Build detailed error response for client debugging
        const errorMessage = error instanceof Error ? error.message : 'Payment creation failed';
        const isCloudflareError = errorMessage.includes('403') || errorMessage.includes('Cloudflare');

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                details: isCloudflareError ? {
                    type: 'CLOUDFLARE_BLOCKED',
                    message: 'SePay API is protected by Cloudflare and blocking the request',
                    solution: 'Contact support@sepay.vn to whitelist server IP: 115.77.125.6',
                    timestamp: new Date().toISOString()
                } : undefined
            } as CreatePaymentResponse,
            { status: 500 }
        );
    }
}
