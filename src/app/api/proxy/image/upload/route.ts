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
        // Optional: pass file_name and size if needed
        apiFormData.append('file_name', imageFile.name || 'image.jpg');
        apiFormData.append('size', String(imageFile.size));

        const apiUrl = `${API_BASE_URL}/ai/image-upload`;
        console.log(`[Proxy Upload] Sending to: ${apiUrl} (Size: ${base64Image.length} chars)`);

        try {
            // Create a configured agent for keep-alive if needed, but standard fetch usually suffices.
            // Using AbortSignal for explicit timeout (e.g., 60 seconds)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: apiFormData.toString(),
                signal: controller.signal,
                // @ts-ignore - duplex needed for node fetch with large bodies sometimes
                duplex: 'half',
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Proxy Upload] API Error: ${response.status} - ${errorText}`);
                try {
                    const errorJson = JSON.parse(errorText);
                    return NextResponse.json({ message: errorJson.message || 'Error from Gommo API', error: errorJson }, { status: response.status });
                } catch {
                    return NextResponse.json({ message: 'Error from Gommo API', error: errorText }, { status: response.status });
                }
            }

            const data = await response.json();
            console.log('[Proxy Upload] Success:', data.imageInfo?.id_base || data.id_base);
            return NextResponse.json(data);

        } catch (fetchError: any) {
            console.error('[Proxy Upload] Fetch Request Failed:', fetchError);
            if (fetchError.name === 'AbortError') {
                return NextResponse.json({ message: 'Upload timeout (60s limit reached)', error: 'Timeout' }, { status: 504 });
            }
            return NextResponse.json({ message: 'Failed to connect to Gommo API', error: fetchError.message, cause: fetchError.cause }, { status: 502 });
        }
    } catch (error: any) {
        console.error('Proxy Error (Image Upload):', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
