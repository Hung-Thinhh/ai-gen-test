import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sql } from '@/lib/postgres/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
    try {
        // Try getting NextAuth session
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json(
                { isAdmin: false, role: null, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user role from Neon database
        const result = await sql`
            SELECT role, user_id FROM users 
            WHERE email = ${session.user.email} 
            LIMIT 1
        `;

        if (!result || result.length === 0) {
            return NextResponse.json(
                { isAdmin: false, role: null, error: 'User not found in database' },
                { status: 404 }
            );
        }

        const userData = result[0];
        const isAdmin = userData.role === 'admin';

        return NextResponse.json({
            isAdmin,
            role: userData.role,
            userId: userData.user_id
        });

    } catch (error: any) {
        console.error('[Admin Verify API] Error:', error);
        return NextResponse.json(
            { isAdmin: false, role: null, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
