/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Modality } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import ai, { hasApiKey } from './client'; // Import the shared client instance

// --- Global Configuration Store ---
interface GlobalConfig {
    modelVersion: 'v2' | 'v3';
    imageResolution: '1K' | '2K' | '4K';
}

let globalConfig: GlobalConfig = {
    modelVersion: 'v2',
    imageResolution: '1K'
};

export const setGlobalModelConfig = (config: Partial<GlobalConfig>) => {
    globalConfig = { ...globalConfig, ...config };
};

export const getModelConfig = () => globalConfig;

export const getTextModel = () => globalConfig.modelVersion === 'v3' ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';
export const getImageModel = () => globalConfig.modelVersion === 'v3' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

// --- Centralized Error Processor ---
export function processApiError(error: unknown): Error {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.group("Gemini API Error Debug");
    console.error("Raw Error Object:", error);
    console.error("Error Message String:", errorMessage);
    console.groupEnd();

    if (errorMessage.includes('ReadableStream uploading is not supported')) {
        return new Error("Ứng dụng tạm thời chưa tương thích ứng dụng di động, mong mọi người thông cảm");
    }
    if (errorMessage.toLowerCase().includes('api key not valid')) {
        return new Error("API Key không hợp lệ. Vui lòng liên hệ quản trị viên để được hỗ trợ.");
    }
    if (errorMessage.includes('not configured')) {
        return new Error("Chưa cấu hình API Key. Vui lòng kiểm tra file .env của bạn.");
    }
    if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('resource_exhausted')) {
        console.log(errorMessage);

        return new Error("Ứng dụng tạm thời đạt giới hạn sử dụng trong ngày, hãy quay trở lại vào ngày tiếp theo.");
    }
    if (errorMessage.toLowerCase().includes('safety') || errorMessage.toLowerCase().includes('blocked')) {
        return new Error("Yêu cầu của bạn đã bị chặn vì lý do an toàn. Vui lòng thử với một hình ảnh hoặc prompt khác.");
    }

    // Return original Error object or a new one for other cases
    if (error instanceof Error) {
        return new Error("Đã xảy ra lỗi không mong muốn từ AI. Vui lòng thử lại sau. Chi tiết: " + error.message);
    }
    return new Error("Đã có lỗi không mong muốn từ AI: " + errorMessage);
}

/**
 * Parses a data URL string to extract its mime type and base64 data.
 * @param imageDataUrl The data URL to parse.
 * @returns An object containing the mime type and data.
 */
export function parseDataUrl(imageDataUrl: string): { mimeType: string; data: string } {
    const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
        throw new Error("Invalid image data URL format. Expected 'data:image/...;base64,...'");
    }
    const [, mimeType, data] = match;
    return { mimeType, data };
}

/**
 * Processes the Gemini API response, extracting the image or throwing an error if none is found.
 * @param response The response from the generateContent call.
 * @returns A data URL string for the generated image.
 */
export function processGeminiResponse(response: GenerateContentResponse): string {
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        return `data:${mimeType};base64,${data}`;
    }

    const textResponse = response.text;
    console.error("API did not return an image. Response:", textResponse);
    throw new Error(`The AI model responded with text instead of an image: "${textResponse || 'No text response received.'}"`);
}

/**
 * A wrapper for the Gemini API call that includes a retry mechanism for internal server errors
 * and for responses that don't contain an image.
 * @param parts An array of parts for the request payload (e.g., image parts, text parts).
 * @param config Optional configuration object for the generateContent call.
 * @returns The GenerateContentResponse from the API.
 */
export async function callGeminiWithRetry(parts: object[], config: any = {}): Promise<GenerateContentResponse> {
    const maxRetries = 3;
    const initialDelay = 1000;
    let lastError: Error | null = null;

    // Check usage limits before making API call
    const { canUseModel, incrementUsage, getRemainingUses } = await import('./usageTracker');
    const currentVersion = globalConfig.modelVersion;

    if (!canUseModel(currentVersion)) {
        const remaining = getRemainingUses(currentVersion);
        throw new Error(`Bạn đã hết lượt sử dụng miễn phí cho model ${currentVersion.toUpperCase()}. Còn lại: ${remaining} lượt.`);
    }

    const model = getImageModel();
    const extraConfig = globalConfig.modelVersion === 'v3'
        ? { imageConfig: { imageSize: globalConfig.imageResolution, ...config.imageConfig } }
        : {};

    const finalConfig = {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
        ...config,
        ...extraConfig
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Gemini Debug] Attempt ${attempt}: Sending request. Has API Key? ${hasApiKey}. Model: ${model}`);
            const response = await ai.models.generateContent({
                model: model,
                contents: { parts },
                config: finalConfig,
            });

            // Validate that the response contains an image.
            const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
            if (imagePart?.inlineData) {
                // Success! Increment usage count
                incrementUsage(currentVersion);
                return response;
            }

            // If no image is found, treat it as a failure and prepare for retry.
            const textResponse = response.text || "No text response received.";
            lastError = new Error(`The AI model responded with text instead of an image: "${textResponse}"`);
            console.warn(`Attempt ${attempt}/${maxRetries}: No image returned. Retrying... Response text: ${textResponse}`);

        } catch (error) {
            const processedError = processApiError(error);
            lastError = processedError;
            const errorMessage = processedError.message;
            console.error(`Error calling Gemini API (Attempt ${attempt}/${maxRetries}):`, errorMessage);

            // Don't retry on critical errors like invalid API key or quota issues.
            if (errorMessage.includes('API Key không hợp lệ') || errorMessage.includes('Chưa cấu hình') || errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('resource_exhausted')) {
                throw processedError;
            }

            // If it's not a retriable server error and we're out of retries, fail.
            const isInternalError = errorMessage.includes('"code":500') || errorMessage.includes('INTERNAL');
            if (!isInternalError && attempt >= maxRetries) {
                throw processedError;
            }
        }

        // Wait before the next attempt, but not after the last one.
        if (attempt < maxRetries) {
            const delay = initialDelay * Math.pow(2, attempt - 1);
            console.log(`Waiting ${delay}ms before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // If the loop completes without returning, all retries have failed. Throw the last error.
    throw lastError || new Error("Gemini API call failed after all retries without returning a valid image.");
}

