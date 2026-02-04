import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';
import { verifyAdminAuth } from '@/lib/admin-auth';

/**
 * GET /api/admin/prompts?tool_custom_id=X
 * Lấy danh sách prompts theo tool_custom_id
 */
export async function GET(request: NextRequest) {
    try {
        // Verify admin authentication
        const authError = await verifyAdminAuth(request);
        if (authError) return authError;

        const searchParams = request.nextUrl.searchParams;
        const toolCustomId = searchParams.get('tool_custom_id');

        if (!toolCustomId) {
            return NextResponse.json(
                { success: false, error: 'tool_custom_id is required' },
                { status: 400 }
            );
        }

        const result = await sql`
            SELECT id, tool_custom_id, category, name, name_vi, prompt_text, preview_image_url, metadata
            FROM prompt_templates
            WHERE tool_custom_id = ${toolCustomId}
            ORDER BY id ASC
        `;

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('[API] Error fetching prompts:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/prompts
 * Tạo prompt mới
 */
export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication
        const authError = await verifyAdminAuth(request);
        if (authError) return authError;

        const body = await request.json();
        const {
            tool_custom_id,
            category,
            name,
            name_vi,
            prompt_text,
            preview_image_url,
            metadata
        } = body;

        if (!tool_custom_id || !name || !prompt_text) {
            return NextResponse.json(
                { success: false, error: 'tool_custom_id, name, and prompt_text are required' },
                { status: 400 }
            );
        }

        const result = await sql`
            INSERT INTO prompt_templates (
                tool_custom_id,
                category,
                name,
                name_vi,
                prompt_text,
                preview_image_url,
                metadata
            ) VALUES (
                ${tool_custom_id},
                ${category || 'style_preset'},
                ${name},
                ${name_vi || name},
                ${prompt_text},
                ${preview_image_url || null},
                ${JSON.stringify(metadata || {})}::jsonb
            )
            RETURNING *
        `;

        return NextResponse.json({
            success: true,
            data: result[0]
        });
    } catch (error: any) {
        console.error('[API] Error creating prompt:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
