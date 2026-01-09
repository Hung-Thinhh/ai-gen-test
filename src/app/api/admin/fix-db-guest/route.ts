import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon/client';

export async function GET() {
    try {
        console.log('Fixing generation_history schema (guest_id)...');

        // Alter guest_id to be NULLABLE
        await sql`ALTER TABLE generation_history ALTER COLUMN guest_id DROP NOT NULL`;

        return NextResponse.json({ success: true, message: 'Fixed: Set guest_id to NULLABLE' });
    } catch (e: any) {
        console.error('Fix DB Error:', e);
        return NextResponse.json({ error: e.message });
    }
}
