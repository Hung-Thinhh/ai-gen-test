import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/data/[type] - Get static data (tools, prompts, categories)
 * Supports: tools, prompts, categories
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ type: string }> }
) {
    try {
        // Await params in Next.js 15+
        const { type } = await params;

        // Validate type
        const validTypes = ['tools', 'prompts', 'categories'];
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
        }

        // Get data from appropriate table
        const { data, error } = await supabaseAdmin
            .from(type)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(`[API] Error fetching ${type}:`, error);
            return NextResponse.json({ [type]: [] });
        }

        return NextResponse.json({ [type]: data || [] });

    } catch (error: any) {
        console.error('[API] Error in GET /api/data/[type]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
