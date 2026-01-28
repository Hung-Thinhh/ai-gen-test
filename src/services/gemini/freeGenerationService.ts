/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Modality } from "@google/genai";
import ai from './client'; // Import the shared client instance
import {
    processApiError,
    parseDataUrl,
    callGeminiWithRetry,
    processGeminiResponse,
    normalizeImageInput // Add import
} from './baseService';

export async function generateFreeImage(
    prompt: string,
    numberOfImages: number,
    aspectRatio: string,
    imageDataUrl1?: string,
    imageDataUrl2?: string,
    imageDataUrl3?: string,
    imageDataUrl4?: string,
    removeWatermark?: boolean,
    toolKey?: string,
    onImageReady?: (index: number, url: string) => void,
    onImageError?: (index: number, error: Error) => void
): Promise<string[]> {
    try {
        const allImageUrls = [imageDataUrl1, imageDataUrl2, imageDataUrl3, imageDataUrl4].filter(Boolean) as string[];

        // Normalize all images first (convert URLs to base64 data)
        const normalizedImages = await Promise.all(
            allImageUrls.map(url => normalizeImageInput(url))
        );

        // Generate requests in parallel
        const promises = Array.from({ length: numberOfImages }).map(async (_, i) => {
            try {
                const parts: object[] = [];

                if (normalizedImages.length > 0) {
                    normalizedImages.forEach(({ mimeType, data }) => {
                        parts.push({ inlineData: { mimeType, data } });
                    });
                }

                const promptParts = [prompt];
                if (allImageUrls.length > 0) {
                    promptParts.push('Thực hiện yêu cầu trong prompt để tạo ra một bức ảnh mới dựa trên (các) hình ảnh đã cho.');
                }
                if (removeWatermark) {
                    promptParts.push('Yêu cầu đặc biệt: Không được có bất kỳ watermark, logo, hay chữ ký nào trên ảnh kết quả.');
                }
                const fullPrompt = promptParts.join('\n');
                parts.push({ text: fullPrompt });

                const validRatios: string[] = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
                const config: any = {};

                let finalAspectRatio = aspectRatio;
                if (aspectRatio === 'Giữ nguyên' && allImageUrls.length === 0) {
                    finalAspectRatio = '1:1'; // Default for text-to-image
                }

                if (finalAspectRatio !== 'Giữ nguyên' && validRatios.includes(finalAspectRatio)) {
                    config.imageConfig = { aspectRatio: finalAspectRatio };
                }

                // Extract tool_key from URL (e.g., /tool/free-generation -> free-generation)
                // Use provided toolKey if available, otherwise fallback to URL or 'unknown'
                let finalToolKey = toolKey || 'unknown';
                if (!toolKey && typeof window !== 'undefined' && window.location?.pathname) {
                    const pathParts = window.location.pathname.split('/');
                    finalToolKey = pathParts.pop() || 'unknown';
                }
                config.tool_key = finalToolKey;

                const response = await callGeminiWithRetry(parts, config);
                const url = processGeminiResponse(response);

                if (onImageReady) {
                    onImageReady(i, url);
                }
                return url;
            } catch (error) {
                const processedError = processApiError(error);
                console.error(`Error generating image ${i + 1}:`, processedError);
                if (onImageError) {
                    onImageError(i, processedError);
                }
                return null;
            }
        });

        const results = await Promise.all(promises);
        return results.filter((url): url is string => url !== null);

    } catch (error) {
        const processedError = processApiError(error);
        console.error("Error during free image generation setup:", processedError);
        throw processedError;
    }
}