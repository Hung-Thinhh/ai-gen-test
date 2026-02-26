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

function getPrimaryPrompt(templatePrompt: string, customPrompt: string, styleContext: string, removeWatermark?: boolean, aspectRatio?: string, hasSecondImage = false, toolKey?: string): string {
    const modificationText = customPrompt ? ` ${customPrompt}.` : '';
    const watermarkText = removeWatermark ? ' No watermark or logo.' : '';
    const aspectRatioText = (aspectRatio && aspectRatio !== 'Giữ nguyên') ? `Aspect ratio: ${aspectRatio}. ` : '';

    // OPTIMIZED: Concise but effective face swap instructions
    if (hasSecondImage) {
        if (toolKey === 'fifa-online') {
            return `${aspectRatioText}FACE SWAP + SQUAD FORMATION POSTER:
STEP 1 - FACE SWAP: Take the face from Photo 1 and swap it onto a person in the scene. Keep the EXACT face from Photo 1 - same eyes, nose, mouth, jawline, skin tone, facial structure. The face must be 100% identical to the input photo. Do NOT generate a new face. Do NOT create an AI face. COPY the real human face pixel by pixel.
STEP 2 - SQUAD FORMATION: Take the squad formation from Photo 2 and display it clearly in the image. Keep all player cards, positions, and formation layout as sharp and readable as possible. The formation should occupy most of the image.
STEP 3 - COMPOSITION: Place the person (with swapped face from Photo 1) on one side of the image. The squad formation from Photo 2 fills the rest. The person should wear their ORIGINAL clothes from Photo 1, NOT fantasy armor or suits.
Do NOT add any text, names, titles, or labels.
Style: "${styleContext}"
Scene: "${templatePrompt}"
CRITICAL REMINDER: This is a FACE SWAP task. The face MUST come from Photo 1. Do NOT generate, imagine, or create a new face. Only ONE person in the final image.${modificationText}${watermarkText}`;
        } else {
            return `${aspectRatioText}DUAL FACE SWAP:
Photo 1 (Female): Use this face for female character.
Photo 2 (Male): Use this face for male character.
Style: "${styleContext}"
Scene: "${templatePrompt}"
CRITICAL: Preserve 100% facial identity from input photos. Only change clothing, hair, and background.${modificationText}${watermarkText}`;
        }
    }

    return `${aspectRatioText}FACE SWAP:
Keep exact face from input photo (eyes, nose, mouth, skin tone).
Style: "${styleContext}"
Scene: "${templatePrompt}"
Requirements: Photorealdistic, natural lighting, high detail.${modificationText}${watermarkText}`;
}

function getFallbackPrompt(templatePrompt: string, customPrompt: string, styleContext: string, removeWatermark?: boolean, aspectRatio?: string, hasSecondImage = false, toolKey?: string): string {
    const modificationText = customPrompt ? ` Bổ sung: "${customPrompt}".` : '';
    const watermarkText = removeWatermark ? ' Không watermark.' : '';
    const aspectRatioText = (aspectRatio && aspectRatio !== 'Giữ nguyên') ? `Tỷ lệ ${aspectRatio}.` : '';

    if (hasSecondImage) {
        if (toolKey === 'fifa-online') {
            return `${aspectRatioText}\nGHÉP MẶT + POSTER ĐỘI HÌNH:
BƯỚC 1: LẤY MẶT từ Ảnh 1 và ghép vào nhân vật. Giữ NGUYÊN mặt thật - mắt, mũi, miệng, da, cấu trúc khuôn mặt phải GIỐNG HỆT ảnh gốc. KHÔNG được tạo mặt AI. KHÔNG được vẽ mặt mới.
BƯỚC 2: LẤY ĐỘI HÌNH từ Ảnh 2, hiển thị rõ ràng sắc nét. Giữ nguyên thẻ cầu thủ, vị trí, đội hình.
BƯỚC 3: Người (mặt từ Ảnh 1) đứng 1 bên, mặc ĐÚNG quần áo gốc từ Ảnh 1. Đội hình chiếm phần còn lại.
KHÔNG thêm chữ, tên, nhãn.
PHONG CÁCH: "${styleContext}".
BỐI CẢNH: "${templatePrompt}".
NHẮC LẠI: Đây là GHÉP MẶT. Mặt PHẢI lấy từ Ảnh 1. KHÔNG tạo mặt mới.${modificationText}${watermarkText}`;
        } else {
            return `${aspectRatioText}\nFACE SWAP CẶP ĐÔI (NAM & NỮ):
1. Ghép mặt Nữ từ Ảnh 1 vào nhân vật nữ.
2. Ghép mặt Nam từ Ảnh 2 vào nhân vật nam.
3. PHONG CÁCH: "${styleContext}".
4. TRANG PHỤC & BỐI CẢNH: "${templatePrompt}".
Yêu cầu: Giống mặt 100%, trang phục và phong cách đúng mô tả.${modificationText}${watermarkText}`;
        }
    }
    return `${aspectRatioText}\nFACE SWAP: Sao chép khuôn mặt từ ảnh gốc vào ảnh mới.
PHONG CÁCH: "${styleContext}".
TRANG PHỤC & BỐI CẢNH: "${templatePrompt}".
Yêu cầu: Giữ nguyên khuôn mặt, thay đổi trang phục và bối cảnh đúng như mô tả.${modificationText}${watermarkText}`;
}

