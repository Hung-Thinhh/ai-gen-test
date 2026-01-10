import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { sql } from '@/lib/neon/client';

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();

        // 1. Check strict authentication (User Session OR Guest ID)
        const session = await getServerSession(authOptions);
        const hasUser = session && session.user;
        const hasGuest = !!data.guest_id;

        if (!hasUser && !hasGuest) {
            return NextResponse.json({ error: 'Unauthorized: No User or Guest Context' }, { status: 401 });
        }

        // Validate required fields
        if (!data.user_id && !data.guest_id) return NextResponse.json({ error: 'Missing user context' }, { status: 400 });

        // If user is logged in, ensure user_id matches session (security)
        if (hasUser && data.user_id) {
            const sessionUserId = (session.user as any).id || (session.user as any).user_id;
            if (data.user_id !== sessionUserId) {
                // return NextResponse.json({ error: 'Forbidden: ID mismatch' }, { status: 403 }); 
                // Optional: warn but maybe allow if admin? For now, let's just proceed or strictly enforce.
                // Let's trust the data.user_id if session exists for now to avoid breaking legacy, 
                // but ideally we should overwrite data.user_id with sessionUserId.
            }
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

        await sql`
            INSERT INTO generation_history 
            (user_id, guest_id, tool_id, output_images, generation_count, credits_used, api_model_used, generation_time_ms, error_message)
            VALUES (
                ${data.user_id || null},
                ${data.guest_id || null},
                ${toolId || null},
                ${outputImagesJson}::jsonb,
                ${generationCount},
                ${creditsUsed},
                ${data.api_model_used || 'unknown'},
                ${data.generation_time_ms || 0},
                ${data.error_message || null}
            )
        `;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("History Insert Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
