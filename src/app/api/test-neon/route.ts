import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon/client';

export async function GET() {
    try {
        console.log('[Test API] Testing Neon connection...');

        // Test 1: Simple query
        console.log('[Test API] Method 1: Using template literal');
        const users1 = await sql`SELECT * FROM users LIMIT 5`;
        console.log('[Test API] Result 1:', { type: typeof users1, isArray: Array.isArray(users1), length: users1?.length, data: users1 });

        return NextResponse.json({
            success: true,
            method: 'template literal',
            type: typeof users1,
            isArray: Array.isArray(users1),
            count: Array.isArray(users1) ? users1.length : 0,
            data: users1
        });

    } catch (error: any) {
        console.error('[Test API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
