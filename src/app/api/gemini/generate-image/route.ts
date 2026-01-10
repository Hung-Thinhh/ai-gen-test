import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
// import { supabaseAdmin } from '@/lib/supabase/client';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

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

        // 1. Authenticate User (NextAuth Only)
        // [MODIFIED] Supabase Auth Token check removed per request.

        console.log('[API DEBUG] Checking NextAuth session...');
        const session = await getServerSession(authOptions);

        if (session && session.user) {
            // Determine User ID from session
            userId = (session.user as any).id || (session.user as any).user_id;
            console.log('[API DEBUG] Found NextAuth user:', userId);
        } else {
            // Check Guest ID if no user session
            if (guestIdHeader) {
                isGuest = true;
                guestId = guestIdHeader;
            }
        }

        if (!userId && !isGuest) {
            return NextResponse.json({ error: 'Unauthorized: No Session or Guest ID' }, { status: 401 });
        }

        const body = await req.json();
        const { parts, config, model } = body;

        // 2. Get Credit Cost from Header (sent by client based on their globalConfig)
        const creditCostHeader = req.headers.get('x-credit-cost');
        const creditCost = creditCostHeader ? parseInt(creditCostHeader, 10) : 1; // Default to 1 if not provided

        console.log('[API DEBUG] Credit cost from header:', creditCost);
        console.log('[API DEBUG] Model:', model);

        // 3. Check if user has enough credits (don't deduct yet)
        console.log('[API DEBUG] Checking credits...', { isGuest, userId, guestId, creditCost });

        let currentCredits = 0;

        const { sql } = await import('@/lib/neon/client');

        if (isGuest && guestId) {
            // For guests: ensure session exists first
            const guestResult = await sql`
                SELECT credits FROM guest_sessions WHERE guest_id = ${guestId} LIMIT 1
            `;
            const guestData = guestResult[0];

            // Create guest session if doesn't exist
            if (!guestData) {
                console.log('[API DEBUG] Creating new guest session:', guestId);
                const defaultCredits = 3;

                try {
                    await sql`
                        INSERT INTO guest_sessions (guest_id, credits)
                        VALUES (${guestId}, ${defaultCredits})
                    `;
                    currentCredits = defaultCredits;
                } catch (createError) {
                    console.error('[API DEBUG] Failed to create guest session:', createError);
                    return NextResponse.json({
                        error: 'Không thể tạo phiên khách. Vui lòng thử lại.'
                    }, { status: 500 });
                }
            } else {
                currentCredits = guestData.credits || 0;
            }

        } else if (userId) {
            // For users: get current credits
            const userResult = await sql`
                SELECT current_credits FROM users WHERE user_id = ${userId} LIMIT 1
            `;
            const userData = userResult[0];
            currentCredits = userData?.current_credits || 0;
        }

        console.log('[API DEBUG] Current credits:', currentCredits, 'Required:', creditCost);

        // Check if enough credits
        if (currentCredits < creditCost) {
            console.log('[API DEBUG] INSUFFICIENT_CREDITS - current:', currentCredits, 'required:', creditCost);
            return NextResponse.json({
                error: 'Bạn đã hết Credit. Vui lòng nạp thêm để tiếp tục.',
                code: 'INSUFFICIENT_CREDITS'
            }, { status: 402 });
        }

        // 4. Generate Image (credits NOT deducted yet)
        console.log('[API DEBUG] Credits sufficient, proceeding with generation...');
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: model || 'gemini-2.5-flash-image',
            contents: { parts },
            config: config
        });

        // 5. Deduct credits ONLY after successful generation
        console.log('[API DEBUG] Generation successful, deducting credits...');

        // DIRECT SQL UPDATE (Via Neon)
        let newCredits = currentCredits - creditCost; // Default fallback
        try {
            console.log(`[API] Deducting ${creditCost} credits directly (via Neon)...`);
            const { sql } = await import('@/lib/neon/client');

            if (isGuest && guestId) {
                // Atomic Update & Return
                const result = await sql`
                    UPDATE guest_sessions
                    SET credits = GREATEST(0, credits - ${creditCost})
                    WHERE guest_id = ${guestId}
                    RETURNING credits
                `;

                if (result.length > 0) {
                    newCredits = result[0].credits;
                    console.log(`[API] Guest credits updated. New balance: ${newCredits}`);
                } else {
                    console.warn('[API] Guest ID not found during deduction:', guestId);
                }

            } else if (userId) {
                // Atomic Update & Return
                const result = await sql`
                    UPDATE users
                    SET current_credits = GREATEST(0, current_credits - ${creditCost})
                    WHERE user_id = ${userId}
                    RETURNING current_credits
                `;

                if (result.length > 0) {
                    newCredits = result[0].current_credits;
                    console.log(`[API] User credits updated. New balance: ${newCredits}`);
                } else {
                    console.warn('[API] User ID not found during deduction:', userId);
                }
            }
        } catch (err: any) {
            console.error('[API] CRITICAL: Neon Credit deduction failed:', err);
            // We log but don't fail the request since image generated
        }

        console.log('[API DEBUG] Credits deducted successfully');

        // Return response with new credit balance
        return NextResponse.json({
            ...response,
            newCredits // Add new credit balance to response
        });

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
