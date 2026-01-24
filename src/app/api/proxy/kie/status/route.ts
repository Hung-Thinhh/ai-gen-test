import { NextRequest, NextResponse } from 'next/server';

const KIE_API_URL = process.env.KIE_API_URL || 'https://api.kie.ai/api/v1';
const KIE_API_KEY = process.env.KIE_API_KEY;

export async function GET(req: NextRequest) {
    try {
        if (!KIE_API_KEY) {
            return NextResponse.json(
                { error: 'KIE_API_KEY not configured' },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(req.url);
        const taskId = searchParams.get('task_id');

        if (!taskId) {
            return NextResponse.json(
                { error: 'task_id is required' },
                { status: 400 }
            );
        }

        console.log('[kie.ai] Checking status for task:', taskId);

        // Call kie.ai API to check status
        // New Endpoint: /jobs/recordInfo?taskId=...
        const response = await fetch(`${KIE_API_URL}/jobs/recordInfo?taskId=${taskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${KIE_API_KEY}`,
                // 'Content-Type': 'application/json', // GET usually doesn't need content-type
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[kie.ai] Status check error:', errorText);
            return NextResponse.json(
                { error: `kie.ai API error: ${response.statusText}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('[kie.ai] Status:', data);

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[kie.ai] Status check error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check status' },
            { status: 500 }
        );
    }
}
