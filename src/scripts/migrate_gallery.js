require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

// Credentials from README as fallback
const README_URL = 'postgresql://postgres:yj5x6moshhlx1vcw@77.42.94.105:3100/postgres';
const connectionString = process.env.POSTGRES_URL || README_URL;

console.log('Connecting with:', connectionString.replace(/:[^:@]*@/, ':****@')); // Hide password

const pool = new Pool({
    connectionString,
    // Add simple SSL config just in case, though client.ts didn't obey it, standard for cloud DBs
    // But if client.ts works without it, maybe I shouldn't add it.
    // However, Neon usually needs it. I'll try without first to match client.ts.
});

async function migrate() {
    console.log('Starting migration...');
    const client = await pool.connect();
    try {
        console.log('Connected to Database.');

        console.log('Adding gallery column to users table...');
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb;
        `);
        console.log('✅ Success: users table updated.');

        console.log('Adding gallery column to guest_sessions table...');
        await client.query(`
            ALTER TABLE guest_sessions 
            ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb;
        `);
        console.log('✅ Success: guest_sessions table updated.');

    } catch (err) {
        console.error('❌ Migration Error:', err);
    } finally {
        client.release();
        await pool.end();
        console.log('Disconnected.');
    }
}

migrate();
