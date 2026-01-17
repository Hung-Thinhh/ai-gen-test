import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
// import { supabaseAdmin } from '@/lib/supabase/client';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
    const perfStart = Date.now();
    const perfLog = (step: string) => {
        const elapsed = Date.now() - perfStart;
        console.log(`[PERF] ${step}: ${elapsed}ms`);
    };

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const vertexProjectId = process.env.VERTEX_PROJECT_ID;
        const vertexLocation = process.env.VERTEX_LOCATION || 'us-central1';

        // Helper to ensure Google Auth finds the file (if using local file)
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_APPLICATION_CREDENTIALS.startsWith('/')) {
            const path = await import('path');
            if (!path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
                process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
            }
        }

        if (!apiKey && !vertexProjectId) {
            return NextResponse.json(
                { error: 'Server API Key or Vertex Project ID not configured' },
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
        console.log('[API DEBUG] Received parts:', JSON.stringify(parts, null, 2));
        console.log('[API DEBUG] Received config:', JSON.stringify(config, null, 2));

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

        perfLog('Credit check completed');

        // 4. Generate Image (credits NOT deducted yet)
        console.log('[API DEBUG] Credits sufficient, proceeding with generation...');

        let ai;
        if (vertexProjectId) {
            console.log('[API DEBUG] Using Vertex AI Provider', { project: vertexProjectId, location: vertexLocation });
            // [FIX] Correct configuration for @google/genai:
            // The build fails with 'vertexAI' because strict types require 'vertexai'.
            // Even if it 'seemed' to work before, the build error confirms this is the only valid way.
            ai = new GoogleGenAI({
                vertexai: true,
                project: vertexProjectId,
                location: vertexLocation
            });
        } else {
            console.log('[API DEBUG] Using Gemini API Key Provider');
            ai = new GoogleGenAI({ apiKey });
        }

        let imageUrl = '';
        let finishReason = '';
        let lastEnhancedPrompt = ''; // Store the last enhanced prompt for history logging

        // Import R2 upload function once
        const { uploadToR2 } = await import('@/lib/r2/upload');

        // Retry loop: Try up to 3 times (to handle occasional API timeouts)
        // But log each attempt to understand why retry is needed
        // Retry loop: Try up to 2 times as requested
        // But log each attempt to understand why retry is needed
        const maxAttempts = 2;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                if (attempt > 1) {
                    console.log(`[API DEBUG] ⚠️ Retry attempt ${attempt}/${maxAttempts}...`);
                }

                // FIX: For image generation with reference images, we need to:
                // 1. Include the image data for reference (face swap, style transfer, etc.)
                // 2. Add explicit "GENERATE A NEW IMAGE:" directive to EVERY prompt
                // 3. This tells the model to CREATE a new image, not just analyze

                const hasImageData = parts.some((p: any) => p.inlineData);

                // Extract text and ALWAYS add explicit generation directive
                const textParts = parts.filter((p: any) => p.text);
                const originalText = textParts.map((p: any) => p.text).join('\n');

                // ALWAYS prepend generation directive - this is critical!
                // Even if prompt contains "Tạo/Generate", being explicit helps the model understand
                const enhancedPrompt = `GENERATE A NEW IMAGE:\n\n${originalText}`;
                lastEnhancedPrompt = enhancedPrompt; // Store for history logging

                if (attempt === 1) {
                    console.log(`[API DEBUG] Attempt 1 - Starting generation with ${hasImageData ? 'reference image' : 'text only'}...`);
                    console.log(`[API DEBUG] Prompt: ${enhancedPrompt.substring(0, 150)}...`);
                }

                console.log(`[API DEBUG] Attempt ${attempt} - Has image data: ${hasImageData}`);
                console.log(`[API DEBUG] Attempt ${attempt} - Enhanced prompt:\n${enhancedPrompt.substring(0, 300)}...`);

                // Build parts array: preserve image data if present, use enhanced prompt text
                const requestParts: any[] = [];

                // Add image data first (if present)
                const imageParts = parts.filter((p: any) => p.inlineData);
                requestParts.push(...imageParts);

                // Add the enhanced text prompt
                requestParts.push({ text: enhancedPrompt });

                console.log(`[API DEBUG] Attempt ${attempt} - Request parts: ${imageParts.length} images + 1 text`);

                // Filter out properties that are not valid for image generation
                const filteredConfig = Object.keys(config).reduce((acc: any, key: string) => {
                    // Exclude text-generation specific properties
                    if (!['responseMimeType', 'responseSchema', 'responseModalities'].includes(key)) {
                        acc[key] = config[key];
                    }
                    return acc;
                }, {});

                console.log(`[API DEBUG] Attempt ${attempt} - Filtered config:`, JSON.stringify(filteredConfig, null, 2));

                const response = await ai.models.generateContent({
                    model: model || 'gemini-2.5-flash-image',
                    contents: [{
                        role: 'user',
                        parts: requestParts  // Image data (if any) + enhanced text prompt
                    }],
                    config: filteredConfig  // Use only filtered config
                });

                perfLog(`AI generation completed (Attempt ${attempt})`);

                // Find ANY valid candidate with image data
                // If asking for 2 images and 1 fails but 1 succeeds, we should take the successful one.
                const validCandidate = response.candidates?.find((c: any) => c.content?.parts?.[0]?.inlineData);
                const validPart = validCandidate?.content?.parts?.[0];

                finishReason = response.candidates?.[0]?.finishReason || 'UNKNOWN';

                if (validPart && validPart.inlineData) {
                    console.log(`[API DEBUG] ✅ Attempt ${attempt} successful! Image generated.`);
                    const base64Image = `data:${validPart.inlineData.mimeType};base64,${validPart.inlineData.data}`;
                    imageUrl = await uploadToR2(base64Image);
                    perfLog('R2 upload completed');
                    console.log('[API DEBUG] Image uploaded to R2:', imageUrl);
                    break; // Success!
                } else {
                    // Attempt failed - log why
                    console.warn(`[API DEBUG] ❌ Attempt ${attempt} failed: No valid image data found in candidates. Finish reason: ${finishReason}`);

                    const firstPart = response.candidates?.[0]?.content?.parts?.[0];
                    if (firstPart?.text) {
                        const responseText = firstPart.text.substring(0, 200);
                        console.warn(`[API DEBUG] Model returned TEXT instead of IMAGE: "${responseText}..."`);
                    }
                    if (response.candidates?.[0]?.safetyRatings && Array.isArray(response.candidates[0].safetyRatings) && response.candidates[0].safetyRatings.length > 0) {
                        console.warn('[API DEBUG] Safety ratings:', response.candidates[0].safetyRatings);
                    }

                    // If this was last attempt, throw error
                    if (attempt === maxAttempts) {
                        throw new Error(`Failed to generate image after ${maxAttempts} attempts. Last reason: ${finishReason}`);
                    }
                    // Otherwise, continue to next retry
                    console.log(`[API DEBUG] Waiting before retry attempt ${attempt + 1}...`);
                }

            } catch (err) {
                console.error(`[API DEBUG] ❌ Attempt ${attempt} error:`, err instanceof Error ? err.message : err);

                // If this was last attempt, rethrow
                if (attempt === maxAttempts) {
                    throw err;
                }
                // Otherwise, continue to next retry
                console.log(`[API DEBUG] Will retry after error...`);
            }
        }

        perfLog('AI generation process completed');

        // Stop here if no image generated (prevent empty history/credit deduction)
        if (!imageUrl) {
            console.warn('[API] No image URL generated after retries, skipping DB update and history log.');
            return NextResponse.json({
                error: 'Không thể tạo ảnh với nội dung này. Có thể do mô tả vi phạm chính sách hoặc quá phức tạp.',
                details: finishReason
            }, { status: 400 }); // Return 400 Bad Request instead of 503 for content issues
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

                if (creditResult.length > 0) {
                    newCredits = creditResult[0].current_credits;
                    // Get last added URL from the returned gallery array
                    const galleryArr = galleryResult[0]?.gallery;
                    const lastUrl = Array.isArray(galleryArr) ? galleryArr[galleryArr.length - 1] : imageUrl;

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

        perfLog('DB update completed');

        // AUTO-LOG TO HISTORY (Server-side)
        try {
            console.log('[API] Auto-logging to generation_history...');

            // Get tool info
            const toolKey = body.tool_key || null;
            let toolId = body.tool_id ? parseInt(body.tool_id) : -1;

            // If tool_key is provided but tool_id is missing/invalid, look it up
            if (toolKey && (toolId === -1 || !toolId)) {
                try {
                    const toolResult = await sql`SELECT tool_id FROM tools WHERE key = ${toolKey} LIMIT 1`;
                    if (toolResult && toolResult.length > 0) {
                        toolId = toolResult[0].tool_id;
                        console.log(`[API] Resolved tool_key '${toolKey}' to tool_id: ${toolId}`);
                    } else {
                        console.warn(`[API] Could not resolve tool_key '${toolKey}' to an ID`);
                        toolId = -1; // Default to -1 if not found
                    }
                } catch (lookupErr: any) {
                    console.warn('[API] ⚠️ Tool lookup failed (non-blocking), proceeding with tool_id=-1:', lookupErr.message);
                    toolId = -1; // Default to -1 on error
                }
            }

            await sql`
                INSERT INTO generation_history 
                (user_id, guest_id, tool_id, output_images, generation_count, credits_used, api_model_used, generation_time_ms, error_message, created_at, tool_key, input_prompt)
                VALUES (
                    ${userId || null},
                    ${guestId || null},
                    ${toolId},
                    ${JSON.stringify([imageUrl])}::jsonb,
                    1,
                    ${creditCost},
                    ${model || 'unknown'},
                    ${Date.now() - perfStart},
                    NULL,
                    NOW(),
                    ${toolKey},
                    ${lastEnhancedPrompt}
                )
            `;

            console.log('[API] ✅ History logged successfully with input_prompt');
        } catch (histErr: any) {
            console.error('[API] ⚠️ History logging failed (non-critical):', histErr.message);
        }

        perfLog('🏁 TOTAL TIME');
        console.log('[API DEBUG] Process complete');

        // Return response
        // OPTIMIZATION: If we have an R2 URL, do NOT send back the heavy Base64 candidates.
        return NextResponse.json({
            candidates: [], // Strip Base64 if R2 URL exists
            newCredits,
            imageUrl // Return the persistent URL
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
