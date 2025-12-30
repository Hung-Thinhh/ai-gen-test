import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/gallery - Get user's gallery images
 */
export async function GET(req: NextRequest) {
    try {
        // Get auth token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Get gallery images
        const { data, error } = await supabaseAdmin
            .from('user_gallery')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[API] Error fetching gallery:', error);
            return NextResponse.json({ images: [] });
        }

        return NextResponse.json({ images: data || [] });

    } catch (error: any) {
        console.error('[API] Error in GET /api/gallery:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/gallery - Add images to gallery
 */
export async function POST(req: NextRequest) {
    try {
        // Get auth token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await req.json();
        const { images } = body; // Array of { image_url, thumbnail_url?, metadata? }

        if (!images || !Array.isArray(images) || images.length === 0) {
            return NextResponse.json({ error: 'Images array required' }, { status: 400 });
        }

        // Prepare records
        const records = images.map(img => ({
            user_id: user.id,
            image_url: img.image_url,
            thumbnail_url: img.thumbnail_url || img.image_url,
            metadata: img.metadata || {}
        }));

        // Insert images
        const { data, error } = await supabaseAdmin
            .from('user_gallery')
            .insert(records)
            .select();

        if (error) {
            console.error('[API] Error adding to gallery:', error);
            return NextResponse.json({ error: 'Failed to add images' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            images: data,
            count: data?.length || 0
        }, { status: 201 });

    } catch (error: any) {
        console.error('[API] Error in POST /api/gallery:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/gallery - Delete images from gallery
 */
export async function DELETE(req: NextRequest) {
    try {
        // Get auth token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await req.json();
        const { imageIds } = body; // Array of image IDs to delete

        if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
            return NextResponse.json({ error: 'Image IDs array required' }, { status: 400 });
        }

        // Delete images (only user's own images)
        const { error } = await supabaseAdmin
            .from('user_gallery')
            .delete()
            .in('id', imageIds)
            .eq('user_id', user.id);

        if (error) {
            console.error('[API] Error deleting from gallery:', error);
            return NextResponse.json({ error: 'Failed to delete images' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            deleted: imageIds.length
        });

    } catch (error: any) {
        console.error('[API] Error in DELETE /api/gallery:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
