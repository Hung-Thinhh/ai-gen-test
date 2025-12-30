import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

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
        const { data, error } = await supabaseAdmin
            .from('guest_gallery')
            .select('*')
            .eq('guest_id', guestId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[API] Error fetching guest gallery:', error);
            return NextResponse.json({ images: [] });
        }

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

        // Prepare records
        const records = images.map(img => ({
            guest_id: guestId,
            image_url: img.image_url,
            thumbnail_url: img.thumbnail_url || img.image_url,
            metadata: img.metadata || {}
        }));

        // Insert images
        const { data, error } = await supabaseAdmin
            .from('guest_gallery')
            .insert(records)
            .select();

        if (error) {
            console.error('[API] Error adding to guest gallery:', error);
            return NextResponse.json({ error: 'Failed to add images' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            images: data,
            count: data?.length || 0
        }, { status: 201 });

    } catch (error: any) {
        console.error('[API] Error in POST /api/gallery/guest:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
