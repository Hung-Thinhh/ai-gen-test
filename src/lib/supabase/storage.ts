import { supabase } from './client';

/**
 * Upload image to Supabase Storage
 * @param file - File to upload
 * @param userId - User ID for folder organization
 * @returns Public URL of uploaded image
 */
export async function uploadImage(
    file: File,
    userId: string
): Promise<string> {
    const fileName = `${userId}/${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
        .from('generated-images')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('generated-images')
        .getPublicUrl(data.path);

    return publicUrl;
}

/**
 * Upload base64 image data
 * @param base64Data - Base64 string (with or without data URI prefix)
 * @param userId - User ID for folder organization
 * @param fileName - Optional custom filename
 */
export async function uploadBase64Image(
    base64Data: string,
    userId: string,
    fileName?: string
): Promise<string> {
    // Remove data URI prefix if present
    const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');

    // Convert base64 to blob
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    const file = new File(
        [blob],
        fileName || `generated_${Date.now()}.png`,
        { type: 'image/png' }
    );

    return uploadImage(file, userId);
}

/**
 * Delete image from storage
 */
export async function deleteImage(filePath: string): Promise<void> {
    const { error } = await supabase.storage
        .from('generated-images')
        .remove([filePath]);

    if (error) {
        console.error('Delete error:', error);
        throw new Error(`Failed to delete image: ${error.message}`);
    }
}

/**
 * List user's images
 */
export async function listUserImages(userId: string) {
    const { data, error } = await supabase.storage
        .from('generated-images')
        .list(userId, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' }
        });

    if (error) throw error;
    return data;
}
