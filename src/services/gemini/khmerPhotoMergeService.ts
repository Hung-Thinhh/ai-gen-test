/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Type } from "@google/genai";
import ai from './client';
import {
    processApiError,
    parseDataUrl,
    callGeminiWithRetry,
    processGeminiResponse
} from './baseService';

function getPrimaryPrompt(templatePrompt: string, customPrompt: string, removeWatermark?: boolean, aspectRatio?: string): string {
    const modificationText = customPrompt ? ` Chi tiết bổ sung: "${customPrompt}".` : '';
    const watermarkText = removeWatermark ? ' Yêu cầu quan trọng: Kết quả cuối cùng không được chứa bất kỳ watermark, logo, hay chữ ký nào.' : '';
    const aspectRatioText = (aspectRatio && aspectRatio !== 'Giữ nguyên') ? `Bức ảnh kết quả BẮT BUỘC phải có tỷ lệ khung hình chính xác là ${aspectRatio}.` : '';

    return `${aspectRatioText}\nHóa thân người trong ảnh vào phong cách Khmer sau: "${templatePrompt}".
    1. YÊU CẦU TUYỆT ĐỐI: Giữ nguyên 100% khuôn mặt, ngũ quan, biểu cảm và đặc điểm nhận dạng của người trong ảnh gốc. Không được thay đổi khuôn mặt.
    2. Chỉ thay đổi trang phục và bối cảnh theo mô tả.
    3. Ảnh kết quả phải chân thực, sắc nét, chất lượng cao 8k.${modificationText}${watermarkText}
    LƯU Ý: Đây là tính năng ghép mặt, hãy đảm bảo khuôn mặt trong ảnh kết quả giống hệt ảnh gốc.`;
}

function getFallbackPrompt(templatePrompt: string, customPrompt: string, removeWatermark?: boolean, aspectRatio?: string): string {
    const modificationText = customPrompt ? ` Bổ sung: "${customPrompt}".` : '';
    const watermarkText = removeWatermark ? ' Không watermark.' : '';
    const aspectRatioText = (aspectRatio && aspectRatio !== 'Giữ nguyên') ? `Tỷ lệ ${aspectRatio}.` : '';

    return `${aspectRatioText}\nGhép khuôn mặt người trong ảnh vào trang phục Khmer: ${templatePrompt}.${modificationText}${watermarkText} YÊU CẦU: Giữ nguyên hoàn toàn khuôn mặt của người trong ảnh gốc.`;
}

export async function generateKhmerImage(
    userImageDataUrl: string,
    templatePrompt: string,
    customPrompt: string,
    removeWatermark?: boolean,
    aspectRatio?: string
): Promise<string> {
    const { mimeType: userMime, data: userData } = parseDataUrl(userImageDataUrl);
    const userImagePart = { inlineData: { mimeType: userMime, data: userData } };

    const config: any = {};
    const validRatios = ['1:1', '3:4', '4:3', '9:16', '16:9', '2:3', '4:5', '3:2', '5:4', '21:9'];
    if (aspectRatio && aspectRatio !== 'Giữ nguyên' && validRatios.includes(aspectRatio)) {
        config.imageConfig = { aspectRatio };
    }

    try {
        console.log("Attempting Khmer Photo Merge generation...");
        // Use prompt-based generation only
        const prompt = getPrimaryPrompt(templatePrompt, customPrompt, removeWatermark, aspectRatio);
        const textPart = { text: prompt };

        // Order: User Image, Prompt (Style Image removed)
        const response = await callGeminiWithRetry([userImagePart, textPart], config);
        return processGeminiResponse(response);
    } catch (error) {
        const processedError = processApiError(error);
        const errorMessage = processedError.message;

        if (errorMessage.includes("API key not valid") || errorMessage.includes("Ứng dụng tạm thời")) {
            throw processedError;
        }

        const isNoImageError = errorMessage.includes("The AI model responded with text instead of an image");

        if (isNoImageError) {
            console.warn(`Primary prompt failed. Trying fallback.`);
            try {
                const fallbackPrompt = getFallbackPrompt(templatePrompt, customPrompt, removeWatermark, aspectRatio);
                const fallbackTextPart = { text: fallbackPrompt };
                // Order: User Image, Prompt
                const fallbackResponse = await callGeminiWithRetry([userImagePart, fallbackTextPart], config);
                return processGeminiResponse(fallbackResponse);
            } catch (fallbackError) {
                console.error("Fallback prompt also failed.", fallbackError);
                throw new Error(`Failed to generate image. Last error: ${processApiError(fallbackError).message}`);
            }
        } else {
            console.error("Error during Khmer Photo Merge generation:", processedError);
            throw processedError;
        }
    }
}