export async function generateStudioImage(
    userImageDataUrl: string,
    styleContext: string,
    templatePrompt: string,
    customPrompt: string,
    removeWatermark?: boolean,
    aspectRatio?: string,
    secondImageDataUrl?: string | null,
    toolKey?: string
): Promise<string> {
    const { mimeType: userMime, data: userData } = await import('./baseService').then(m => m.normalizeImageInput(userImageDataUrl));
    const userImagePart = { inlineData: { mimeType: userMime, data: userData } };

    const parts: any[] = [];

    // For FIFA Online: add text labels BEFORE each image so Gemini knows which is which
    if (toolKey === 'fifa-online' && secondImageDataUrl) {
        parts.push({ text: "[Photo 1 - USER PORTRAIT: This is the real person's photo. You MUST use this EXACT face in the final image. Do NOT generate a new face.]" });
        parts.push(userImagePart);

        const { mimeType: userMime2, data: userData2 } = await import('./baseService').then(m => m.normalizeImageInput(secondImageDataUrl));
        const userImagePart2 = { inlineData: { mimeType: userMime2, data: userData2 } };
        parts.push({ text: "[Photo 2 - SQUAD FORMATION: This is a game screenshot showing the team formation. Display this formation in the background.]" });
        parts.push(userImagePart2);
    } else {
        parts.push(userImagePart);
        if (secondImageDataUrl) {
            const { mimeType: userMime2, data: userData2 } = await import('./baseService').then(m => m.normalizeImageInput(secondImageDataUrl));
            const userImagePart2 = { inlineData: { mimeType: userMime2, data: userData2 } };
            parts.push(userImagePart2);
        }
    }

    const config: any = {};
    const validRatios = ['1:1', '3:4', '4:3', '9:16', '16:9', '2:3', '4:5', '3:2', '5:4', '21:9'];
    if (aspectRatio && aspectRatio !== 'Giữ nguyên' && validRatios.includes(aspectRatio)) {
        config.imageConfig = { aspectRatio };
    }

    if (toolKey) {
        config.tool_key = toolKey;
    }

    const hasSecondImage = !!secondImageDataUrl;

    try {
        console.log(`Attempting Studio Image generation (${hasSecondImage ? 'Couple' : 'Single'} Mode) with Context: "${styleContext}"...`);

        const prompt = getPrimaryPrompt(templatePrompt, customPrompt, styleContext, removeWatermark, aspectRatio, hasSecondImage, toolKey);
        const textPart = { text: prompt };

        // Add prompt at the end
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
                const fallbackPrompt = getFallbackPrompt(templatePrompt, customPrompt, styleContext, removeWatermark, aspectRatio, hasSecondImage, toolKey);
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
            console.error("Error during Studio generation:", processedError);
            throw processedError;
        }
    }
}
