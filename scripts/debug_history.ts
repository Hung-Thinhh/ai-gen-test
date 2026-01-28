import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
if (process.env.NEON_DATABASE_URL) {
    process.env.POSTGRES_URL = process.env.NEON_DATABASE_URL;
}
console.log('Using connection string:', process.env.POSTGRES_URL ? 'DEFINED (Length: ' + process.env.POSTGRES_URL.length + ')' : 'UNDEFINED');

console.log('Using connection string:', process.env.POSTGRES_URL ? 'DEFINED (Length: ' + process.env.POSTGRES_URL.length + ')' : 'UNDEFINED');

// Dynamic import to ensure env is loaded first
async function checkHistory() {
    try {
        const { sql } = await import('@/lib/postgres/client');
        const result = await sql`
            SELECT history_id, input_prompt, output_images, created_at
            FROM generation_history 
            ORDER BY created_at DESC 
            LIMIT 1
        `;
        console.log('Latest History Entry:', {
            input_prompt: result[0]?.input_prompt,
            output_images_preview: JSON.stringify(result[0]?.output_images).substring(0, 100) + '...'
        });
    } catch (e) {
        console.error('Error fetching history:', e);
    } finally {
        process.exit(0);
    }
}

checkHistory();
