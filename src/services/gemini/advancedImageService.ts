/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Advanced AI Image Generation Services
 * Contains specialized image generation functions adapted to current architecture
 */
import { Modality } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import ai from './client';
import { parseDataUrl, processGeminiResponse, callGeminiWithRetry, processApiError, getImageModel } from './baseService';

/**
 * Remove an object from an image based on text description
 * @param imageDataUrl - The original image as a data URL
 * @param objectDescription - Text description of the object to remove
 * @returns The edited image with the object removed (as data URL)
 */
export async function removeObjectFromImage(imageDataUrl: string, objectDescription: string, toolKey?: string): Promise<string> {
    const prompt = `You are an expert AI photo editor specializing in object removal and inpainting.

YOUR TASK: Remove the object described as "${objectDescription}" from this image.

INSTRUCTIONS:
1. Identify the object matching the description "${objectDescription}"
2. Remove it completely from the image
3. Fill the area naturally using advanced inpainting techniques:
   - Match surrounding textures, colors, and patterns seamlessly
   - Maintain correct perspective and lighting
   - Ensure no visible seams, artifacts, or traces
   - Blend smoothly with adjacent areas
4. Keep everything else in the image completely unchanged

CRITICAL REQUIREMENTS:
- The removed area should look completely natural as if the object never existed
- No traces or outlines of the original object should remain
- Perfect blending with surroundings
- Maintain original image quality and style

Return ONLY the final edited image with the object removed and the area filled naturally.`;

    try {
        const { mimeType, data } = parseDataUrl(imageDataUrl);

        const parts = [
            { inlineData: { mimeType, data } },
            { text: prompt }
        ];

        const response = await callGeminiWithRetry(parts, toolKey ? { tool_key: toolKey } : {});
        return processGeminiResponse(response);
    } catch (error) {
        console.error('Error in removeObjectFromImage:', error);
        throw processApiError(error);
    }
}

/**
 * Swaps faces between two images
 * @param sourceImageDataUrl The image where the face will be replaced
 * @param targetFaceDataUrl The image containing the face to use
 */
