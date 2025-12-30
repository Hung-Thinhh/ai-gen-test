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

        let currentCredits = 0;

        // 3. Check Balance - Don't deduct yet!
        if (isGuest && guestId) {
            let { data: guestData, error: guestError } = await supabaseAdmin
                .from('guest_sessions')
                .select('credits')
                .eq('guest_id', guestId)
                .maybeSingle();

            // If guest doesn't exist, create them with default credits
            if (!guestData && !guestError) {
                console.log('[API DEBUG] New guest detected, creating session:', guestId);
                const defaultCredits = 3; // Default guest credits

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

                guestData = newGuest;
                console.log('[API DEBUG] Guest session created successfully with', defaultCredits, 'credits');
            }

            if (guestError) {
                console.error('[API DEBUG] Guest lookup failed:', guestError);
                return NextResponse.json({
                    error: 'Lỗi khi kiểm tra phiên khách. Vui lòng thử lại.'
                }, { status: 500 });
            }

            currentCredits = guestData?.credits || 0;
        } else if (userId) {
            const { data: userData } = await supabaseAdmin.from('users').select('current_credits').eq('user_id', userId).single();
            currentCredits = userData?.current_credits || 0;
        }

        console.log('[API DEBUG] Current credits:', currentCredits, 'Required:', creditCost);

        // Check if enough credits BEFORE generating
        if (currentCredits < creditCost) {
            console.log('[API DEBUG] INSUFFICIENT_CREDITS - current:', currentCredits, 'required:', creditCost);
            return NextResponse.json(
                { error: 'Bạn đã hết Credit. Vui lòng nạp thêm để tiếp tục.', code: 'INSUFFICIENT_CREDITS' },
                { status: 402 }
            );
        }

        // 5. Generate Image FIRST (before deducting)
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: model || 'gemini-2.5-flash-image',
            contents: { parts },
            config: config
        });

        // 6. Deduct Credits ONLY after successful generation
        // Use RPC for atomic decrement to avoid race conditions with parallel requests
        let updateError = null;
        if (isGuest && guestId) {
            const { error } = await supabaseAdmin.rpc('decrement_guest_credits', {
                p_guest_id: guestId,
                p_amount: creditCost
            });
            updateError = error;
        } else if (userId) {
            const { error } = await supabaseAdmin.rpc('decrement_user_credits', {
                p_user_id: userId,
                p_amount: creditCost
            });
            updateError = error;
        }

        if (updateError) {
            console.error("Failed to deduct credits after generation:", updateError);
            // Note: Image was generated but credit deduction failed
            // User still gets the image, which is acceptable
        }

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
