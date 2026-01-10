import { Pool } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not defined. Database connections will fail.');
}

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "",
});