export async function swapFaces(
    sourceImageDataUrl: string,
    targetFaceDataUrl: string,
    additionalInstructions?: string,
    toolKey?: string
): Promise<string> {
    const prompt = `Professional portrait integration:

**Task details:**
You are placing the person from Image 2 into the scene of Image 1.
- Image 1: The background, pose, and clothing reference.
- Image 2: The person's identity reference.

**Guidelines:**

1. **Match the scene:**
Maintain the composition of Image 1 including:
✓ Background (studio backdrop, scenery, colors)
✓ Body and clothing (same clothes, same pose)
✓ Hair style and hair color (from Image 1, NOT Image 2)
✓ Head angle and pose (same tilt, rotation)
✓ Overall lighting direction and color temperature
✓ Image composition and framing
DO NOT change ANYTHING about the scene, clothes, hair, or background!

2. **Identity preservation:**
Preserve the person's features from Image 2:
- Eye shape and color
- Nose and mouth structure
- Facial contours and skin texture
- Skin tone and distinguishing details

3. **Seamless blending:**
- Adapt the person to the lighting and angle of Image 1.
- Ensure a photorealistic and natural look.
- The result should look like a single, high-quality photograph.

**Note:** Maintain the subjects' appearance while fitting them into the environment.

${additionalInstructions ? `**User's Additional Instructions:** ${additionalInstructions}` : ''}

**Final check:** Result = Image 1's body/scene/hair + Image 2's face (adapted to fit Image 1's angle and lighting).`;

    const sourceParsed = parseDataUrl(sourceImageDataUrl);
    const targetParsed = parseDataUrl(targetFaceDataUrl);

    const parts = [
        { inlineData: { mimeType: sourceParsed.mimeType, data: sourceParsed.data } },
        { inlineData: { mimeType: targetParsed.mimeType, data: targetParsed.data } },
        { text: prompt }
    ];

    const response = await callGeminiWithRetry(parts, toolKey ? { tool_key: toolKey } : {});
    return processGeminiResponse(response);
}

/**
 * AI-powered inpainting - fills transparent areas based on prompt
 */
export async function inpaintImage(
    prompt: string,
    maskedImageDataUrl: string,
    additionalInstructions?: string,
    toolKey?: string
): Promise<string> {
    const fullPrompt = `Your task is to perform inpainting.The user has provided an image with a transparent area(the mask).You must fill in this transparent area based on the following instruction: "${prompt}".

** CRITICAL INSTRUCTIONS:**
    1. The filled area must seamlessly blend with the rest of the image in terms of lighting, texture, color, and perspective.
2. The result should be a single, cohesive, photorealistic image.
3. Do not alter the non - transparent parts of the image.

    ${additionalInstructions ? `**User Refinement:** ${additionalInstructions}` : ''} `;

    const { mimeType, data } = parseDataUrl(maskedImageDataUrl);
    const parts = [
        { inlineData: { mimeType, data } },
        { text: fullPrompt }
    ];

    const response = await callGeminiWithRetry(parts, toolKey ? { tool_key: toolKey } : {});
    return processGeminiResponse(response);
}

/**
 * Creates photobooth-style photo strip with multiple poses
 */
export async function generatePhotoBooth(
    imageDataUrl: string,
    count: number,
    toolKey?: string
): Promise<string> {
    const prompt = `Professional photo strip:

Create a photobooth-style photo strip using the person from the provided image.

**Requirements:**
1. Every photo in the strip should feature the same person from the original image.
2. Preserve their facial characteristics accurately:
   - Eyes, nose, and mouth shape
   - Face shape and skin tone
3. The person should be easily recognizable across all frames.

**Composition:**
1. Create a grid of **${count}** unique photos.
2. Each photo should show a different natural pose or expression (smiling, laughing, thoughtful).
3. Maintain consistent lighting and a photorealistic style.

**Technical Goal:**
Combine the subjects' poses into a single high-quality photo strip.`;

    const { mimeType, data } = parseDataUrl(imageDataUrl);
    const parts = [
        { inlineData: { mimeType, data } },
        { text: prompt }
    ];

    const response = await callGeminiWithRetry(parts, toolKey ? { tool_key: toolKey } : {});
    return processGeminiResponse(response);
}

/**
 * Creates clone effect - multiple instances of same person in different poses
 */
export async function generateCloneEffect(
    imageDataUrl: string,
    instructions?: string,
    toolKey?: string
): Promise<string> {
    const prompt = `Person multiplication effect:
Take the person from the image and create a new scene where there are three versions of that same person in different poses.

**Primary goal:**
Maintain the facial identity and appearance of the original person. All instances should be photorealistic and recognizable as the subject from the photo.

** SECONDARY TASK: CLONE COMPOSITION **
    1. ** Triple the Person:** The final image must contain three instances of the person from the original photo.
2. ** Vary the Poses:** Each clone should be in a different, natural - looking pose.
3. ** Seamless Composition:** The clones must be composited into the original background seamlessly.Pay close attention to lighting, shadows, and perspective to make it look like a real, single photograph.

    ${instructions ? `\n**REFINEMENT INSTRUCTIONS (apply ONLY these minor changes while strictly following the IDENTITY PRESERVATION directive):**\n${instructions}` : ''} `;

    const { mimeType, data } = parseDataUrl(imageDataUrl);
    const parts = [
        { inlineData: { mimeType, data } },
        { text: prompt }
    ];

    const response = await callGeminiWithRetry(parts, toolKey ? { tool_key: toolKey } : {});
    return processGeminiResponse(response);
}

/**
 * Swaps color palette from one image to another
 */
export async function swapColorPalette(
    originalImageDataUrl: string,
    paletteImageDataUrl: string,
    dimensions?: { width: number; height: number },
    toolKey?: string
): Promise<string> {
    const dimensionsText = dimensions
        ? `The final output image MUST be exactly ${dimensions.width} pixels wide by ${dimensions.height} pixels tall.`
        : '';

    const prompt = `Your task is to perform a color palette swap.
- The ** first image ** is the source image that needs to be recolored.
- The ** second image ** is the color palette reference.

** CRITICAL INSTRUCTIONS:**
    1. ** Extract Palette:** Analyze the second image and identify its dominant color palette.
2. ** Recolor Source Image:** Apply the extracted color palette to the first image.You must replace the original colors of the source image with colors from the palette image.
3. ** Preserve Structure:** The content, shapes, lighting, and textures of the first image must be perfectly preserved.The only change should be the colors.
    ${dimensionsText}

The result should be a new version of the first image, but as if it were created using only the colors from the second image.`;

    const originalParsed = parseDataUrl(originalImageDataUrl);
    const paletteParsed = parseDataUrl(paletteImageDataUrl);

    const parts = [
        { inlineData: { mimeType: originalParsed.mimeType, data: originalParsed.data } },
        { inlineData: { mimeType: paletteParsed.mimeType, data: paletteParsed.data } },
        { text: prompt }
    ];

    const response = await callGeminiWithRetry(parts, toolKey ? { tool_key: toolKey } : {});
    return processGeminiResponse(response);
}

/**
 * Extracts outfit/clothing from person in image
 */
export async function extractOutfit(
    imageDataUrl: string,
    instructions?: string,
    toolKey?: string
): Promise<string> {
    const prompt = `Your task is to isolate and extract only the complete outfit(clothing, shoes, accessories) worn by the person in the provided image.

** CRITICAL INSTRUCTIONS:**
    1. ** Isolate the Outfit:** Identify all articles of clothing, footwear, and accessories.
2. ** Remove the Person and Background:** The final image MUST NOT contain the person(no skin, no face, no hair) or the original background.
3. ** Generate a Clean Output:** Place the extracted outfit on a solid, neutral light grey background.
4. ** Maintain Realism:** The outfit should be presented as a photorealistic "flat lay" or as if on an invisible mannequin, preserving its original shape, texture, and colors.

    ${instructions ? `\n**Additional Instructions:** ${instructions}` : ''} `;

    const { mimeType, data } = parseDataUrl(imageDataUrl);
    const parts = [
        { inlineData: { mimeType, data } },
        { text: prompt }
    ];

    const response = await callGeminiWithRetry(parts, toolKey ? { tool_key: toolKey } : {});
    return processGeminiResponse(response);
}

/**
 * Generates product mockup by applying logo to product
 */
export async function generateProductMockup(
    logoDataUrl: string,
    productDataUrl: string,
    toolKey?: string
): Promise<string> {
    const prompt = `Your task is to create a product mockup.
- The ** first image ** is a logo with a transparent background.
- The ** second image ** is a product photo.

** CRITICAL INSTRUCTIONS:**
    1. Take the logo from the first image and realistically apply it to the surface of the product in the second image.
2. The placement of the logo should be natural and centered, where a brand logo would typically appear on such a product.
3. You MUST adjust the logo's perspective, lighting, and texture to perfectly match the product's surface.It should look like it was printed on or part of the product, not just pasted on top.
4. Preserve the original product and its background entirely.The only change should be the addition of the logo.`;

    const logoParsed = parseDataUrl(logoDataUrl);
    const productParsed = parseDataUrl(productDataUrl);

    const parts = [
        { inlineData: { mimeType: logoParsed.mimeType, data: logoParsed.data } },
        { inlineData: { mimeType: productParsed.mimeType, data: productParsed.data } },
        { text: prompt }
    ];

    const response = await callGeminiWithRetry(parts, toolKey ? { tool_key: toolKey } : {});
    return processGeminiResponse(response);
}



/**
 * Generates typographic illustration from text phrase
 */
export async function generateTypographicIllustration(phrase: string, toolKey?: string): Promise<string> {
    const prompt = `Using only the letters from the phrase["${phrase}"], create a minimalist black and white typographic illustration depicting the scene described by the phrase.Each letter should be creatively shaped and arranged to form a sense of motion and represent the elements in the scene.The design must be clean and minimal, comprising the entire manipulated alphabet of["${phrase}"] without any additional shapes or lines.The letters should bend or curve to mimic the natural forms of the scene while remaining legible.The final image should be on a clean, solid, light grey background.`;

    const parts = [{ text: prompt }];
    const response = await callGeminiWithRetry(parts, toolKey ? { tool_key: toolKey } : {});
    return processGeminiResponse(response);
}

/**
 * Generates styled image from prompt and reference images
 */
export async function generateStyledImage(
    prompt: string,
    imageUrls: string[],
    additionalInstructions?: string,
    aspectRatio?: string,
    toolKey?: string
): Promise<string> {
    const fullPrompt = additionalInstructions ? `${prompt} \n\nAdditional Instructions: ${additionalInstructions} ` : prompt;

    const imageParts = imageUrls.map(url => {
        const { mimeType, data } = parseDataUrl(url);
        return { inlineData: { mimeType, data } };
    });

    const parts = [...imageParts, { text: fullPrompt }];
    const config = {
        ...(aspectRatio ? { aspectRatio } : {}),
        ...(toolKey ? { tool_key: toolKey } : {})
    };
    console.log('gọi apiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii');

    const response = await callGeminiWithRetry(parts, config);
    return processGeminiResponse(response);
}

/**
 * Generates background from concept image
 */
export async function generateBackgroundFromConcept(imageDataUrl: string, toolKey?: string): Promise<string> {
    const prompt = `Analyze the provided concept / mood board image.Your task is to generate a clean, empty, photorealistic background scene inspired by the overall theme, color palette, and style of the image.

** CRITICAL INSTRUCTIONS:**
    1. ** DO NOT include any people, characters, or foreground objects ** from the original image.
2. The output must be a background ONLY.
3. Capture the essence and mood of the concept image(e.g., if it's a forest scene, create an empty forest background; if it's a futuristic city, create an empty futuristic cityscape).`;

    const { mimeType, data } = parseDataUrl(imageDataUrl);
    const parts = [
        { inlineData: { mimeType, data } },
        { text: prompt }
    ];

    const response = await callGeminiWithRetry(parts, toolKey ? { tool_key: toolKey } : {});
    return processGeminiResponse(response);
}

