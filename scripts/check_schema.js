const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to DB.');
        const res = await client.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'generation_history' 
        AND column_name = 'history_id'
    `);
        console.log('Result:', JSON.stringify(res.rows));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
    }
}

run();
