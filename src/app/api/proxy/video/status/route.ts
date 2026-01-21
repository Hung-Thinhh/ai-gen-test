import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://api.gommo.net';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const processId = searchParams.get('process_id');

        const accessToken = process.env.GOMMO_API_KEY;
        const domain = process.env.GOMMO_DOMAIN;

        if (!processId) {
            return NextResponse.json({ message: 'Missing process_id' }, { status: 400 });
        }
        if (!accessToken || !domain) {
            return NextResponse.json({ message: 'Server configuration error: Missing Gommo credentials' }, { status: 500 });
        }

        // Gommo API requires POST with x-www-form-urlencoded containing access_token
        // Even for "Check Status"
        const formData = new URLSearchParams();
        formData.append('access_token', accessToken);
        formData.append('domain', domain);
        formData.append('videoId', processId); // Parameter name is 'videoId' per doc, not 'process_id' for check status endpoint?
        // Wait, doc says: `videoId` (string, required): ID video cần kiểm tra <Là id_base của videoInfo>
        // My code passed `process_id` via query param to this proxy path. I should map it to `videoId`.

        const response = await fetch(`${API_BASE_URL}/ai/video`, {
            method: 'POST', // FORCE POST
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ message: data.message || 'Error from Gommo API', error: data }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Proxy Error (Check Status):', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
