import { neon, neonConfig } from '@neondatabase/serverless';

// Configure Neon for optimal performance
neonConfig.fetchConnectionCache = true;

// Initialize Neon SQL client
export const sql = neon(process.env.NEON_DATABASE_URL!);

// Type-safe query result helper
export type QueryResult<T> = T[];

// Helper to execute queries with error handling
export async function executeQuery<T>(
    query: ReturnType<typeof sql>,
    errorMessage: string = 'Database query failed'
): Promise<QueryResult<T>> {
    try {
        const result = await query;
        return result as QueryResult<T>;
    } catch (error) {
        console.error(`[Neon] ${errorMessage}:`, error);
        throw error;
    }
}
