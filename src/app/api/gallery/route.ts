import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/gallery - Get user's gallery images with proper pagination
 * Query params: ?page=1&limit=30
 *
 * Optimized: Uses LATERAL JOIN to unnest jsonb array and paginate at DB level
 * Only fetches exactly the number of images needed for the page
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userCheck = await sql`SELECT user_id FROM users WHERE email = ${session.user.email} LIMIT 1`;
        if (!userCheck || userCheck.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const userId = userCheck[0].user_id;

        // Parse pagination params
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30')));
        const offset = (page - 1) * limit;

        // Cache headers
        const cacheHeaders = {
            'Cache-Control': 'private, max-age=30, stale-while-revalidate=300',
        };

        // Get total count of valid images (exclude base64)
        const countResult = await sql`
            SELECT COUNT(*) as total
            FROM generation_history gh,
            LATERAL jsonb_array_elements_text(gh.output_images) AS img_url
            WHERE gh.user_id = ${userId}
            AND img_url LIKE 'https://%'
        `;
        const totalImages = parseInt(countResult[0]?.total || '0');

        // Fetch exactly the images needed for this page using LATERAL JOIN
        // This is much more efficient than fetching all records and processing in JS
        const data = await sql`
            SELECT
                gh.history_id,
                gh.input_prompt,
                gh.created_at,
                gh.tool_key,
                gh.api_model_used,
                gh.share,
                img.img_url,
                img.img_index
            FROM (
                SELECT
                    history_id,
                    input_prompt,
                    created_at,
                    tool_key,
                    api_model_used,
                    share,
                    output_images
                FROM generation_history
                WHERE user_id = ${userId}
                ORDER BY created_at DESC
            ) gh,
            LATERAL (
                SELECT
                    value::text as img_url,
                    (ordinality - 1) as img_index
                FROM jsonb_array_elements_text(gh.output_images) WITH ORDINALITY AS t(value, ordinality)
                WHERE value::text LIKE 'https://%'
            ) img
            ORDER BY gh.created_at DESC, img.img_index
            LIMIT ${limit} OFFSET ${offset}
        `;

        // Transform to frontend format
        const imagesList = data.map((row: any) => ({
            id: `${row.history_id}_${row.img_index}`,
            history_id: row.history_id,
            url: row.img_url,
            created_at: row.created_at,
            tool_key: row.tool_key,
            model: row.api_model_used,
            share: row.share || false
        }));

        const promptsList = data.map((row: any) => row.input_prompt || null);

        const totalPages = Math.ceil(totalImages / limit);

        return NextResponse.json({
            images: imagesList,
            prompts: promptsList,
            pagination: {
                page,
                limit,
                totalImages,
                totalPages,
                hasMore: page < totalPages
            }
        }, { headers: cacheHeaders });

    } catch (error: any) {
        console.error('[API] Error in GET /api/gallery:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/gallery - Add images to gallery (generates history entry)
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userCheck = await sql`SELECT user_id FROM users WHERE email = ${session.user.email} LIMIT 1`;
        if (!userCheck || userCheck.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const userId = userCheck[0].user_id;

        const body = await req.json();
        const { images, prompt, tool_key } = body;

        if (!images || !Array.isArray(images) || images.length === 0) {
            return NextResponse.json({ error: 'Images array required' }, { status: 400 });
        }

        // Insert into generation_history
        const result = await sql`
            INSERT INTO generation_history (
                user_id, output_images, input_prompt, tool_key, created_at
            ) VALUES (
                ${userId},
                ${JSON.stringify(images)}::jsonb,
                ${prompt || null},
                ${tool_key || null},
                NOW()
            )
            RETURNING history_id, output_images, input_prompt, created_at, tool_key
        `;

        if (result.length > 0) {
            return NextResponse.json({
                success: true,
                history: result[0],
                count: images.length
            }, { status: 201 });
        }

        return NextResponse.json({ error: 'Failed to insert history' }, { status: 500 });

    } catch (error: any) {
        console.error('[API] Error in POST /api/gallery:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/gallery - Delete history entry (images)
 */
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userCheck = await sql`SELECT user_id FROM users WHERE email = ${session.user.email} LIMIT 1`;
        if (!userCheck || userCheck.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const userId = userCheck[0].user_id;

        const body = await req.json();
        const { historyIds } = body;

        if (!historyIds || !Array.isArray(historyIds) || historyIds.length === 0) {
            return NextResponse.json({ error: 'History IDs array required' }, { status: 400 });
        }

        // Delete from generation_history
        const result = await sql`
            DELETE FROM generation_history
            WHERE user_id = ${userId} AND history_id = ANY(${historyIds}::uuid[])
        `;

        return NextResponse.json({
            success: true,
            deleted: historyIds.length
        });

    } catch (error: any) {
        console.error('[API] Error in DELETE /api/gallery:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
