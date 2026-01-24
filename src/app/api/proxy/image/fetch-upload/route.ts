import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { imageUrl } = await req.json();

        if (!imageUrl) {
            return NextResponse.json({ message: 'Missing imageUrl' }, { status: 400 });
        }

        // Fetch image from URL (server-side, no CORS)
        const imageRes = await fetch(imageUrl);

        if (!imageRes.ok) {
            return NextResponse.json({ message: 'Failed to fetch image from URL' }, { status: 500 });
        }

        const imageBlob = await imageRes.blob();
        const arrayBuffer = await imageBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');

        // Upload to Gommo
        const accessToken = process.env.GOMMO_API_KEY;
        const domain = process.env.GOMMO_DOMAIN;

        if (!accessToken || !domain) {
            return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
        }

        const apiFormData = new URLSearchParams();
        apiFormData.append('access_token', accessToken);
        apiFormData.append('domain', domain);
        apiFormData.append('data', base64Image);
        apiFormData.append('file_name', 'poster-image.jpg');
        apiFormData.append('size', String(buffer.length));

        const response = await fetch('https://api.gommo.net/ai/image-upload', {
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
        console.error('Proxy Error (Fetch & Upload):', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
