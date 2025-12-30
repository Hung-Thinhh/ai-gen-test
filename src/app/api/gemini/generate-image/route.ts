import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Server API Key not configured' },
                { status: 500 }
            );
        }

        // 1. Authenticate User OR Identify Guest
        const authHeader = req.headers.get('Authorization');
        const guestIdHeader = req.headers.get('X-Guest-ID');

        console.log('[API DEBUG] Received headers - Authorization:', authHeader ? 'EXISTS' : 'NULL');
        console.log('[API DEBUG] Received headers - X-Guest-ID:', guestIdHeader ? guestIdHeader : 'NULL');

        let userId: string | null = null;
        let guestId: string | null = null;
        let isGuest = false;

        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
            if (!authError && user) {
                userId = user.id;
            }
        }

        // If not authenticated user, check guest
        if (!userId && guestIdHeader) {
            isGuest = true;
            guestId = guestIdHeader;
        }

        if (!userId && !isGuest) {
            return NextResponse.json({ error: 'Unauthorized: No User Token or Guest ID provided' }, { status: 401 });
        }

        const body = await req.json();
        const { parts, config, model } = body;

        // 2. Get Credit Cost from Header (sent by client based on their globalConfig)
        const creditCostHeader = req.headers.get('x-credit-cost');
        const creditCost = creditCostHeader ? parseInt(creditCostHeader, 10) : 1; // Default to 1 if not provided

        console.log('[API DEBUG] Credit cost from header:', creditCost);
        console.log('[API DEBUG] Model:', model);

        // 3. ATOMIC CREDIT RESERVATION - Reserve credits BEFORE generation
        // This prevents race conditions when generating multiple images in parallel
        let reservationSuccess = false;

        if (isGuest && guestId) {
            // First, ensure guest session exists
            let { data: guestData, error: guestError } = await supabaseAdmin
                .from('guest_sessions')
                .select('credits')
                .eq('guest_id', guestId)
                .maybeSingle();

            // Create guest session if doesn't exist
            if (!guestData && !guestError) {
                console.log('[API DEBUG] New guest detected, creating session:', guestId);
                const defaultCredits = 3;

                const { data: newGuest, error: createError } = await supabaseAdmin
                    .from('guest_sessions')
                    .insert({ guest_id: guestId, credits: defaultCredits })
                    .select('credits')
                    .single();

                if (createError) {
                    console.error('[API DEBUG] Failed to create guest session:', createError);
                    return NextResponse.json({
                        error: 'Không thể tạo phiên khách. Vui lòng thử lại.'
                    }, { status: 500 });
                }

                console.log('[API DEBUG] Guest session created with', defaultCredits, 'credits');
            }

            // Now atomically reserve credits
            const { data, error } = await supabaseAdmin.rpc('reserve_guest_credits', {
                p_guest_id: guestId,
                p_amount: creditCost
            });

            if (error) {
                console.error('[API DEBUG] Failed to reserve guest credits:', error);
                return NextResponse.json({
                    error: 'Lỗi khi đặt trước credits. Vui lòng thử lại.'
                }, { status: 500 });
            }

            reservationSuccess = data;
            console.log('[API DEBUG] Guest credit reservation:', reservationSuccess ? 'SUCCESS' : 'INSUFFICIENT');
        } else if (userId) {
            // Atomically reserve user credits
            const { data, error } = await supabaseAdmin.rpc('reserve_user_credits', {
                p_user_id: userId,
                p_amount: creditCost
            });

            if (error) {
                console.error('[API DEBUG] Failed to reserve user credits:', error);
                return NextResponse.json({
                    error: 'Lỗi khi đặt trước credits. Vui lòng thử lại.'
                }, { status: 500 });
            }

            reservationSuccess = data;
            console.log('[API DEBUG] User credit reservation:', reservationSuccess ? 'SUCCESS' : 'INSUFFICIENT');
        }

        // If reservation failed (insufficient credits), return error
        if (!reservationSuccess) {
            console.log('[API DEBUG] INSUFFICIENT_CREDITS - reservation failed');
            return NextResponse.json(
                { error: 'Bạn đã hết Credit. Vui lòng nạp thêm để tiếp tục.', code: 'INSUFFICIENT_CREDITS' },
                { status: 402 }
            );
        }

        // 4. Generate Image (credits already reserved/deducted)
        console.log('[API DEBUG] Credits reserved successfully, proceeding with generation...');
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: model || 'gemini-2.5-flash-image',
            contents: { parts },
            config: config
        });

        // Credits were already deducted during reservation - no need to deduct again
        console.log('[API DEBUG] Generation successful, credits already deducted during reservation');

        return NextResponse.json(response);

    } catch (error: any) {
        console.error("Server-side Gemini generation error:", error);

        // Return user-friendly error messages
        let userMessage = 'Đã xảy ra lỗi khi tạo ảnh. Vui lòng thử lại.';

        if (error.message?.includes('safety') || error.message?.includes('blocked')) {
            userMessage = 'Nội dung bị chặn vì vi phạm chính sách an toàn. Vui lòng thử prompt khác.';
        } else if (error.message?.includes('quota') || error.message?.includes('429')) {
            userMessage = 'Hệ thống đang quá tải. Vui lòng thử lại sau.';
        }

        return NextResponse.json(
            { error: userMessage },
            { status: 500 }
        );
    }
}
