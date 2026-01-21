import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://api.gommo.net';

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ message: 'Missing URL' }, { status: 400 });
        }

        const accessToken = process.env.GOMMO_API_KEY;
        const domain = process.env.GOMMO_DOMAIN;

        if (!accessToken || !domain) {
            return NextResponse.json({ message: 'Server configuration error: Missing Gommo credentials' }, { status: 500 });
        }

        console.log(`[Proxy] Fetching image from URL: ${url}`);

        // 1. Fetch image from external URL (Server-side fetch prevents CORS)
        const imageRes = await fetch(url);
        if (!imageRes.ok) {
            return NextResponse.json({ message: `Failed to fetch image from URL: ${imageRes.statusText}` }, { status: 400 });
        }

        const blob = await imageRes.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');

        // 2. Upload to Gommo AI
        const apiFormData = new URLSearchParams();
        apiFormData.append('access_token', accessToken);
        apiFormData.append('domain', domain);
        apiFormData.append('data', base64Image);

        // Use last part of URL as filename or default
        const fileName = url.split('/').pop()?.split('?')[0] || 'image_from_url.jpg';
        apiFormData.append('file_name', fileName);
        apiFormData.append('size', String(blob.size));

        const response = await fetch(`${API_BASE_URL}/ai/image-upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: apiFormData.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ message: data.message || 'Error from Gommo API', error: data }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Proxy Error (URL Upload):', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
