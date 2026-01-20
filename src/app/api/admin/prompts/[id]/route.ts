import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';

/**
 * PUT /api/admin/prompts/[id]
 * Cập nhật prompt
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            category,
            name,
            name_vi,
            prompt_text,
            preview_image_url,
            metadata
        } = body;

        if (!name || !prompt_text) {
            return NextResponse.json(
                { success: false, error: 'name and prompt_text are required' },
                { status: 400 }
            );
        }

        const result = await sql`
            UPDATE prompt_templates SET
                category = ${category || 'style_preset'},
                name = ${name},
                name_vi = ${name_vi || name},
                prompt_text = ${prompt_text},
                preview_image_url = ${preview_image_url || null},
                metadata = ${JSON.stringify(metadata || {})}::jsonb,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING *
        `;

        if (result.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Prompt not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result[0]
        });
    } catch (error: any) {
        console.error('[API] Error updating prompt:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/prompts/[id]
 * Xóa prompt
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const result = await sql`
            DELETE FROM prompt_templates WHERE id = ${id}
            RETURNING id
        `;

        if (result.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Prompt not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Prompt deleted successfully'
        });
    } catch (error: any) {
        console.error('[API] Error deleting prompt:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
