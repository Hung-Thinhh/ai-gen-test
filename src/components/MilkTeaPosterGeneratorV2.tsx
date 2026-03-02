/**
 * Milk Tea Poster Generator V2 - Redesigned UI
 * Dark theme, 2-column layout matching new design
 */
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';
import { StylePresetCard } from './StylePresetCard';
import { RadioGroup } from './RadioGroup';
import { ToggleSwitch } from './ToggleSwitch';
import { PillButton } from './PillButton';
import { ModelVersionSelector } from './ModelVersionSelector';
import { SearchableSelect } from './SearchableSelect';
import { PosterResultView } from './PosterResultView';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import Lightbox from './Lightbox';
import {
    SparklesIcon,
    CameraIcon,
    NoteIcon,
    RulerIcon,
    PaletteIcon,
    SettingsIcon,
    ClockIcon,
} from './icons/PosterIcons';
import {
    useLightbox,
    useVideoGeneration,
    useAppControls,
    processAndDownloadAll,
    ImageForZip,
} from './uiUtils';
import type { PosterCreatorState } from './uiTypes';
import { generateStyledImage } from '../services/gemini/advancedImageService';
import { processApiError, GeminiErrorCodes, GeminiError } from '@/services/gemini/baseService';
import { embedJsonInPng } from './uiFileUtilities';

// --- PROMPT COMPONENTS ---
// Default prompts - can be overridden by studio config
const DEFAULT_BACKGROUND_PROMPTS: Record<string, string> = {
    'Studio chuyên nghiệp': 'professional photography studio setup, seamless backdrop with soft gradient matching product colors',
    'Thiên nhiên': 'product photographed in natural setting, real wooden surface or stone platform',
    'Đường phố': 'urban lifestyle photography, product on textured concrete or brick surface',
    'Sang trọng': 'luxury product photography, rich marble or velvet surface, gold/metallic accent props',
    'Nhà bếp': 'authentic kitchen food photography, wooden cutting board or kitchen counter',
    'Bãi biển': 'beach product photography, sandy surface with natural shells',
    'Studio tối giản': 'minimalist studio photography, clean single-color seamless backdrop',
    'Công nghệ': 'tech product photography, sleek reflective surface, subtle neon accent lighting',
    'Cổ điển': 'vintage product photography, antique wooden furniture surface',
};

const DEFAULT_LIGHTING_PROMPTS: Record<string, string> = {
    'Studio chuyên nghiệp': 'professional 3-point studio lighting setup',
    'Ánh sáng tự nhiên': 'soft natural window light from side',
    'Golden hour': 'warm golden hour sunlight',
    'Neon glow': 'subtle neon accent lighting, colored gel lights',
    'Dramatic shadow': 'dramatic single-source lighting, deep contrasting shadows',
    'Soft diffused': 'large softbox diffused lighting',
    'Rim light': 'soft volumetric rim/back lighting',
};

const DEFAULT_ANGLE_PROMPTS: Record<string, string> = {
    'Góc chụp studio chuẩn': 'professional eye-level studio shot',
    'Góc nhìn trực diện': 'straight-on frontal view',
    'Góc 45 độ': 'three-quarter view at 45-degree angle',
    'Góc nhìn từ trên': 'overhead flat-lay shot, 90-degree top-down view',
    'Góc 3/4 cao': 'high three-quarter angle',
    'Góc hero shot': 'dramatic low-angle hero shot',
    'Góc cận cảnh': 'close-up macro angle',
};

const DEFAULT_POSTER_TYPE_PROMPTS: Record<string, string> = {
    'Poster quảng cáo sản phẩm': 'professional product advertisement poster',
    'Banner social media': 'social media banner, modern digital marketing',
    'Mockup sản phẩm 3D': '3D product mockup, realistic rendering',
    'Poster sự kiện': 'event promotional poster',
    'Bao bì sản phẩm': 'product packaging design',
    'Billboard quảng cáo': 'billboard advertising, large format outdoor ad',
};

const ASPECT_RATIO_PROMPTS: Record<string, string> = {
    'Giữ nguyên theo ảnh tham khảo': 'maintain the same aspect ratio as the reference image',
    '1:1 (Vuông - Instagram)': 'MUST be EXACTLY 1:1 SQUARE aspect ratio (1024x1024 pixels). The image MUST be perfectly square - equal width and height.',
    '9:16 (Story/Reels)': 'MUST be EXACTLY 9:16 VERTICAL aspect ratio (1080x1920 pixels). This is a TALL NARROW portrait format - the height must be almost TWICE the width. Make the image much TALLER than it is wide.',
    '16:9 (Ngang - YouTube)': 'MUST be EXACTLY 16:9 LANDSCAPE WIDESCREEN aspect ratio (1920x1080 pixels). Wide horizontal format - width almost twice the height.',
    '4:5 (Dọc - Instagram Post)': 'MUST be EXACTLY 4:5 PORTRAIT aspect ratio (1024x1280 pixels). Vertical Instagram post format - slightly taller than wide.',
    '5:4 (Ngang - Instagram)': 'MUST be EXACTLY 5:4 LANDSCAPE aspect ratio (1280x1024 pixels). Horizontal Instagram format - slightly wider than tall.',
    '3:4 (Dọc chuẩn)': 'MUST be EXACTLY 3:4 PORTRAIT aspect ratio (1152x1536 pixels). Vertical format, taller than wide.',
    '4:3 (Ngang chuẩn)': 'MUST be EXACTLY 4:3 LANDSCAPE aspect ratio (1536x1152 pixels). Horizontal format, wider than tall.',
    '2:3 (Poster dọc)': 'MUST be EXACTLY 2:3 PORTRAIT poster aspect ratio (1024x1536 pixels). Tall vertical poster format - height is 1.5x the width.',
    '3:2 (Poster ngang)': 'MUST be EXACTLY 3:2 LANDSCAPE poster aspect ratio (1536x1024 pixels). Wide horizontal poster format - width is 1.5x the height.',
};

const SMART_STYLING_PROMPT = `
**CRITICAL INSTRUCTIONS FOR REALISTIC INTEGRATION:**

1. **SEAMLESS INTEGRATION IS MANDATORY:**
   - The product MUST look like it was ACTUALLY PHOTOGRAPHED in the scene, NOT composited/photoshopped.
   - Match the product's lighting EXACTLY to the environment lighting (direction, color temperature, intensity).
   - Create NATURAL shadows that match the scene's light source (soft/hard, angle, length).
   - Add subtle reflections from the environment onto the product surface.

2. **LIGHTING CONSISTENCY:**
   - If the scene has warm lighting, the product must also have warm color cast.
   - Shadows must fall in the SAME direction as other shadows in the scene.
   - Add ambient occlusion where product meets surfaces.
   - Include subtle rim lighting or edge glow if scene has backlighting.

3. **ENVIRONMENTAL INTERACTION:**
   - Add realistic reflections on glossy product surfaces showing the environment.
   - Create natural shadows underneath and around the product.
   - If there are splashes/particles, they should interact with the product realistically.
   - Add atmospheric effects consistently (fog, mist, bokeh) affecting both product and background.

4. **COLOR HARMONY:**
   - The product's colors should be influenced by the environment's ambient color.
   - Ensure white balance is consistent between product and background.
   - Add subtle color spill from colorful backgrounds onto the product edges.

5. **OUTPUT QUALITY:**
   - Full HD, professional commercial photography quality.
   - Sharp focus on product with appropriate depth of field.
   - The result must be indistinguishable from a real professional photo shoot.
`;

