import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';
import { verifyAdminAuth } from '@/lib/admin-auth';

// GET all packages
export async function GET(req: NextRequest) {
    try {
        // Verify admin authentication
        const authError = await verifyAdminAuth(req);
        if (authError) return authError;

        const packages = await sql`
            SELECT package_id, name, description, price, credits, duration_days, is_active
            FROM packages
            ORDER BY price ASC
        `;

        return NextResponse.json({ packages });
    } catch (error: any) {
        console.error('[API] GET /api/admin/packages error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
