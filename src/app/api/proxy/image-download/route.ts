import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ message: 'Missing url parameter' }, { status: 400 });
    }

    try {
        const imageRes = await fetch(url);

        if (!imageRes.ok) {
            return NextResponse.json({ message: 'Failed to fetch image from URL' }, { status: 500 });
        }

        const contentType = imageRes.headers.get('content-type') || 'application/octet-stream';
        const imageBuffer = await imageRes.arrayBuffer();

        return new NextResponse(Buffer.from(imageBuffer), {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
            },
        });
    } catch (error: any) {
        console.error('Proxy Error (Image Download):', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