interface StylePreset {
    name: string;
    description: string;
    prompt?: string;
    buildPrompt?: (productDesc: string, posterTypePrompt: string, bgPrompt: string, lightPrompt: string, anglePrompt: string, notes: string) => string;
}

// Fallback hardcoded presets (will be replaced by DB)
const FALLBACK_STYLE_PRESETS: Record<string, StylePreset> = {
    studio_professional: {
        name: 'Studio Chuyên Nghiệp',
        description: 'Chụp ảnh studio nghiêm túc, chuyên nghiệp',
        buildPrompt: (productDesc, posterTypePrompt, bgPrompt, lightPrompt, anglePrompt, notes) =>
            `CREATE A NEW ${posterTypePrompt} featuring ${productDesc}. EXTRACT the product and place it in a completely NEW professional studio environment. Apply: ${bgPrompt}. Use ${lightPrompt}. Shoot at ${anglePrompt}. Add reflections, shadows, and professional retouching. Full HD quality. ${notes}`,
    },
    organic_elegant: {
        name: 'Hữu cơ & Thanh lịch',
        description: 'Sản phẩm với lá cây, hoa tươi xung quanh',
        buildPrompt: (productDesc, posterTypePrompt, bgPrompt, lightPrompt, anglePrompt, notes) =>
            `CREATE A NEW ${posterTypePrompt} featuring ${productDesc}. EXTRACT the product and PLACE it in an elegant organic setting with fresh green leaves, colorful flowers, and natural elements surrounding it. Apply: ${bgPrompt}. ${lightPrompt}. ${anglePrompt}. Full HD quality. ${notes}`,
    },
};


interface PosterGeneratorV2Props {
    // Required props
    appState: PosterCreatorState;
    onStateChange: (newState: PosterCreatorState) => void;
    onReset: () => void;
    logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: any) => void;
    addImagesToGallery: (images: string[]) => Promise<string[] | undefined>;

    // Optional props (for compatibility with wrappers)
    mainTitle?: string;
    subtitle?: string;
    useSmartTitleWrapping?: boolean;
    smartTitleWrapWords?: number;
    uploaderCaption?: string;
    uploaderDescription?: string;
    onGoBack?: () => void;
    stylePresets?: Record<string, any>;
    domainContext?: string;
    domainPrompts?: {
        backgrounds?: Record<string, string>;
        lighting?: Record<string, string>;
        angles?: Record<string, string>;
        posterTypes?: Record<string, string>;
    };
    theme?: {
        primaryColor?: string;
        secondaryColor?: string;
        gradient?: string;
    };
}

