import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://api.gommo.net';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { base64Data } = body;

        if (!base64Data || typeof base64Data !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid base64Data' }, { status: 400 });
        }

        const accessToken = process.env.GOMMO_API_KEY;
        const domain = process.env.GOMMO_DOMAIN;

        if (!accessToken || !domain) {
            return NextResponse.json({ error: 'Server configuration error: Missing Gommo credentials' }, { status: 500 });
        }

        // Extract base64 data (remove data:image/xxx;base64, prefix if present)
        const base64Match = base64Data.match(/^data:image\/\w+;base64,(.+)$/);
        const base64Image = base64Match ? base64Match[1] : base64Data;

        // Prepare form data for Gommo API
        const apiFormData = new URLSearchParams();
        apiFormData.append('access_token', accessToken);
        apiFormData.append('domain', domain);
        apiFormData.append('data', base64Image);
        apiFormData.append('file_name', `image_${Date.now()}.jpg`);
        apiFormData.append('size', String(Math.floor(base64Image.length * 0.75))); // Rough size estimate

        const apiUrl = `${API_BASE_URL}/ai/image-upload`;
        console.log(`[Upload Base64] Uploading to R2 via Gommo API...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: apiFormData.toString(),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Upload Base64] API Error: ${response.status} - ${errorText}`);
            return NextResponse.json({ error: 'Failed to upload to R2', details: errorText }, { status: response.status });
        }

        const data = await response.json();
        console.log('[Upload Base64] Success:', data);

        // Extract R2 URL from response
        // Gommo API returns: { imageInfo: { url: "..." } } or { url: "..." }
        const r2Url = data.imageInfo?.url || data.url;

        if (!r2Url) {
            console.error('[Upload Base64] No URL in response:', data);
            return NextResponse.json({ error: 'No URL in upload response', data }, { status: 500 });
        }

        return NextResponse.json({ url: r2Url });

    } catch (fetchError: any) {
        console.error('[Upload Base64] Fetch Error:', fetchError);
        if (fetchError.name === 'AbortError') {
            return NextResponse.json({ error: 'Upload timeout (60s limit reached)' }, { status: 504 });
        }
        return NextResponse.json({ error: 'Failed to upload', message: fetchError.message }, { status: 500 });
    }
}
