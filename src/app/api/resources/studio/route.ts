import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

/**
 * Helper to verify Admin access.
 */
async function verifyAdmin(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
        const result = await sql`
            SELECT user_id, role, email FROM users
            WHERE email = ${session.user.email}
            LIMIT 1
        `;

        if (result && result.length > 0) {
            const userType = result[0];
            if (userType.role === 'admin' || userType.role === 'editor') {
                return {
                    id: userType.user_id,
                    email: userType.email,
                    role: userType.role
                };
            }
        }
    }

    return null;
}

/**
 * GET /api/resources/studio - Fetch all studios
 */
export async function GET(request: NextRequest) {
    try {
        console.log('[API] Fetching studios (Server-Side Neon)');

        // Join with categories to get category name
        const data = await sql`
            SELECT 
                s.*,
                c.name as category_name
            FROM studio s
            LEFT JOIN categories c ON s.category = c.id
            ORDER BY s.created_at DESC
        `;

        // Map to include categories object for easier access
        const studios = data.map((studio: any) => ({
            ...studio,
            categories: studio.category_name ? { name: studio.category_name } : null
        }));

        return NextResponse.json({ success: true, data: studios || [] });
    } catch (error: any) {
        console.error('[API] Error fetching studios:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/resources/studio - Create new studio
 */
export async function POST(request: NextRequest) {
    const user = await verifyAdmin(request);
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, slug, description, category, preview_image_url, sort_order, is_active, prompts } = body;

        const result = await sql`
            INSERT INTO studio (name, slug, description, category, preview_image_url, sort_order, is_active, prompts, created_at)
            VALUES (
                ${name}, 
                ${slug}, 
                ${description || ''}, 
                ${category || null}, 
                ${preview_image_url || ''}, 
                ${sort_order || 0}, 
                ${is_active !== false}, 
                ${JSON.stringify(prompts || [])}::jsonb, 
                NOW()
            )
            RETURNING *
        `;

        return NextResponse.json({ success: true, data: result[0] });
    } catch (error: any) {
        console.error('[API] Error creating studio:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/resources/studio - Update studio
 */
export async function PUT(request: NextRequest) {
    const user = await verifyAdmin(request);
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

        // Get current studio
        const currentStudio = await sql`SELECT * FROM studio WHERE id = ${id} LIMIT 1`;
        if (currentStudio.length === 0) {
            return NextResponse.json({ success: false, error: 'Studio not found' }, { status: 404 });
        }

        const existing = currentStudio[0];

        // Merge updates with existing values
        const name = updates.name !== undefined ? updates.name : existing.name;
        const slug = updates.slug !== undefined ? updates.slug : existing.slug;
        const description = updates.description !== undefined ? updates.description : existing.description;
        const category = updates.category !== undefined ? updates.category : existing.category;
        const preview_image_url = updates.preview_image_url !== undefined ? updates.preview_image_url : existing.preview_image_url;
        const sort_order = updates.sort_order !== undefined ? updates.sort_order : existing.sort_order;
        const is_active = updates.is_active !== undefined ? updates.is_active : existing.is_active;
        const prompts = updates.prompts !== undefined ? JSON.stringify(updates.prompts) : JSON.stringify(existing.prompts);

        await sql`
            UPDATE studio 
            SET 
                name = ${name}, 
                slug = ${slug}, 
                description = ${description}, 
                category = ${category}, 
                preview_image_url = ${preview_image_url}, 
                sort_order = ${sort_order}, 
                is_active = ${is_active}, 
                prompts = ${prompts}::jsonb
            WHERE id = ${id}
        `;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API] Error updating studio:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/resources/studio - Delete studio
 */
export async function DELETE(request: NextRequest) {
    const user = await verifyAdmin(request);
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

        await sql`
            DELETE FROM studio 
            WHERE id = ${id}
        `;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API] Error deleting studio:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
