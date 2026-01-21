import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://api.gommo.net';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const type = searchParams.get('type') || 'video';

        const accessToken = process.env.GOMMO_API_KEY;
        const domain = process.env.GOMMO_DOMAIN;

        if (!accessToken || !domain) {
            return NextResponse.json({ message: 'Server configuration error: Missing Gommo credentials' }, { status: 500 });
        }

        // Gommo API 'List Models' uses POST x-www-form-urlencoded based on "Core Concepts"
        const formData = new URLSearchParams();
        formData.append('access_token', accessToken);
        formData.append('domain', domain);
        formData.append('type', type);

        const response = await fetch(`${API_BASE_URL}/ai/models`, {
            method: 'POST',
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
        console.error('Proxy Error (List Models):', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
