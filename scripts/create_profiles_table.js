const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to DB.');
        console.log('Creating profiles table...');

        // Attempt 1: With Foreign Key
        try {
            await client.query(`
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY, 
                gallery TEXT[] DEFAULT '{}', 
                last_updated TIMESTAMPTZ DEFAULT NOW(),
                CONSTRAINT fk_user FOREIGN KEY(id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        `);
            console.log('Profiles table created successfully (with FK).');
        } catch (fkError) {
            console.warn('FK constraint failed (users table might differ or not exist). Retrying without FK...');
            // Attempt 2: Without Foreign Key
            await client.query(`
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY, 
                gallery TEXT[] DEFAULT '{}', 
                last_updated TIMESTAMPTZ DEFAULT NOW()
            )
        `);
            console.log('Profiles table created successfully (standalone).');
        }

    } catch (error) {
        console.error('Fatal Error:', error);
    } finally {
        await client.end();
    }
}

run();
