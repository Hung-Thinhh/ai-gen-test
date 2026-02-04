/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Modality } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

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
// CRITICAL: Only imagen-* models work on Vertex AI. gemini-*-image models do NOT exist on Vertex AI!
// For Gemini API: v3 uses Nano Banana Pro (gemini-3-pro-image-preview), v2 uses Flash Image
export const getImageModel = () => globalConfig.modelVersion === 'v3' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

// --- Development Mode Detection ---
const isDev = process.env.NODE_ENV === 'development';

// Helper function for conditional logging
const devLog = (...args: any[]) => {
    if (isDev) {
        console.log(...args);
    }
};

const devWarn = (...args: any[]) => {
    if (isDev) {
        console.warn(...args);
    }
};

const devError = (...args: any[]) => {
    if (isDev) {
        console.error(...args);
    }
};


// --- Centralized Error Processor ---
// --- Error Code Standards ---
export const GeminiErrorCodes = {
    MODEL_REFUSAL: 'MODEL_REFUSAL',       // 400: AI từ chối trả lời (policy/inability)
    SAFETY_VIOLATION: 'SAFETY_VIOLATION', // 400: Vi phạm bộ lọc an toàn
    QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',     // 429: Hết lượt/Quá tải
    INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS', // 402: Hết tiền
    INTERNAL_ERROR: 'INTERNAL_ERROR',     // 500: Lỗi server
    BAD_REQUEST: 'BAD_REQUEST',            // 400: Lỗi request
    GENERATION_FAILED: 'GENERATION_FAILED', // 500: Lỗi tạo ảnh (IMAGE_OTHER, STOP...)
    SERVER_BUSY: 'SERVER_BUSY'            // 503: Server bận/Overloaded
} as const;

export class GeminiError extends Error {
    code: string;
    description?: string;

    constructor(message: string, code: string = GeminiErrorCodes.INTERNAL_ERROR, description?: string) {
        super(message);
        this.name = "GeminiError";
        this.code = code;
        this.description = description;
    }
}

// --- Centralized Error Processor ---
export function processApiError(error: unknown): Error {
    // 0. Check for structured API error objects (e.g. { error: "Message", code: "SAFETY_VIOLATION" })
    const anyError = error as any;

    // Case A: Already a GeminiError?
    if (error instanceof GeminiError) return error;

    // Case B: Structured error from Server (props: error, code, details)
    // Server is the single source of truth. Trust what it says.
    if (anyError?.error && typeof anyError.error === 'string') {
        const code = anyError.code || GeminiErrorCodes.INTERNAL_ERROR;
        return new GeminiError(anyError.error, code, anyError.details);
    }

    // 1. Prevent double wrapping
    if (error instanceof Error && error.message.startsWith("Đã xảy ra lỗi không mong muốn từ AI")) {
        return error;
    }

    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.group("Gemini API Error Debug");
    console.error("Raw Error Object:", error);
    console.error("Error Message String:", errorMessage);
    console.groupEnd();

    // Case C: Client-side or Network Errors (Not from API response structure)
    if (errorMessage.includes('ReadableStream uploading is not supported')) {
        return new GeminiError("Ứng dụng tạm thời chưa tương thích ứng dụng di động, mong mọi người thông cảm", GeminiErrorCodes.BAD_REQUEST);
    }
    if (errorMessage.toLowerCase().includes('api key not valid')) {
        return new GeminiError("Hệ thống đang gặp lỗi key. Vui lòng thử lại sau.", GeminiErrorCodes.INTERNAL_ERROR);
    }
    if (errorMessage.includes('not configured')) {
        return new GeminiError("Hệ thống đang gặp lỗi cấu hình. Vui lòng thử lại sau.", GeminiErrorCodes.INTERNAL_ERROR);
    }

    // Fallback: Generic Internal Error
    if (error instanceof Error) {
        // Keep original stack trrace if possible by extending
        return new GeminiError("Đã xảy ra lỗi không mong muốn từ AI. Vui lòng thử lại sau. Chi tiết: " + error.message, GeminiErrorCodes.INTERNAL_ERROR);
    }
    return new GeminiError("Đã có lỗi không mong muốn từ AI: " + errorMessage, GeminiErrorCodes.INTERNAL_ERROR);
}

