import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon/client';

export async function GET(req: NextRequest) {
    try {
        const key = req.nextUrl.searchParams.get('key');
        if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

        // Try tool_key match
        let tools = await sql`SELECT tool_id FROM tools WHERE tool_key = ${key}`;

        if (tools.length === 0) {
            // Try numeric check
            const asNum = parseInt(key);
            if (!isNaN(asNum)) {
                tools = await sql`SELECT tool_id FROM tools WHERE tool_id = ${asNum}`;
            }
        }

        if (tools.length === 0) {
            // Fallback (optional) - return generic first tool
            tools = await sql`SELECT tool_id FROM tools LIMIT 1`;
        }

        return NextResponse.json({ tool_id: tools[0]?.tool_id || null });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
