import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://api.gommo.net';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const accessToken = process.env.GOMMO_API_KEY;
        const domain = process.env.GOMMO_DOMAIN;

        if (!accessToken || !domain) {
            return NextResponse.json({ message: 'Server configuration error: Missing Gommo credentials' }, { status: 500 });
        }

        // Convert to x-www-form-urlencoded
        const formData = new URLSearchParams();
        formData.append('access_token', accessToken);
        formData.append('domain', domain);

        // Append other fields
        for (const key in body) {
            if (typeof body[key] === 'object' && body[key] !== null) {
                // Arrays/Objects must be JSON stringified
                formData.append(key, JSON.stringify(body[key]));
            } else {
                formData.append(key, String(body[key]));
            }
        }

        // Forward request to Gommo AI
        const response = await fetch(`${API_BASE_URL}/ai/create-video`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ message: data.message || 'Error from Gommo API', error: data }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Proxy Error (Create Video):', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
