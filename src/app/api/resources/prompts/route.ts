
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon/client';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

/**
 * Helper to verify Admin access.
 */
async function verifyAdmin(request: NextRequest) {
    // 1. Try NextAuth Session (Preferred)
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
        const result = await sql`
            SELECT user_id, role, email FROM users
            WHERE email = ${session.user.email}
            LIMIT 1
        `;

        if (result && result.length > 0) {
            const userType = result[0];
            if (userType.role === 'admin' || userType.role === 'editor') {
                return {
                    id: userType.user_id,
                    email: userType.email,
                    role: userType.role
                };
            }
        }
    }

    // 2. Fallback: Authorization Header check (if needed, but without Supabase client it's hard to verify JWT easily)
    // Assuming we are migrating to full Session-based auth for admin actions.

    return null;
}

export async function GET(request: NextRequest) {
    try {
        console.log('[API] Fetching prompts (Server-Side Neon)');
        const data = await sql`
            SELECT * FROM prompts
            ORDER BY created_at DESC
        `;

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error: any) {
        console.error('[API] Error fetching prompts:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


export async function POST(request: NextRequest) {
    const user = await verifyAdmin(request);
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Ensure category_ids is jsonb-ready
        // Code expects object with fields matching DB columns
        const { avt_url, content, usage, category_ids } = body;

        // Note: 'prompts' table ID is INTEGER NOT NULL.
        // Usually it's serial/identity. We assume schema handles auto-increment.

        const result = await sql`
            INSERT INTO prompts (avt_url, content, usage, category_ids, created_at)
            VALUES (
                ${avt_url}, 
                ${content}, 
                ${usage}, 
                ${JSON.stringify(category_ids)}::jsonb, 
                NOW()
            )
            RETURNING *
        `;

        return NextResponse.json({ success: true, data: result[0] });
    } catch (error: any) {
        console.error('[API] Error creating prompt:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const user = await verifyAdmin(request);
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

        // Construct dynamic update
        // We handle specific fields to be safe
        // Or if updates keys match columns exactly:
        // Neon sql helper doesn't support dynamic object keys easily without helper utility
        // but we know likely fields: avt_url, content, usage, category_ids

        // This is a bit verbose but safe
        const currentPrompt = await sql`SELECT * FROM prompts WHERE id = ${id} LIMIT 1`;
        if (currentPrompt.length === 0) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

        const existing = currentPrompt[0];

        // Merge updates
        const avt_url = updates.avt_url !== undefined ? updates.avt_url : existing.avt_url;
        const content = updates.content !== undefined ? updates.content : existing.content;
        const usage = updates.usage !== undefined ? updates.usage : existing.usage;
        const category_ids = updates.category_ids !== undefined ? JSON.stringify(updates.category_ids) : JSON.stringify(existing.category_ids);

        await sql`
            UPDATE prompts 
            SET avt_url = ${avt_url}, 
                content = ${content}, 
                usage = ${usage}, 
                category_ids = ${category_ids}::jsonb
            WHERE id = ${id}
        `;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API] Error updating prompt:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const user = await verifyAdmin(request);
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

        await sql`
            DELETE FROM prompts 
            WHERE id = ${id}
        `;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
