import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@/lib/postgres/client';

// GET all packages
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check admin role (optional - uncomment if you want admin-only access)
        // if (!session?.user || (session.user as any).role !== 'admin') {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const packages = await sql`
            SELECT package_id, name, description, price, credits, duration_days, is_active
            FROM packages
            ORDER BY price ASC
        `;

        return NextResponse.json({ packages });
    } catch (error: any) {
        console.error('[API] GET /api/admin/packages error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
