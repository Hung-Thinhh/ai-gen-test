import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';

/**
 * GET /api/data/[type] - Get static data (tools, prompts, categories)
 * Supports: tools, prompts, categories
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ type: string }> }
) {
    try {
        const { type } = await params;

        // Validate type
        const validTypes = ['tools', 'prompts', 'categories'];
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
        }

        let data: any[] = [];

        // Safe query execution based on type
        // Note: Neon sql helper parameters are for values, not table names.
        // We use explicit queries for each table for safety.
        switch (type) {
            case 'tools':
                data = await sql`SELECT * FROM tools ORDER BY created_at DESC`;
                break;
            case 'prompts':
                data = await sql`SELECT * FROM prompts ORDER BY created_at DESC`;
                break;
            case 'categories':
                data = await sql`SELECT * FROM categories ORDER BY created_at DESC`;
                break;
        }

        return NextResponse.json({ [type]: data || [] });

    } catch (error: any) {
        console.error('[API] Error in GET /api/data/[type]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
