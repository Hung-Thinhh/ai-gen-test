require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
    console.error('Error: POSTGRES_URL environment variable is required');
    process.exit(1);
}

console.log('Connecting with:', connectionString.replace(/:[^:@]*@/, ':****@'));

const pool = new Pool({
    connectionString,
});

async function migrate() {
    console.log('Starting migration for profiles table...');
    const client = await pool.connect();
    try {
        console.log('Connected to Database.');

        console.log('Adding gallery column to profiles table...');
        await client.query(`
            ALTER TABLE profiles 
            ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb;
        `);
        console.log('✅ Success: profiles table updated.');

    } catch (err) {
        console.error('❌ Migration Error:', err);
    } finally {
        client.release();
        await pool.end();
        console.log('Disconnected.');
    }
}

migrate();