export const MilkTeaPosterGeneratorV2: React.FC<PosterGeneratorV2Props> = ({
    appState,
    onStateChange,
    onReset,
    logGeneration,
    addImagesToGallery,
    mainTitle = 'Tạo Poster Sản Phẩm',
    subtitle = 'Công cụ thiết kế AI chuyên nghiệp',
    stylePresets,
    domainContext,
    domainPrompts,
    theme,
    // Other props are ignored for now in V2
}) => {
    const { t, settings, checkCredits, modelVersion, creditCostPerImage, handleModelVersionChange } = useAppControls();
    const { lightboxIndex, openLightbox, closeLightbox, navigateLightbox } = useLightbox();
    const { videoTasks, generateVideo } = useVideoGeneration();

    // Result View State
    const [showResultView, setShowResultView] = useState(false);
    const [selectedResultImage, setSelectedResultImage] = useState<string | null>(null);
    const [activeResultIndex, setActiveResultIndex] = useState(0);

    // Use DB stylePresets if available, otherwise fallback to hardcoded
    const STYLE_PRESETS = useMemo(() => {
        return stylePresets || FALLBACK_STYLE_PRESETS;
    }, [stylePresets]);

    // Use domain prompts from DB if available, otherwise fallback to defaults
    const BACKGROUND_PROMPTS = useMemo(() => {
        return domainPrompts?.backgrounds || DEFAULT_BACKGROUND_PROMPTS;
    }, [domainPrompts]);

    const LIGHTING_PROMPTS = useMemo(() => {
        return domainPrompts?.lighting || DEFAULT_LIGHTING_PROMPTS;
    }, [domainPrompts]);

    const ANGLE_PROMPTS = useMemo(() => {
        return domainPrompts?.angles || DEFAULT_ANGLE_PROMPTS;
    }, [domainPrompts]);

    const POSTER_TYPE_PROMPTS = useMemo(() => {
        return domainPrompts?.posterTypes || DEFAULT_POSTER_TYPE_PROMPTS;
    }, [domainPrompts]);

    // Load style presets from DB for UI display
    const availablePresets = useMemo(() => {
        if (stylePresets && Object.keys(stylePresets).length > 0) {
            // Map DB presets to UI config
            return Object.entries(stylePresets).reduce((acc, [key, preset]) => {
                acc[key] = {
                    icon: preset.icon || '🎨',
                    iconBg: preset.iconBg || '#666',
                    title: preset.name || key,
                    description: preset.description || '',
                };
                return acc;
            }, {} as Record<string, any>);
        }
        // Use fallback presets for UI
        return Object.entries(FALLBACK_STYLE_PRESETS).reduce((acc, [key, preset]) => {
            acc[key] = {
                icon: '🎨',
                iconBg: '#666',
                title: preset.name,
                description: preset.description,
            };
            return acc;
        }, {} as Record<string, any>);
    }, [stylePresets]);

    // Select Dropdown Options - Use keys from PROMPTS (define before state)
    const posterTypeOptions = Object.keys(POSTER_TYPE_PROMPTS);
    const backgroundTypeOptions = Object.keys(BACKGROUND_PROMPTS);
    const lightingTypeOptions = Object.keys(LIGHTING_PROMPTS);
    const productAngleOptions = Object.keys(ANGLE_PROMPTS);

    // Local UI State - Allow multiple style selection (max 4)
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [productDesc, setProductDesc] = useState('');
    const [envDesc, setEnvDesc] = useState('');
    const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1 (Vuông - Instagram)');
    const [imageCount, setImageCount] = useState(1);
    const [includeText, setIncludeText] = useState(false);
    const [headline, setHeadline] = useState('');
    const [subheadline, setSubheadline] = useState('');
    const [callToAction, setCallToAction] = useState('');

    // New select dropdowns state
    const [posterType, setPosterType] = useState(posterTypeOptions[0] || 'Poster quảng cáo sản phẩm');
    const [backgroundType, setBackgroundType] = useState(backgroundTypeOptions[0] || 'Studio chuyên nghiệp');
    const [lightingType, setLightingType] = useState(lightingTypeOptions[0] || 'Ánh sáng tự nhiên');
    const [productAngle, setProductAngle] = useState(productAngleOptions[0] || 'Góc chụp studio chuẩn');

    // Radio groups state
    const [lighting, setLighting] = useState('Tự nhiên');
    const [angle, setAngle] = useState('Ngang tầm mắt');
    const [composition, setComposition] = useState('Chính giữa');
    const [isGenerating, setIsGenerating] = useState(false);
    const [displayImages, setDisplayImages] = useState<string[]>([]);

    // Aspect Ratio Options (Full list from old version)
    const aspectRatioFullOptions = [
        'Giữ nguyên theo ảnh tham khảo',
        '1:1 (Vuông - Instagram)',
        '16:9 (Ngang - YouTube)',
        '9:16 (Story/Reels)',
        '4:5 (Dọc - Instagram Post)',
        '5:4 (Ngang - Instagram)',
        '4:3 (Ngang chuẩn)',
        '3:4 (Dọc chuẩn)',
        '3:2 (Poster ngang)',
        '2:3 (Poster dọc)',
    ];

    // Radio Options
    const lightingOptions = [
        { value: 'Tự nhiên', label: 'Tự nhiên', icon: '☀️' },
        { value: 'Studio Softbox', label: 'Studio Softbox', icon: '🔦' },
        { value: 'Tương phản cao', label: 'Tương phản cao', icon: '⚡' },
    ];

    const angleOptions = [
        { value: 'Ngang tầm mắt', label: 'Ngang tầm mắt', icon: '➡️' },
        { value: 'Từ trên xuống', label: 'Từ trên xuống', icon: '⬇️' },
        { value: 'Từ dưới lên', label: 'Từ dưới lên', icon: '⬆️' },
    ];

    const compositionOptions = [
        { value: 'Chính giữa', label: 'Chính giữa', icon: '🎯' },
        { value: 'Quy tắc 1/3', label: 'Quy tắc 1/3', icon: '📐' },
        { value: 'Toàn cảnh', label: 'Toàn cảnh', icon: '🌅' },
    ];

    // Image Upload Handlers
    const handleProductImageUpload = useCallback((imageDataUrl: string | null) => {
        if (imageDataUrl) {
            onStateChange({
                ...appState,
                stage: 'configuring',
                productImages: [imageDataUrl],
                error: null,
            });
        } else {
            onStateChange({ ...appState, productImages: [] });
        }
    }, [appState, onStateChange]);

    const handleSecondaryObjectUpload = useCallback((imageDataUrl: string | null) => {
        onStateChange({ ...appState, secondaryObjectImage: imageDataUrl });
    }, [appState, onStateChange]);

    const handleReferenceImageUpload = useCallback((imageDataUrl: string | null) => {
        onStateChange({ ...appState, referenceImage: imageDataUrl });
    }, [appState, onStateChange]);

    const handleTextEffectUpload = useCallback((imageDataUrl: string | null) => {
        onStateChange({ ...appState, textEffectImage: imageDataUrl });
    }, [appState, onStateChange]);

    // Handle browser back button - prevent leaving the tool accidentally
    useEffect(() => {
        if (showResultView) {
            // Push a new state when entering result view
            window.history.pushState({ resultView: true }, '', window.location.href);

            const handlePopState = (event: PopStateEvent) => {
                // When user presses back, return to editor instead of leaving page
                event.preventDefault();
                setShowResultView(false);
                // Push state again to prevent actually going back
                window.history.pushState({ resultView: false }, '', window.location.href);
            };

            window.addEventListener('popstate', handlePopState);

            return () => {
                window.removeEventListener('popstate', handlePopState);
            };
        }
    }, [showResultView]);

    // Warn user before leaving page while generating
    useEffect(() => {
        if (isGenerating) {
            const handleBeforeUnload = (e: BeforeUnloadEvent) => {
                e.preventDefault();
                e.returnValue = 'Đang tạo ảnh, bạn có chắc muốn rời trang?';
                return e.returnValue;
            };

            window.addEventListener('beforeunload', handleBeforeUnload);

            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            };
        }
    }, [isGenerating]);

    // Build prompt - FULL LOGIC FROM OLD VERSION
    // Now accepts optional styleKey to build prompt for a specific style
    const buildPrompt = useCallback((styleKey?: string) => {
        const desc = productDesc || 'the product in the image';
        const posterTypePrompt = POSTER_TYPE_PROMPTS[posterType] || 'professional product poster';
        const bgPrompt = BACKGROUND_PROMPTS[backgroundType] || 'professional background';
        const lightPrompt = LIGHTING_PROMPTS[lightingType] || 'professional lighting';
        const anglePrompt = ANGLE_PROMPTS[productAngle] || 'optimal angle';
        const notes = '';
        const domainPrompt = domainContext || 'Milk Tea & Beverage commercial photography aesthetics.';

        const fullDomainContext = `\n**DOMAIN/INDUSTRY CONTEXT:**\n${domainPrompt}\nApply this aesthetic appropriately to the entire image composition.\n`;

        // Check if we have reference image - this changes the entire approach
        const hasReferenceImage = !!appState.referenceImage;
        const hasTextEffect = !!appState.textEffectImage;

        let mainPrompt = '';

        if (hasReferenceImage) {
            // REFERENCE IMAGE MODE: Analyze layout first, then recreate with user's product
            const hasTextEffectImage = !!appState.textEffectImage;
            mainPrompt = `
**⚠️ CRITICAL - UNDERSTAND WHICH IMAGE IS WHICH:**
You are given MULTIPLE images. Each has a SPECIFIC purpose:

1. **MY PRODUCT IMAGE(S)** [FIRST IMAGE(S)]: The product I want in the final poster
   - Use this product in the poster
   - This is NOT a layout reference

2. **REFERENCE POSTER IMAGE** [${hasTextEffectImage ? 'SECOND TO LAST' : 'LAST'} IMAGE]: The poster showing LAYOUT, COMPOSITION, and ASPECT RATIO
   - ⚠️ THIS IS THE SOURCE OF TRUTH FOR: aspect ratio, layout, product position, background style
   - Copy the EXACT aspect ratio (portrait/landscape/square) from this image
   - Copy the EXACT composition and product placement

${hasTextEffectImage ? `3. **TEXT EFFECT IMAGE** [LAST IMAGE]: Shows ONLY the font/text styling I want
   - Use this ONLY for text styling (font, color, effects)
   - Do NOT use this for layout or aspect ratio
   - This image only affects how the text looks, NOT the poster structure` : ''}

**⚠️ ASPECT RATIO RULE:**
- The OUTPUT must have the SAME aspect ratio as the REFERENCE POSTER IMAGE
- If reference is PORTRAIT (tall), output MUST be portrait
- If reference is LANDSCAPE (wide), output MUST be landscape  
- Do NOT change aspect ratio based on other images

YOUR TASK: Create poster with MY PRODUCT + REFERENCE LAYOUT ${hasTextEffectImage ? '+ TEXT EFFECT STYLING' : ''}.

**STEP 1 - ANALYZE THE REFERENCE POSTER IMAGE (NOT OTHER IMAGES):**
First, carefully analyze the REFERENCE POSTER image and identify:
- What is the ASPECT RATIO? (portrait/landscape/square)
- Where is the main product/subject positioned? (center, left, right, top, bottom)
- What is the exact background style, colors, and atmosphere?
- Where are any text elements located? (headlines, taglines, CTAs)
- What decorative elements exist? (splashes, leaves, particles, shadows, reflections)
- What is the overall composition and proportions?

**STEP 2 - RECREATE WITH THESE STRICT RULES:**

1. **⚠️ CRITICAL - REPLACE THE REFERENCE PRODUCT WITH MY PRODUCT:**
   - COMPLETELY REMOVE the product shown in the reference image (it's NOT my product)
   - EXTRACT my product from MY uploaded product image (the FIRST image provided)
   - PLACE my product in the EXACT same position, scale, and angle as the original product in the reference
   - The reference product is just a PLACEHOLDER showing where MY product should go
   - My product is: "${desc}"

2. **⚠️ COLOR PALETTE - MUST MATCH REFERENCE EXACTLY:**
   - Analyze the EXACT color scheme of the reference image
   - If reference is GREEN (matcha theme) → output MUST be GREEN, NOT orange/brown
   - If reference is ORANGE → output MUST be ORANGE  
   - If reference is PINK → output MUST be PINK
   - Copy the EXACT background color, gradients, and color tones
   - The overall color impression must be IDENTICAL to reference
   - Do NOT change colors based on my product - KEEP the reference colors

3. **BACKGROUND & COMPOSITION - COPY EXACTLY:**
   - Copy the EXACT same background style, gradients, and visual atmosphere
   - If reference has a WHITE BOX/PODIUM → use WHITE BOX, not hexagon
   - If reference has a HEXAGON podium → use HEXAGON
   - Copy the EXACT podium/platform shape and color
   - Copy the lighting direction and intensity

4. **PRESERVE MY PRODUCT'S LOGO/BRANDING:** Keep all logos, labels, and branding on MY uploaded product image intact. Do NOT remove anything from my product.

5. **⚠️ CRITICAL - REMOVE ALL TEXT FROM REFERENCE:**
   - REMOVE every single word, letter, and text element from the reference image
   - This includes: "SUMMER", "Lorem ipsum", brand names, taglines, ALL text
   - The background where text was should be filled with the surrounding background seamlessly
   - Do NOT copy any text from reference - only copy the background and visual elements
   - ONLY add the text that user provides in STEP 3 below

6. **⚠️ CRITICAL - REMOVE ALL LOGOS/WATERMARKS FROM REFERENCE:**
   - COMPLETELY REMOVE any logos, watermarks, brand marks, or company emblems from the reference image
   - This includes logos in corners (like "BonzerTOUR", company logos, photographer watermarks)
   - Do NOT copy any branding elements from the reference image background
   - The areas where logos/watermarks were should be filled with the surrounding background seamlessly
   - The ONLY branding that should appear is ON my uploaded product itself

7. **⚠️ DECORATIVE ELEMENTS - COPY EXACTLY FROM REFERENCE:**
   - If reference has GREEN TEA LEAVES → add GREEN TEA LEAVES, not star anise
   - If reference has MATCHA POWDER sprinkles → add MATCHA POWDER, not other spices
   - If reference has STAR ANISE → add STAR ANISE
   - If reference has ICE CUBES → add ICE CUBES
   - Copy the EXACT TYPE, COLOR, and POSITION of decorative elements
   - Do NOT substitute with different elements (e.g., star anise instead of leaves)
   - The decorative elements must match the reference EXACTLY in type and style
   - Do NOT add effects that don't exist in reference

${envDesc ? `8. **ADDITIONAL ELEMENTS:** Also include: ${envDesc}.` : ''}
${appState.secondaryObjectImage ? '9. **SECONDARY OBJECTS:** Incorporate elements from the secondary object image as surrounding props in appropriate positions.' : ''}
`;
        } else {
            // NO REFERENCE IMAGE: Use style presets and options
            let environmentContext = '';
            if (envDesc) {
                environmentContext = `ENVIRONMENT CONTEXT: Place the product with: ${envDesc}. `;
            }
            if (appState.secondaryObjectImage) {
                environmentContext += 'Include secondary objects from the uploaded reference as surrounding elements. ';
            }

            // Get style preset for this specific image (if styleKey provided)
            let styleDescription = '';
            if (styleKey && STYLE_PRESETS[styleKey]) {
                const preset = STYLE_PRESETS[styleKey];
                styleDescription = preset?.prompt || preset?.buildPrompt?.(desc, posterTypePrompt, bgPrompt, lightPrompt, anglePrompt, notes) || '';
            }

            mainPrompt = `
GENERATE A NEW IMAGE:
**DOMAIN/INDUSTRY CONTEXT:** ${domainPrompt}

**SETUP:**
- Product: ${desc}
- Poster Type: ${posterTypePrompt}

**PRIORITY SETTINGS (⚠️ MUST OVERRIDE CONFLICTING STYLE DESCRIPTIONS):**
- Background: ${bgPrompt} (⚠️ THIS IS THE MANDATORY BACKGROUND. Ignore any background mentioned in "style art direction" below if it conflicts.)
- Lighting: ${lightPrompt}
- Angle: ${anglePrompt}

**STYLE ART DIRECTION (Apply mood/lighting/colors, but KEEP the background defined above):**
${styleDescription}

**ADDITIONAL INSTRUCTIONS:**
${environmentContext}
${notes ? `User Notes: ${notes}` : ''}
`;
        }

        // Handle text on poster - Replace text at same positions as reference
        let textContext = '';
        if (includeText) {
            if (hasReferenceImage) {
                // Reference mode: Replace text at same positions
                textContext = `

**STEP 3 - TEXT REPLACEMENT (MANDATORY):**
Analyze where text/titles appear in the reference image and replace with my content.
⚠️ YOU MUST ADD ALL TEXT ELEMENTS I PROVIDE BELOW - DO NOT SKIP ANY!

${headline ? `📌 **MAIN HEADLINE:** "${headline}"
   - MUST BE ADDED at the SAME position as the main title in reference
   - Make it bold, prominent, and eye-catching
   - Scale to fit the space while maintaining readability` : ''}

${subheadline ? `📌 **SUBHEADLINE:** "${subheadline}"
   - MUST BE ADDED below or near the headline as in reference
   - Slightly smaller than headline but still readable` : ''}

${callToAction ? `📌 **CTA BUTTON (MANDATORY):** "${callToAction}"
   - ⚠️ THIS IS REQUIRED - YOU MUST ADD THIS CTA BUTTON
   - Look at the reference image to find the CTA button position (usually bottom area)
   - Create a button/badge with the text "${callToAction}" at that position
   - Design style should match the reference CTA style (rounded rectangle, pill shape, etc.)
   - Colors should HARMONIZE with the overall poster theme
   - Make it noticeable but natural in the design
   - If reference has a CTA button, replicate its style and position exactly` : ''}

**⚠️ CRITICAL TEXT RULES:**
- ONLY use the text content I provided above (headline, subheadline, CTA)
- YOU MUST INCLUDE ALL text elements I specified - do NOT skip any
- Do NOT add any other text, brand names, or words from the product image
- Do NOT read text from the product packaging/logo and add it as a separate title
- The product's own branding/labels should remain ON the product only
- Text must NOT overlap with the product
- All text should feel like part of the original design

**⚠️⚠️ CRITICAL - VIETNAMESE TEXT ACCURACY (RẤT QUAN TRỌNG):**
The text I provided is in VIETNAMESE with special diacritical marks (dấu). You MUST:
- Copy EVERY character EXACTLY as I wrote it - do NOT guess or change any letter
- Vietnamese has unique diacritics: à, á, ả, ã, ạ, ă, ằ, ắ, ẳ, ẵ, ặ, â, ầ, ấ, ẩ, ẫ, ậ, etc.
- Do NOT substitute similar-looking letters (e.g., "tràn" ≠ "trản", "Mua" ≠ "Nhặn")
- If my text says "${headline || ''}" - write EXACTLY that, character by character
- If my text says "${subheadline || ''}" - write EXACTLY that, character by character  
- If my text says "${callToAction || ''}" - write EXACTLY that, character by character
- ANY spelling error in Vietnamese text is UNACCEPTABLE
- Double-check each word before rendering
`;

                // Text styling decision tree
                if (hasTextEffect) {
                    // Priority 1: Use uploaded text effect image
                    textContext += `
**TEXT STYLING FROM UPLOADED REFERENCE:**
Apply the EXACT text style from the uploaded text effect image:
- Copy the exact font family and weight
- Copy the exact colors, gradients, or color effects
- Copy all shadow effects (drop shadow, inner shadow, long shadow)
- Copy any glow, outline, or stroke effects
- Copy 3D effects, emboss, bevel if present
- Copy any texture or pattern fills
The text must look like it was styled by the same designer who made the text effect reference.
`;
                } else {
                    // Priority 2: Copy text style EXACTLY from reference image
                    textContext += `
**⚠️ TYPOGRAPHY - MUST MATCH REFERENCE EXACTLY (CRITICAL):**
The text styling must be a PERFECT VISUAL COPY of the reference image's typography.

1. **ANALYZE REFERENCE TEXT CAREFULLY:**
   - What is the EXACT font type? (serif, sans-serif, script, decorative, display?)
   - Is it a SPECIAL decorative font with unique letterforms?
   - What COLOR is the text? (white, green, red, gradient?)
   - Does it have TEXTURE or PATTERN inside the letters?
   - Does it have OUTLINE, STROKE, or BORDER?
   - Does it have SHADOW (drop shadow, inner shadow, 3D effect)?
   - Is it BOLD, LIGHT, ITALIC, or REGULAR?

2. **⚠️ COPY THE EXACT FONT STYLE:**
   - If reference uses a DECORATIVE SCRIPT font (like "matcha" style with swirls) → use SAME decorative style
   - If reference uses BOLD SANS-SERIF → use BOLD SANS-SERIF
   - If reference has a unique artistic font → replicate that artistic style
   - Do NOT substitute with generic Arial/Helvetica - match the DESIGN QUALITY
   - The letterforms must LOOK SIMILAR to reference

3. **COPY THE EXACT TEXT EFFECTS:**
   - If reference text is WHITE with no effects → use WHITE with no effects
   - If reference text has GREEN color → use GREEN
   - If reference has matcha powder texture on text → add similar texture
   - If reference has shadow/glow → add shadow/glow
   - If reference has outline/stroke → add outline/stroke

4. **⚠️ THE GOAL:**
   - Someone looking at both posters should think the same designer made them
   - The typography style must be VISUALLY IDENTICAL in feeling
   - Match the artistic level and sophistication of the reference
`;
                }
            } else {
                textContext = '\n\n**TEXT ON POSTER:**\n';
                if (headline) textContext += `- Main headline: "${headline}" - Make it bold and prominent at top\n`;
                if (subheadline) textContext += `- Subheadline: "${subheadline}" - Below headline, supporting text\n`;
                if (callToAction) textContext += `- CTA: "${callToAction}" - Design as elegant button that matches poster style, NOT overly bright or flashy\n`;
                textContext += `\n**⚠️ VIETNAMESE TEXT - COPY EXACTLY:**\nThe text is in Vietnamese with diacritical marks. Copy EVERY character EXACTLY as provided - do NOT guess or substitute letters.\n`;

                // Priority 3: Auto-generate professional typography
                textContext += `
**PROFESSIONAL TYPOGRAPHY DESIGN:**
Since no reference, create DESIGNER-LEVEL typography:

1. **FONT SELECTION:**
   - Choose a sophisticated, premium font that matches the product category
   - For luxury products: elegant serif or refined sans-serif
   - For modern/tech: clean geometric sans-serif
   - For food/beverage: friendly rounded or appetizing display fonts
   - For fashion: stylish high-contrast or editorial fonts
   - AVOID basic/default fonts like Arial or Times New Roman

2. **TYPOGRAPHY HIERARCHY:**
   - Create visual contrast between headline and subheadline
   - Mix font weights (bold headline + light subheadline) or styles (display + serif)
   - Size ratios should be professional (headline 2-3x larger than body)

3. **VISUAL EFFECTS:**
   - Add subtle but impactful effects (soft shadows, slight gradients)
   - Colors should complement or tastefully contrast with the poster
   - Consider decorative elements if appropriate for the brand

4. **DESIGNER MINDSET:**
   - The text should look like it was designed by a professional agency
   - Every detail matters - kerning, spacing, alignment
   - The overall feel should be premium and polished
`;
            }
        }

        // Aspect ratio instruction - MUST be at the very beginning for emphasis
        let aspectRatioContext = '';
        const aspectRatioPrompt = ASPECT_RATIO_PROMPTS[selectedAspectRatio];
        if (aspectRatioPrompt) {
            if (selectedAspectRatio === 'Giữ nguyên theo ảnh tham khảo' && hasReferenceImage) {
                aspectRatioContext = `
**⚠️ CRITICAL - ASPECT RATIO MUST MATCH REFERENCE:**
- Analyze the EXACT dimensions/proportions of the reference image.
- If reference is portrait (tall), output MUST be portrait with same ratio.
- If reference is landscape (wide), output MUST be landscape with same ratio.
- If reference is square, output MUST be square.
- The output image dimensions should match the reference image proportions EXACTLY.
- Do NOT change the aspect ratio - this is mandatory.
`;
            } else if (selectedAspectRatio !== 'Giữ nguyên theo ảnh tham khảo') {
                aspectRatioContext = `
**⚠️⚠️⚠️ CRITICAL - MANDATORY ASPECT RATIO INSTRUCTION ⚠️⚠️⚠️**
${aspectRatioPrompt}

**THIS IS NON-NEGOTIABLE:**
- The OUTPUT IMAGE dimensions MUST follow this exact aspect ratio.
- For 9:16: The image must be TALL and NARROW (like a phone screen in portrait mode).
- For 16:9: The image must be WIDE and SHORT (like a TV screen).
- For 1:1: The image must be a PERFECT SQUARE.
- Adjust your composition to fit this format - do NOT output a different ratio.
- If you output a wrong aspect ratio, the result will be REJECTED.

`;
            }
        }

        // Check if we have reference image - this changes the entire approach
        // Only add SMART_STYLING_PROMPT if advanced styling is enabled (saves ~500 tokens)
        const advancedStyling = hasReferenceImage ? '' : SMART_STYLING_PROMPT;
        return `${aspectRatioContext}${mainPrompt}${textContext}${advancedStyling}`;
    }, [productDesc, posterType, backgroundType, lightingType, productAngle, domainContext, envDesc, appState, STYLE_PRESETS, includeText, headline, subheadline, callToAction, selectedAspectRatio]);

    // Generate Handler - Create one image per selected style
    const handleGenerate = async () => {
        if (!appState.productImages[0]) {
            toast.error('Vui lòng tải ảnh sản phẩm lên!');
            return;
        }

        if (selectedStyles.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 phong cách!');
            return;
        }

        // Check credits based on number of selected styles
        const totalCredits = creditCostPerImage * selectedStyles.length;
        if (!await checkCredits(totalCredits)) {
            return;
        }

        setIsGenerating(true);
        setDisplayImages([]); // Clear previous images

        // Switch to result view IMMEDIATELY
        setShowResultView(true);
        setActiveResultIndex(0);
        setSelectedResultImage(null);

        onStateChange({ ...appState, stage: 'generating' });

        try {
            // Prepare image URLs for generation (same for all styles)
            const imageUrls: string[] = [];

            // Add product images
            if (appState.productImages && appState.productImages.length > 0) {
                imageUrls.push(...appState.productImages);
            }

            // Add reference image if exists
            if (appState.referenceImage) {
                imageUrls.push(appState.referenceImage);
            }

            // Add text effect image if exists
            if (appState.textEffectImage) {
                imageUrls.push(appState.textEffectImage);
            }

            console.log('[V2] Image URLs count:', imageUrls.length);
            console.log('[V2] Styles to generate:', selectedStyles.length, selectedStyles);

            // Generate one image per selected style in PARALLEL
            const generateImageForStyle = async (styleKey: string, index: number) => {
                const styleName = STYLE_PRESETS[styleKey]?.name || styleKey;
                console.log(`[V2] Starting generation ${index + 1}/${selectedStyles.length} for style: ${styleName}...`);

                try {
                    // Build prompt specifically for this style
                    const prompt = buildPrompt(styleKey);

                    const imageUrl = await generateStyledImage(
                        prompt,
                        imageUrls,
                        undefined,
                        selectedAspectRatio,
                        'milktea-poster-v2'
                    );

                    if (imageUrl) {
                        console.log(`[V2] Image ${index + 1} (${styleName}) generated successfully:`, imageUrl);
                        // Update UI immediately for this image
                        setDisplayImages(prev => [imageUrl, ...prev]);

                        // First image logic (view already shown, just track it)
                        if (index === 0) {
                            setSelectedResultImage(imageUrl);
                        }

                        return imageUrl;
                    }
                    return null;
                } catch (err: any) {
                    const error = processApiError(err);
                    console.error(`[V2] Error generating image for style ${styleName}:`, error);
                    toast.error(`Lỗi tạo ảnh ${styleName}: ${error.message}`);
                    return null;
                }
            };

            // Create array of promises - one per selected style
            const promises = selectedStyles.map((styleKey, index) => generateImageForStyle(styleKey, index));

            // Wait for all to complete (in parallel)
            const results = await Promise.all(promises);

            // Filter successful images
            const generatedImages = results.filter((url): url is string => url !== null);

            // Add all generated images to gallery
            if (generatedImages.length > 0) {
                // await addImagesToGallery(generatedImages); // FIX: Duplicate save causing double images in gallery

                // logGeneration('milktea-poster-v2', appState, generatedImages[0], {
                //     api_model_used: modelVersion,
                //     credits_used: generatedImages.length,
                //     generation_count: generatedImages.length,
                //     input_prompt: prompt,
                // });

                toast.success(`✨ Tạo thành công ${generatedImages.length}/${selectedStyles.length} poster!`);

                // Result view already shown, no need to set again

            } else {
                toast.error('Không tạo được ảnh nào!');
            }
        } catch (err: any) {
            const error = processApiError(err);
            console.error('[V2] Generation error:', error);
            toast.error(`Lỗi: ${error.message}`);
            onStateChange({ ...appState, error: error.message, stage: 'configuring' });
        } finally {
            setIsGenerating(false);
            onStateChange({ ...appState, stage: 'configuring' });
        }
    };

    const lightboxImages = useMemo(() => {
        return [...appState.productImages, ...displayImages].filter((img): img is string => !!img);
    }, [appState.productImages, displayImages]);

    if (showResultView) {
        return (
            <PosterResultView
                images={displayImages}
                allGeneratedImages={displayImages}
                totalCount={imageCount}
                isGenerating={isGenerating}
                onBack={() => setShowResultView(false)}
                posterTitle={appState.options.headline || "Poster Design"}
                selectedIndex={activeResultIndex}
                onSelectImage={(idx) => setActiveResultIndex(idx)}
                onDownload={async (url, format, quality) => {
                    const { downloadImage } = await import('./uiUtils');
                    const randomId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                    await downloadImage(url, `Duky-AI-poster-${randomId}`);
                    toast.success(`Đang tải xuống ${format} (${quality})...`);
                }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="border-b border-neutral-800 px-6 py-4 pt-20 md:pt-10">
                <div className="max-w-7xl mx-auto flex items-end justify-between">
                    <div>
                        <h1 className="text-4xl font-bold flex items-center gap-2">
                            <SparklesIcon className="w-10 h-10" />
                            {mainTitle}
                        </h1>
                        <p className="text-md text-neutral-400 mt-1">
                            {subtitle}
                        </p>
                    </div>

                </div>
            </div>

            {/* Model Selector */}
            <div className=" px-6 p-0 md:py-3">
                <div className="max-w-10 md:max-w-7xl fixed md:absolute z-99 top-14 md:top-26 right-10 md:right-36 mx-auto flex justify-center">
                    <ModelVersionSelector
                        modelVersion={modelVersion}
                        onModelChange={handleModelVersionChange}
                    />
                </div>
            </div>

            {/* Main Content - 2 Column Layout */}
            <div className="max-w-[1600px] mx-auto px-6 p-2 md:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-6">
                    {/* LEFT SIDEBAR */}
                    <div className="flex flex-col gap-6 ">
                        {/* Upload Section */}
                        <div className="bg-[#0c0c0c] rounded-xl p-6 border border-neutral-800">
                            <label className="text-white font-semibold text-base flex items-center gap-2 mb-4">
                                <CameraIcon className="w-6 h-6" />
                                Ảnh đầu vào
                            </label>
                            {/* Large Product Image Upload */}
                            <div className="w-60 m-auto md:w-auto">
                                <ActionablePolaroidCard
                                    uploadLabel="Tải ảnh sản phẩm lên"
                                    type_box="big"
                                    type={appState.productImages[0] ? 'content-input' : 'uploader'}
                                    status="done"
                                    mediaUrl={appState.productImages[0] ?? undefined}
                                    caption="Tải ảnh sản phẩm lên"
                                    placeholderType="photo"
                                    onImageChange={handleProductImageUpload}
                                />

                            </div>

                            {/* 3 Small Upload Slots */}
                            <div className="grid grid-cols-3 gap-2 mt-10 md:mt-4">
                                {/* Secondary Object */}
                                <div className="flex flex-col items-center h-32 md:h-40 ">
                                    <ActionablePolaroidCard
                                        uploadLabel='Đồ vật phụ'

                                        type={appState.secondaryObjectImage ? 'content-input' : 'uploader'}
                                        status="done"
                                        mediaUrl={appState.secondaryObjectImage ?? undefined}
                                        caption="📍"
                                        placeholderType="architecture"
                                        onImageChange={handleSecondaryObjectUpload}
                                    />
                                </div>

                                {/* Reference Image */}
                                <div className="flex flex-col items-center">
                                    <ActionablePolaroidCard
                                        uploadLabel='Bố cục mẫu'

                                        type={appState.referenceImage ? 'content-input' : 'uploader'}
                                        status="done"
                                        mediaUrl={appState.referenceImage ?? undefined}
                                        caption="🖼️"
                                        placeholderType="furniture"
                                        onImageChange={handleReferenceImageUpload}
                                    />
                                </div>

                                {/* Text Effect */}
                                <div className="flex flex-col items-center">
                                    <ActionablePolaroidCard
                                        uploadLabel='Text mẫu'
                                        type={appState.textEffectImage ? 'content-input' : 'uploader'}
                                        status="done"
                                        mediaUrl={appState.textEffectImage ?? undefined}
                                        caption="Tt"
                                        placeholderType="art"
                                        onImageChange={handleTextEffectUpload}
                                    />
                                </div>
                            </div>

                        </div>

                        {/* Information Section */}
                        <div className="bg-[#0c0c0c] border border-neutral-800 rounded-xl p-6">
                            <label className="text-white font-semibold text-xl flex items-center gap-2 mb-4">
                                <NoteIcon className="w-5 h-6" />
                                Thông tin
                            </label>



                            {/* Product Description */}
                            <div className="mb-4">
                                <label className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                                    MÔ TẢ SẢN PHẨM
                                </label>
                                <textarea
                                    value={productDesc}
                                    onChange={(e) => setProductDesc(e.target.value)}
                                    placeholder="Sản phẩm là gì? Màu sắc, chất liệu..."
                                    rows={3}
                                    className="w-full !h-2 !min-h-15 px-4 py-2 bg-[#0c0c0c] border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 resize-none"
                                />
                            </div>

                            {/* Environment Description */}
                            <div>
                                <label className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                                    MÔ TẢ XUNG QUANH / VỊ TRÍ (tùy chọn)
                                </label>
                                <textarea
                                    value={envDesc}
                                    onChange={(e) => setEnvDesc(e.target.value)}
                                    placeholder="Trên bàn gỗ, dưới ánh nắng, nền studio..."
                                    rows={3}
                                    className="w-full !h-2 !min-h-15 px-4 py-2 bg-[#0c0c0c] border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT MAIN AREA */}
                    <div className="flex flex-col gap-6">
                        {/* Style Presets */}
                        <div className="bg-[#0c0c0c] border border-neutral-800 rounded-xl p-6">
                            <label className="block text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
                                <PaletteIcon className="w-4 h-4" />
                                Phong cách thiết kế
                                {selectedStyles.length > 0 && (
                                    <span className="ml-auto text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                                        {selectedStyles.length}/4 đã chọn
                                    </span>
                                )}
                            </label>

                            {/* Desktop Grid */}
                            <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(availablePresets).map(([key, config]) => {
                                    const isSelected = selectedStyles.includes(key);
                                    const canSelect = selectedStyles.length < 4 || isSelected;

                                    return (
                                        <StylePresetCard
                                            key={key}
                                            icon={config.icon}
                                            iconBg={config.iconBg}
                                            title={config.title}
                                            description={config.description}
                                            isSelected={isSelected}
                                            onClick={() => {
                                                if (isSelected) {
                                                    // Deselect
                                                    setSelectedStyles(prev => prev.filter(s => s !== key));
                                                } else if (canSelect) {
                                                    // Select (max 4)
                                                    setSelectedStyles(prev => [...prev, key]);
                                                } else {
                                                    toast.error('Chỉ được chọn tối đa 4 phong cách!');
                                                }
                                            }}
                                        />
                                    );
                                })}
                            </div>

                            {/* Mobile Swiper */}
                            <div className="md:hidden">
                                <Swiper
                                    modules={[Pagination, FreeMode]}
                                    spaceBetween={12}
                                    slidesPerView={2.2}
                                    freeMode={true}
                                    pagination={{
                                        clickable: true,
                                        dynamicBullets: true,
                                    }}
                                    className="style-presets-swiper !p-2"
                                >
                                    {Object.entries(availablePresets).map(([key, config]) => {
                                        const isSelected = selectedStyles.includes(key);
                                        const canSelect = selectedStyles.length < 4 || isSelected;

                                        return (
                                            <SwiperSlide key={key}>
                                                <StylePresetCard
                                                    icon={config.icon}
                                                    iconBg={config.iconBg}
                                                    title={config.title}
                                                    description={config.description}
                                                    isSelected={isSelected}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setSelectedStyles(prev => prev.filter(s => s !== key));
                                                        } else if (canSelect) {
                                                            setSelectedStyles(prev => [...prev, key]);
                                                        } else {
                                                            toast.error('Chỉ được chọn tối đa 4 phong cách!');
                                                        }
                                                    }}
                                                />
                                            </SwiperSlide>
                                        );
                                    })}
                                </Swiper>
                            </div>
                        </div>

                        {/* Text Overlay Toggle */}
                        <div className="bg-[#0c0c0c] border border-neutral-800 rounded-xl py-1 px-2 md:p-6">
                            <ToggleSwitch
                                label="Chèn chữ lên ảnh"
                                checked={includeText}
                                onChange={setIncludeText}
                            />

                            {includeText && (
                                <div className="mt-4 flex flex-col gap-3">
                                    <input
                                        type="text"
                                        value={headline}
                                        onChange={(e) => setHeadline(e.target.value)}
                                        placeholder="Tiêu đề chính (VD: SALE 50%)"
                                        className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
                                    />
                                    <input
                                        type="text"
                                        value={subheadline}
                                        onChange={(e) => setSubheadline(e.target.value)}
                                        placeholder="Tiêu đề phụ (VD: Tiết kiệm cơ hội)"
                                        className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
                                    />
                                    <input
                                        type="text"
                                        value={callToAction}
                                        onChange={(e) => setCallToAction(e.target.value)}
                                        placeholder="Nút bấm (VD: Mua ngay)"
                                        className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Detail Adjustments */}
                        <div className="bg-[#0c0c0c] border border-neutral-800 rounded-xl p-6">
                            <label className="text-white font-semibold text-base flex items-center gap-2 mb-4">
                                <SettingsIcon className="w-5 h-5" />
                                Tỉnh chỉnh chi tiết
                            </label>

                            {/* Row 1: Select Dropdowns */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                {/* Loại poster */}
                                <div>
                                    <label className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                                        Loại poster
                                    </label>
                                    <SearchableSelect
                                        id="poster-type"
                                        label=""
                                        options={posterTypeOptions}
                                        value={posterType}
                                        onChange={setPosterType}
                                        placeholder="Chọn loại poster..."
                                    />
                                </div>

                                {/* Kiểu nền */}
                                <div>
                                    <label className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                                        Kiểu nền
                                    </label>
                                    <SearchableSelect
                                        id="background-type"
                                        label=""
                                        options={backgroundTypeOptions}
                                        value={backgroundType}
                                        onChange={setBackgroundType}
                                        placeholder="Chọn kiểu nền..."
                                    />
                                </div>

                                {/* Kiểu ánh sáng */}
                                <div>
                                    <label className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                                        Kiểu ánh sáng
                                    </label>
                                    <SearchableSelect
                                        id="lighting-type"
                                        label=""
                                        options={lightingTypeOptions}
                                        value={lightingType}
                                        onChange={setLightingType}
                                        placeholder="Chọn kiểu ánh sáng..."
                                    />
                                </div>

                                {/* Góc sản phẩm */}
                                <div>
                                    <label className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                                        Góc sản phẩm
                                    </label>
                                    <SearchableSelect
                                        id="product-angle"
                                        label=""
                                        options={productAngleOptions}
                                        value={productAngle}
                                        onChange={setProductAngle}
                                        placeholder="Chọn góc sản phẩm..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Format Section */}
                        <div className="bg-[#0c0c0c] border border-neutral-800 rounded-xl p-6">
                            <label className="text-white font-semibold text-base flex items-center gap-2 mb-4">
                                <RulerIcon className="w-5 h-5" />
                                Định dạng
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-20">
                                {/* Aspect Ratio */}
                                <div>
                                    <label className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                                        Tỷ lệ khung hình
                                    </label>
                                    <SearchableSelect
                                        id="aspect-ratio"
                                        label=""
                                        options={aspectRatioFullOptions}
                                        value={selectedAspectRatio}
                                        onChange={setSelectedAspectRatio}
                                        placeholder="Chọn tỷ lệ khung hình..."
                                    />
                                    {appState.options.aspectRatio && appState.options.aspectRatio !== 'Giữ nguyên theo ảnh tham khảo' && modelVersion !== 'v3' && modelVersion !== 'pro' && (
                                        <p className="!text-xs text-orange-500 mt-1 flex items-center gap-1">
                                            <span>⚠️</span>
                                            <span>Tỷ lệ khung ảnh chỉ hoạt động với Model v3 / Pro. Vui lòng chuyển sang v3 hoặc Pro</span>
                                        </p>
                                    )}
                                </div>
                                {/* Image Count Buttons */}
                                <div className='w-1/2'>
                                    <label className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                                        SỐ LƯỢNG ẢNH
                                    </label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4].map((count) => (
                                            <button
                                                key={count}
                                                onClick={() => setImageCount(count)}
                                                className={`flex-1 items-center justify-center flex py-2 rounded-lg font-semibold transition-all ${imageCount === count
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                                    }`}
                                            >
                                                {count}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>


                        {/* View Results Button - Show if there are generated images */}
                        {displayImages.length > 0 && !showResultView && (
                            <button
                                onClick={() => setShowResultView(true)}
                                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-3 rounded-xl text-sm md:text-base flex items-center justify-center gap-2 transition-all border border-neutral-700"
                            >
                                <span>👁️</span>
                                Xem Kết Quả ({displayImages.length})
                            </button>
                        )}

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !appState.productImages[0]}
                            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400/30 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2 transition-all"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Đang tạo...
                                </>
                            ) : (
                                <>
                                    <span>⚡</span>
                                    Tạo Poster Ngay
                                </>
                            )}
                        </button>


                        {/* Results */}
                        {displayImages.length > 0 && (
                            <div className="bg-[#0c0c0c] border border-neutral-800 rounded-xl p-6">
                                <h3 className="text-white font-semibold text-lg mb-4">Kết quả</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {displayImages.map((img, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => openLightbox(appState.productImages.length + idx)}
                                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-orange-500"
                                        >
                                            <img src={img} alt={`Result ${idx + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            <Lightbox
                images={lightboxImages}
                selectedIndex={lightboxIndex}
                prompts={[]}
                onClose={closeLightbox}
                onNavigate={navigateLightbox}
            />
        </div>
    );
};

export default MilkTeaPosterGeneratorV2;
