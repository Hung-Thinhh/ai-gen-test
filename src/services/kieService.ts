// kie.ai API Service
// Supports text-to-video, image-to-video, lip-sync, and app execution

const PROXY_BASE_URL = '/api/proxy/kie';

// Types
export interface VideoAppConfig {
    id: string;
    name: string;
    description?: string;
    model_config: {
        model: string;
        mode?: 'normal' | 'fast';
        aspect_ratio?: string;
    };
    input_schema: any[];
    prompt_template?: string;
}

export interface CreateKieTaskParams {
    prompt: string;
    imageUrl?: string; // If provided, use image-to-video
    audioUrl?: string; // If provided with imageUrl, use lip-sync
    model?: string; // Explicit model override
    mode?: 'normal' | 'fast';
    aspectRatio?: '1:1' | '16:9' | '9:16' | '3:2' | '2:3';
}

export interface KieTaskResponse {
    task_id: string;
    status: string;
}

export interface KieStatusResponse {
    task_id: string;
    status: 'pending' | 'processing' | 'success' | 'failed';
    result?: {
        video_url?: string;
        thumbnail_url?: string;
    };
    error?: string;
    progress?: number;
}

/**
 * Execute a Video App Task
 * Handles prompt templating and parameter mapping
 */
export async function executeAppTask(app: VideoAppConfig, inputs: Record<string, any>): Promise<string> {
    console.log('[kieService] Executing App:', app.name, inputs);

    let finalPrompt = inputs.prompt || '';

    // Handle Prompt Template
    if (app.prompt_template) {
        finalPrompt = app.prompt_template;
        // Replace {{key}} with input values
        Object.keys(inputs).forEach(key => {
            // Simple replaceAll for {{key}}
            const regex = new RegExp(`{{${key}}}`, 'g');
            finalPrompt = finalPrompt.replace(regex, inputs[key]);
        });
    }

    // Map inputs to API params
    const taskParams: CreateKieTaskParams = {
        prompt: finalPrompt,
        model: app.model_config.model,
        mode: app.model_config.mode || 'normal',
        aspectRatio: (app.model_config.aspect_ratio as any) || '2:3',
        // Map common fields based on naming convention
        imageUrl: inputs.image_url || inputs.image_urls,
        audioUrl: inputs.audio_url,
    };

    // Handle specific array logic for image_urls (if app input is array but API expects single string for some models?)
    // Actually kie.ai accepts image_url (string) or image_urls (array).
    // Let's pass what we have, createKieTask will handle input payload construction.

    // However, createKieTask currently expects `imageUrl` (singular) as a specific param for logic detection.
    // If input is array of strings, take first one for `imageUrl` logic detection
    if (Array.isArray(inputs.image_urls) && inputs.image_urls.length > 0) {
        taskParams.imageUrl = inputs.image_urls[0];
    }

    return createKieTask(taskParams);
}

/**
 * Create video generation task on kie.ai
 * Auto-selects model based on inputs:
 * - imageUrl + audioUrl → kling/ai-avatar-standard (Lip Sync)
 * - imageUrl provided → grok-imagine/image-to-video
 * - imageUrl null → grok-imagine/text-to-video
 * UNLESS model is explicitly provided.
 */
