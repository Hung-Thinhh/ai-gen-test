import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/community/gallery
 * Fetch shared images from generation_history with user details
 */
export async function GET(req: NextRequest) {
    try {
        // Query to get shared images and join with users table
        // We expand the output_images array to individual rows if needed, or handle arrays in frontend
        // For simplicity and performance, we'll fetch the rows and process in JS if needed,
        // but given the requirement "images dính liền nhau", treating each image as an item is better.

        // However, output_images is a JSONB array. 
        // We want individual images. We can use `jsonb_array_elements_text` to expand.

        const data = await sql`
            SELECT 
                gh.history_id,
                gh.created_at,
                gh.tool_key,
                gh.input_prompt,
                u.display_name,
                u.avatar_url,
                img_url
            FROM generation_history gh
            CROSS JOIN LATERAL jsonb_array_elements_text(gh.output_images) as img_url
            JOIN users u ON gh.user_id = u.user_id
            WHERE gh.share = true
            AND img_url LIKE 'https://%' -- Ensure valid URLs (skip base64 if any slipped in)
            ORDER BY gh.created_at DESC
            LIMIT 40
        `;

        const galleryItems = data.map(row => ({
            id: `${row.history_id}-${Math.random().toString(36).substr(2, 9)}`, // unique id for frontend
            url: row.img_url,
            prompt: row.input_prompt,
            tool: row.tool_key || 'unknown-tool',
            createdAt: row.created_at,
            user: {
                name: row.display_name || 'Anonymous Artist',
                avatar: row.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.display_name || 'A')}&background=random`
            }
        }));

        return NextResponse.json({
            success: true,
            data: galleryItems
        });

    } catch (error: any) {
        console.error('[API] Error fetching community gallery:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
