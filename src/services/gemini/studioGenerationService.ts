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
            return `${aspectRatioText}A professional eSports tournament broadcast graphic for a football game.
The scene features two distinct elements based on the provided reference photos:
1. The FIRST IMAGE shows the manager/competitor. Their facial identity, expression, and original clothing must be represented with absolute fidelity in the final output.
2. The SECOND IMAGE shows their tactical squad formation. This entire formation layout, including all player cards and positions, must be clearly visible and legible as the background or central focus of the graphic.
Composition: The manager stands confidently on one side. The tactical formation occupies the remaining space.
Atmosphere: Professional gaming arena, cinematic stadium lighting, elegant golden and blue auras, high-end eSports production quality.
Please create a cohesive, photorealistic scene that combines these elements naturally. No additional text, labels, or names.${modificationText}${watermarkText}`;
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
            return `${aspectRatioText}\nPOSTER COMPETITOR FIFA ONLINE 4:
Dữ liệu đầu vào:
- Ảnh 1: Chân dung người thật. CẦN giữ nguyên khuôn mặt 100%.
- Ảnh 2: Ảnh chụp màn hình đội hình game.
Nhiệm vụ: Tạo ảnh giới thiệu tuyển thủ esports chuyên nghiệp.
Đặt người từ Ảnh 1 ở một bên. Giữ nguyên mặt và trang phục từ Ảnh 1.
Hiển thị đội hình từ Ảnh 2 rõ ràng ở trung tâm hoặc phía sau. Thẻ cầu thủ phải dễ đọc.
Hiệu ứng: Sân vận động hoành tráng, hào quang vàng/xanh, không khí vô địch.
YÊU CẦU: Giống mặt 100%, không thêm chữ hay nhãn.${modificationText}${watermarkText}`;
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
    parts.push(userImagePart);

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

    if (toolKey) {
        config.tool_key = toolKey;
    }

    const hasSecondImage = !!secondImageDataUrl;

    try {
        console.log(`Attempting Studio Image generation (${hasSecondImage ? 'Dual' : 'Single'} Mode) with Context: "${styleContext}"...`);

        const prompt = getPrimaryPrompt(templatePrompt, customPrompt, styleContext, removeWatermark, aspectRatio, hasSecondImage, toolKey);
        const textPart = { text: prompt };

        // Order: Image 1, [Image 2], Prompt
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
