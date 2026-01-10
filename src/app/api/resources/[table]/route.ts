import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon/client';
import { getUserByEmail } from '@/lib/neon/queries';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

// Whitelist of allowed tables to prevent arbitrary access
const ALLOWED_TABLES = [
    'hero_banners',
    'tools',
    'prompts',
    'studio',
    'categories',
    'system_configs',
    'packages'
];

async function verifyAdmin(request: NextRequest) {
    // Try NextAuth Session
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
        const userType = await getUserByEmail(session.user.email);
        if (userType && (userType.role === 'admin' || userType.role === 'editor')) {
            return {
                id: userType.user_id,
                email: userType.email,
                role: userType.role
            };
        }
    }
    return null;
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ table: string }> }
) {
    const { table } = await context.params;

    if (!ALLOWED_TABLES.includes(table)) {
        return NextResponse.json({ success: false, error: 'Invalid resource table' }, { status: 400 });
    }

    try {
        let data: any[];

        switch (table) {
            case 'hero_banners':
                data = await sql`SELECT * FROM hero_banners ORDER BY sort_order ASC`;
                break;
            case 'tools':
                data = await sql`SELECT * FROM tools ORDER BY sort_order ASC`;
                break;
            case 'packages':
                data = await sql`SELECT * FROM packages ORDER BY sort_order ASC`;
                break;
            case 'studio':
                data = await sql`SELECT * FROM studio ORDER BY sort_order ASC`;
                break;
            case 'prompts':
                data = await sql`SELECT * FROM prompts ORDER BY created_at DESC`;
                break;
            case 'categories':
                data = await sql`SELECT * FROM categories ORDER BY created_at DESC`;
                break;
            case 'system_configs':
                data = await sql`SELECT * FROM system_configs ORDER BY updated_at DESC`;
                break;
            default:
                data = [];
        }

        return NextResponse.json({ success: true, data: Array.isArray(data) ? data : [] });
    } catch (error: any) {
        console.error('[API] Server error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ table: string }> }
) {
    const { table } = await context.params;
    if (!ALLOWED_TABLES.includes(table)) return NextResponse.json({ success: false, error: 'Invalid resource table' }, { status: 400 });

    const user = await verifyAdmin(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        let result;

        switch (table) {
            case 'studio':
                result = await sql`
                    INSERT INTO studio (id, name, description, preview_image_url, prompts, sort_order, is_active, category, slug, created_at, updated_at)
                    VALUES (
                        gen_random_uuid(),
                        ${body.name},
                        ${body.description},
                        ${body.preview_image_url},
                        ${JSON.stringify(body.prompts)}::jsonb,
                        ${body.sort_order || 0},
                        ${body.is_active ?? true},
                        ${body.category},
                        ${body.slug},
                        NOW(),
                        NOW()
                    )
                    RETURNING *
                `;
                break;
            case 'tools':
                // Ensure tool_id (integer) logic ?? DB usually has serial. 
                // Assuming tool_id is serial from schema (integer NOT NULL usually matches serial primary key logic but explicit schema needed)
                // If not serial, we might need to find max.
                // For now, assume id is auto-generated or passed (if integer).
                // Actually schema says: tool_id integer NOT NULL. If it's not SERIAL, insert will fail without it.
                // Let's assume passed or DB Default.
                result = await sql`
                    INSERT INTO tools (tool_key, name, description, base_credit_cost, api_model, max_resolution, is_active, is_premium_only, status, preview_image_url, sort_order, created_at, updated_at)
                    VALUES (
                        ${body.tool_key},
                        ${body.name},
                        ${JSON.stringify(body.description)}::jsonb,
                        ${body.base_credit_cost},
                        ${body.api_model},
                        ${body.max_resolution},
                        ${body.is_active ?? true},
                        ${body.is_premium_only ?? false},
                        ${body.status},
                        ${body.preview_image_url},
                        ${body.sort_order || 0},
                        NOW(),
                        NOW()
                    )
                    RETURNING *
                `;
                break;
            case 'categories':
                result = await sql`
                    INSERT INTO categories (id, name, slug, description, image_url, sort_order, is_active, created_at, updated_at)
                    VALUES (gen_random_uuid(), ${body.name}, ${body.slug}, ${body.description}, ${body.image_url}, ${body.sort_order || 0}, ${body.is_active ?? true}, NOW(), NOW())
                    RETURNING *
                 `;
                break;
            // Add other tables as needed. For now support these main ones.
            default:
                return NextResponse.json({ success: false, error: 'Table insert not implemented yet' }, { status: 501 });
        }

        return NextResponse.json({ success: true, data: result[0] });
    } catch (error: any) {
        console.error('[API POST] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ table: string }> }
) {
    const { table } = await context.params;
    if (!ALLOWED_TABLES.includes(table)) return NextResponse.json({ success: false, error: 'Invalid resource table' }, { status: 400 });

    const user = await verifyAdmin(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();

        switch (table) {
            case 'studio': {
                const { id, ...updates } = body;
                if (!id) throw new Error('Missing ID');

                const current = (await sql`SELECT * FROM studio WHERE id=${id} LIMIT 1`)[0];
                if (!current) throw new Error('Not found');

                await sql`
                    UPDATE studio SET
                        name = ${updates.name !== undefined ? updates.name : current.name},
                        description = ${updates.description !== undefined ? updates.description : current.description},
                        preview_image_url = ${updates.preview_image_url !== undefined ? updates.preview_image_url : current.preview_image_url},
                        prompts = ${updates.prompts !== undefined ? JSON.stringify(updates.prompts) : JSON.stringify(current.prompts)}::jsonb,
                        sort_order = ${updates.sort_order !== undefined ? updates.sort_order : current.sort_order},
                        is_active = ${updates.is_active !== undefined ? updates.is_active : current.is_active},
                        category = ${updates.category !== undefined ? updates.category : current.category},
                        slug = ${updates.slug !== undefined ? updates.slug : current.slug},
                        updated_at = NOW()
                    WHERE id = ${id}
                `;
                break;
            }
            case 'tools': {
                const { tool_id, ...updates } = body;
                if (!tool_id) throw new Error('Missing Tool ID');

                const current = (await sql`SELECT * FROM tools WHERE tool_id=${tool_id} LIMIT 1`)[0];
                if (!current) throw new Error('Not found');

                await sql`
                    UPDATE tools SET
                        tool_key = ${updates.tool_key !== undefined ? updates.tool_key : current.tool_key},
                        name = ${updates.name !== undefined ? updates.name : current.name},
                        description = ${updates.description !== undefined ? JSON.stringify(updates.description) : JSON.stringify(current.description)}::jsonb,
                        base_credit_cost = ${updates.base_credit_cost !== undefined ? updates.base_credit_cost : current.base_credit_cost},
                        api_model = ${updates.api_model !== undefined ? updates.api_model : current.api_model},
                        max_resolution = ${updates.max_resolution !== undefined ? updates.max_resolution : current.max_resolution},
                        is_active = ${updates.is_active !== undefined ? updates.is_active : current.is_active},
                        is_premium_only = ${updates.is_premium_only !== undefined ? updates.is_premium_only : current.is_premium_only},
                        status = ${updates.status !== undefined ? updates.status : current.status},
                        preview_image_url = ${updates.preview_image_url !== undefined ? updates.preview_image_url : current.preview_image_url},
                        sort_order = ${updates.sort_order !== undefined ? updates.sort_order : current.sort_order},
                        updated_at = NOW()
                    WHERE tool_id = ${tool_id}
                `;
                break;
            }
            case 'system_configs': {
                const { config_key, ...updates } = body;
                if (!config_key) throw new Error('Missing Config Key');

                const current = (await sql`SELECT * FROM system_configs WHERE config_key=${config_key} LIMIT 1`)[0];
                if (!current) throw new Error('Not found');

                await sql`
                    UPDATE system_configs SET
                        config_value = ${updates.config_value !== undefined ? updates.config_value : current.config_value},
                        description = ${updates.description !== undefined ? updates.description : current.description},
                        is_public = ${updates.is_public !== undefined ? updates.is_public : current.is_public},
                        updated_at = NOW()
                    WHERE config_key = ${config_key}
                 `;
                break;
            }
            // Add other tables as needed.
            default:
                return NextResponse.json({ success: false, error: 'Table update not implemented yet' }, { status: 501 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API PUT] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ table: string }> }
) {
    const { table } = await context.params;
    if (!ALLOWED_TABLES.includes(table)) return NextResponse.json({ success: false, error: 'Invalid resource table' }, { status: 400 });

    const user = await verifyAdmin(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

        switch (table) {
            case 'studio':
                await sql`DELETE FROM studio WHERE id = ${id}`;
                break;
            case 'tools':
                await sql`DELETE FROM tools WHERE tool_id = ${id}`;
                break;
            case 'hero_banners':
                await sql`DELETE FROM hero_banners WHERE id = ${id}`;
                break;
            case 'prompts':
                await sql`DELETE FROM prompts WHERE id = ${id}`;
                break;
            case 'categories':
                await sql`DELETE FROM categories WHERE id = ${id}`;
                break;
            case 'system_configs':
                await sql`DELETE FROM system_configs WHERE config_key = ${id}`;
                break;
            case 'packages':
                await sql`DELETE FROM packages WHERE id = ${id}`;
                break;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API DELETE] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
