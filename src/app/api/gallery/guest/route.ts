import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon/client';

/**
 * GET /api/gallery/guest?guestId=xxx - Get guest gallery images
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const guestId = searchParams.get('guestId');

        if (!guestId) {
            return NextResponse.json({ error: 'Guest ID required' }, { status: 400 });
        }

        // Get guest gallery
        const data = await sql`
            SELECT * FROM guest_gallery 
            WHERE guest_id = ${guestId} 
            ORDER BY created_at DESC
        `;

        return NextResponse.json({ images: data || [] });

    } catch (error: any) {
        console.error('[API] Error in GET /api/gallery/guest:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/gallery/guest - Add images to guest gallery
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { guestId, images } = body;

        if (!guestId) {
            return NextResponse.json({ error: 'Guest ID required' }, { status: 400 });
        }

        if (!images || !Array.isArray(images) || images.length === 0) {
            return NextResponse.json({ error: 'Images array required' }, { status: 400 });
        }

        const insertedImages = [];

        for (const img of images) {
            const result = await sql`
                INSERT INTO guest_gallery (
                    guest_id, image_url, thumbnail_url, metadata, created_at
                ) VALUES (
                    ${guestId},
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
        console.error('[API] Error in POST /api/gallery/guest:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
