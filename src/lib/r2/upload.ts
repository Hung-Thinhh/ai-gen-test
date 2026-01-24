import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "./client";

/**
 * Upload base64 image to Cloudflare R2
 * @param base64Image - Base64 encoded image
 * @returns Public URL of the uploaded image
 */
/**
 * Upload base64 file to Cloudflare R2
 * @param base64Data - Base64 encoded data (with or without prefix)
 * @param contentType - MIME type (e.g., 'image/png', 'audio/mpeg')
 * @returns Public URL of the uploaded file
 */
export async function uploadToR2(base64Input: string, contentType: string = 'image/png'): Promise<string> {
    try {
        // Extract base64 data (remove data:xxx;base64, prefix if present)
        const base64Data = base64Input.replace(/^data:[\w/]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Determine extension
        let extension = 'png';
        if (contentType.includes('audio')) extension = 'mp3';
        if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = 'jpg';
        if (contentType.includes('mp4')) extension = 'mp4';

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const filename = `${timestamp}-${randomString}.${extension}`;

        console.log('[R2] Uploading:', filename, 'Type:', contentType, 'Size:', (buffer.length / 1024 / 1024).toFixed(2), 'MB');

        const uploadStart = Date.now();

        // Upload to R2
        await r2Client.send(
            new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: filename,
                Body: buffer,
                ContentType: contentType,
                CacheControl: "public, max-age=31536000", // 1 year
            })
        );

        const uploadDuration = Date.now() - uploadStart;
        console.log('[R2] Upload completed in', uploadDuration, 'ms');

        // Return public URL
        const publicUrl = `${R2_PUBLIC_URL}/${filename}`;
        console.log('[R2] Public URL:', publicUrl);

        return publicUrl;
    } catch (error) {
        console.error('[R2] Upload error:', error);
        throw new Error(`Failed to upload to R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