/**
 * Parses a data URL string to extract its mime type and base64 data.
 * @param imageDataUrl The data URL to parse.
 * @returns An object containing the mime type and data.
 */
export function parseDataUrl(imageDataUrl: string): { mimeType: string; data: string } {
    const match = imageDataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!match) {
        // Log the start of the invalid string for debugging
        const preview = imageDataUrl.length > 50 ? imageDataUrl.substring(0, 50) + '...' : imageDataUrl;
        console.error(`Invalid image data URL format. Input preview: "${preview}"`);
        throw new Error(`Invalid image data URL format. Expected 'data:image/...;base64,...'. Input starts with: ${preview}`);
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

    const fetchAndConvert = async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        const blob = await response.blob();
        return new Promise<{ mimeType: string; data: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
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
    };

    try {
        // Try fetching directly first
        return await fetchAndConvert(input);
    } catch (directError) {
        console.warn(`[baseService] Direct fetch failed, trying proxy. Error: ${directError}`);
        try {
            // Fallback to proxy
            const proxyUrl = `/api/proxy/image/fetch?url=${encodeURIComponent(input)}`;
            return await fetchAndConvert(proxyUrl);
        } catch (proxyError) {
            throw new Error(`Failed to process image URL (Proxy fallback also failed): ${proxyError instanceof Error ? proxyError.message : String(proxyError)}`);
        }
    }
}


/**
 * Processes the Gemini API response, extracting the image or throwing an error if none is found.
 * @param response The response from the generateContent call.
 * @returns A data URL string for the generated image.
 */
export function processGeminiResponse(response: GenerateContentResponse): string {
    // Check for optimized R2 URL first (Server-side optimization)
    if ((response as any).imageUrl) {
        return (response as any).imageUrl;
    }

    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        return `data:${mimeType};base64,${data}`;
    }

    const textResponse = response.text;
    console.error("API did not return an image. Response:", textResponse);
    throw new Error(`The AI model responded with text instead of an image: "${textResponse || 'No text response received.'}"`);
}

// --- Session Cache for Parallel Requests ---
let cachedSession: { token?: string; timestamp: number } | null = null;
const SESSION_CACHE_DURATION = 30000; // 30 seconds

