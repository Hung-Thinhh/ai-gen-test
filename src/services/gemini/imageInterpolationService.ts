/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Type } from "@google/genai";
import {
    processApiError,
    parseDataUrl,
    getTextModel
} from './baseService';

/**
 * Analyzes a single image to generate a descriptive prompt (QUICK mode).
 * @param sourceImageDataUrl Data URL of the source image.
 * @returns A promise resolving to the generated text prompt.
 */
export async function analyzeImagePairForPrompt(sourceImageDataUrl: string): Promise<{ mainPrompt: string; suggestions: string; }> {
    const { mimeType, data } = parseDataUrl(sourceImageDataUrl);
    const imagePart = { inlineData: { mimeType, data } };

    const prompt = `
        Bạn là một AI chuyên gia phân tích hình ảnh và tạo prompt (câu lệnh).
        Hãy phân tích bức ảnh này và tạo ra một câu lệnh (prompt) chính xác để có thể tái tạo lại bức ảnh này bằng các AI tạo ảnh (như Stable Diffusion, Midjourney).

        **YÊU CẦU:**
        1.  Mô tả ngắn gọn, súc tích về **chủ đề chính**, **phong cách nghệ thuật**, **màu sắc**, và **bố cục**.
        2.  Không dùng các từ ngữ cảm thán hay mô tả mơ hồ. Tập trung vào các từ khóa quan trọng.
        3.  Bắt đầu trực tiếp bằng mô tả. Ví dụ: "Một bức chân dung cô gái..."

        **ĐẦU RA (JSON):**
        - **mainPrompt**: Câu lệnh mô tả ảnh (tiếng Việt).
        - **suggestions**: Một mảng gồm 2 đến 4 ý tưởng gợi ý để biến tấu bức ảnh này thành phong cách khác.
    `;
    const textPart = { text: prompt };

    try {
        console.log("Attempting to analyze single image for prompt (QUICK)...");

        // Use callGeminiTextWithRetry (server-side API)
        const { callGeminiGenericWithRetry } = await import('./baseService');

        const response = await callGeminiGenericWithRetry(
            getTextModel(),
            [{ parts: [textPart, imagePart] }],
            {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        mainPrompt: { type: Type.STRING, description: "Câu lệnh mô tả bức ảnh." },
                        suggestions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Các ý tưởng biến tấu."
                        },
                    },
                    required: ["mainPrompt", "suggestions"],
                }
            }
        );

        const text = response.text;
        if (!text) {
            throw new Error("AI không thể tạo prompt từ cặp ảnh.");
        }
        const normalizedText = text.trim();
        if (normalizedText) {
            const parsed = JSON.parse(normalizedText);
            const suggestionsString = Array.isArray(parsed.suggestions) ? parsed.suggestions.join('\n') : '';
            return {
                mainPrompt: parsed.mainPrompt || '',
                suggestions: suggestionsString,
            };
        }

        console.error("API did not return text. Response:", response);
        throw new Error("The AI model did not return a valid JSON response.");

    } catch (error) {
        const processedError = processApiError(error);
        console.error("Error during prompt generation from image pair:", processedError);
        throw processedError;
    }
}

// DEPRECATED: analyzeImagePairForPromptDeep is removed as part of single-image redesign.
// Keeping this placeholder commented out if needed for reference, or just removing it.
// I will remove it completely to clean up.

/**
 * Analyzes a single image to generate an EXPERT-LEVEL descriptive prompt (EXPERT mode).
 * @param sourceImageDataUrl Data URL of the source image.
 * @returns A promise resolving to an object with the detailed main prompt and suggestions.
 */
