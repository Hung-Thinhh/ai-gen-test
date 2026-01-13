/**
 * Cloudinary utilities for image management
 */

/**
 * Extract Cloudinary public_id from image URL
 * @param url - Cloudinary image URL
 * @returns public_id or null if not a valid Cloudinary URL
 * 
 * Example:
 * Input: "https://res.cloudinary.com/demo/image/upload/v1234/folder/image.jpg"
 * Output: "folder/image"
 */
export function extractPublicIdFromUrl(url: string): string | null {
    try {
        // Check if it's a Cloudinary URL
        if (!url.includes('cloudinary.com')) {
            return null;
        }

        // Parse URL
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;

        // Cloudinary URL structure: /[cloud_name]/[resource_type]/[type]/[version]/[public_id].[format]
        // Example: /demo/image/upload/v1234567890/folder/subfolder/image.jpg

        // Match pattern after /upload/ or /upload/v[version]/
        const match = pathname.match(/\/upload\/(?:v\d+\/)?(.+)$/);

        if (!match) {
            return null;
        }

        // Get the public_id with path (before the file extension)
        let publicIdWithExt = match[1];

        // Remove file extension
        const lastDotIndex = publicIdWithExt.lastIndexOf('.');
        if (lastDotIndex !== -1) {
            publicIdWithExt = publicIdWithExt.substring(0, lastDotIndex);
        }

        return publicIdWithExt;
    } catch (error) {
        console.error('[extractPublicIdFromUrl] Error parsing URL:', error);
        return null;
    }
}

/**
 * Check if URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
    try {
        return url.includes('cloudinary.com') && url.includes('/upload/');
    } catch {
        return false;
    }
}
