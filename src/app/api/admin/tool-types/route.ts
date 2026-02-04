import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';
import { verifyAdminAuth } from '@/lib/admin-auth';

/**
 * GET /api/admin/tool-types
 * Lấy danh sách tất cả tool types
 * Updated: DB import fix
 */
export async function GET(request: NextRequest) {
    try {
        // Verify admin authentication
        const authError = await verifyAdminAuth(request);
        if (authError) return authError;

        const result = await sql`
            SELECT id, code, name, name_vi, description, icon, component, sort_order
            FROM tool_types
            ORDER BY sort_order ASC, id ASC
        `;

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('[API] Error fetching tool types:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
