import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { sql } from '@/lib/postgres/client'; // Use Neon for speed/consistency

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id || (session.user as any).user_id;

        // Fetch User Data from Neon including subscription info
        const users = await sql`
            SELECT role, current_credits, subscription_type, subscription_expires_at 
            FROM users 
            WHERE user_id = ${userId}
        `;

        if (users.length === 0) {
            // User might need to be synced/created? Or just return default
            return NextResponse.json({
                role: 'user',
                current_credits: 0,
                subscription_type: null,
                subscription_expires_at: null,
                is_fresh: true
            });
        }

        const user = users[0];

        return NextResponse.json({
            role: user.role,
            current_credits: user.current_credits,
            subscription_type: user.subscription_type,
            subscription_expires_at: user.subscription_expires_at
        });

    } catch (error: any) {
        console.error("[API] /api/user/me error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
