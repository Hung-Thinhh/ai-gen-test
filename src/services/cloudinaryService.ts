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
 * Uploads a Base64 string or Blob to Cloudinary.
 * @param fileOrBase64 The Base64 string (data:image/...) or a Blob object.
 * @param folder Optional folder path (Cloudinary handles this via preset or parameter, 
 *               but unsigned presets often override folders. We'll try passing it.)
 */
export const uploadToCloudinary = async (fileOrBase64: string | Blob, folder: string = 'ai-gen-gallery'): Promise<string> => {
    try {
        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

        const formData = new FormData();
        formData.append('upload_preset', UPLOAD_PRESET);
        // formData.append('folder', folder); // Note: Folder assignment depends on preset settings in "unsigned" mode

        if (typeof fileOrBase64 === 'string') {
            formData.append('file', fileOrBase64);
        } else {
            formData.append('file', fileOrBase64);
        }

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        const data: CloudinaryResponse = await response.json();

        if (!response.ok || data.error) {
            console.error('Cloudinary Upload Error:', data.error);
            throw new Error(data.error?.message || 'Failed to upload to Cloudinary');
        }

        return data.secure_url;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw error;
    }
};
