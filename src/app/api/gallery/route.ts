import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/gallery - Get user's gallery images
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

        // Get gallery images
        const data = await sql`
            SELECT * FROM user_gallery 
            WHERE user_id = ${userId} 
            ORDER BY created_at DESC
        `;

        return NextResponse.json({ images: data || [] });

    } catch (error: any) {
        console.error('[API] Error in GET /api/gallery:', error);
        // If table doesn't exist, return empty array instead of 500? No, stick to error logging.
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/gallery - Add images to gallery
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
        const { images } = body;

        if (!images || !Array.isArray(images) || images.length === 0) {
            return NextResponse.json({ error: 'Images array required' }, { status: 400 });
        }

        // Insert images loop (Neon doesn't support bulk insert with json mapping easily in tagged template without helper)
        // Check if we can use VALUES (...), (...), ...
        // We can construct the query dynamically.

        const insertedImages = [];

        for (const img of images) {
            const result = await sql`
                INSERT INTO user_gallery (
                    user_id, image_url, thumbnail_url, metadata, created_at
                ) VALUES (
                    ${userId},
                    ${img.image_url},
                    ${img.thumbnail_url || img.image_url},
                    ${JSON.stringify(img.metadata || {})}::jsonb,
                    NOW()
                )
                RETURNING *
            `;
            if (result.length > 0) insertedImages.push(result[0]);
        }

        return NextResponse.json({
            success: true,
            images: insertedImages,
            count: insertedImages.length
        }, { status: 201 });

    } catch (error: any) {
        console.error('[API] Error in POST /api/gallery:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/gallery - Delete images from gallery
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
        const { imageIds } = body;

        if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
            return NextResponse.json({ error: 'Image IDs array required' }, { status: 400 });
        }

        // Delete loop or WHERE IN
        // For simplicity and safety with varying array length, loop or explicit query construction.
        // Let's use simple loop for now as batch delete is rare or small numbers.
        // OR: WHERE id = ANY(${imageIds}) if imageIds is string[].

        // Ensure imageIds are strictly strings/uuids to prevent injection if not parameterized properly by driver (Neon driver handles arrays usually?)
        // Neon driver: `WHERE id = ANY(${imageIds})` works for Postgres arrays.

        await sql`
            DELETE FROM user_gallery 
            WHERE user_id = ${userId} AND id = ANY(${imageIds}::uuid[])
        `;

        return NextResponse.json({
            success: true,
            deleted: imageIds.length
        });

    } catch (error: any) {
        console.error('[API] Error in DELETE /api/gallery:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
