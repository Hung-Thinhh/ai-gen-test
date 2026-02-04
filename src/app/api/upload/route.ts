import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2/upload';

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validate base64 image data
 */
function validateImage(image: string): { valid: boolean; error?: string; mimeType?: string } {
    // Check if valid base64 format
    const base64Pattern = /^data:image\/(jpeg|png|gif|webp|svg\+xml);base64,/;
    const match = image.match(base64Pattern);

    if (!match) {
        return { valid: false, error: 'Invalid image format. Only JPEG, PNG, GIF, WebP, SVG allowed' };
    }

    const mimeType = `image/${match[1]}`;

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(mimeType)) {
        return { valid: false, error: `File type ${mimeType} not allowed` };
    }

    // Check file size (base64 is ~33% larger than binary)
    const base64Data = image.split(',')[1];
    const fileSize = Buffer.from(base64Data, 'base64').length;

    if (fileSize > MAX_FILE_SIZE) {
        return { valid: false, error: `File too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB` };
    }

    return { valid: true, mimeType };
}

export async function POST(req: NextRequest) {
    try {
        const { image, folder, contentType = 'image/png' } = await req.json();

        if (!image) {
            return NextResponse.json({ error: 'No image/file provided' }, { status: 400 });
        }

        // Validate image
        const validation = validateImage(image);
        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        // Validate content type if provided
        if (!ALLOWED_TYPES.includes(contentType)) {
            return NextResponse.json(
                { error: `Content type ${contentType} not allowed` },
                { status: 400 }
            );
        }

        // Optional: You could use the folder param to organize in R2 if uploadToR2 supports it
        // For now uploadToR2 generates a unique filename
        const publicUrl = await uploadToR2(image, contentType);

        return NextResponse.json({ url: publicUrl });
    } catch (error: any) {
        console.error('[API] Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
