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

function getPrimaryPrompt(templatePrompt: string, customPrompt: string, removeWatermark?: boolean, aspectRatio?: string, hasSecondImage = false): string {
    const modificationText = customPrompt ? ` Chi tiết bổ sung: "${customPrompt}".` : '';
    const watermarkText = removeWatermark ? ' Yêu cầu quan trọng: Kết quả cuối cùng không được chứa bất kỳ watermark, logo, hay chữ ký nào.' : '';
    const aspectRatioText = (aspectRatio && aspectRatio !== 'Giữ nguyên') ? `Bức ảnh kết quả BẮT BUỘC phải có tỷ lệ khung hình chính xác là ${aspectRatio}.` : '';

    let taskDescription = `**NHIỆM VỤ:** Tạo ảnh mới từ ảnh gốc bằng cách thay đổi trang phục và bối cảnh theo phong cách Khmer: "${templatePrompt}".`;
    let faceInstructions = `**YÊU CẦU TUYỆT ĐỐI VỀ KHUÔN MẶT (QUAN TRỌNG NHẤT):**
1. PHẢI SAO CHÉP CHÍNH XÁC 100% khuôn mặt từ ảnh gốc - đây là yêu cầu TỐI QUAN TRỌNG.
2. Giữ nguyên hoàn toàn: hình dạng mắt, mũi, miệng, cằm, má, trán, lông mày, màu da, kết cấu da.
3. Giữ nguyên biểu cảm, góc nhìn, tư thế đầu từ ảnh gốc.
4. Đây là tính năng FACE SWAP/GHÉP MẶT - khuôn mặt trong ảnh kết quả PHẢI GIỐNG HỆT ảnh gốc.`;

    if (hasSecondImage) {
        taskDescription = `**NHIỆM VỤ:** Tạo ảnh CẶP ĐÔI mới từ 2 ảnh gốc đầu vào. Ảnh 1 là NỮ. Ảnh 2 là NAM. Thay thế trang phục và bối cảnh thành phong cách Khmer: "${templatePrompt}".`;
        faceInstructions = `**YÊU CẦU TUYỆT ĐỐI VỀ KHUÔN MẶT (QUAN TRỌNG NHẤT):**
1. Với nhân vật NỮ: Sao chép CHÍNH XÁC 100% khuôn mặt từ Ảnh đầu vào 1.
2. Với nhân vật NAM: Sao chép CHÍNH XÁC 100% khuôn mặt từ Ảnh đầu vào 2.
3. Giữ nguyên hoàn toàn đặc điểm nhận dạng khuôn mặt của cả hai nhân vật.`;
    }

    return `${aspectRatioText}\n${taskDescription}

${faceInstructions}

**CHỈ ĐƯỢC THAY ĐỔI:**
- Trang phục (theo mô tả)
- Bối cảnh/phông nền (theo mô tả)
- Tư thế cơ thể (nếu cần theo template)

**YÊU CẦU KỸ THUẬT:**
- Chất lượng 8K, sắc nét, chân thực
- Ánh sáng tự nhiên, màu sắc sống động${modificationText}${watermarkText}

**LƯU Ý:** Khuôn mặt là yếu tố KHÔNG ĐƯỢC THAY ĐỔI. Hãy sao chép chính xác 100% khuôn mặt từ ảnh gốc.`;
}

function getFallbackPrompt(templatePrompt: string, customPrompt: string, removeWatermark?: boolean, aspectRatio?: string, hasSecondImage = false): string {
    const modificationText = customPrompt ? ` Bổ sung: "${customPrompt}".` : '';
    const watermarkText = removeWatermark ? ' Không watermark.' : '';
    const aspectRatioText = (aspectRatio && aspectRatio !== 'Giữ nguyên') ? `Tỷ lệ ${aspectRatio}.` : '';

    if (hasSecondImage) {
        return `${aspectRatioText}\nFACE SWAP CẶP ĐÔI: Sao chép khuôn mặt Nữ từ Ảnh 1 và khuôn mặt Nam từ Ảnh 2 vào trang phục Khmer. Giữ nguyên 100% nhân dạng. ${templatePrompt}.${modificationText}${watermarkText}`;
    }
    return `${aspectRatioText}\nFACE SWAP: Sao chép CHÍNH XÁC 100% khuôn mặt người trong ảnh gốc vào trang phục Khmer: ${templatePrompt}. QUAN TRỌNG: Giữ nguyên hoàn toàn khuôn mặt, ngũ quan, biểu cảm. Chỉ thay đổi trang phục và bối cảnh.${modificationText}${watermarkText}`;
}

export async function generateKhmerImage(
    userImageDataUrl: string,
    templatePrompt: string,
    customPrompt: string,
    removeWatermark?: boolean,
    aspectRatio?: string,
    secondImageDataUrl?: string | null
): Promise<string> {
    const { mimeType: userMime, data: userData } = await import('./baseService').then(m => m.normalizeImageInput(userImageDataUrl));
    const userImagePart = { inlineData: { mimeType: userMime, data: userData } };

    const parts = [userImagePart];

    if (secondImageDataUrl) {
        const { mimeType: userMime2, data: userData2 } = await import('./baseService').then(m => m.normalizeImageInput(secondImageDataUrl));
        const userImagePart2 = { inlineData: { mimeType: userMime2, data: userData2 } };
        parts.push(userImagePart2);
    }

    const config: any = {};
    const validRatios = ['1:1', '3:4', '4:3', '9:16', '16:9', '2:3', '4:5', '3:2', '5:4', '21:9'];
    if (aspectRatio && aspectRatio !== 'Giữ nguyên' && validRatios.includes(aspectRatio)) {
        config.imageConfig = { aspectRatio };
    }

    const hasSecondImage = !!secondImageDataUrl;

    try {
        console.log(`Attempting Khmer Photo Merge generation (${hasSecondImage ? 'Couple' : 'Single'} Mode)...`);

        const prompt = getPrimaryPrompt(templatePrompt, customPrompt, removeWatermark, aspectRatio, hasSecondImage);
        const textPart = { text: prompt };

        // Order: User Image 1, [User Image 2], Prompt
        parts.push(textPart as any);

        const response = await callGeminiWithRetry(parts, config);
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
                const fallbackPrompt = getFallbackPrompt(templatePrompt, customPrompt, removeWatermark, aspectRatio, hasSecondImage);
                const fallbackTextPart = { text: fallbackPrompt };

                // Reconstruct parts for fallback (must be clean array)
                const fbParts = [userImagePart];
                if (secondImageDataUrl) {
                    const { mimeType: userMime2, data: userData2 } = await import('./baseService').then(m => m.normalizeImageInput(secondImageDataUrl));
                    fbParts.push({ inlineData: { mimeType: userMime2, data: userData2 } });
                }
                fbParts.push(fallbackTextPart as any);

                const fallbackResponse = await callGeminiWithRetry(fbParts, config);
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
