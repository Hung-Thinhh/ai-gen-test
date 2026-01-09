import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// List of tables to export
const TABLES_TO_EXPORT = [
    'users',
    'prompts',
    'tools',
    'categories',
    'studio',
    'hero_banners',
    'system_configs',
    'generation_history',
    'payment_transactions',
    'guest_sessions'
];

export async function GET(request: NextRequest) {
    try {
        console.log('[Export] Starting database export...');

        const exportData: Record<string, any> = {
            exportDate: new Date().toISOString(),
            tables: {}
        };

        // Fetch data from each table
        for (const tableName of TABLES_TO_EXPORT) {
            try {
                const { data, error } = await supabaseAdmin
                    .from(tableName)
                    .select('*');

                if (error) {
                    console.error(`[Export] Error fetching ${tableName}:`, error);
                    exportData.tables[tableName] = { error: error.message, data: [] };
                } else {
                    exportData.tables[tableName] = {
                        count: data?.length || 0,
                        data: data || []
                    };
                    console.log(`[Export] ✅ Exported ${data?.length || 0} rows from ${tableName}`);
                }
            } catch (err: any) {
                console.error(`[Export] Exception fetching ${tableName}:`, err);
                exportData.tables[tableName] = { error: err.message, data: [] };
            }
        }

        // Return as downloadable JSON
        const filename = `supabase_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error: any) {
        console.error('[Export] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
