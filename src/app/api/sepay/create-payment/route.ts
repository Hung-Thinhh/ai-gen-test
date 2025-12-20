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

        // 7. Call SePay API to create payment
        const sepayApiKey = process.env.SEPAY_API_KEY;
        const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?order_id=${orderId}`;
        const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/cancel?order_id=${orderId}`;
        const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sepay/webhook`;

        // If no API key configured, use mock payment URL for testing
        if (!sepayApiKey) {
            console.log('[SePay] API key not configured, using mock payment URL for testing');
            const mockPaymentUrl = `https://sandbox.sepay.vn/payment?order_id=${orderId}&amount=${selectedPackage.price}&credits=${selectedPackage.credits}`;

            console.log('[SePay] Mock Payment URL:', mockPaymentUrl);

            return NextResponse.json({
                success: true,
                payment_url: mockPaymentUrl,
                order_id: orderId
            } as CreatePaymentResponse);
        }

        // Prepare SePay request
        const sepayRequest = {
            amount: selectedPackage.price,
            order_id: orderId,
            return_url: returnUrl,
            cancel_url: cancelUrl,
            notify_url: webhookUrl,
            buyer_email: '', // Will be filled if available
            description: `Mua ${selectedPackage.credits} credits - ${selectedPackage.name}`
        };

        console.log('[SePay] API Request:', { ...sepayRequest, notify_url: '***' });

        // Call real SePay API with browser-like headers to bypass Cloudflare
        try {
            const sepayResponse = await fetch('https://my.sepay.vn/userapi/transactions/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sepayApiKey}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Origin': 'https://dukyai.com',
                    'Referer': 'https://dukyai.com/',
                    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'cross-site'
                },
                body: JSON.stringify(sepayRequest)
            });

            console.log('[SePay] Response status:', sepayResponse.status);

            if (!sepayResponse.ok) {
                const errorText = await sepayResponse.text();
                console.error('[SePay] API error:', errorText);

                // DISABLED: Fallback to mock URL (user wants to see real errors)
                /*
                if (sepayResponse.status === 403 && errorText.includes('Cloudflare')) {
                    console.warn('[SePay] ⚠️ Cloudflare blocked the request. Using mock URL for testing.');
                    console.warn('[SePay] 💡 Solution: Contact SePay support to whitelist your server IP.');
                    
                    const mockPaymentUrl = `https://sandbox.sepay.vn/payment?order_id=${orderId}&amount=${selectedPackage.price}&credits=${selectedPackage.credits}`;
                    
                    return NextResponse.json({
                        success: true,
                        payment_url: mockPaymentUrl,
                        order_id: orderId,
                        warning: 'Using mock URL - SePay API blocked by Cloudflare'
                    } as CreatePaymentResponse);
                }
                */

                throw new Error(`SePay API failed with status ${sepayResponse.status}`);
            }

            const sepayData = await sepayResponse.json();
            console.log('[SePay] API Response:', sepayData);

            return NextResponse.json({
                success: true,
                payment_url: sepayData.data?.payment_url || sepayData.payment_url,
                order_id: orderId
            } as CreatePaymentResponse);
        } catch (error) {
            console.error('[SePay] API call failed:', error);

            // DISABLED: Fallback for testing real errors
            /*
            if (error instanceof Error && (error.message.includes('403') || error.message.includes('Cloudflare'))) {
                console.warn('[SePay] Falling back to mock payment URL due to Cloudflare protection');
                const mockPaymentUrl = `https://sandbox.sepay.vn/payment?order_id=${orderId}&amount=${selectedPackage.price}&credits=${selectedPackage.credits}`;
                
                return NextResponse.json({
                    success: true,
                    payment_url: mockPaymentUrl,
                    order_id: orderId,
                    warning: 'Using mock URL - please contact SePay support'
                } as CreatePaymentResponse);
            }
            */

            throw error;
        }

    } catch (error) {
        console.error('[SePay] Payment creation error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Payment creation failed'
            } as CreatePaymentResponse,
            { status: 500 }
        );
    }
}
