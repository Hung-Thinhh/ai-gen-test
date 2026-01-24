// Gommo AI API Base URL (Via Proxy to avoid CORS)
const PROXY_BASE_URL = '/api/proxy';

// Types
export interface CreateVideoParams {
    model: string;
    prompt: string;
    ratio?: string;
    resolution?: string;
    duration?: string;
    mode?: string;
    privacy?: string;
    image_start?: string; // Image ID
    image_end?: string; // Image ID
    image_ref?: string; // Image ID
    images?: string[]; // Array of Image IDs or URLs
    quantity?: number;
}

export interface VideoStatusResponse {
    id: string;
    status: string; // 'MEDIA_GENERATION_STATUS_PENDING', etc.
    output?: {
        download_url: string;
        thumbnail_url?: string;
    };
    error?: string;
}

/**
 * Upload Image to Gommo AI (Via Proxy)
 * Credentials handled by Server
 */
export async function uploadImageToGommo(file: File | string): Promise<string> {

    // If string (URL), call specialized Proxy Route to avoid CORS
    if (typeof file === 'string') {
        const res = await fetch(`${PROXY_BASE_URL}/image/upload-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: file })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Upload from URL failed');
        }

        const data = await res.json();
        console.log("Upload URL Response:", data);

        if (data.imageInfo && data.imageInfo.id_base) {
            return data.imageInfo.id_base;
        }
        return data.id_base || data.id || '';
    }

    // Normal File Upload
    let blob: Blob = file;

    const formData = new FormData();
    formData.append('image', blob);
    // Token & Domain injected by Server Proxy

    const res = await fetch(`${PROXY_BASE_URL}/image/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Upload failed');
    }

    const data = await res.json();
    console.log("Upload Image Response:", data); // Debug log for user

    // Doc: { imageInfo: { id_base: "..." } }
    if (data.imageInfo && data.imageInfo.id_base) {
        return data.imageInfo.id_base;
    }
    // Fallback if structure changes
    return data.id_base || data.id || '';
}

/**
 * Create Video (Via Proxy)
 * Credentials handled by Server
 */
export async function createVideo(params: CreateVideoParams): Promise<string> {
    const res = await fetch(`${PROXY_BASE_URL}/video/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', // Proxy will convert this to x-www-form-urlencoded
        },
        body: JSON.stringify(params),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Create video failed');
    }

    const data = await res.json();
    console.log("Create Video Response:", data);

    // Doc: { videoInfo: { id_base: "..." }, OR data.id_base }
    // User log: data.id_base AND data.videoInfo.id_base exist. 
    // We should prefer videoInfo.id_base if available as it is more specific.
    if (data.videoInfo && data.videoInfo.id_base) {
        return data.videoInfo.id_base;
    }
    if (data.id_base) {
        return data.id_base;
    }

    return '';
}

/**
 * Check Video Status (Via Proxy)
 * Credentials handled by Server
 */
export async function checkVideoStatus(processId: string): Promise<VideoStatusResponse> {
    // Note: Use POST internally in Proxy, but client calls Proxy with GET/POST?
    // My Proxy for status is GET based on query param: GET /api/proxy/video/status?process_id=...
    // The Proxy then converts to POST to Gommo.

    // BUT WAIT: My Proxy `status/route.ts` was implemented as GET.
    // So here in Client Service, we must use GET.

    const url = `${PROXY_BASE_URL}/video/status?process_id=${processId}`;

    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || 'Check status failed');
    }

    const data = await res.json();
    console.log("Check Status Response:", data);

    // Doc Check Status Success:
    // { id_base: "...", status: "MEDIA_GENERATION_STATUS_SUCCESSFUL", download_url: "...", thumbnail_url: "..." }

    // Doc Check Status Success might return nested videoInfo
    // { videoInfo: { id_base: "...", status: "...", download_url: "..." } }

    const info = data.videoInfo || data;

    return {
        id: info.id_base || processId,
        status: info.status, // Return raw status for UI processing
        output: {
            download_url: info.download_url,
            thumbnail_url: info.thumbnail_url
        },
        error: info.error // If error structure differs, adapt here
    };
}

/**
 * List Models (Via Proxy)
 * Credentials handled by Server
 */
export async function listVideoModels(): Promise<any[]> {
    const res = await fetch(`${PROXY_BASE_URL}/models?type=video`, {
        method: 'GET',
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'List models failed');
    }

    const data = await res.json();
    return data.data || [];
}
