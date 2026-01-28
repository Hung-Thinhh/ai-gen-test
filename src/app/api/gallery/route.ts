import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/gallery - Get user's gallery images from generation_history
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

        // Get gallery images from generation_history with prompts
        const data = await sql`
            SELECT 
                history_id,
                output_images,
                input_prompt,
                created_at,
                created_at,
                tool_key,
                api_model_used
            FROM generation_history 
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
            LIMIT 500
        `;

        // Transform to frontend format with extracted images and their prompts
        const imagesList = [];
        const promptsList = [];
        let baseCount = 0;
        let urlCount = 0;

        for (const record of data) {
            if (record.output_images && Array.isArray(record.output_images)) {
                for (let i = 0; i < record.output_images.length; i++) {
                    const img = record.output_images[i];

                    // Filter out base64 images, only keep R2 URLs
                    if (!img || typeof img !== 'string') continue;
                    if (img.startsWith('data:')) {
                        baseCount++;
                        continue; // Skip base64
                    }
                    if (!img.startsWith('https://')) {
                        continue;
                    }

                    urlCount++;
                    imagesList.push({
                        id: `${record.history_id}_${i}`,
                        history_id: record.history_id,
                        url: img,
                        created_at: record.created_at,
                        tool_key: record.tool_key,
                        model: record.api_model_used
                    });
                    // Map each image with its prompt
                    promptsList.push(record.input_prompt || null);
                }
            }
        }

        console.log(`[API] GET /api/gallery: Found ${imagesList.length} URL images (skipped ${baseCount} base64 images)`);
        console.log('[API] Sample images:', imagesList.slice(0, 2).map(img => ({
            url: img.url.substring(0, 60) + '...',
            tool: img.tool_key
        })));
        console.log('[API] Sample prompts:', promptsList.slice(0, 2).map(p => p?.substring(0, 50) + '...' || 'null'));

        const response = {
            images: imagesList,
            prompts: promptsList,
            total: imagesList.length
        };

        console.log('[API] Response summary:', {
            total: response.total,
            prompts_count: promptsList.filter(p => p).length,
            skipped_base64: baseCount,
            format: 'R2 URLs with prompts'
        });

        return NextResponse.json(response);

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
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
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
