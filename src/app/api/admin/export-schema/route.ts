import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// List of tables to export schema
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

function inferDataType(value: any): string {
    if (value === null || value === undefined) return 'text';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') {
        return Number.isInteger(value) ? 'integer' : 'numeric';
    }
    if (typeof value === 'object') {
        if (value instanceof Date) return 'timestamp with time zone';
        if (Array.isArray(value)) return 'jsonb';
        return 'jsonb';
    }
    // Check if it looks like a UUID
    if (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        return 'uuid';
    }
    // Check if it looks like a timestamp
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return 'timestamp with time zone';
    }
    return 'text';
}

export async function GET(request: NextRequest) {
    try {
        console.log('[Export Schema] Starting schema export...');

        let sqlOutput = `-- Supabase Database Schema Export
-- Generated: ${new Date().toISOString()}
-- Compatible with PostgreSQL (Neon, Supabase, etc.)
-- NOTE: Schema inferred from sample data. Please verify column types and add constraints.

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

`;

        // Fetch schema for each table by sampling data
        for (const tableName of TABLES_TO_EXPORT) {
            try {
                // Get a sample row to infer schema
                const { data: sampleData, error } = await supabaseAdmin
                    .from(tableName)
                    .select('*')
                    .limit(1)
                    .maybeSingle();

                if (error) {
                    console.error(`[Export Schema] Error for ${tableName}:`, error);
                    sqlOutput += `-- Could not fetch schema for ${tableName}: ${error.message}\n\n`;
                    continue;
                }

                if (!sampleData) {
                    sqlOutput += `-- Table ${tableName} is empty, cannot infer schema\n`;
                    sqlOutput += `-- CREATE TABLE ${tableName} (\n`;
                    sqlOutput += `--     id serial PRIMARY KEY,\n`;
                    sqlOutput += `--     created_at timestamp with time zone DEFAULT now()\n`;
                    sqlOutput += `-- );\n\n`;
                    continue;
                }

                // Generate CREATE TABLE statement
                sqlOutput += `-- Table: ${tableName}\n`;
                sqlOutput += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`;
                sqlOutput += `CREATE TABLE ${tableName} (\n`;

                // Infer columns from sample data
                const columns = Object.keys(sampleData);
                const columnDefs: string[] = [];

                for (const colName of columns) {
                    const dataType = inferDataType(sampleData[colName]);
                    let colDef = `    ${colName} ${dataType}`;

                    // Add NOT NULL for id columns
                    if (colName === 'id' || colName.endsWith('_id')) {
                        colDef += ' NOT NULL';
                    }

                    columnDefs.push(colDef);
                }

                sqlOutput += columnDefs.join(',\n');
                sqlOutput += `\n);\n\n`;

                // Add common indexes
                sqlOutput += `-- Indexes for ${tableName}\n`;
                if (columns.includes('id')) {
                    sqlOutput += `ALTER TABLE ${tableName} ADD PRIMARY KEY (id);\n`;
                }
                if (columns.includes('created_at')) {
                    sqlOutput += `CREATE INDEX idx_${tableName}_created_at ON ${tableName}(created_at);\n`;
                }
                if (columns.includes('user_id')) {
                    sqlOutput += `CREATE INDEX idx_${tableName}_user_id ON ${tableName}(user_id);\n`;
                }
                sqlOutput += `\n`;

                console.log(`[Export Schema] ✅ Inferred schema for ${tableName} (${columns.length} columns)`);

            } catch (err: any) {
                console.error(`[Export Schema] Exception for ${tableName}:`, err);
                sqlOutput += `-- Exception for ${tableName}: ${err.message}\n\n`;
            }
        }

        // Add important notes
        sqlOutput += `\n-- IMPORTANT NOTES:\n`;
        sqlOutput += `-- 1. Schema was inferred from sample data - please verify all column types\n`;
        sqlOutput += `-- 2. Add FOREIGN KEY constraints manually if needed\n`;
        sqlOutput += `-- 3. Add UNIQUE constraints where appropriate\n`;
        sqlOutput += `-- 4. Configure Row Level Security (RLS) policies if needed\n`;
        sqlOutput += `-- 5. Add DEFAULT values for columns as needed\n\n`;

        // Return as downloadable SQL file
        const filename = `supabase_schema_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;

        return new NextResponse(sqlOutput, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error: any) {
        console.error('[Export Schema] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
