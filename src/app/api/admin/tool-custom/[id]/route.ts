import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';

/**
 * PUT /api/admin/tool-custom/[id]
 * Cập nhật tool custom
 * Updated: Support domain_prompts
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            category_id,
            name,
            slug,
            description,
            preview_image_url,
            domain_prompts,
            ui_config,
            status,
            sort_order,
            tags
        } = body;

        // Validate required fields
        if (!name || !slug) {
            return NextResponse.json(
                { success: false, error: 'name and slug are required' },
                { status: 400 }
            );
        }

        // Check if tool exists
        const existing = await sql`
            SELECT id, tool_type_id FROM tool_custom WHERE id = ${id}
        `;

        if (existing.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Tool custom not found' },
                { status: 404 }
            );
        }

        const toolTypeId = existing[0].tool_type_id;

        // Check duplication
        const duplicate = await sql`
            SELECT id FROM tool_custom 
            WHERE tool_type_id = ${toolTypeId} AND slug = ${slug} AND id != ${id}
        `;

        if (duplicate.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Slug already exists for this tool type' },
                { status: 409 }
            );
        }

        const result = await sql`
            UPDATE tool_custom SET
                category_id = ${category_id || null},
                name = ${name},
                slug = ${slug},
                description = ${description || ''},
                preview_image_url = ${preview_image_url || ''},
                domain_prompts = ${domain_prompts || ''},
                ui_config = ${JSON.stringify(ui_config || {})}::jsonb,
                status = ${status || 'active'},
                sort_order = ${sort_order || 0},
                tags = ${tags || []},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING *
        `;

        return NextResponse.json({
            success: true,
            data: result[0]
        });
    } catch (error: any) {
        console.error('[API] Error updating tool custom:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/tool-custom/[id]
 * Xóa tool custom
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const result = await sql`
            DELETE FROM tool_custom WHERE id = ${id}
            RETURNING id
        `;

        if (result.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Tool custom not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Tool custom deleted successfully'
        });
    } catch (error: any) {
        console.error('[API] Error deleting tool custom:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