/**
 * A wrapper for Gemini text generation calls with retry mechanism.
 * @param contents The prompt or content to send to the model.
 * @param model Optional model override. Defaults to getTextModel().
 * @param config Optional configuration for generateContent.
 * @returns The response text from the model.
 */
export async function callGeminiTextWithRetry(
    contents: string,
    model: string = getTextModel(),
    config: any = {}
): Promise<string> {
    const maxRetries = 3;
    const initialDelay = 1000;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents,
                ...config,
            });

            const text = response.text?.trim();
            if (text) {
                return text;
            }

            lastError = new Error('Model returned empty response');
            console.warn(`Attempt ${attempt}/${maxRetries}: Empty response. Retrying...`);
        } catch (error) {
            const processedError = processApiError(error);
            lastError = processedError;
            const errorMessage = processedError.message;
            console.error(`Error calling Gemini Text API (Attempt ${attempt}/${maxRetries}):`, errorMessage);

            // Don't retry on critical errors
            if (
                errorMessage.includes('API Key không hợp lệ') ||
                errorMessage.includes('429') ||
                errorMessage.toLowerCase().includes('quota') ||
                errorMessage.toLowerCase().includes('rate limit') ||
                errorMessage.toLowerCase().includes('resource_exhausted')
            ) {
                throw processedError;
            }

            const isInternalError = errorMessage.includes('"code":500') || errorMessage.includes('INTERNAL');
            if (!isInternalError && attempt >= maxRetries) {
                throw processedError;
            }
        }

        if (attempt < maxRetries) {
            const delay = initialDelay * Math.pow(2, attempt - 1);
            console.log(`Waiting ${delay}ms before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError || new Error('Gemini text API call failed after all retries.');
}

/**
 * A generic wrapper for Gemini generateContent calls with retry mechanism.
 * Useful for calls that don't require image output (e.g., text-only or mixed responses).
 * @param model The model to use.
 * @param contents The prompt or content parts.
 * @param config Optional configuration.
 * @returns The full GenerateContentResponse.
 */
export async function callGeminiGenericWithRetry(
    model: string,
    contents: any,
    config: any = {}
): Promise<GenerateContentResponse> {
    const maxRetries = 3;
    const initialDelay = 1000;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents,
                ...config,
            });

            if (response.candidates?.[0]?.content) {
                return response;
            }

            lastError = new Error('Model returned no candidates');
            console.warn(`Attempt ${attempt}/${maxRetries}: No candidates. Retrying...`);
        } catch (error) {
            const processedError = processApiError(error);
            lastError = processedError;
            const errorMessage = processedError.message;
            console.error(`Error calling Gemini Generic API (Attempt ${attempt}/${maxRetries}):`, errorMessage);

            if (
                errorMessage.includes('API Key không hợp lệ') ||
                errorMessage.includes('429') ||
                errorMessage.toLowerCase().includes('quota') ||
                errorMessage.toLowerCase().includes('rate limit') ||
                errorMessage.toLowerCase().includes('resource_exhausted')
            ) {
                throw processedError;
            }

            const isInternalError = errorMessage.includes('"code":500') || errorMessage.includes('INTERNAL');
            if (!isInternalError && attempt >= maxRetries) {
                throw processedError;
            }
        }

        if (attempt < maxRetries) {
            const delay = initialDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError || new Error('Gemini generic API call failed after all retries.');
}

/**
 * Takes a user's prompt and asks a generative model to expand and enrich it.
 * @param userPrompt The user's original, potentially simple, prompt.
 * @returns A promise that resolves to a more descriptive and detailed prompt string.
 */
export async function enhancePrompt(userPrompt: string): Promise<string> {
    const metaPrompt = `Bạn là một chuyên gia viết prompt cho AI tạo ảnh như Imagen. Nhiệm vụ của bạn là lấy một prompt đơn giản từ người dùng và mở rộng nó thành một prompt có độ mô tả cao và hiệu quả để tạo ra một hình ảnh tuyệt đẹp. Hãy thêm các chi tiết phong phú về phong cách, ánh sáng, bố cục, tâm trạng và các kỹ thuật nghệ thuật. Đầu ra PHẢI bằng tiếng Việt.

Prompt của người dùng: "${userPrompt}"

**Đầu ra:** Chỉ xuất ra văn bản prompt đã được tinh chỉnh, không có bất kỳ cụm từ giới thiệu nào.`;

    try {
        return await callGeminiTextWithRetry(metaPrompt);
    } catch (error) {
        // Process the error for logging/user feedback but return the original prompt as a safe fallback
        const processedError = error instanceof Error ? error : new Error(String(error));
        console.error("Error during prompt enhancement:", processedError);
        return userPrompt;
    }
}