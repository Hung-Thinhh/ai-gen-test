import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon/client';

export async function GET(req: NextRequest) {
    try {
        const data = await sql`
            SELECT * FROM prompts 
            ORDER BY created_at DESC
        `;

        return NextResponse.json({ data: data || [] });
    } catch (error: any) {
        console.error('Server error fetching prompts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
