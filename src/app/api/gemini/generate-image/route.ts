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

        if (session && session.user && session.user.email) {
            // Fetch UUID from database by email
            const { getUserByEmail } = await import('@/lib/postgres/queries');
            const userData = await getUserByEmail(session.user.email);
            if (userData) {
                userId = userData.user_id;
                console.log('[API DEBUG] Found user UUID from DB:', userId);
            } else {
                console.warn('[API DEBUG] User not found in DB for email:', session.user.email);
            }
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

        const { sql } = await import('@/lib/postgres/client');

        if (isGuest && guestId) {
            // For guests: ensure session exists first
            const guestResult = await sql`
                SELECT credits FROM guest_sessions WHERE guest_id = ${guestId} LIMIT 1
            `;
            const guestData = guestResult[0];

            // Create guest session if doesn't exist
            if (!guestData) {
                console.log('[API DEBUG] Creating new guest session:', guestId);

                // Get default credits from system_configs
                const { getSystemConfig } = await import('@/lib/postgres/queries');
                const guestLimitConfig = await getSystemConfig('guest_generation_limit');
                const defaultCredits = guestLimitConfig ? parseInt(guestLimitConfig, 10) : 3;

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

        // 5. Upload to Cloudinary (Server-side)
        console.log('[API DEBUG] Uploading to Cloudinary...');

        const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dmxmzannb';
        const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'AI-image';

        // Helper to upload
        const uploadToCloudinaryServer = async (base64Image: string) => {
            const formData = new FormData();
            formData.append('file', base64Image);
            formData.append('upload_preset', UPLOAD_PRESET);

            const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) {
                const errData = await uploadRes.json();
                console.error('Cloudinary Upload Error:', errData);
                throw new Error('Failed to upload image to storage');
            }

            const data = await uploadRes.json();
            // Optimize URL (f_auto, q_auto)
            return data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
        };

        // We only upload the first image for now (gemini usually returns 1 in this setup)
        const firstCandidate = response.candidates?.[0]?.content?.parts?.[0];
        let imageUrl = '';

        if (firstCandidate && firstCandidate.inlineData) {
            const base64Image = `data:${firstCandidate.inlineData.mimeType};base64,${firstCandidate.inlineData.data}`;
            imageUrl = await uploadToCloudinaryServer(base64Image);
            console.log('[API DEBUG] Image uploaded:', imageUrl);
        } else {
            console.warn('[API DEBUG] No inlineData found in candidate, skipping upload');
        }


        // 6. Deduct credits AND Save to Gallery (Atomic-ish)
        console.log('[API DEBUG] Generation successful, deducting credits and saving to gallery...');

        // DIRECT SQL UPDATE (Via Neon)
        // We update credits AND append the new image URL to the gallery JSONB array relative to the user/guest
        let newCredits = currentCredits - creditCost;

        try {
            console.log(`[API] Updating DB (Usage + Gallery)...`);
            console.log(`[API DEBUG] DB Update Data - isGuest: ${isGuest}, guestId: ${guestId}, userId: ${userId}, imageUrl: ${imageUrl}, creditCost: ${creditCost}`);

            const { sql } = await import('@/lib/postgres/client');

            if (isGuest && guestId && imageUrl) {
                // Atomic Update & Return
                const result = await sql`
                    UPDATE guest_sessions
                    SET 
                        credits = GREATEST(0, credits - ${creditCost}),
                        gallery = COALESCE(gallery, '[]'::jsonb) || jsonb_build_array(${imageUrl}::text)
                    WHERE guest_id = ${guestId}
                    RETURNING credits,
                    gallery->>-1 AS last_added_url;
                `;

                if (result.length > 0) {
                    newCredits = result[0].credits;
                    console.log(`[API] Guest updated. New balance: ${newCredits}, Image saved. Last URL: ${result[0].last_added_url}`);
                } else {
                    console.warn('[API] Guest ID not found during update:', guestId);
                }

            } else if (userId && imageUrl) {
                // 1. Update Credits in `users`
                const creditResult = await sql`
                    UPDATE users
                    SET current_credits = GREATEST(0, current_credits - ${creditCost})
                    WHERE user_id = ${userId}
                    RETURNING current_credits;
                `;

                // 2. Add image to `profiles` (Gallery)
                const galleryResult = await sql`
                    INSERT INTO profiles (id, gallery, last_updated)
                    VALUES (${userId}, jsonb_build_array(${imageUrl}::text), NOW())
                    ON CONFLICT (id) 
                    DO UPDATE SET 
                        gallery = COALESCE(profiles.gallery, '[]'::jsonb) || jsonb_build_array(${imageUrl}::text),
                        last_updated = NOW()
                    RETURNING gallery;
                `;

                const oke1 = await sql`
                    SELECT gallery->>-1 AS last_added_url 
FROM profiles 
WHERE id = ${userId};
                `;

                console.log('cccccccccccccccccccccccccccccccccc', oke1);

                if (creditResult.length > 0) {
                    newCredits = creditResult[0].current_credits;
                    // Get last added URL from the returned gallery array
                    const galleryArr = galleryResult[0]?.gallery;
                    const lastUrl = Array.isArray(galleryArr) ? galleryArr[galleryArr.length - 1] : 'unknown';

                    console.log(`[API] User updated. New balance: ${newCredits}, Image saved to profiles. Last URL: ${lastUrl}`);
                } else {
                    console.warn('[API] User ID not found during update:', userId);
                }
            } else {
                // Fallback for credit deduction ONLY if image upload failed or no ID (shouldn't happen here logically)
                if (isGuest && guestId) {
                    await sql`UPDATE guest_sessions SET credits = GREATEST(0, credits - ${creditCost}) WHERE guest_id = ${guestId}`;
                } else if (userId) {
                    await sql`UPDATE users SET current_credits = GREATEST(0, current_credits - ${creditCost}) WHERE user_id = ${userId}`;
                }
            }
        } catch (err: any) {
            console.error('[API] CRITICAL: DB Update failed:', err);
            // We log but don't fail the request since image generated (maybe?) 
            // Actually if DB fails, user gets image but no history. acceptable trade-off vs erroring out.
        }

        console.log('[API DEBUG] Process complete');

        // Return response
        return NextResponse.json({
            candidates: response.candidates,
            newCredits,
            imageUrl // Return the persistent URL too
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