export async function analyzeImagePairForPromptExpert(sourceImageDataUrl: string): Promise<{ mainPrompt: string; suggestions: string; }> {
    const { mimeType, data } = parseDataUrl(sourceImageDataUrl);
    const imagePart = { inlineData: { mimeType, data } };

    const prompt = `
        Bạn là một Kỹ sư Prompt (Prompt Engineer) bậc thầy và chuyên gia phân tích hình ảnh. 
        Nhiệm vụ của bạn là "đảo ngược" (reverse-engineer) bức ảnh này thành một prompt cực kỳ chi tiết, chuyên nghiệp, sử dụng thuật ngữ chuyên ngành nhiếp ảnh và nghệ thuật số.

        **YÊU CẦU CỐT LÕI:**
        1.  **Chi tiết cực cao:** Mô tả từng khía cạnh nhỏ nhất: ánh sáng (lighting), góc máy (camera angle), loại ống kính (lens type), khẩu độ (aperture), phong cách (style), kết cấu (texture), và tâm trạng (mood).
        2.  **Sử dụng thuật ngữ chuyên môn:** Ví dụ: "volumetric lighting", "bokeh", "cinematic composition", "digital painting style", "octane render", "unreal engine 5", "8k resolution".
        3.  **Cấu trúc prompt:**
            - **Chủ đề chính:** Mô tả chi tiết chủ thể.
            - **Môi trường & Bối cảnh:** Mô tả nền và không gian xung quanh.
            - **Thông số kỹ thuật & Phong cách:** Các từ khóa về phong cách và chất lượng ảnh.

        **ĐẦU RA (JSON):**
        - **mainPrompt**: Câu lệnh prompt chuyên gia (tiếng Việt), dài và chi tiết.
        - **suggestions**: Một mảng gồm 2 đến 4 ý tưởng nâng cao để biến bức ảnh này thành một tác phẩm nghệ thuật khác biệt hoàn toàn (ví dụ: Cyberpunk, Fantasy, Oil Painting).
    `;
    const textPart = { text: prompt };

    try {
        console.log("Attempting to analyze single image for prompt (EXPERT)...");

        // Use server-side API
        const { callGeminiGenericWithRetry } = await import('./baseService');

        const response = await callGeminiGenericWithRetry(
            getTextModel(),
            [{ parts: [textPart, imagePart] }],
            {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        mainPrompt: { type: Type.STRING, description: "Câu lệnh cực kỳ chi tiết mô tả bức ảnh." },
                        suggestions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Các ý tưởng biến tấu nâng cao."
                        },
                    },
                    required: ["mainPrompt", "suggestions"],
                }
            }
        );

        const text = response.text;
        if (!text) {
            throw new Error("AI không thể tạo prompt chuyên gia từ cặp ảnh.");
        }
        const normalizedText = text.trim();
        if (normalizedText) {
            const parsed = JSON.parse(normalizedText);
            const suggestionsString = Array.isArray(parsed.suggestions) ? parsed.suggestions.join('\n') : '';
            return {
                mainPrompt: parsed.mainPrompt || '',
                suggestions: suggestionsString,
            };
        }

        console.error("API did not return text. Response:", response);
        throw new Error("The AI model did not return a valid JSON response.");

    } catch (error) {
        const processedError = processApiError(error);
        console.error("Error during expert prompt generation from image pair:", processedError);
        throw processedError;
    }
}


/**
 * Merges a base prompt with user's notes into a new, cohesive prompt.
 * @param basePrompt The initial prompt generated from image analysis.
 * @param userNotes The user's additional modification requests.
 * @returns A promise that resolves to the new, merged prompt.
 */
export async function interpolatePrompts(basePrompt: string, userNotes: string): Promise<string> {
    const prompt = `
        Bạn là một trợ lý AI chuyên tinh chỉnh các câu lệnh tạo ảnh.
        Nhiệm vụ của bạn là hợp nhất "Yêu cầu Chỉnh sửa của Người dùng" vào "Prompt Gốc" để tạo ra một prompt mới, mạch lạc bằng tiếng Việt.

        - **Prompt Gốc (mô tả một sự biến đổi cơ bản):** "${basePrompt}"
        - **Yêu cầu Chỉnh sửa của Người dùng (CÓ ƯU TIÊN CAO HƠN):** "${userNotes}"

        **Quy tắc quan trọng:**
        1.  **Ưu tiên yêu cầu của người dùng:** Prompt mới phải ưu tiên thực hiện yêu cầu của người dùng. Nếu có sự mâu thuẫn, yêu cầu của người dùng sẽ ghi đè lên các phần tương ứng trong Prompt Gốc.
        2.  **Giữ lại ý chính:** Giữ lại bản chất của sự biến đổi từ Prompt Gốc, trừ khi nó bị thay đổi trực tiếp bởi yêu cầu của người dùng.
        3.  **Tích hợp hợp lý:** Tích hợp các thay đổi một cách tự nhiên vào prompt, tạo thành một câu lệnh hoàn chỉnh.

        **Ví dụ:**
        - **Prompt Gốc:** "biến ảnh thành tranh màu nước"
        - **Yêu cầu người dùng:** "sử dụng tông màu chủ đạo là xanh dương và vàng"
        - **Prompt Mới:** "biến ảnh thành tranh màu nước, sử dụng bảng màu chủ đạo là xanh dương và vàng"

        - **Prompt Gốc:** "thêm một chiếc mũ phù thủy nhỏ màu đỏ cho con mèo"
        - **Yêu cầu người dùng:** "thay mũ bằng vương miện và làm cho mắt mèo phát sáng"
        - **Prompt Mới:** "đội một chiếc vương miện cho con mèo và làm cho mắt nó phát sáng"

        Bây giờ, hãy tạo prompt mới dựa trên các đầu vào được cung cấp. Chỉ xuất ra văn bản prompt cuối cùng bằng tiếng Việt. Không thêm bất kỳ cụm từ giới thiệu nào.
    `;

    try {
        console.log("Attempting to interpolate prompts with prioritization...");
        const { callGeminiTextWithRetry } = await import('./baseService');
        const text = await callGeminiTextWithRetry(prompt, getTextModel());

        if (text) {
            return text.trim();
        }

        throw new Error("The AI model did not return a valid text prompt for interpolation.");

    } catch (error) {
        const processedError = processApiError(error);
        console.error("Error during prompt interpolation:", processedError);
        throw processedError;
    }
}

