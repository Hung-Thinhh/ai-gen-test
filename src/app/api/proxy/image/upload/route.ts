import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://api.gommo.net';

export async function POST(req: NextRequest) {
    try {
        const clientFormData = await req.formData();

        const accessToken = process.env.GOMMO_API_KEY;
        const domain = process.env.GOMMO_DOMAIN;

        if (!accessToken || !domain) {
            return NextResponse.json({ message: 'Server configuration error: Missing Gommo credentials' }, { status: 500 });
        }

        const imageFile = clientFormData.get('image');

        if (!imageFile || !(imageFile instanceof Blob)) {
            return NextResponse.json({ message: 'Missing or invalid image file' }, { status: 400 });
        }

        // Convert Blob/File to Base64
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');

        // Prepare x-www-form-urlencoded body for Gommo API
        const apiFormData = new URLSearchParams();
        apiFormData.append('access_token', accessToken);
        apiFormData.append('domain', domain);
        apiFormData.append('data', base64Image); // Doc says param is 'data' containing base64 string

        // Optional: pass file_name and size if needed, though 'data' is main.
        apiFormData.append('file_name', imageFile.name || 'image.jpg');
        apiFormData.append('size', String(imageFile.size));

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
        console.error('Proxy Error (Image Upload):', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
