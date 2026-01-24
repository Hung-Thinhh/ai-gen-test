import { NextRequest, NextResponse } from 'next/server';

/**
 * Callback endpoint for kie.ai to POST results
 * This is only used in production when we have a public domain
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('[kie.ai] Callback received:', body);

        const { task_id, status, result, error } = body;

        // TODO: Store result in database or cache
        // For now, just log it
        // In a real app, you would:
        // 1. Store the result in Redis/DB with task_id as key
        // 2. Use WebSocket/SSE to notify the client
        // 3. Or client can poll a separate endpoint to check if result is ready

        if (status === 'success') {
            console.log('[kie.ai] Task succeeded:', task_id, result);
            // Store result for client to fetch
        } else if (status === 'failed') {
            console.error('[kie.ai] Task failed:', task_id, error);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('[kie.ai] Callback error:', error);
        return NextResponse.json(
            { error: error.message || 'Callback processing failed' },
            { status: 500 }
        );
    }
}