async function getCachedSession(): Promise<string | undefined> {
    const now = Date.now();

    // Return cached session if still valid
    if (cachedSession && (now - cachedSession.timestamp) < SESSION_CACHE_DURATION) {
        devLog('[baseService] Using cached session');
        return cachedSession.token;
    }

    // Fetch NextAuth session
    devLog('[baseService] Fetching fresh NextAuth session...');
    try {
        // Use NextAuth's getSession (client-side)
        const { getSession } = await import('next-auth/react');
        const session = await getSession();

        const token = (session as any)?.accessToken;

        // Cache the result
        cachedSession = { token, timestamp: now };
        devLog('[baseService] Session cached successfully');

        return token;
    } catch (error) {
        devWarn('[baseService] getSession failed:', error);
        return undefined;
    }
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
    devLog('🚀🚀🚀 [BASESERVICE] callGeminiWithRetry BẮT ĐẦU 🚀🚀🚀');
    devLog('[BASESERVICE] Parts count:', parts.length);
    devLog('[BASESERVICE] Config:', config);

    const maxRetries = 1; // Server already retries internally, so client attempts should be 1 to avoid multiplication
    const initialDelay = 1000;
    let lastError: Error | null = null;
    const currentVersion = globalConfig.modelVersion;

    // 1. Get Auth Token OR Guest ID for Credit Deduction
    // Use cached session to avoid timeout on parallel requests
    const token = await getCachedSession();

    // Fallback to Guest ID if no token
    const guestId = typeof window !== 'undefined' ? localStorage.getItem('guest_device_id') : null;

    devLog('[baseService DEBUG] token:', token ? 'EXISTS' : 'NULL');
    devLog('[baseService DEBUG] guestId:', guestId ? guestId : 'NULL');

    if (!token && !guestId) {
        devLog('Vui lòng đăng nhập hoặc tải lại trang để khởi tạo phiên khách (Guest Session).');

        throw new Error("Vui lòng đăng nhập hoặc tải lại trang để khởi tạo phiên khách (Guest Session).");
    }

    const model = getImageModel();

    // Extract aspectRatio from config if present
    const { aspectRatio, ...restConfig } = config;

    // Map UI aspect ratio format to Gemini API format
    // Gemini API only accepts: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
    const mapAspectRatioToApi = (uiAspectRatio?: string): string | undefined => {
        if (!uiAspectRatio) return undefined;

        // Extract ratio from UI format like "1:1 (Vuông - Instagram)" -> "1:1"
        const ratioMatch = uiAspectRatio.match(/^(\d+:\d+)/);
        if (ratioMatch) {
            const ratio = ratioMatch[1];
            // Validate against Gemini API supported ratios
            const validRatios = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
            if (validRatios.includes(ratio)) {
                return ratio;
            }
        }

        // If no match or invalid, return undefined (API will use default)
        devLog('[baseService] Invalid or unsupported aspect ratio:', uiAspectRatio);
        return undefined;
    };

    const apiAspectRatio = mapAspectRatioToApi(aspectRatio);

    if (aspectRatio && apiAspectRatio) {
        devLog('[baseService] Mapped aspect ratio:', aspectRatio, '->', apiAspectRatio);
    } else if (aspectRatio) {
        devLog('[baseService] Invalid aspect ratio, using default. Input:', aspectRatio);
    }

    // Filter out text-generation specific properties that shouldn't be used for image generation
    const cleanRestConfig = Object.keys(restConfig).reduce((acc: any, key: string) => {
        // Exclude responseMimeType, responseSchema, and responseModalities which are for text-based APIs
        if (!['responseMimeType', 'responseSchema', 'responseModalities'].includes(key)) {
            acc[key] = restConfig[key];
        }
        return acc;
    }, {});

    // For v3: use imageConfig with imageSize and aspectRatio
    // For v2: aspectRatio still goes in config but without imageSize wrapper
    const extraConfig = globalConfig.modelVersion === 'v3'
        ? {
            imageConfig: {
                imageSize: globalConfig.imageResolution,
                ...(apiAspectRatio && { aspectRatio: apiAspectRatio }),
                ...config.imageConfig
            }
        }
        : (apiAspectRatio ? { aspectRatio: apiAspectRatio } : {}); // v2: add aspectRatio at root level

    // Don't include responseModalities for image generation - it confuses the API
    // The image models generate images natively without needing this config
    const finalConfig = {
        ...cleanRestConfig,
        ...extraConfig
    };

    devLog('[baseService] Model version:', globalConfig.modelVersion);
    devLog('[baseService] Final config:', JSON.stringify(finalConfig, null, 2));

    // Prepare Headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-credit-cost': currentVersion === 'v3' ? '2' : '1', // Credit cost based on model version
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        devLog('[baseService DEBUG] Using Authorization header');
    } else if (guestId) {
        headers['X-Guest-ID'] = guestId;
        devLog('[baseService DEBUG] Using X-Guest-ID header:', guestId);
    }
    devLog('[baseService DEBUG] Final headers:', headers);
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            devLog(`[Gemini Debug] Attempt ${attempt}: Sending request to Internal API. Model: ${model}`);
            devLog('[Gemini Debug] Request details:', {
                url: '/api/gemini/generate-image',
                method: 'POST',
                hasToken: !!token,
                hasGuestId: !!guestId,
                creditCost: headers['x-credit-cost'],
                modelVersion: currentVersion
            });

            // Add timeout to detect hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                devError('[Gemini Debug] Request timeout after 180s!');
                controller.abort();
            }, 180000); // 180 second timeout

            let response;
            try {
                const fetchStart = Date.now();
                devLog('📡📡📡 [BASESERVICE] ĐANG GỌI FETCH /api/gemini/generate-image 📡📡📡');
                devLog('[BASESERVICE] Request body:', { parts: parts.length, config: finalConfig, model });

                response = await fetch('/api/gemini/generate-image', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        parts,
                        config: finalConfig,
                        model: model,
                        tool_key: config.tool_key || undefined, // Forward tool_key to API
                        input_prompt: (parts as any[]).find((p: any) => p.text)?.text || '' // Explicitly send prompt text
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                const fetchDuration = Date.now() - fetchStart;
                devLog(`⏱️ [PERF] Fetch completed in ${fetchDuration}ms`);

                devLog('✅✅✅ [BASESERVICE] NHẬN ĐƯỢC RESPONSE TỪ API ✅✅✅');
                devLog('[BASESERVICE] Response status:', response.status);
                devLog('[BASESERVICE] Response ok:', response.ok);

                devLog('[Gemini Debug] Response received:', {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    duration: `${fetchDuration}ms`
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    devError('[Gemini Debug] API Error Response:', errorData);

                    // Handle specific credit error
                    if (response.status === 402 || errorData.code === 'INSUFFICIENT_CREDITS') {
                        throw new Error("Bạn đã hết Credit. Vui lòng nạp thêm để tiếp tục.");
                    }

                    // Throw the raw error data object so processApiError can handle structured errors (e.g. SAFETY_VIOLATION)
                    // without redundant wrapping.
                    throw errorData;
                }
            } catch (fetchError: any) {
                clearTimeout(timeoutId);
                if (fetchError.name === 'AbortError') {
                    devError('[Gemini Debug] Request was aborted due to timeout');
                    throw new Error('Request timeout - Server không phản hồi sau 180 giây');
                }
                throw fetchError;
            }

            const data: GenerateContentResponse = await response.json();

            // Validate that the response contains an image.
            const imagePart = data.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData);

            // PRIORITY: Check for Server-Side R2 URL first (Optimized flow)
            if ((data as any).imageUrl) {
                // SUCCESS: Update credits in UI immediately (same as inlineData path)
                try {
                    if (typeof window !== 'undefined' && (data as any).newCredits !== undefined) {
                        // Dispatch credit update event with new balance from server
                        const event = new CustomEvent('user-credits-updated', {
                            detail: { credits: (data as any).newCredits }
                        });
                        window.dispatchEvent(event);
                        devLog('[baseService] Credits updated in UI (R2 URL):', (data as any).newCredits);
                    }
                } catch (refreshError) {
                    devWarn('[baseService] Failed to update credits in UI:', refreshError);
                }
                // Return data as is, the service will use imageUrl
                return data;
            }

            if (imagePart?.inlineData) {
                // SUCCESS: Update credits in UI immediately
                try {
                    if (typeof window !== 'undefined' && (data as any).newCredits !== undefined) {
                        // Dispatch credit update event with new balance from server
                        const event = new CustomEvent('user-credits-updated', {
                            detail: { credits: (data as any).newCredits }
                        });
                        window.dispatchEvent(event);
                        devLog('[baseService] Credits updated in UI:', (data as any).newCredits);
                    }
                } catch (refreshError) {
                    devWarn('[baseService] Failed to update credits in UI:', refreshError);
                }
                return data;
            }

            // If no image is found, treat it as a failure and prepare for retry.
            const textResponse = data.text || "No text response received.";
            lastError = new Error(`The AI model responded with text instead of an image: "${textResponse}"`);
            devWarn(`Attempt ${attempt}/${maxRetries}: No image returned. Retrying... Response text: ${textResponse}`);

        } catch (error) {
            const processedError = processApiError(error);
            lastError = processedError;
            const errorMessage = processedError.message;
            devError(`Error calling Gemini API (Attempt ${attempt}/${maxRetries}):`, errorMessage);

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
            devLog(`Waiting ${delay}ms before next attempt...`);
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