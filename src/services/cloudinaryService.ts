/**
 * Service for uploading images to Cloudinary via Unsigned Upload.
 */

const CLOUD_NAME = 'dmxmzannb';
const UPLOAD_PRESET = 'AI-image';

interface CloudinaryResponse {
    secure_url: string;
    public_id: string;
    error?: { message: string };
}

/**
 * Converts an image (Base64 or Blob) to WebP format for optimal storage.
 * @param fileOrBase64 The input image
 * @returns WebP Base64 string
 */
const convertToWebP = async (fileOrBase64: string | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            // Create canvas and draw image
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0);

            // Convert to WebP with 85% quality (good balance)
            const webpDataUrl = canvas.toDataURL('image/webp', 0.85);
            resolve(webpDataUrl);
        };

        img.onerror = () => reject(new Error('Failed to load image for WebP conversion'));

        // Load image
        if (typeof fileOrBase64 === 'string') {
            img.src = fileOrBase64;
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error('Failed to read blob'));
            reader.readAsDataURL(fileOrBase64);
        }
    });
};

/**
 * Uploads a Base64 string or Blob to Cloudinary.
 * Automatically converts to WebP format before upload for optimal storage.
 * @param fileOrBase64 The Base64 string (data:image/...) or a Blob object.
 * @param folder Optional folder path (Cloudinary handles this via preset or parameter, 
 *               but unsigned presets often override folders. We'll try passing it.)
 */
export const uploadToCloudinary = async (fileOrBase64: string | Blob, folder: string = 'ai-gen-gallery'): Promise<string> => {
    try {
        // Convert to WebP BEFORE upload to save storage
        console.log('[Cloudinary] Converting image to WebP...');
        const webpBase64 = await convertToWebP(fileOrBase64);
        console.log('[Cloudinary] WebP conversion complete');

        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

        const formData = new FormData();
        formData.append('upload_preset', UPLOAD_PRESET);
        // Upload WebP directly
        formData.append('file', webpBase64);

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        const data: CloudinaryResponse = await response.json();

        if (!response.ok || data.error) {
            console.error('Cloudinary Upload Error:', data.error);
            throw new Error(data.error?.message || 'Failed to upload to Cloudinary');
        }

        // Optimize the URL for best delivery (WebP/AVIF, Auto Quality)
        return optimizeCloudinaryUrl(data.secure_url);
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw error;
    }
};

/**
 * Optimizes a Cloudinary URL by adding f_auto,q_auto transformations.
 * This ensures the image is delivered in the efficient format (WebP/AVIF) and quality.
 * @param url The original Cloudinary URL
 * @returns The optimized URL
 */
export const optimizeCloudinaryUrl = (url: string): string => {
    if (!url || !url.includes('/upload/')) return url;
    // Avoid double optimization if already present
    if (url.includes('f_auto') && url.includes('q_auto')) return url;

    return url.replace('/upload/', '/upload/f_auto,q_auto/');
};
