import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { sql } from '@/lib/neon/client';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const data = await req.json();

        // Validate required fields
        if (!data.user_id && !data.guest_id) return NextResponse.json({ error: 'Missing user context' }, { status: 400 });

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

        await sql`
            INSERT INTO generation_history 
            (user_id, guest_id, tool_id, output_images, generation_count, credits_used, api_model_used, generation_time_ms, error_message)
            VALUES (
                ${data.user_id || null},
                ${data.guest_id || null},
                ${toolId || null},
                ${data.output_images},
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
