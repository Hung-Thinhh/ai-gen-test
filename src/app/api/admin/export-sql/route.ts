import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// List of tables to export (in order of dependencies)
const TABLES_TO_EXPORT = [
    'users',
    'categories',
    'tools',
    'studio',
    'prompts',
    'hero_banners',
    'system_configs',
    'generation_history',
    'payment_transactions',
    'guest_sessions'
];

function escapeSQL(value: any): string {
    if (value === null || value === undefined) {
        return 'NULL';
    }
    if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE';
    }
    if (typeof value === 'number') {
        return value.toString();
    }
    if (typeof value === 'object') {
        // Handle JSON/JSONB columns
        return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
    }
    // String - escape single quotes
    return `'${String(value).replace(/'/g, "''")}'`;
}

export async function GET(request: NextRequest) {
    try {
        console.log('[Export SQL] Starting database export...');

        let sqlOutput = `-- Supabase Database Export to SQL
-- Generated: ${new Date().toISOString()}
-- Compatible with PostgreSQL (Neon, Supabase, etc.)

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

`;

        // Fetch and generate SQL for each table
        for (const tableName of TABLES_TO_EXPORT) {
            try {
                const { data, error } = await supabaseAdmin
                    .from(tableName)
                    .select('*');

                if (error) {
                    console.error(`[Export SQL] Error fetching ${tableName}:`, error);
                    sqlOutput += `-- Error fetching ${tableName}: ${error.message}\n\n`;
                    continue;
                }

                if (!data || data.length === 0) {
                    sqlOutput += `-- Table ${tableName} is empty\n\n`;
                    continue;
                }

                sqlOutput += `-- Table: ${tableName} (${data.length} rows)\n`;
                sqlOutput += `-- Truncate existing data (optional)\n`;
                sqlOutput += `-- TRUNCATE TABLE ${tableName} CASCADE;\n\n`;

                // Get column names from first row
                const columns = Object.keys(data[0]);

                // Generate INSERT statements
                for (const row of data) {
                    const values = columns.map(col => escapeSQL(row[col])).join(', ');
                    sqlOutput += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});\n`;
                }

                sqlOutput += `\n`;
                console.log(`[Export SQL] ✅ Exported ${data.length} rows from ${tableName}`);

            } catch (err: any) {
                console.error(`[Export SQL] Exception fetching ${tableName}:`, err);
                sqlOutput += `-- Exception fetching ${tableName}: ${err.message}\n\n`;
            }
        }

        // Add sequence reset commands
        sqlOutput += `\n-- Reset sequences (if using auto-increment IDs)\n`;
        sqlOutput += `-- SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));\n`;
        sqlOutput += `-- SELECT setval('prompts_id_seq', (SELECT MAX(id) FROM prompts));\n`;

        // Return as downloadable SQL file
        const filename = `supabase_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;

        return new NextResponse(sqlOutput, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error: any) {
        console.error('[Export SQL] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
