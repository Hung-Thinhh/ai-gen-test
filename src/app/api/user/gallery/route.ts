import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { sql } from '@/lib/neon/client';
import { getUserByEmail } from '@/lib/neon/queries';

// Helper to get UUID from session
async function getUUIDFromSession(session: any): Promise<string | null> {
    console.log('[Gallery] getUUIDFromSession called');
    console.log('[Gallery] session.user.email:', session?.user?.email);

    if (!session?.user?.email) {
        console.log('[Gallery] No email in session, returning null');
        return null;
    }

    console.log('[Gallery] Fetching user from DB by email:', session.user.email);
    const userData = await getUserByEmail(session.user.email);
    console.log('[Gallery] getUserByEmail result:', userData);

    if (userData) {
        console.log('[Gallery] ✅ Found UUID:', userData.user_id);
        return userData.user_id;
    } else {
        console.log('[Gallery] ⚠️ User not found in DB');
        return null;
    }
}

export async function GET(req: NextRequest) {
    try {
        console.log('[Gallery GET] Starting...');
        const session = await getServerSession(authOptions);
        console.log('[Gallery GET] Session:', session ? 'exists' : 'null');

        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = await getUUIDFromSession(session);
        console.log('[Gallery GET] userId after getUUIDFromSession:', userId);

        if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const profiles = await sql`
            SELECT gallery FROM profiles WHERE id = ${userId}
        `;

        let gallery: string[] = [];
        if (profiles.length > 0 && profiles[0].gallery && Array.isArray(profiles[0].gallery)) {
            gallery = profiles[0].gallery.reverse();
        }

        return NextResponse.json({ gallery });
    } catch (e: any) {
        console.error('[API] GET /api/user/gallery error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = await getUUIDFromSession(session);
        if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const { urls } = await req.json();

        if (!urls || !Array.isArray(urls)) return NextResponse.json({ error: 'Invalid URLs' }, { status: 400 });

        // Atomic Upsert: Append to JSONB array
        await sql`
            INSERT INTO profiles (id, gallery, last_updated)
            VALUES (${userId}, ${JSON.stringify(urls)}::jsonb, NOW())
            ON CONFLICT (id) 
            DO UPDATE SET 
                gallery = COALESCE(profiles.gallery, '[]'::jsonb) || ${JSON.stringify(urls)}::jsonb,
                last_updated = NOW()
        `;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('[API] POST /api/user/gallery error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = await getUUIDFromSession(session);
        if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const url_to_remove = req.nextUrl.searchParams.get('url');

        if (!url_to_remove) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

        // Remove item from array
        await sql`
            UPDATE profiles 
            SET gallery = array_remove(gallery, ${url_to_remove}),
                last_updated = NOW()
            WHERE id = ${userId}
        `;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('[API] DELETE /api/user/gallery error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