export async function createKieTask(params: CreateKieTaskParams): Promise<string> {
    const { prompt, imageUrl, audioUrl, mode = 'normal', aspectRatio = '2:3' } = params;

    // Determine model
    let model = params.model; // Use explicit model if provided

    if (!model) {
        // Auto-select fallback
        if (imageUrl && audioUrl) {
            model = 'kling/ai-avatar-standard';
        } else if (imageUrl) {
            model = 'grok-imagine/image-to-video';
        } else {
            model = 'grok-imagine/text-to-video';
        }
    }

    // Build input based on model
    const input: any = {
        prompt: prompt || '',
        mode,
    };

    const isVeoModel = model.includes('veo');

    if (model === 'kling/ai-avatar-standard') {
        // Lip Sync Input
        input.image_url = imageUrl;
        input.audio_url = audioUrl;
    } else if (isVeoModel) {
        // Veo models (text-to-video or image-to-video)
        // Veo API expects aspect_ratio in input for all cases
        input.aspect_ratio = aspectRatio || '16:9';

        // If image URL is provided, add it as imageUrls array
        if (imageUrl) {
            input.image_urls = Array.isArray(imageUrl) ? imageUrl : [imageUrl];
        }
    } else if (model === 'grok-imagine/image-to-video') {
        // Image-to-Video Input (for Grok)
        input.image_urls = [imageUrl];
        input.index = 0;
    } else {
        // Text-to-Video Input (for Grok)
        input.aspect_ratio = aspectRatio;
    }

    console.log('[kie.ai] Creating task:', { model, input });

    const res = await fetch(`${PROXY_BASE_URL}/createTask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            input,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || 'Failed to create kie.ai task');
    }

    const data = await res.json();
    console.log('[kie.ai] Task created response:', JSON.stringify(data, null, 2));

    // Handle different response structures
    const taskId = data.task_id || data.taskId || data.data?.task_id || data.data?.taskId;

    if (!taskId) {
        console.error('[kie.ai] Response missing task_id:', data);
        throw new Error('API response did not contain task_id');
    }

    return taskId;
}

/**
 * Check task status (for polling)
 */
export async function checkKieTaskStatus(taskId: string): Promise<KieStatusResponse> {
    const res = await fetch(`${PROXY_BASE_URL}/status?task_id=${taskId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || 'Failed to check task status');
    }

    const data = await res.json();
    console.log('[kie.ai] Status check response:', JSON.stringify(data, null, 2));

    const info = data.data || data;

    // Map kie status to our status
    let status: 'pending' | 'processing' | 'success' | 'failed' = 'pending';
    let videoUrl = undefined;

    const rawStatus = (info.status || info.state || '').toLowerCase();

    // Parse resultJson if available
    let resultUrls: string[] = [];
    if (info.resultJson) {
        try {
            const parsedResult = JSON.parse(info.resultJson);
            if (parsedResult.resultUrls && Array.isArray(parsedResult.resultUrls)) {
                resultUrls = parsedResult.resultUrls;
            }
        } catch (e) {
            console.error('[kie.ai] Failed to parse resultJson:', e);
        }
    }

    if (rawStatus === 'success' || rawStatus === 'succeeded') {
        status = 'success';
        videoUrl = resultUrls[0] || info.videoUrl || info.url || info.result;
    } else if (rawStatus === 'failed' || rawStatus === 'error') {
        status = 'failed';
    } else if (rawStatus === 'processing' || rawStatus === 'running') {
        status = 'processing';
    }

    if (!videoUrl && (info.videoUrl || info.url)) {
        status = 'success';
        videoUrl = info.videoUrl || info.url;
    }

    if (!videoUrl && resultUrls.length > 0) {
        status = 'success';
        videoUrl = resultUrls[0];
    }

    return {
        task_id: taskId,
        status: status,
        result: videoUrl ? { video_url: videoUrl } : undefined,
        error: info.failMsg || info.errorMsg || info.error || info.msg,
        progress: info.progress || (status === 'success' ? 100 : 0),
    };
}

/**
 * Helper: Poll status until completion
 */
export async function pollUntilComplete(
    taskId: string,
    onProgress?: (status: KieStatusResponse) => void,
    maxAttempts = 600, // 600 * 5s = 50 minutes max
): Promise<string> {
    let attempts = 0;

    return new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            attempts++;

            if (attempts > maxAttempts) {
                clearInterval(interval);
                reject(new Error('Task timeout - exceeded 50 minutes'));
                return;
            }

            try {
                const status = await checkKieTaskStatus(taskId);

                if (onProgress) {
                    onProgress(status);
                }

                if (status.status === 'success') {
                    clearInterval(interval);
                    if (status.result?.video_url) {
                        resolve(status.result.video_url);
                    } else {
                        reject(new Error('Video URL not found in response'));
                    }
                } else if (status.status === 'failed') {
                    clearInterval(interval);
                    reject(new Error(status.error || 'Task failed'));
                }
            } catch (err: any) {
                console.error('[kie.ai] Poll error:', err);
            }
        }, 5000); // Poll every 5 seconds
    });
}
