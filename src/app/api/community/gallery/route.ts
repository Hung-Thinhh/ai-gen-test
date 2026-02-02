import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/community/gallery
 * Fetch shared images from generation_history with user details
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        // Query to get shared images and join with users table
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
            AND img_url LIKE 'https://%'
            ORDER BY COALESCE(gh.updated_at, gh.created_at) DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        // Create deterministic unique ID from history_id and image URL
        // This ensures the same image always gets the same ID
        const allItems = data.map(row => {
            // Extract a stable identifier from the image URL (last part of path)
            const urlParts = row.img_url.split('/');
            const imageIdentifier = urlParts[urlParts.length - 1].split('?')[0]; // Remove query params

            return {
                id: `${row.history_id}-${imageIdentifier}`, // deterministic unique id
                url: row.img_url,
                prompt: row.input_prompt,
                tool: row.tool_key || 'unknown-tool',
                createdAt: row.created_at,
                user: {
                    name: row.display_name || 'Anonymous Artist',
                    avatar: row.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.display_name || 'A')}&background=random`
                }
            };
        });

        // De-duplicate images using Map (keeps first occurrence)
        const uniqueItemsMap = new Map();
        allItems.forEach(item => {
            if (!uniqueItemsMap.has(item.id)) {
                uniqueItemsMap.set(item.id, item);
            }
        });
        const galleryItems = Array.from(uniqueItemsMap.values());

        return NextResponse.json({
            success: true,
            data: galleryItems,
            pagination: {
                page,
                limit,
                hasMore: galleryItems.length === limit
            }
        });

    } catch (error: any) {
        console.error('[API] Error fetching community gallery:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
