import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon/client';

export async function GET(req: NextRequest) {
    try {
        const data = await sql`
            SELECT * FROM tools 
            ORDER BY created_at DESC
        `;

        return NextResponse.json({ data: data || [] });
    } catch (error: any) {
        console.error('Server error fetching tools:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
