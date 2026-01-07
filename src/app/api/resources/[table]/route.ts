import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Whylist of allowed tables to prevent arbitrary access
const ALLOWED_TABLES = [
    'hero_banners',
    'tools',
    'prompts',
    'studio',
    'categories',
    'system_configs'
];

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ table: string }> } // Correct type for Next.js 15+ Params
) {
    const { table } = await context.params;

    // 1. Validate Table Name
    if (!ALLOWED_TABLES.includes(table)) {
        return NextResponse.json({ success: false, error: 'Invalid resource table' }, { status: 400 });
    }

    try {
        console.log(`[API] Fetching resource: ${table}`);

        let query = supabaseAdmin.from(table).select('*');

        // Optional: Apply default sorting based on table
        if (['hero_banners', 'tools', 'studio', 'prompts'].includes(table)) {
            // Check if sort_order column exists or just try sorting? 
            // Safer to just fetch and let client sort, OR assuming 'sort_order' exists if your schema is consistent.
            // For now, let's just fetch all. Simple is robust.
            // Actually, prompts might be huge, but 'getAllPrompts' fetches all... so it's fine.
        }

        // Special sorting for specific tables if known columns exist
        if (table === 'hero_banners' || table === 'packages') {
            query = query.order('sort_order', { ascending: true });
        } else if (table === 'tools' || table === 'studio') {
            query = query.order('sort_order', { ascending: true });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;

        if (error) {
            console.error(`[API] Error fetching ${table}:`, error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: data });
    } catch (error) {
        console.error('[API] Server error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
