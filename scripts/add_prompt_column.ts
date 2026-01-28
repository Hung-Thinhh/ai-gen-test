
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Force use of NEON_DATABASE_URL if available
if (process.env.NEON_DATABASE_URL) {
    process.env.POSTGRES_URL = process.env.NEON_DATABASE_URL;
}

console.log('Migrating DB using connection string length:', process.env.POSTGRES_URL?.length);

async function migrate() {
    try {
        // Dynamic import to ensure process.env is set before client init
        const { sql } = await import('@/lib/postgres/client');

        console.log('Adding input_prompt column directly...');
        await sql`ALTER TABLE generation_history ADD COLUMN IF NOT EXISTS input_prompt TEXT`;

        console.log('Migration successful: input_prompt column added.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        process.exit(0);
    }
}

migrate();
