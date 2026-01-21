import { Pool } from 'pg';

// PostgreSQL connection string from environment
const POSTGRES_URL = process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL!;

// Create connection pool
// Create connection pool
const pool = new Pool({
    connectionString: POSTGRES_URL,
    max: 20, // Reduce max connections to prevent exhaustion in dev HMR
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: false, // Disable SSL as server does not support it
});

// SQL tagged template function (compatible with Neon syntax)
export const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
    const client = await pool.connect();
    try {
        // Build query from template strings
        const query = strings.reduce((acc, str, i) => {
            return acc + str + (i < values.length ? `$${i + 1}` : '');
        }, '');

        const result = await client.query(query, values);
        return result.rows;
    } finally {
        client.release();
    }
};

// Type-safe query result helper
export type QueryResult<T> = T[];

// Helper to execute queries with error handling
export async function executeQuery<T>(
    queryFn: () => Promise<any[]>,
    errorMessage: string = 'Database query failed'
): Promise<QueryResult<T>> {
    try {
        const result = await queryFn();
        return result as QueryResult<T>;
    } catch (error) {
        console.error(`[PostgreSQL] ${errorMessage}:`, error);
        throw error;
    }
}

// Test connection function
export async function testConnection(): Promise<boolean> {
    try {
        const result = await sql`SELECT 1 as test`;
        console.log('[PostgreSQL] Connection successful:', result);
        return true;
    } catch (error) {
        console.error('[PostgreSQL] Connection failed:', error);
        return false;
    }
}

// Cleanup on exit
process.on('exit', () => {
    pool.end();
});
