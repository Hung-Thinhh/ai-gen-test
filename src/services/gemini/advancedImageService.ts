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
    const prompt = `**PROFESSIONAL FACE SWAP - READ CAREFULLY**

**UNDERSTAND THE TASK:**
You are replacing the FACE in Image 1 with the FACE from Image 2.
- Image 1 = The SCENE (body, clothes, hair, background, pose, angle) - KEEP EVERYTHING EXCEPT THE FACE
- Image 2 = The NEW FACE source - TAKE ONLY THE FACIAL FEATURES

**CRITICAL RULES:**

**RULE 1: PRESERVE SCENE FROM IMAGE 1 (100%)**
Keep these EXACTLY as they appear in Image 1:
✓ Background (studio backdrop, scenery, colors)
✓ Body and clothing (same clothes, same pose)
✓ Hair style and hair color (from Image 1, NOT Image 2)
✓ Head angle and pose (same tilt, rotation)
✓ Overall lighting direction and color temperature
✓ Image composition and framing
DO NOT change ANYTHING about the scene, clothes, hair, or background!

**RULE 2: TAKE FACE FROM IMAGE 2 (Identity Features Only)**
Extract these facial features from Image 2:
✓ Eye shape, color, spacing, eyelids
✓ Nose shape and structure
✓ Mouth, lips, teeth pattern
✓ Face shape (jaw, cheeks, chin contour)
✓ Eyebrows shape and thickness
✓ Skin texture, freckles, moles
✓ Glasses (if person in Image 2 wears glasses, include them)
✓ Facial hair (beard, mustache if present)

**RULE 3: ADAPT THE FACE TO IMAGE 1'S SCENE (CRITICAL)**

1. **MATCH HEAD ANGLE FROM IMAGE 1:**
   - Look at Image 1's head angle (straight, 3/4 left, 3/4 right, tilted).
   - Rotate Image 2's face to match that EXACT angle.
   - The face must fit the head position in Image 1.

2. **MATCH LIGHTING FROM IMAGE 1:**
   - Apply Image 1's lighting to the new face.
   - Shadows should fall in the same direction as Image 1.
   - Color temperature (warm/cool) must match Image 1.
   - If Image 1 has studio lighting, apply studio lighting to the face.

3. **SKIN TONE COLOR GRADING:**
   - Keep the person's identity from Image 2 (same skin texture).
   - BUT adjust brightness, contrast, saturation to match Image 1's lighting.
   - Remove any color cast from Image 2's original photo.
   - The face should look like it was photographed in Image 1's lighting.

4. **SCALE TO FIT:**
   - Size the face to match the head in Image 1.
   - Face fills the head area naturally.

**RULE 4: SEAMLESS BLENDING**
- NO visible edges or seams around the face.
- Hair from Image 1 blends naturally with the new face.
- Neck and ear transitions are invisible.
- Result looks like a REAL photograph, not a collage.

**COMMON MISTAKES TO AVOID:**
❌ Don't use Image 2's background
❌ Don't use Image 2's hair style
❌ Don't use Image 2's clothing
❌ Don't keep Image 2's head angle if different from Image 1
❌ Don't keep Image 2's lighting if different from Image 1

${additionalInstructions ? `**User's Additional Instructions:** ${additionalInstructions}` : ''}

**FINAL CHECK:** Result = Image 1's body/scene/hair + Image 2's face (adapted to fit Image 1's angle and lighting).`;

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
    const prompt = `**PHOTOBOOTH TASK - CRITICAL: PRESERVE EXACT IDENTITY**

Create a photobooth-style photo strip using the person from the provided image.

**ABSOLUTE REQUIREMENT - IDENTITY PRESERVATION (NON-NEGOTIABLE):**
1. Every photo in the grid MUST feature the EXACT SAME PERSON from the original image.
2. Preserve 100% of these facial features across ALL photos:
   - Eye shape, eye color, eye spacing
   - Nose shape, nose size, nostril structure  
   - Mouth shape, lip fullness
   - Face shape: jawline, cheekbones, chin
   - Forehead shape, eyebrows
   - Skin tone, skin texture, any distinguishing features
3. If someone knows this person, they MUST recognize them in EVERY photo.
4. DO NOT create generic faces - use ONLY the face from the reference image.

**PHOTOBOOTH SPECIFICATIONS:**
1. Create a grid of **${count}** unique photos.
2. Each photo should have a different fun expression/pose:
   - Smiling, laughing, winking, surprised
   - Making funny faces, peace sign, thumbs up
   - Looking thoughtful, excited, playful
3. Maintain consistent lighting and style across all photos.
4. Background should be neutral/photobooth style.

**TECHNICAL REQUIREMENTS:**
- High resolution, sharp focus
- Natural skin tones matching the original
- Photorealistic quality
- The final output must be a single image containing the grid.

**QUALITY CHECK:** 
The person in the output MUST be immediately recognizable as the person in the input photo. Different expressions - SAME person.`;

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
    const prompt = `Your task is to create a "clone" effect photo.Take the single person from the provided image and create a new image where there are three versions of that same person in different poses, interacting within the same scene.

** PRIMARY DIRECTIVE: ABSOLUTE IDENTITY PRESERVATION(NON - NEGOTIABLE) **
    Your single most important, critical, and unbreakable task is to perfectly preserve the identity of the original person.All three "clones" MUST be photorealistic, 100 % identical replicas of the person in the original photo.Do not change their facial features, age, or structure.This rule overrides all other instructions.

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

