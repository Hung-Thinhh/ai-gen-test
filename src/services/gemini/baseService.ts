/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Modality } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import { supabase } from '@/lib/supabase/client';

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
 * Ensures an image input is in the { mimeType, data } format.
 * If input is a URL, it fetches and converts to base64.
 * If input is already a data URL, it calls parseDataUrl.
 */
export async function normalizeImageInput(input: string): Promise<{ mimeType: string; data: string }> {
    console.log(`[baseService] normalizeImageInput called with input length: ${input.length}, startsWith: ${input.substring(0, 30)}...`);
    if (input.startsWith('data:')) {
        return parseDataUrl(input);
    }

    try {
        const response = await fetch(input);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                // reader.result includes "data:image/xyz;base64," prefix
                const match = base64data.match(/^data:(.+);base64,(.+)$/);
                if (match) {
                    resolve({ mimeType: match[1], data: match[2] });
                } else {
                    reject(new Error("Failed to convert blob to base64"));
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        throw new Error(`Failed to process image URL: ${error instanceof Error ? error.message : String(error)}`);
    }
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
 * Uses Server-Side API for credit checking and key protection.
 * @param parts An array of parts for the request payload (e.g., image parts, text parts).
 * @param config Optional configuration object for the generateContent call.
 * @returns The GenerateContentResponse from the API.
 */
export async function callGeminiWithRetry(parts: object[], config: any = {}): Promise<GenerateContentResponse> {
    const maxRetries = 3;
    const initialDelay = 1000;
    let lastError: Error | null = null;
    const currentVersion = globalConfig.modelVersion;

    // 1. Get Auth Token OR Guest ID for Credit Deduction
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Fallback to Guest ID if no token
    const guestId = typeof window !== 'undefined' ? localStorage.getItem('guest_device_id') : null;

    console.log('[baseService DEBUG] token:', token ? 'EXISTS' : 'NULL');
    console.log('[baseService DEBUG] guestId:', guestId ? guestId : 'NULL');

    if (!token && !guestId) {
        throw new Error("Vui lòng đăng nhập hoặc tải lại trang để khởi tạo phiên khách (Guest Session).");
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

    // Prepare Headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-credit-cost': currentVersion === 'v3' ? '2' : '1', // Credit cost based on model version
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('[baseService DEBUG] Using Authorization header');
    } else if (guestId) {
        headers['X-Guest-ID'] = guestId;
        console.log('[baseService DEBUG] Using X-Guest-ID header:', guestId);
    }
    console.log('[baseService DEBUG] Final headers:', headers);
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Gemini Debug] Attempt ${attempt}: Sending request to Internal API. Model: ${model}`);

            const response = await fetch('/api/gemini/generate-image', {
                method: 'POST',
                headers: headers, // Use the prepared headers (Auth or Guest-ID)
                body: JSON.stringify({
                    parts,
                    config: finalConfig,
                    model: model
                })
            });

            if (!response.ok) {
                const errorData = await response.json();

                // Handle specific credit error
                if (response.status === 402 || errorData.code === 'INSUFFICIENT_CREDITS') {
                    throw new Error("Bạn đã hết Credit. Vui lòng nạp thêm để tiếp tục.");
                }

                throw new Error(errorData.error || `Server responded with ${response.status}`);
            }

            const data: GenerateContentResponse = await response.json();

            // Validate that the response contains an image.
            const imagePart = data.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData);
            if (imagePart?.inlineData) {
                // SUCCESS: Refresh credits in UI
                try {
                    if (typeof window !== 'undefined' && (window as any).__refreshCredits) {
                        await (window as any).__refreshCredits();
                        console.log('[baseService] Credits refreshed in UI after generation');
                    }
                } catch (refreshError) {
                    console.warn('[baseService] Failed to refresh credits:', refreshError);
                }
                return data;
            }

            // If no image is found, treat it as a failure and prepare for retry.
            const textResponse = data.text || "No text response received.";
            lastError = new Error(`The AI model responded with text instead of an image: "${textResponse}"`);
            console.warn(`Attempt ${attempt}/${maxRetries}: No image returned. Retrying... Response text: ${textResponse}`);

        } catch (error) {
            const processedError = processApiError(error);
            lastError = processedError;
            const errorMessage = processedError.message;
            console.error(`Error calling Gemini API (Attempt ${attempt}/${maxRetries}):`, errorMessage);

            // Don't retry on critical errors like invalid API key or quota issues.
            if (errorMessage.includes('hết Credit') || errorMessage.includes('API Key không hợp lệ') || errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')) {
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

    throw lastError || new Error("Gemini API call failed after all retries.");
}

/**
 * A wrapper for Gemini text generation calls with retry mechanism.
 * Now uses Server-Side API to hide API Key.
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
            // Call Server API instead of client SDK
            const response = await fetch('/api/gemini/generate-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: contents }] }], // Standard Gemini structure
                    model,
                    config
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error ${response.status}`);
            }

            const data = await response.json();
            const text = data.text?.trim() || data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

            if (text) return text;

            lastError = new Error('Model returned empty response');
            console.warn(`Attempt ${attempt}/${maxRetries}: Empty response. Retrying...`);

        } catch (error) {
            const processedError = processApiError(error);
            lastError = processedError;
            if (attempt >= maxRetries) throw processedError;
        }

        if (attempt < maxRetries) {
            const delay = initialDelay * Math.pow(2, attempt - 1);
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
/**
 * A generic wrapper for Gemini generateContent calls with retry mechanism.
 * Useful for calls that don't require image output (e.g., text-only or mixed responses).
 * Now routed through secure server API.
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
            // Call Server Text API (it returns full response object structure)
            const response = await fetch('/api/gemini/generate-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: contents, // Pass directly
                    model,
                    config
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error ${response.status}`);
            }

            const data = await response.json();

            // Check if candidates exist (checking mocked generic response structure)
            if (data.candidates?.[0]?.content) {
                return data as GenerateContentResponse;
            }

            lastError = new Error('Model returned no candidates');
            console.warn(`Attempt ${attempt}/${maxRetries}: No candidates. Retrying...`);
        } catch (error) {
            const processedError = processApiError(error);
            lastError = processedError;
            if (attempt >= maxRetries) throw processedError;
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