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
    const toolTypeId = searchParams.get('tool_type_id');
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
          { success: false, error: 'Studio not found' },
          { status: 404 }
        );
      }

      // Fetch style presets for this tool
      const stylePresets = await sql`
        SELECT id, name, name_vi, prompt_text, metadata
        FROM prompt_templates
        WHERE tool_custom_id = ${result[0].id}
        ORDER BY id ASC
      `;

      return NextResponse.json({
        success: true,
        data: {
          ...result[0],
          style_presets: stylePresets
        }
      });
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
    } else if (toolTypeId) {
      const typeId = parseInt(toolTypeId, 10);
      if (isNaN(typeId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid tool_type_id' },
          { status: 400 }
        );
      }
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
          AND tc.tool_type_id = ${typeId}
        ORDER BY tc.sort_order ASC, tc.created_at DESC
      `;
      return NextResponse.json({ success: true, data: result });
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
