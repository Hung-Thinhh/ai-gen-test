import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { sql } from '@/lib/neon/client';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = (session.user as any).id;

        const profiles = await sql`
            SELECT gallery FROM profiles WHERE id = ${userId}
        `;

        let gallery: string[] = [];
        if (profiles.length > 0 && profiles[0].gallery && Array.isArray(profiles[0].gallery)) {
            gallery = profiles[0].gallery.reverse();
        }

        return NextResponse.json({ gallery });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = (session.user as any).id;
        const { urls } = await req.json();

        if (!urls || !Array.isArray(urls)) return NextResponse.json({ error: 'Invalid URLs' }, { status: 400 });

        // Atomic Upsert: Append to array
        // Note: Neon/Postgres array_append or || operator
        await sql`
            INSERT INTO profiles (id, gallery, last_updated)
            VALUES (${userId}, ${urls}, NOW())
            ON CONFLICT (id) 
            DO UPDATE SET 
                gallery = profiles.gallery || EXCLUDED.gallery,
                last_updated = NOW()
        `;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = (session.user as any).id;
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
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
