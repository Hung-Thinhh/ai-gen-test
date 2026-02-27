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
            return `${aspectRatioText}CREATE A FIFA/FC ONLINE ESPORTS POSTER:

SELECTED TEMPLATE STYLE: ${templatePrompt}

SCENE DESCRIPTION:
A professional esports poster featuring a Head Coach (HLV) standing confidently in a football stadium setting. Apply the SELECTED TEMPLATE STYLE above to customize the atmosphere, lighting, and mood. Golden/amber color grading with dramatic lighting. Gaming UI elements and formation cards floating as holographic overlays.

REFERENCES PROVIDED:
- REFERENCE IMAGE A shows the Head Coach appearance to include
- REFERENCE IMAGE B shows the gaming squad formation UI style to incorporate as graphic elements

OUTPUT REQUIREMENTS:
- Stadium background styled according to the SELECTED TEMPLATE
- Coach figure wearing sleek black polo or suit, crossed arms, confident pose
- Formation card elements integrated as glowing golden holographic overlays (not as real players)
- "HLV" text and stylized golden logo in frame
- 8k resolution, photorealistic, cinematic lighting matching the template style
- No additional text labels${modificationText}${watermarkText}`;
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

    // Single image mode or FIFA without second image
    if (toolKey === 'fifa-online') {
        return `${aspectRatioText}CREATE A FIFA/FC ONLINE ESPORTS POSTER:

SELECTED TEMPLATE STYLE: ${templatePrompt}

SCENE DESCRIPTION:
A professional esports poster featuring a Head Coach (HLV) standing confidently in a football stadium setting. Apply the SELECTED TEMPLATE STYLE above to customize the atmosphere, lighting, and mood. Golden/amber color grading with dramatic lighting. Gaming UI elements and formation cards floating as holographic overlays.

REFERENCES PROVIDED:
- REFERENCE IMAGE A shows the Head Coach appearance to include
- Use default FIFA gaming UI style for formation card overlays

OUTPUT REQUIREMENTS:
- Stadium background styled according to the SELECTED TEMPLATE
- Coach figure wearing sleek black polo or suit, crossed arms, confident pose
- Standard FIFA formation card overlays as glowing golden holographic elements
- "HLV" text and stylized golden logo in frame
- 8k resolution, photorealistic, cinematic lighting matching the template style
- No additional text labels${modificationText}${watermarkText}`;
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

    // FIFA: Works with or without second image
    if (toolKey === 'fifa-online') {
        if (hasSecondImage) {
            return `${aspectRatioText}\nTẠO POSTER ESPORTS FIFA/FC ONLINE:

MẪU ĐÃ CHỌN: ${templatePrompt}

MÔ TẢ CẢNH:
Poster thể thao điện tử chuyên nghiệp với HLV đứng tự tin. Áp dụng phong cách từ MẪU ĐÃ CHỌN ở trên để tùy chỉnh không khí sân vận động, ánh sáng và màu sắc. Tông màu vàng đồng với ánh đèn sân khấu drama. UI game và thẻ đội hình hiển thị như lớp hologram phủ lên.

ẢNH THAM KHẢO:
- ẢNH A: Hình dáng HLV cần đưa vào poster
- ẢNH B: Phong cách UI đội hình game để tích hợp dưới dạng đồ họa

YÊU CẦU OUTPUT:
+ Sân vận động theo phong cách MẪU ĐÃ CHỌN
+ Nhân vật HLV mặc áo polo đen hoặc vest, tư thế tự tin, tay khoanh
+ Thẻ đội hình tích hợp như lớp hologram vàng phát sáng (không phải ngưở i thật)
+ Chữ "HLV" và logo vàng trong khung
+ 8k resolution, photorealistic, cinematic lighting theo mẫu
+ Không thêm chữ hay nhãn khác${modificationText}${watermarkText}`;
        } else {
            return `${aspectRatioText}\nTẠO POSTER ESPORTS FIFA/FC ONLINE:

MẪU ĐÃ CHỌN: ${templatePrompt}

MÔ TẢ CẢNH:
Poster thể thao điện tử chuyên nghiệp với HLV đứng tự tin. Áp dụng phong cách từ MẪU ĐÃ CHỌN ở trên để tùy chỉnh không khí sân vận động, ánh sáng và màu sắc. Tông màu vàng đồng với ánh đèn sân khấu drama. UI game và thẻ đội hình hiển thị như lớp hologram phủ lên.

ẢNH THAM KHẢO:
- ẢNH A: Hình dáng HLV cần đưa vào poster
- Dùng style UI đội hình chuẩn của FIFA/FC Online

YÊU CẦU OUTPUT:
+ Sân vận động theo phong cách MẪU ĐÃ CHỌN
+ Nhân vật HLV mặc áo polo đen hoặc vest, tư thế tự tin, tay khoanh
+ Thẻ đội hình chuẩn FIFA/FC Online như lớp hologram vàng phát sáng
+ Chữ "HLV" và logo vàng trong khung
+ 8k resolution, photorealistic, cinematic lighting theo mẫu
+ Không thêm chữ hay nhãn khác${modificationText}${watermarkText}`;
        }
    }
    
    if (hasSecondImage) {
        return `${aspectRatioText}\nGHÉP MẶT HAI NGƯỜI:
- Ảnh 1 & Ảnh 2: Hình mẫu khuôn mặt.
- Yêu cầu: Giữ nguyên khuôn mặt thật (mắt, mũi, miệng, da).
PHONG CÁCH: "${styleContext}".
BỐI CẢNH: "${templatePrompt}".${modificationText}${watermarkText}`;
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

    // FIX: Build parts with TEXT FIRST for FIFA to avoid IMAGE_OTHER
    // This changes how the model interprets the request
    const isFifaOnline = toolKey === 'fifa-online';
    
    // For FIFA: check if actually has valid second image
    const hasValidSecondImage = !!(secondImageDataUrl && secondImageDataUrl.length > 100);
    
    const prompt = getPrimaryPrompt(templatePrompt, customPrompt, styleContext, removeWatermark, aspectRatio, hasValidSecondImage, toolKey);
    const textPart = { text: prompt };
    
    const parts: any[] = [];
    
    // For FIFA: Text first, then images (different from other tools)
    // This helps avoid triggering face manipulation policy
    if (isFifaOnline) {
        parts.push(textPart);
        parts.push(userImagePart);
        if (hasValidSecondImage) {
            const { mimeType: userMime2, data: userData2 } = await import('./baseService').then(m => m.normalizeImageInput(secondImageDataUrl));
            parts.push({ inlineData: { mimeType: userMime2, data: userData2 } });
        }
    } else {
        // Original order for other tools: Images first, then text
        parts.push(userImagePart);
        if (secondImageDataUrl) {
            const { mimeType: userMime2, data: userData2 } = await import('./baseService').then(m => m.normalizeImageInput(secondImageDataUrl));
            parts.push({ inlineData: { mimeType: userMime2, data: userData2 } });
        }
        parts.push(textPart as any);
    }

    const config: any = {};
    const validRatios = ['1:1', '3:4', '4:3', '9:16', '16:9', '2:3', '4:5', '3:2', '5:4', '21:9'];
    if (aspectRatio && aspectRatio !== 'Giữ nguyên' && validRatios.includes(aspectRatio)) {
        config.imageConfig = { aspectRatio };
    }

    if (toolKey) {
        config.tool_key = toolKey;
    }

    const hasSecondImage = hasValidSecondImage;

    try {
        console.log(`Attempting Studio Image generation (${hasSecondImage ? 'Dual' : 'Single'} Mode) with Context: "${styleContext}"...`);
        if (isFifaOnline) {
            console.log(`[FIFA DEBUG] Using ${hasSecondImage ? '2 images' : '1 image only'}, Order: TEXT -> IMG1${hasSecondImage ? ' -> IMG2' : ''}`);
        }

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

                // Reconstruct parts for fallback with same order logic
                const fbParts: any[] = [];
                if (isFifaOnline) {
                    // Text first for FIFA
                    fbParts.push(fallbackTextPart);
                    fbParts.push(userImagePart);
                    if (hasSecondImage) {
                        const { mimeType: userMime2, data: userData2 } = await import('./baseService').then(m => m.normalizeImageInput(secondImageDataUrl));
                        fbParts.push({ inlineData: { mimeType: userMime2, data: userData2 } });
                    }
                } else {
                    // Images first for others
                    fbParts.push(userImagePart);
                    if (hasSecondImage) {
                        const { mimeType: userMime2, data: userData2 } = await import('./baseService').then(m => m.normalizeImageInput(secondImageDataUrl));
                        fbParts.push({ inlineData: { mimeType: userMime2, data: userData2 } });
                    }
                    fbParts.push(fallbackTextPart as any);
                }

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