/**
 * Adapts a base prompt to be more contextually relevant to a reference image.
 * @param imageDataUrl The data URL of the reference image.
 * @param basePrompt The initial prompt describing a transformation.
 * @returns A promise that resolves to the new, contextually-aware prompt.
 */
export async function adaptPromptToContext(imageDataUrl: string, basePrompt: string): Promise<string> {
    const { mimeType, data: base64Data } = parseDataUrl(imageDataUrl);
    const imagePart = { inlineData: { mimeType, data: base64Data } };

    const promptText = `Nhiệm vụ của bạn là một chuyên gia tinh chỉnh prompt cho AI tạo ảnh. Tôi sẽ cung cấp cho bạn: 1. Một "Ảnh Tham Chiếu". 2. Một "Prompt Gốc" mô tả một sự biến đổi. Yêu cầu của bạn là viết lại "Prompt Gốc" thành một "Prompt Mới" sao cho phù hợp hơn với bối cảnh, chủ thể, và phong cách của "Ảnh Tham Chiếu". Sự biến đổi cốt lõi phải được giữ nguyên. Ví dụ: - Ảnh Tham Chiếu: ảnh một con chó thật. - Prompt Gốc: "biến thành nhân vật hoạt hình" - Prompt Mới: "biến con chó trong ảnh thành nhân vật hoạt hình theo phong cách Pixar". - Ảnh Tham Chiếu: ảnh một toà nhà cổ kính. - Prompt Gốc: "thêm các chi tiết cyberpunk" - Prompt Mới: "thêm các chi tiết máy móc và đèn neon theo phong cách cyberpunk vào toà nhà cổ kính, giữ lại kiến trúc gốc". - Ảnh Tham Chiếu: một bức tranh phong cảnh màu nước. - Prompt Gốc: "thay đổi bầu trời thành dải ngân hà" - Prompt Mới: "vẽ lại bầu trời thành một dải ngân hà rực rỡ theo phong cách màu nước, hoà hợp với phần còn lại của bức tranh". Prompt Gốc hiện tại là: "${basePrompt}". Hãy phân tích Ảnh Tham Chiếu và tạo ra Prompt Mới bằng tiếng Việt. Chỉ trả về nội dung của prompt, không có các cụm từ giới thiệu như "Đây là prompt mới:".`;
    const textPart = { text: promptText };

    try {
        console.log("Attempting to adapt prompt to image context...");
        const { callGeminiGenericWithRetry } = await import('./baseService');
        const response = await callGeminiGenericWithRetry(
            getTextModel(),
            [{ parts: [imagePart, textPart] }],
            {}
        );

        const text = response.text;
        if (text) {
            return text.trim();
        }

        console.warn("API did not return text for context adaptation. Falling back to base prompt. Response:", response);
        return basePrompt;

    } catch (error) {
        const processedError = processApiError(error);
        console.error("Error during prompt context adaptation. Falling back to base prompt.", processedError);
        return basePrompt;
    }
}