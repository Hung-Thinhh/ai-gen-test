import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';

export async function POST(req: NextRequest) {
    try {
        const { imageUrl } = await req.json();

        if (!imageUrl) {
            return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });
        }

        // We search for the row where output_images contains the imageUrl.
        // output_images is a JSONB array of strings.
        // We use the JSONB contains operator @> to check if the array contains the string.
        // However, '["url"]' syntax is needed.

        // Alternatively, since we might store just the URL string or an array depending on legacy data,
        // using a text-based search or specific JSON path existence check is safer if schema varies.
        // But assuming standard schema:

        const result = await sql`
            UPDATE generation_history
            SET share = true
            WHERE output_images @> ${JSON.stringify([imageUrl])}::jsonb
            RETURNING history_id as id
        `;

        if (result.length === 0) {
            // Fallback: Try searching as text if it wasn't a proper JSON array match
            // This helps if data is legacy or structured differently
            const fallbackResult = await sql`
                UPDATE generation_history
                SET share = true
                WHERE output_images::text LIKE ${'%' + imageUrl + '%'}
                RETURNING history_id as id
            `;

            if (fallbackResult.length === 0) {
                return NextResponse.json({ message: 'Image not found in history', updated: false }, { status: 404 });
            }
            return NextResponse.json({ success: true, updatedId: fallbackResult[0].id });
        }

        return NextResponse.json({ success: true, updatedId: result[0].id });
    } catch (error: any) {
        console.error('[API] Error sharing image:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
