import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';

/**
 * GET /api/admin/tool-custom?tool_type_id=1
 * Lấy danh sách tool custom theo tool_type_id
 * Updated: Support domain_prompts
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const toolTypeId = searchParams.get('tool_type_id');

        if (!toolTypeId) {
            return NextResponse.json(
                { success: false, error: 'tool_type_id is required' },
                { status: 400 }
            );
        }

        const result = await sql`
            SELECT 
                tc.id,
                tc.tool_type_id,
                tc.category_id,
                tc.name,
                tc.slug,
                tc.description,
                tc.preview_image_url,
                tc.domain_prompts,
                tc.ui_config,
                tc.status,
                tc.sort_order,
                tc.tags,
                tc.created_at,
                tc.updated_at,
                tt.name as tool_type_name,
                tt.name_vi as tool_type_name_vi,
                c.name as category_name,
                c.name_vi as category_name_vi
            FROM tool_custom tc
            LEFT JOIN tool_types tt ON tc.tool_type_id = tt.id
            LEFT JOIN cate_tool_custom c ON tc.category_id = c.id
            WHERE tc.tool_type_id = ${toolTypeId}
            ORDER BY tc.sort_order ASC, tc.id DESC
        `;
        // Removed `prompts` JSON column from select as we use prompt_templates now

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('[API] Error fetching tool custom:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/tool-custom
 * Tạo mới tool custom
 * Updated: Support domain_prompts + Auto-fix sequence
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            tool_type_id,
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
        if (!tool_type_id || !name || !slug) {
            return NextResponse.json(
                { success: false, error: 'tool_type_id, name, and slug are required' },
                { status: 400 }
            );
        }

        // Check if slug already exists for this tool_type_id
        const existing = await sql`
            SELECT id FROM tool_custom 
            WHERE tool_type_id = ${tool_type_id} AND slug = ${slug}
        `;

        if (existing.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Slug already exists for this tool type' },
                { status: 409 }
            );
        }

        try {
            const result = await sql`
                INSERT INTO tool_custom (
                    tool_type_id,
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
                ) VALUES (
                    ${tool_type_id},
                    ${category_id || null},
                    ${name},
                    ${slug},
                    ${description || ''},
                    ${preview_image_url || ''},
                    ${domain_prompts || ''},
                    ${JSON.stringify(ui_config || {})}::jsonb,
                    ${status || 'active'},
                    ${sort_order || 0},
                    ${tags || []}
                )
                RETURNING *
            `;

            return NextResponse.json({
                success: true,
                data: result[0]
            });
        } catch (insertError: any) {
            // Handle duplicate key error (23505) specifically for primary key (pkey)
            // This happens when the sequence is out of sync
            if (insertError.code === '23505' && insertError.constraint === 'tool_custom_pkey') {
                console.log('[API] Primary key violation detected. Attempting to fix sequence...');

                // Fix sequence
                await sql`SELECT setval('tool_custom_id_seq', (SELECT MAX(id) FROM tool_custom))`;

                // Content retry logic
                console.log('[API] Sequence fixed. Retrying insert...');
                const result = await sql`
                    INSERT INTO tool_custom (
                        tool_type_id,
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
                    ) VALUES (
                        ${tool_type_id},
                        ${category_id || null},
                        ${name},
                        ${slug},
                        ${description || ''},
                        ${preview_image_url || ''},
                        ${domain_prompts || ''},
                        ${JSON.stringify(ui_config || {})}::jsonb,
                        ${status || 'active'},
                        ${sort_order || 0},
                        ${tags || []}
                    )
                    RETURNING *
                `;

                return NextResponse.json({
                    success: true,
                    data: result[0]
                });
            }
            throw insertError;
        }

    } catch (error: any) {
        console.error('[API] Error creating tool custom:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
