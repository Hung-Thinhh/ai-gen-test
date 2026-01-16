/**
 * API Route: Get Tool Custom Studios
 * GET /api/tool-custom - List all studios
 * GET /api/tool-custom?tool_type=poster - Filter by tool type
 * GET /api/tool-custom?slug=milk-tea-poster - Get by slug
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const toolType = searchParams.get('tool_type');
        const slug = searchParams.get('slug');
        const categorySlug = searchParams.get('category');

        // Get by slug (single studio)
        if (slug) {
            const result = await sql`
        SELECT 
          tc.*,
          tt.code as tool_type_code,
          tt.name as tool_type_name,
          c.slug as category_slug,
          c.name as category_name,
          c.name_vi as category_name_vi
        FROM tool_custom tc
        LEFT JOIN tool_types tt ON tc.tool_type_id = tt.id
        LEFT JOIN cate_tool_custom c ON tc.category_id = c.id
        WHERE tc.slug = ${slug}
          AND tc.status = 'active'
        LIMIT 1
      `;

            if (result.length === 0) {
                return NextResponse.json(
                    { error: 'Studio not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json(result[0]);
        }

        // List studios with filters
        if (toolType && categorySlug) {
            const result = await sql`
        SELECT 
          tc.*,
          tt.code as tool_type_code,
          tt.name as tool_type_name,
          c.slug as category_slug,
          c.name as category_name,
          c.name_vi as category_name_vi
        FROM tool_custom tc
        LEFT JOIN tool_types tt ON tc.tool_type_id = tt.id
        LEFT JOIN cate_tool_custom c ON tc.category_id = c.id
        WHERE tc.status = 'active'
          AND tt.code = ${toolType}
          AND c.slug = ${categorySlug}
        ORDER BY tc.sort_order ASC, tc.created_at DESC
      `;
            return NextResponse.json(result);
        } else if (toolType) {
            const result = await sql`
        SELECT 
          tc.*,
          tt.code as tool_type_code,
          tt.name as tool_type_name,
          c.slug as category_slug,
          c.name as category_name,
          c.name_vi as category_name_vi
        FROM tool_custom tc
        LEFT JOIN tool_types tt ON tc.tool_type_id = tt.id
        LEFT JOIN cate_tool_custom c ON tc.category_id = c.id
        WHERE tc.status = 'active'
          AND tt.code = ${toolType}
        ORDER BY tc.sort_order ASC, tc.created_at DESC
      `;
            return NextResponse.json(result);
        } else if (categorySlug) {
            const result = await sql`
        SELECT 
          tc.*,
          tt.code as tool_type_code,
          tt.name as tool_type_name,
          c.slug as category_slug,
          c.name as category_name,
          c.name_vi as category_name_vi
        FROM tool_custom tc
        LEFT JOIN tool_types tt ON tc.tool_type_id = tt.id
        LEFT JOIN cate_tool_custom c ON tc.category_id = c.id
        WHERE tc.status = 'active'
          AND c.slug = ${categorySlug}
        ORDER BY tc.sort_order ASC, tc.created_at DESC
      `;
            return NextResponse.json(result);
        } else {
            // No filters - get all active studios
            const result = await sql`
        SELECT 
          tc.*,
          tt.code as tool_type_code,
          tt.name as tool_type_name,
          c.slug as category_slug,
          c.name as category_name,
          c.name_vi as category_name_vi
        FROM tool_custom tc
        LEFT JOIN tool_types tt ON tc.tool_type_id = tt.id
        LEFT JOIN cate_tool_custom c ON tc.category_id = c.id
        WHERE tc.status = 'active'
        ORDER BY tc.sort_order ASC, tc.created_at DESC
      `;
            return NextResponse.json(result);
        }

    } catch (error) {
        console.error('[API] /api/tool-custom GET error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch studios' },
            { status: 500 }
        );
    }
}
