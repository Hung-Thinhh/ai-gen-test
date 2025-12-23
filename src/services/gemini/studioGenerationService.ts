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

function getPrimaryPrompt(templatePrompt: string, customPrompt: string, styleContext: string, removeWatermark?: boolean, aspectRatio?: string, hasSecondImage = false): string {
    const modificationText = customPrompt ? ` Chi tiết bổ sung: "${customPrompt}".` : '';
    const watermarkText = removeWatermark ? ' Yêu cầu quan trọng: Kết quả cuối cùng không được chứa bất kỳ watermark, logo, hay chữ ký nào.' : '';
    const aspectRatioText = (aspectRatio && aspectRatio !== 'Giữ nguyên') ? `Bức ảnh kết quả BẮT BUỘC phải có tỷ lệ khung hình chính xác là ${aspectRatio}.` : '';

    // GENERIC: Stronger instruction to follow the template prompt exactly.
    // MODIFICATION: Moved Face Instructions to the TOP to ensure they are processed first.

    let faceInstructions = `**NHIỆM VỤ ƯU TIÊN HÀNG ĐẦU (TOP PRIORITY): BẢO TOÀN KHUÔN MẶT**
Đây là tác vụ GHÉP MẶT (FACE SWAP) chất lượng cao.
1. Mục tiêu duy nhất: Đưa khuôn mặt từ ảnh gốc vào bối cảnh mới.
2. YÊU CẦU: Giữ nguyên 100% các đặc điểm nhận dạng: mắt, mũi, miệng, cằm, má, cấu trúc xương mặt, biểu cảm.
3. CẤM: Không được tạo ra khuôn mặt mới, không được lai tạo khuôn mặt.
4. Ảnh đầu ra phải trông giống hệt người trong ảnh đầu vào, chỉ khác trang phục và tóc.`;

    let taskDescription = `**MÔ TẢ BỐI CẢNH & TRANG PHỤC (STYLE):**
Hãy đặt nhân vật vào bối cảnh và trang phục sau đây theo phong cách "${styleContext}":
"${templatePrompt}"

**CHỈ DẪN THỰC HIỆN:**
- Bước 1: Lấy khuôn mặt từ ảnh đầu vào.
- Bước 2: Tái tạo (Render) lại phần cơ thể, trang phục, tóc và bối cảnh dựa trên mô tả ở trên.
- Bước 3: Hòa trộn ánh sáng sao cho khuôn mặt gốc khớp tự nhiên với bối cảnh mới.`;

    if (hasSecondImage) {
        faceInstructions = `**NHIỆM VỤ ƯU TIÊN HÀNG ĐẦU: FACE SWAP CẶP ĐÔI (DUAL FACE SWAP)**
Bạn được cung cấp 2 ảnh chân dung. Nhiệm vụ là ghép mặt của họ vào một bức ảnh cặp đôi mới.
1. ẢNH 1 (NỮ): Lấy khuôn mặt này ghép vào nhân vật Nữ trong ảnh kết quả.
2. ẢNH 2 (NAM): Lấy khuôn mặt này ghép vào nhân vật Nam trong ảnh kết quả.
3. YÊU CẦU TUYỆT ĐỐI: 
   - Khuôn mặt Nữ phải giống 100% người trong Ảnh 1.
   - Khuôn mặt Nam phải giống 100% người trong Ảnh 2.
   - KHÔNG ĐƯỢC HOÁN ĐỔI GIỚI TÍNH hay khuôn mặt.`;

        taskDescription = `**MÔ TẢ BỐI CẢNH & TRANG PHỤC CẶP ĐÔI:**
Phong cách chủ đạo: "${styleContext}"
"${templatePrompt}"

HÃY ĐẢM BẢO:
- Nhân vật Nữ mặc trang phục Nữ như mô tả.
- Nhân vật Nam mặc trang phục Nam như mô tả.
- Bối cảnh chính xác như mô tả.`;
    }

    return `${aspectRatioText}
${faceInstructions}

${taskDescription}

**YÊU CẦU KỸ THUẬT:**
- Độ phân giải siêu cao (8K), chi tiết sắc nét.
- Giữ nguyên màu da (Skin tone) của người trong ảnh gốc.
- Ánh sáng tự nhiên (Photorealistic lighting).${modificationText}${watermarkText}

**LỜI NHẮC CUỐI CÙNG:** Nếu khuôn mặt không giống ảnh gốc, tác vụ coi như THẤT BẠI.`;
}

function getFallbackPrompt(templatePrompt: string, customPrompt: string, styleContext: string, removeWatermark?: boolean, aspectRatio?: string, hasSecondImage = false): string {
    const modificationText = customPrompt ? ` Bổ sung: "${customPrompt}".` : '';
    const watermarkText = removeWatermark ? ' Không watermark.' : '';
    const aspectRatioText = (aspectRatio && aspectRatio !== 'Giữ nguyên') ? `Tỷ lệ ${aspectRatio}.` : '';

    if (hasSecondImage) {
        return `${aspectRatioText}\nFACE SWAP CẶP ĐÔI (NAM & NỮ):
1. Ghép mặt Nữ từ Ảnh 1 vào nhân vật nữ.
2. Ghép mặt Nam từ Ảnh 2 vào nhân vật nam.
3. PHONG CÁCH: "${styleContext}".
4. TRANG PHỤC & BỐI CẢNH: "${templatePrompt}".
Yêu cầu: Giống mặt 100%, trang phục và phong cách đúng mô tả.${modificationText}${watermarkText}`;
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
        console.log(`Attempting Studio Image generation (${hasSecondImage ? 'Couple' : 'Single'} Mode) with Context: "${styleContext}"...`);

        const prompt = getPrimaryPrompt(templatePrompt, customPrompt, styleContext, removeWatermark, aspectRatio, hasSecondImage);
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
                const fallbackPrompt = getFallbackPrompt(templatePrompt, customPrompt, styleContext, removeWatermark, aspectRatio, hasSecondImage);
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
