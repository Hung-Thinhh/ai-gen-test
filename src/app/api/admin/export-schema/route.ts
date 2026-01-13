import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';

// List of tables to export schema

// Map of tables to explicit query functions for schema inference
const SCHEMA_QUERIES: Record<string, () => Promise<any[]>> = {
    users: () => sql`SELECT * FROM users LIMIT 1`,
    categories: () => sql`SELECT * FROM categories LIMIT 1`,
    tools: () => sql`SELECT * FROM tools LIMIT 1`,
    studio: () => sql`SELECT * FROM studio LIMIT 1`,
    prompts: () => sql`SELECT * FROM prompts LIMIT 1`,
    hero_banners: () => sql`SELECT * FROM hero_banners LIMIT 1`,
    system_configs: () => sql`SELECT * FROM system_configs LIMIT 1`,
    generation_history: () => sql`SELECT * FROM generation_history LIMIT 1`,
    payment_transactions: () => sql`SELECT * FROM payment_transactions LIMIT 1`,
    guest_sessions: () => sql`SELECT * FROM guest_sessions LIMIT 1`,
    packages: () => sql`SELECT * FROM packages LIMIT 1`,
    user_gallery: () => sql`SELECT * FROM user_gallery LIMIT 1`,
    guest_gallery: () => sql`SELECT * FROM guest_gallery LIMIT 1`
};

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
        console.log('[Export Schema] Starting schema export from Neon...');

        let sqlOutput = `-- Neon Database Schema Export
-- Generated: ${new Date().toISOString()}
-- Compatible with PostgreSQL (Neon, Supabase, etc.)
-- NOTE: Schema inferred from sample data. Please verify column types and add constraints.

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

`;

        // Fetch schema for each table by sampling data
        for (const [tableName, queryFn] of Object.entries(SCHEMA_QUERIES)) {
            try {
                // Get a sample row to infer schema
                const sampleData = await queryFn();

                if (!sampleData || sampleData.length === 0) {
                    sqlOutput += `-- Table ${tableName} is empty, cannot infer schema\n`;
                    sqlOutput += `-- CREATE TABLE ${tableName} (\n`;
                    sqlOutput += `--     id serial PRIMARY KEY,\n`;
                    sqlOutput += `--     created_at timestamp with time zone DEFAULT now()\n`;
                    sqlOutput += `-- );\n\n`;
                    continue;
                }

                const row = sampleData[0];

                // Generate CREATE TABLE statement
                sqlOutput += `-- Table: ${tableName}\n`;
                sqlOutput += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`;
                sqlOutput += `CREATE TABLE ${tableName} (\n`;

                // Infer columns from sample data
                const columns = Object.keys(row);
                const columnDefs: string[] = [];

                for (const colName of columns) {
                    const dataType = inferDataType(row[colName]);
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
        const filename = `neon_schema_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;

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
