import { NextRequest, NextResponse } from 'next/server';

/**
 * API Proxy to fetch images from external URLs (like R2) to bypass CORS
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const imageUrl = searchParams.get('url');

        if (!imageUrl) {
            return NextResponse.json(
                { error: 'Missing url parameter' },
                { status: 400 }
            );
        }

        // Validate URL to prevent SSRF attacks
        try {
            const url = new URL(imageUrl);
            // Only allow HTTPS URLs from R2 or trusted domains
            if (url.protocol !== 'https:' && url.protocol !== 'http:') {
                return NextResponse.json(
                    { error: 'Invalid URL protocol' },
                    { status: 400 }
                );
            }
        } catch (err) {
            return NextResponse.json(
                { error: 'Invalid URL format' },
                { status: 400 }
            );
        }

        console.log('[Image Fetch Proxy] Fetching:', imageUrl);

        // Fetch the image from the external URL
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)',
            },
        });

        if (!response.ok) {
            console.error('[Image Fetch Proxy] Failed:', response.status, response.statusText);
            return NextResponse.json(
                { error: `Failed to fetch image: ${response.statusText}` },
                { status: response.status }
            );
        }

        // Get the image data
        const imageBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/png';

        console.log('[Image Fetch Proxy] Success:', contentType, imageBuffer.byteLength, 'bytes');

        // Return the image with proper headers
        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
                'Access-Control-Allow-Origin': '*', // Allow CORS
            },
        });
    } catch (error) {
        console.error('[Image Fetch Proxy] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
