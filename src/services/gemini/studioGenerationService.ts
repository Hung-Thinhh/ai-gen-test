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
            return `${aspectRatioText}Epic esports poster:
Background: A packed, glowing football stadium at night under bright stadium lights. Luxurious gold, amber, and bronze color grading. Integrate the gaming squad formation card layout beautifully, glowing with golden magical sparks and lens flares.
Foreground: The person looking confident, wearing a sleek black polo shirt or suit, standing with crossed arms. 
Details: Add glowing golden particles floating in the air, dynamic cinematic lighting highlighting the person's face. The words "HLV" and a stylized golden logo subtly integrated into the shiny golden bottom frame. 
Style: 8k resolution, ultra-detailed, photorealistic, octane render masterpiece. No extra text labels.${modificationText}${watermarkText}`;
        } else {
            return `${aspectRatioText}PORTRAIT MERGING (DUAL):
Photo 1: Reference for the person's face. 
Photo 2: Reference for the secondary person or background element.
Instruction: Preserve the facial identity (eyes, nose, mouth, skin tone) from the input photos.
Style: "${styleContext}"
Scene: "${templatePrompt}"
Create a photorealistic result preserving the subjects' appearance.${modificationText}${watermarkText}`;
        }
    }

    return `${aspectRatioText}PORTRAIT RECREATION:
Keep the exact facial identity from the input photo (eyes, nose, mouth, skin tone).
Style: "${styleContext}"
Scene: "${templatePrompt}"
Requirements: Photorealistic, natural lighting, high detail.${modificationText}${watermarkText}`;
}

function getFallbackPrompt(templatePrompt: string, customPrompt: string, styleContext: string, removeWatermark?: boolean, aspectRatio?: string, hasSecondImage = false, toolKey?: string): string {
    const modificationText = customPrompt ? ` Bổ sung: "${customPrompt}".` : '';
    const watermarkText = removeWatermark ? ' Không watermark.' : '';
    const aspectRatioText = (aspectRatio && aspectRatio !== 'Giữ nguyên') ? `Tỷ lệ ${aspectRatio}.` : '';

    if (hasSecondImage) {
        if (toolKey === 'fifa-online') {
            return `${aspectRatioText}\nẢNH CHÂN DUNG + SƠ ĐỒ ĐỘI HÌNH:
- Ảnh 1: Chân dung tuyển thủ. Cần tái tạo lại chân dung và trang phục một cách tự nhiên.
- Ảnh 2: Sơ đồ đội hình game. Cần tích hợp rõ ràng vào hình ảnh.
Nhiệm vụ: Tạo một poster chuyên nghiệp với người đứng một bên và sơ đồ đội hình chiếm không gian còn lại.
Phong cách: Sân vận động hoành tráng, ánh sáng rực rỡ, không khí thi đấu đỉnh cao.
Yêu cầu: Không thêm chữ hay nhãn.${modificationText}${watermarkText}`;
        } else {
            return `${aspectRatioText}\nGHÉP MẶT HAI NGƯỜI:
- Ảnh 1 & Ảnh 2: Hình mẫu khuôn mặt.
- Yêu cầu: Giữ nguyên khuôn mặt thật (mắt, mũi, miệng, da).
PHONG CÁCH: "${styleContext}".
BỐI CẢNH: "${templatePrompt}".${modificationText}${watermarkText}`;
        }
    }
    return `${aspectRatioText}\nGHÉP MẶT: Sao chép khuôn mặt thực từ ảnh gốc vào ảnh mới.
Yêu cầu: Giữ nguyên khuôn mặt thật (mắt, mũi, miệng, da).
PHONG CÁCH: "${styleContext}".
BỐI CẢNH: "${templatePrompt}".${modificationText}${watermarkText}`;
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
