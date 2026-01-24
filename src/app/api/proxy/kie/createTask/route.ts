import { NextRequest, NextResponse } from 'next/server';

const KIE_API_URL = process.env.KIE_API_URL || 'https://api.kie.ai/api/v1';
const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_CALLBACK_URL = process.env.KIE_CALLBACK_URL;

export async function POST(req: NextRequest) {
    try {
        if (!KIE_API_KEY) {
            return NextResponse.json(
                { error: 'KIE_API_KEY not configured' },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { model, input } = body;

        // Determine if we should use callback (production) or not (dev)
        const isDev = process.env.NODE_ENV === 'development';
        const callbackUrl = isDev ? undefined : KIE_CALLBACK_URL;

        console.log('[kie.ai] Creating task:', { model, input, isDev, callbackUrl });

        // Determine endpoint and payload based on model type
        const isVeoModel = model.includes('veo');

        let endpoint: string;
        let requestBody: any;

        if (isVeoModel) {
            // Use Veo API endpoint
            endpoint = `${KIE_API_URL}/veo/generate`;

            // Validate and normalize aspect_ratio for Veo
            // Veo API supports: 1:1, 16:9, 9:16 (based on common video aspect ratios)
            const validVeoRatios = ['1:1', '16:9', '9:16'];
            let veoAspectRatio = input.aspect_ratio || '16:9';

            // If ratio is not in valid list, default to 16:9
            if (!validVeoRatios.includes(veoAspectRatio)) {
                console.warn(`[kie.ai] Unsupported Veo aspect ratio ${veoAspectRatio}, defaulting to 16:9`);
                veoAspectRatio = '16:9';
            }

            // For reference-to-video (image-to-video), use veo_fast model
            let veoModel = model;
            const hasImageUrls = input.image_urls && Array.isArray(input.image_urls) && input.image_urls.length > 0;

            if (hasImageUrls) {
                // Override model for reference-to-video - API supports veo3_fast
                veoModel = 'veo3_fast';
                console.log(`[kie.ai] Reference-to-video detected, overriding model to: ${veoModel}`);
            }

            requestBody = {
                prompt: input.prompt || '',
                model: veoModel,
                callBackUrl: callbackUrl,
                aspect_ratio: veoAspectRatio,
                enableTranslation: true,
            };

            // Add imageUrls if provided
            if (hasImageUrls) {
                requestBody.imageUrls = input.image_urls;
                requestBody.generationType = 'REFERENCE_2_VIDEO';
            }

            console.log('[kie.ai] Veo request body:', JSON.stringify(requestBody, null, 2));
        } else {
            // Use standard /jobs/createTask endpoint for other models
            endpoint = `${KIE_API_URL}/jobs/createTask`;
            requestBody = {
                model,
                callBackUrl: callbackUrl,
                input,
            };
        }

        // Call kie.ai API
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${KIE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[kie.ai] API error:', errorText);
            return NextResponse.json(
                { error: `kie.ai API error: ${response.statusText}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('[kie.ai] Task created:', data);

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[kie.ai] Proxy error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create task' },
            { status: 500 }
        );
    }
}
