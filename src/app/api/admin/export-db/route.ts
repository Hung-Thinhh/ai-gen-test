import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';


// Map of tables to explicit query functions to avoid dynamic SQL issues
const EXPORT_QUERIES: Record<string, () => Promise<any[]>> = {
    users: () => sql`SELECT * FROM users`,
    prompts: () => sql`SELECT * FROM prompts`,
    tools: () => sql`SELECT * FROM tools`,
    categories: () => sql`SELECT * FROM categories`,
    studio: () => sql`SELECT * FROM studio`,
    hero_banners: () => sql`SELECT * FROM hero_banners`,
    system_configs: () => sql`SELECT * FROM system_configs`,
    generation_history: () => sql`SELECT * FROM generation_history`,
    payment_transactions: () => sql`SELECT * FROM payment_transactions`,
    guest_sessions: () => sql`SELECT * FROM guest_sessions`,
    packages: () => sql`SELECT * FROM packages`,
    user_gallery: () => sql`SELECT * FROM user_gallery`,
    guest_gallery: () => sql`SELECT * FROM guest_gallery`
};

export async function GET(request: NextRequest) {
    try {
        console.log('[Export] Starting database export from Neon...');

        const exportData: Record<string, any> = {
            exportDate: new Date().toISOString(),
            source: 'Neon Database',
            tables: {}
        };

        // Fetch data from each table using explicit queries
        for (const [tableName, queryFn] of Object.entries(EXPORT_QUERIES)) {
            try {
                const data = await queryFn();

                exportData.tables[tableName] = {
                    count: data?.length || 0,
                    data: data || []
                };
                console.log(`[Export] ✅ Exported ${data?.length || 0} rows from ${tableName}`);
            } catch (err: any) {
                console.error(`[Export] Exception fetching ${tableName}:`, err);
                // Don't crash entire export if one table fails (e.g. missing table)
                exportData.tables[tableName] = { error: err.message, data: [] };
            }
        }

        // Return as downloadable JSON
        const filename = `neon_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

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
