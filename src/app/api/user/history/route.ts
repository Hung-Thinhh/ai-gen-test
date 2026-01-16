import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { sql } from '@/lib/postgres/client';
import { getUserByEmail } from '@/lib/postgres/queries';

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();

        // DEBUG: Log incoming data
        console.log('[History API] Received data:', JSON.stringify({
            tool_id: data.tool_id,
            output_images: data.output_images?.length ? `Array(${data.output_images.length})` : data.output_images,
            generation_count: data.generation_count,
            credits_used: data.credits_used,
            input_prompt: data.input_prompt // Log prompt
        }));

        // 1. Check strict authentication (User Session OR Guest ID)
        const session = await getServerSession(authOptions);
        const hasUser = session && session.user;
        const hasGuest = !!data.guest_id;

        if (!hasUser && !hasGuest) {
            return NextResponse.json({ error: 'Unauthorized: No User or Guest Context' }, { status: 401 });
        }

        // Validate required fields
        if (!data.user_id && !data.guest_id) return NextResponse.json({ error: 'Missing user context' }, { status: 400 });

        // If user is logged in, ensure we use DB UUID instead of session ID
        let userId = data.user_id;
        console.log('[History] Initial userId from request:', userId);
        console.log('[History] hasUser:', hasUser);
        console.log('[History] session.user.email:', session?.user?.email);

        if (hasUser && session?.user?.email) {
            console.log('[History] Fetching user by email:', session.user.email);
            const userData = await getUserByEmail(session.user.email);
            console.log('[History] getUserByEmail result:', userData);
            if (userData) {
                userId = userData.user_id; // Use UUID from DB
                console.log('[History] ✅ Using UUID from DB:', userId);
            } else {
                console.warn('[History] ⚠️ User not found in DB, using original userId:', userId);
            }
        } else {
            console.log('[History] No email in session, using original userId:', userId);
        }

        let creditsUsed = data.credits_used;
        const toolId = data.tool_id;
        const generationCount = data.generation_count || 1;

        // Calculate credits if not provided and tool_id exists
        if ((creditsUsed === undefined || creditsUsed === 0) && toolId) {
            const tools = await sql`SELECT base_credit_cost FROM tools WHERE tool_id = ${toolId}`;
            if (tools.length > 0) {
                const cost = tools[0].base_credit_cost || 0;
                creditsUsed = cost * generationCount;
            }
        }

        // Properly handle output_images as JSON
        let outputImagesJson = null;
        if (data.output_images) {
            if (typeof data.output_images === 'string') {
                // If already a string, try to parse and re-stringify to ensure valid JSON
                try {
                    outputImagesJson = JSON.stringify(JSON.parse(data.output_images));
                } catch {
                    outputImagesJson = data.output_images;
                }
            } else {
                // If it's an array/object, stringify it
                outputImagesJson = JSON.stringify(data.output_images);
            }
        }

        // Ensure tool_id is never null (database constraint)
        // Use -1 as default for unknown/studio tools
        const finalToolId = toolId || -1;

        await sql`
            INSERT INTO generation_history 
            (user_id, guest_id, tool_id, output_images, generation_count, credits_used, api_model_used, generation_time_ms, error_message, input_prompt, created_at)
            VALUES (
                ${userId || null},
                ${data.guest_id || null},
                ${finalToolId},
                ${outputImagesJson}::jsonb,
                ${generationCount},
                ${creditsUsed},
                ${data.api_model_used || 'unknown'},
                ${data.generation_time_ms || 0},
                ${data.error_message || null},
                ${data.input_prompt || null},
                NOW()
            )
        `;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("History Insert Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
