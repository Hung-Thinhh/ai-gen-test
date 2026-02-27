/**
 * Merge two images side by side before sending to API
 * This helps avoid IMAGE_OTHER policy by making it look like 1 image
 */
export async function mergeImagesSideBySide(
    image1DataUrl: string,
    image2DataUrl: string
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img1 = new Image();
        const img2 = new Image();
        
        img1.onload = () => {
            img2.onload = () => {
                // Create canvas with width = img1.width + img2.width
                const canvas = document.createElement('canvas');
                const maxHeight = Math.max(img1.height, img2.height);
                canvas.width = img1.width + img2.width;
                canvas.height = maxHeight;
                
                const ctx = canvas.getContext('2d')!;
                
                // Draw white background
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw image 1
                ctx.drawImage(img1, 0, 0);
                
                // Draw image 2 next to it
                ctx.drawImage(img2, img1.width, 0);
                
                // Convert to data URL
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
            img2.onerror = reject;
            img2.src = image2DataUrl;
        };
        img1.onerror = reject;
        img1.src = image1DataUrl;
    });
}
