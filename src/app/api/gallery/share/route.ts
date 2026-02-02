import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';

export async function POST(req: NextRequest) {
    try {
        const { historyId, imageUrl, share = true } = await req.json();

        if (!historyId && !imageUrl) {
            return NextResponse.json({ error: 'Missing historyId or imageUrl' }, { status: 400 });
        }

        // Prefer historyId for precise single-record update
        if (historyId) {
            const result = await sql`
                UPDATE generation_history
                SET share = ${share}, updated_at = NOW()
                WHERE history_id = ${historyId}::uuid
                RETURNING history_id as id
            `;

            if (result.length === 0) {
                return NextResponse.json({ message: 'Record not found', updated: false }, { status: 404 });
            }

            return NextResponse.json({ success: true, updatedId: result[0].id });
        }

        // Fallback to imageUrl (legacy support) - this will update ONLY the FIRST matching record
        if (imageUrl) {
            const result = await sql`
                UPDATE generation_history
                SET share = ${share}, updated_at = NOW()
                WHERE history_id = (
                    SELECT history_id 
                    FROM generation_history 
                    WHERE output_images @&gt; ${JSON.stringify([imageUrl])}::jsonb
                    LIMIT 1
                )
                RETURNING history_id as id
            `;

            if (result.length === 0) {
                return NextResponse.json({ message: 'Image not found', updated: false }, { status: 404 });
            }

            return NextResponse.json({ success: true, updatedId: result[0].id });
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    } catch (error: any) {
        console.error('[API] Error sharing image:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
