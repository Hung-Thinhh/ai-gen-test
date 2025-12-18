/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Crops an image to a specific aspect ratio from the center.
 * @param dataUrl The base64 data URL of the source image.
 * @param targetAspectRatio The target aspect ratio as a number (width / height).
 * @returns A promise that resolves to the data URL of the cropped image.
 */
export function cropImageToAspectRatio(
  dataUrl: string,
  targetAspectRatio: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      const origWidth = img.width;
      const origHeight = img.height;
      const origRatio = origWidth / origHeight;

      let cropWidth, cropHeight, cropX, cropY;

      if (origRatio > targetAspectRatio) {
        // Original is wider than target (e.g., landscape src for portrait target)
        // Crop the width to match the target aspect ratio
        cropHeight = origHeight;
        cropWidth = origHeight * targetAspectRatio;
        cropX = (origWidth - cropWidth) / 2;
        cropY = 0;
      } else {
        // Original is taller than target (or same ratio)
        // Crop the height to match the target aspect ratio
        cropWidth = origWidth;
        cropHeight = origWidth / targetAspectRatio;
        cropX = 0;
        cropY = (origHeight - cropHeight) / 2;
      }

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      // Draw the cropped portion of the original image onto the canvas
      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      // Get the result as a new data URL
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => reject(new Error('Failed to load image for cropping.'));
    img.src = dataUrl;
  });
}