import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2/upload';

export async function POST(req: NextRequest) {
    try {
        const { image, folder } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        // Optional: You could use the folder param to organize in R2 if uploadToR2 supports it
        // For now uploadToR2 generates a unique filename
        const publicUrl = await uploadToR2(image);

        return NextResponse.json({ url: publicUrl });
    } catch (error: any) {
        console.error('[API] Upload error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}
