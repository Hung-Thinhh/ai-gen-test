/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ChangeEvent, useCallback, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import Lightbox from './Lightbox';
import {
    AppScreenHeader,
    ImageForZip,
    handleFileUpload,
    useLightbox,
    useVideoGeneration,
    processAndDownloadAll,
    useAppControls,
    dataURLtoBlob,
} from './uiUtils';
import * as storageService from '../services/storageService';
import { SearchableSelect } from './SearchableSelect';
import type { PosterCreatorState } from './uiTypes';
import { generateStyledImage } from '../services/gemini/advancedImageService';

// --- PROMPT COMPONENTS ---
const BACKGROUND_PROMPTS: Record<string, string> = {
    'Tự động phân tích': `INTELLIGENT BACKGROUND SELECTION: Analyze the product and automatically choose the most harmonious background style based on these rules:
- For TEA/MATCHA/LATTE beverages: Use soft PASTEL tones (mint green, cream, soft pink, lavender) with natural wooden or marble surface
- For ENERGY DRINKS/SPORTS beverages: Use VIBRANT BOLD colors (electric blue, neon green, fiery orange, dynamic gradients) with sleek modern surface
- For COFFEE beverages: Use warm EARTH TONES (deep brown, cream, terracotta) with rustic wooden surface
- For FRUIT JUICES/SMOOTHIES: Use FRESH TROPICAL colors matching the fruit (orange for citrus, berry purple, tropical green) with natural props
- For ALCOHOL/WINE: Use ELEGANT DARK tones (deep burgundy, gold accents, black velvet) with luxury surface
- For MILK/DAIRY: Use CLEAN WHITE/CREAM palette with soft shadows on pure seamless backdrop
- For COSMETICS/BEAUTY: Use SOPHISTICATED neutrals (rose gold, nude pink, marble white) with premium surface
- For FOOD items: Use APPETIZING warm tones that complement the dish, natural ingredients as props
The background color palette MUST harmonize with the product's dominant colors. Surface and props should match the product category. Professional commercial photography quality.`,
    'Auto analyze': `INTELLIGENT BACKGROUND SELECTION: Analyze the product automatically...`,
    'Studio chuyên nghiệp': 'professional photography studio setup, seamless backdrop with soft gradient matching product colors',
    'Professional studio': 'professional photography studio setup, seamless backdrop',
    'Thiên nhiên': 'product photographed in natural setting, real wooden surface or stone platform',
    'Nature': 'product photographed in natural setting',
    'Đường phố': 'urban lifestyle photography, product on textured concrete or brick surface',
    'Urban street': 'urban lifestyle photography',
    'Sang trọng': 'luxury product photography, rich marble or velvet surface, gold/metallic accent props',
    'Luxury': 'luxury product photography',
    'Nhà bếp': 'authentic kitchen food photography, wooden cutting board or kitchen counter',
    'Kitchen': 'authentic kitchen food photography',
    'Bãi biển': 'beach product photography, sandy surface with natural shells',
    'Beach': 'beach product photography',
    'Studio tối giản': 'minimalist studio photography, clean single-color seamless backdrop',
    'Minimalist studio': 'minimalist studio photography',
    'Công nghệ': 'tech product photography, sleek reflective surface, subtle neon accent lighting',
    'Tech': 'tech product photography',
    'Cổ điển': 'vintage product photography, antique wooden furniture surface',
    'Vintage': 'vintage product photography',
};

const LIGHTING_PROMPTS: Record<string, string> = {
    'Studio chuyên nghiệp': 'professional 3-point studio lighting setup',
    'Professional studio': 'professional 3-point studio lighting setup',
    'Ánh sáng tự nhiên': 'soft natural window light from side',
    'Natural light': 'soft natural window light',
    'Golden hour': 'warm golden hour sunlight',
    'Neon glow': 'subtle neon accent lighting, colored gel lights',
    'Dramatic shadow': 'dramatic single-source lighting, deep contrasting shadows',
    'Soft diffused': 'large softbox diffused lighting',
    'Rim light': 'soft volumetric rim/back lighting',
};

const ANGLE_PROMPTS: Record<string, string> = {
    'Góc chụp studio chuẩn': 'professional eye-level studio shot',
    'Standard studio angle': 'professional eye-level studio shot',
    'Góc nhìn trực diện': 'straight-on frontal view',
    'Front view': 'straight-on frontal view',
    'Góc 45 độ': 'three-quarter view at 45-degree angle',
    '45-degree angle': 'three-quarter view at 45-degree angle',
    'Góc nhìn từ trên': 'overhead flat-lay shot, 90-degree top-down view',
    'Top view': 'overhead flat-lay shot',
    'Góc 3/4 cao': 'high three-quarter angle',
    'High 3/4 angle': 'high three-quarter angle',
    'Góc hero shot': 'dramatic low-angle hero shot',
    'Hero shot': 'dramatic low-angle hero shot',
    'Góc cận cảnh': 'close-up macro angle',
    'Close-up detail': 'close-up macro angle',
};

const POSTER_TYPE_PROMPTS: Record<string, string> = {
    'Poster quảng cáo sản phẩm': 'professional product advertisement poster',
    'Product advertisement poster': 'professional product advertisement poster',
    'Banner social media': 'social media banner, modern digital marketing',
    'Social media banner': 'social media banner',
    'Mockup sản phẩm 3D': '3D product mockup, realistic rendering',
    '3D product mockup': '3D product mockup',
    'Poster sự kiện': 'event promotional poster',
    'Event poster': 'event promotional poster',
    'Bao bì sản phẩm': 'product packaging design',
    'Product packaging': 'product packaging design',
    'Billboard quảng cáo': 'billboard advertising, large format outdoor ad',
    'Billboard advertising': 'billboard advertising',
};

const COLOR_SCHEME_OPTIONS = [
    'Tự động theo ảnh tham khảo',
    'Màu ấm (đỏ, cam, vàng)',
    'Màu lạnh (xanh dương, xanh lá, tím)',
    'Đen trắng sang trọng',
    'Pastel nhẹ nhàng',
    'Neon rực rỡ',
    'Earth tones tự nhiên',
];

const ASPECT_RATIO_OPTIONS = [
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

const DOMAIN_PROMPTS: Record<string, string> = {
    'Tự do sáng tạo': 'Creative freedom: Adapt the style to best fit the product.',

    'F&B (Thực phẩm & Đồ uống)': `Food & Beverage aesthetics:
ALLOWED PROPS: If product is COLD (ice cream, soda, beer, juice) → add condensation droplets, frost, ice cubes, fresh fruit slices. If product is HOT (coffee, soup) → add subtle steam, warm lighting.
FORBIDDEN: Do NOT add cosmetic items (powder puffs, brushes, flower petals), tech items (circuits, screens), fashion items (fabric swatches), medical equipment.
Focus on high appetite appeal, fresh ingredients as natural props.`,

    'Mỹ phẩm & Làm đẹp': `Beauty & Cosmetics aesthetics:
ALLOWED PROPS: Flower petals (rose, orchid), marble surfaces, silk ribbons, soft brushes, powder puffs, golden accents, crystal elements, skincare texture.
FORBIDDEN: Do NOT add ice cubes, water droplets, condensation, beverage glasses, fruit slices, steam, or any F&B-related props. Do NOT add tech circuits or food items.
Focus on elegance, purity, soft diffused lighting, premium materials (frosted glass, silk, marble), pastel or rose gold sophisticated colors.`,

    'Công nghệ': `Technology aesthetics:
ALLOWED PROPS: Circuit patterns (subtle), metallic reflections, neon accent lights (blue/cyan), geometric shapes, glass surfaces, clean modern lines.
FORBIDDEN: Do NOT add organic props (flowers, leaves, fruit), ice/water/condensation, fabric textures, food items, powder puffs.
Focus on sleek modern lines, cool lighting, high-tech atmosphere, sharp reflections, futuristic elements.`,

    'Thời trang': `Fashion aesthetics:
ALLOWED PROPS: Fabric swatches, texture samples, lifestyle elements (magazines, accessories), dramatic shadows, sophisticated surfaces.
FORBIDDEN: Do NOT add ice/water/condensation, tech circuits, food items, medical equipment, beverage props.
Focus on style, fabric textures, trendy composition, dramatic lighting, high-end magazine look, lifestyle atmosphere.`,

    'Bất động sản & Nội thất': `Real Estate & Interior aesthetics:
ALLOWED PROPS: Architectural elements, plants (potted, subtle), soft textiles, wood textures, ambient warm lighting.
FORBIDDEN: Do NOT add product-specific props (ice, cosmetic items, food, beverages), tech circuits, commercial packaging.
Focus on spaciousness, natural lighting, architectural details, comfortable atmosphere, luxury living context.`,

    'Giáo dục': `Education aesthetics:
ALLOWED PROPS: Books, notebooks, pencils (subtle), bright clean surfaces, inspiring elements.
FORBIDDEN: Do NOT add commercial props (ice, cosmetics, beverages), dark moody lighting, tech gadgets, medical items.
Focus on clarity, bright friendly colors, inspiring atmosphere, clean composition, learning-focused environment.`,

    'Du lịch': `Travel aesthetics:
ALLOWED PROPS: Natural landscape elements, cultural artifacts (subtle), scenic backgrounds, adventure elements.
FORBIDDEN: Do NOT add product packaging props, ice/beverages, tech gadgets, cosmetic items, food props.
Focus on scenic beauty, adventure, cultural elements, vibrant natural colors, inviting landscapes, holiday atmosphere.`,

    'Sức khỏe & Y tế': `Health & Medical aesthetics:
ALLOWED PROPS: Clean surfaces (white/blue), subtle medical symbols (cross, plus sign), plants (aloe vera for natural health), scientific elements.
FORBIDDEN: Do NOT add commercial props (ice, cosmetics, beverages), dark colors, food items, fashion accessories.
Focus on cleanliness, trust (blue/white tones), professional atmosphere, scientific credibility, soft comforting lighting.`,
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

type StylePresetKey = 'studio_professional' | 'organic_elegant' | 'dynamic_fresh' | 'gourmet_dramatic' | 'conceptual_surreal' | 'narrative_context' | 'tech_futuristic' | 'fashion_editorial' | 'beauty_luxury' | 'lifestyle_minimal' | 'sports_dynamic' | 'automotive_premium' | 'eco_natural' | 'urban_street';

interface StylePreset {
    name: string;
    nameEn: string;
    description: string;
    descriptionEn: string;
    buildPrompt: (productDesc: string, posterTypePrompt: string, bgPrompt: string, lightPrompt: string, anglePrompt: string, notes: string) => string;
}

const STYLE_PRESETS: Record<StylePresetKey, StylePreset> = {
    studio_professional: {
        name: 'Studio Chuyên Nghiệp',
        nameEn: 'Professional Studio',
        description: 'Chụp ảnh studio nghiêm túc, chuyên nghiệp',
        descriptionEn: 'Serious professional studio photography',
        buildPrompt: (productDesc, posterTypePrompt, bgPrompt, lightPrompt, anglePrompt, notes) =>
            `CREATE A NEW ${posterTypePrompt} featuring ${productDesc}. EXTRACT the product and place it in a completely NEW professional studio environment. Apply: ${bgPrompt}. Use ${lightPrompt}. Shoot at ${anglePrompt}. Add reflections, shadows, and professional retouching. Full HD quality. ${notes}`,
    },
    organic_elegant: {
        name: 'Hữu cơ & Thanh lịch',
        nameEn: 'Organic & Elegant',
        description: 'Sản phẩm với lá cây, hoa tươi xung quanh',
        descriptionEn: 'Product with natural leaves and flowers',
        buildPrompt: (productDesc, posterTypePrompt, bgPrompt, lightPrompt, anglePrompt, notes) =>
            `CREATE A NEW ${posterTypePrompt} featuring ${productDesc}. EXTRACT the product and PLACE it in an elegant organic setting with fresh green leaves, colorful flowers, and natural elements surrounding it. Apply: ${bgPrompt}. ${lightPrompt}. ${anglePrompt}. Full HD quality. ${notes}`,
    },
    dynamic_fresh: {
        name: 'Động lực & Tươi mới',
        nameEn: 'Dynamic & Fresh',
        description: 'Splash nước, nguyên liệu bay',
        descriptionEn: 'Water splash, flying ingredients',
        buildPrompt: (productDesc, posterTypePrompt, bgPrompt, lightPrompt, anglePrompt, notes) =>
            `CREATE A NEW DYNAMIC ${posterTypePrompt} featuring ${productDesc}. GENERATE an exciting scene with dramatic liquid splash, water droplets frozen in mid-air, ice cubes flying, and dynamic motion effects. Apply: ${bgPrompt}. ${lightPrompt}. ${anglePrompt}. High-speed photography look. Full HD quality. ${notes}`,
    },
    gourmet_dramatic: {
        name: 'Ẩm thực & Kịch tính',
        nameEn: 'Gourmet & Dramatic',
        description: 'Food photography chuyên nghiệp',
        descriptionEn: 'Professional food photography',
        buildPrompt: (productDesc, posterTypePrompt, bgPrompt, lightPrompt, anglePrompt, notes) =>
            `CREATE A NEW professional food photography ${posterTypePrompt} featuring ${productDesc}. CONSTRUCT a gourmet scene with fresh ingredients, herbs, steam effects, and appetizing presentation. Apply dramatic ${bgPrompt}. ${lightPrompt}. ${anglePrompt}. Magazine-quality food advertising. Full HD quality. ${notes}`,
    },
    conceptual_surreal: {
        name: 'Thế giới thu nhỏ',
        nameEn: 'Miniature World',
        description: 'Cảnh quan fantasy 3D với nhân vật hoạt hình',
        descriptionEn: '3D fantasy landscape with cartoon characters',
        buildPrompt: (productDesc, posterTypePrompt, bgPrompt, lightPrompt, anglePrompt, notes) =>
            `CREATE A NEW MAGICAL ${posterTypePrompt} featuring ${productDesc} as the giant centerpiece in a whimsical miniature 3D fantasy world. ADD tiny cute cartoon characters interacting with the product, magical particles, fantasy landscape. ${bgPrompt}. ${lightPrompt}. ${anglePrompt}. Dreamlike atmosphere. Full HD quality. ${notes}`,
    },
    narrative_context: {
        name: 'Xoáy tròn & Splash',
        nameEn: 'Swirl & Splash',
        description: 'Chất lỏng xoáy tròn bao quanh sản phẩm',
        descriptionEn: 'Artistic liquid swirl wrapping around product',
        buildPrompt: (productDesc, posterTypePrompt, bgPrompt, lightPrompt, anglePrompt, notes) =>
            `CREATE A NEW ARTISTIC ${posterTypePrompt} featuring ${productDesc}. GENERATE dramatic colorful liquid swirls spiraling around the product in circular motion, paint splashes, smoky effects. ${bgPrompt}. ${lightPrompt}. ${anglePrompt}. Abstract artistic advertising style. Full HD quality. ${notes}`,
    },
    tech_futuristic: {
        name: 'Công nghệ Tương lai',
        nameEn: 'Tech Futuristic',
        description: 'Hiệu ứng hologram, ánh sáng neon, không gian cyber',
        descriptionEn: 'Hologram effects, neon lights, cyber space',
        buildPrompt: (productDesc, posterTypePrompt, bgPrompt, lightPrompt, anglePrompt, notes) =>
            `CREATE A NEW FUTURISTIC ${posterTypePrompt} featuring ${productDesc}. PLACE product in a high-tech environment with holographic UI elements, neon blue/purple lighting, digital grid patterns, floating particles, sleek reflective surfaces. ${bgPrompt}. ${lightPrompt}. ${anglePrompt}. Sci-fi tech advertising style. Full HD quality. ${notes}`,
    },
    fashion_editorial: {
        name: 'Thời trang Biên tập',
        nameEn: 'Fashion Editorial',
        description: 'Phong cách tạp chí thời trang cao cấp',
        descriptionEn: 'High-end fashion magazine style',
        buildPrompt: (productDesc, posterTypePrompt, bgPrompt, lightPrompt, anglePrompt, notes) =>
            `CREATE A NEW EDITORIAL ${posterTypePrompt} featuring ${productDesc}. COMPOSE a sophisticated fashion photography scene with elegant minimalist background, dramatic shadows, artistic composition, premium fabric textures. ${bgPrompt}. ${lightPrompt}. ${anglePrompt}. Vogue-style fashion advertising. Full HD quality. ${notes}`,
    },
    beauty_luxury: {
        name: 'Mỹ phẩm Sang trọng',
        nameEn: 'Beauty Luxury',
        description: 'Ánh kim, hoa hồng, giọt nước tinh khiết',
        descriptionEn: 'Gold accents, roses, pure water droplets',
        buildPrompt: (productDesc, posterTypePrompt, bgPrompt, lightPrompt, anglePrompt, notes) =>
            `CREATE A NEW LUXURIOUS ${posterTypePrompt} featuring ${productDesc}. DESIGN an elegant beauty scene with rose gold accents, delicate rose petals, crystal-clear water droplets, soft silk fabric, marble surface, premium cosmetic presentation. ${bgPrompt}. ${lightPrompt}. ${anglePrompt}. High-end beauty advertising. Full HD quality. ${notes}`,
    },
    lifestyle_minimal: {
        name: 'Lifestyle Tối giản',
        nameEn: 'Lifestyle Minimal',
        description: 'Phong cách sống tối giản, không gian sạch sẽ',
        descriptionEn: 'Minimalist lifestyle, clean space',
        buildPrompt: (productDesc, posterTypePrompt, bgPrompt, lightPrompt, anglePrompt, notes) =>
            `CREATE A NEW MINIMALIST ${posterTypePrompt} featuring ${productDesc}. COMPOSE a clean lifestyle scene with neutral tones, simple geometric shapes, negative space, natural materials (wood, cotton, ceramics), soft shadows. ${bgPrompt}. ${lightPrompt}. ${anglePrompt}. Scandinavian minimal lifestyle advertising. Full HD quality. ${notes}`,
    },
    sports_dynamic: {
        name: 'Thể thao Năng động',
        nameEn: 'Sports Dynamic',
        description: 'Chuyển động mạnh mẽ, năng lượng, tốc độ',
        descriptionEn: 'Powerful motion, energy, speed',
        buildPrompt: (productDesc, posterTypePrompt, bgPrompt, lightPrompt, anglePrompt, notes) =>
            `CREATE A NEW DYNAMIC ${posterTypePrompt} featuring ${productDesc}. GENERATE an energetic sports scene with motion blur, speed lines, sweat droplets flying, athletic energy, bold contrasting colors, dramatic action freeze-frame. ${bgPrompt}. ${lightPrompt}. ${anglePrompt}. Nike-style sports advertising. Full HD quality. ${notes}`,
    },
    automotive_premium: {
        name: 'Ô tô Cao cấp',
        nameEn: 'Automotive Premium',
        description: 'Bóng loáng, phản chiếu, kim loại sang trọng',
        descriptionEn: 'Glossy reflections, luxury metal',
        buildPrompt: (productDesc, posterTypePrompt, bgPrompt, lightPrompt, anglePrompt, notes) =>
            `CREATE A NEW PREMIUM ${posterTypePrompt} featuring ${productDesc}. DESIGN a luxury automotive scene with perfect chrome reflections, sleek metallic surfaces, dramatic studio lighting, carbon fiber textures, glossy paint finish. ${bgPrompt}. ${lightPrompt}. ${anglePrompt}. Mercedes-Benz style premium advertising. Full HD quality. ${notes}`,
    },
    eco_natural: {
        name: 'Sinh thái Tự nhiên',
        nameEn: 'Eco Natural',
        description: 'Thiên nhiên xanh, bền vững, hữu cơ',
        descriptionEn: 'Green nature, sustainable, organic',
        buildPrompt: (productDesc, posterTypePrompt, bgPrompt, lightPrompt, anglePrompt, notes) =>
            `CREATE A NEW ECO-FRIENDLY ${posterTypePrompt} featuring ${productDesc}. COMPOSE a natural sustainable scene with lush green plants, bamboo, recycled materials, earth tones, natural sunlight, organic textures, eco-conscious presentation. ${bgPrompt}. ${lightPrompt}. ${anglePrompt}. Sustainable eco advertising. Full HD quality. ${notes}`,
    },
    urban_street: {
        name: 'Đường phố Đô thị',
        nameEn: 'Urban Street',
        description: 'Graffiti, bê tông, phong cách streetwear',
        descriptionEn: 'Graffiti, concrete, streetwear style',
        buildPrompt: (productDesc, posterTypePrompt, bgPrompt, lightPrompt, anglePrompt, notes) =>
            `CREATE A NEW URBAN ${posterTypePrompt} featuring ${productDesc}. PLACE product in gritty street environment with graffiti wall, concrete textures, urban decay aesthetic, bold typography, street art elements, raw authentic vibe. ${bgPrompt}. ${lightPrompt}. ${anglePrompt}. Supreme-style streetwear advertising. Full HD quality. ${notes}`,
    },
};

interface PosterCreatorProps {
    mainTitle: string;
    subtitle: string;
    useSmartTitleWrapping: boolean;
    smartTitleWrapWords: number;
    uploaderCaption: string;
    uploaderDescription: string;
    addImagesToGallery: (images: string[]) => Promise<string[] | undefined>;
    appState: PosterCreatorState;
    onStateChange: (newState: PosterCreatorState) => void;
    onReset: () => void;
    onGoBack: () => void;
    logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: {
        api_model_used?: string;
        credits_used?: number;
        generation_count?: number;
    }) => void;
}

const MAX_PRODUCT_IMAGES = 3;

const PosterCreator: React.FC<PosterCreatorProps> = (props) => {
    const {
        uploaderCaption, uploaderDescription, addImagesToGallery,
        appState, onStateChange, onReset,
        logGeneration,
        ...headerProps
    } = props;

    const { t, checkCredits, user: currentUser, isLoggedIn, guestId, userIp, modelVersion } = useAppControls();
    const { lightboxIndex, openLightbox, closeLightbox, navigateLightbox } = useLightbox();
    const { videoTasks, generateVideo } = useVideoGeneration();
    const [localNotes, setLocalNotes] = useState(appState.options.notes);
    const [localEnvDesc, setLocalEnvDesc] = useState(appState.options.environmentDescription || '');
    const [productDescription, setProductDescription] = useState('');
    const [selectedStyle, setSelectedStyle] = useState<StylePresetKey>('studio_professional');
    const [localHeadline, setLocalHeadline] = useState(appState.options.headline || '');
    const [localSubheadline, setLocalSubheadline] = useState(appState.options.subheadline || '');
    const [localCTA, setLocalCTA] = useState(appState.options.callToAction || '');
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const [pendingImageSlots, setPendingImageSlots] = useState<number>(0); // Track how many images are still loading
    const [displayImages, setDisplayImages] = useState<string[]>([]); // Images created in current session
    const [isGenerating, setIsGenerating] = useState<boolean>(false); // Prevent double execution
    const MAX_DISPLAY_IMAGES = 4; // Maximum images to show on screen
    const generatedBlobUrlsRef = React.useRef<string[]>([]);
    const resultsRef = React.useRef<HTMLDivElement>(null);

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            generatedBlobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    useEffect(() => {
        setLocalNotes(appState.options.notes);
        setLocalEnvDesc(appState.options.environmentDescription || '');
        setLocalHeadline(appState.options.headline || '');
        setLocalSubheadline(appState.options.subheadline || '');
        setLocalCTA(appState.options.callToAction || '');
    }, [appState.options]);

    // Memoize lightboxImages to prevent unnecessary re-creation
    const lightboxImages = useMemo(() =>
        [...appState.productImages, ...displayImages].filter((img): img is string => !!img),
        [appState.productImages, displayImages]
    );
    const ASPECT_RATIO_OPTIONS_DISPLAY = t('aspectRatioOptions') || [
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

    const POSTER_TYPES = useMemo(() => {
        const types = t('posterCreator_posterTypes');
        return Array.isArray(types) ? types : ['Poster quảng cáo sản phẩm', 'Banner social media', 'Mockup sản phẩm 3D'];
    }, [t]);

    const BACKGROUND_STYLES = useMemo(() => {
        const styles = t('posterCreator_backgroundStyles');
        return Array.isArray(styles) ? styles : Object.keys(BACKGROUND_PROMPTS).slice(0, 6);
    }, [t]);

    const LIGHTING_STYLES = useMemo(() => {
        const styles = t('posterCreator_lightingStyles');
        return Array.isArray(styles) ? styles : Object.keys(LIGHTING_PROMPTS).slice(0, 6);
    }, [t]);

    const PRODUCT_ANGLES = useMemo(() => {
        const angles = t('posterCreator_productAngles');
        return Array.isArray(angles) ? angles : Object.keys(ANGLE_PROMPTS).slice(0, 6);
    }, [t]);

    const DOMAIN_OPTIONS = useMemo(() => [
        'Tự do sáng tạo',
        'F&B (Thực phẩm & Đồ uống)',
        'Mỹ phẩm & Làm đẹp',
        'Công nghệ',
        'Thời trang',
        'Bất động sản & Nội thất',
        'Giáo dục',
        'Du lịch',
        'Sức khỏe & Y tế'
    ], []);

    // Helper to read file as Blob URL
    const handleFileAsBlob = (e: ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const blobUrl = URL.createObjectURL(file);
            // We need to track these to revoke them later, but for now let's just use them.
            // Ideally, we should add to a ref to revoke on unmount or change.
            // For simplicity in this optimization step, we trust the browser/OS to handle page lifecycle cleanup partialy, 
            // but for 'productImages' we might want to track. 
            // However, React state is the bottleneck now.
            callback(blobUrl);
        }
    };

    // Handle product image upload (up to 3)
    const handleProductImageUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        handleFileAsBlob(e, (blobUrl: string) => {
            if (appState.productImages.length < MAX_PRODUCT_IMAGES) {
                const newImages = [...appState.productImages, blobUrl];
                onStateChange({
                    ...appState,
                    stage: 'configuring',
                    productImages: newImages,
                    error: null,
                });
                // Note: addImagesToGallery might expect B64. If it assumes B64 for persistence, 
                // we might need to convert only when saving to gallery, or let gallery handle blobs.
                // Checking uiContexts for addImagesToGallery... it likely invalidates if we pass a blob url that expires.
                // But for OOM fix, we MUST keep appState light.
                // Let's defer gallery addition or convert async if needed. 
                // For now, let's NOT add input images to gallery immediately or accept that they might be blob urls.
                // Actually, let's keep addImagesToGallery call but maybe separate it to avoiding holding B64 in appState.

                // We will skip addImagesToGallery for now to save memory, or we need to read as B64 just for that.
                // But reading as B64 crashes memory. 
                // Let's comment out addImagesToGallery for inputs for now to allow functioning.
                // Or better: don't auto-add inputs to gallery (history) to save space.
                // addImagesToGallery([blobUrl]); 
            }
        });
    }, [appState, onStateChange]);

    const handleRemoveProductImage = (index: number) => {
        const newImages = appState.productImages.filter((_, i) => i !== index);
        onStateChange({ ...appState, productImages: newImages });
    };

    // Handle secondary object image
    const handleSecondaryObjectUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        handleFileAsBlob(e, (blobUrl: string) => {
            onStateChange({ ...appState, secondaryObjectImage: blobUrl });
        });
    }, [appState, onStateChange]);

    // Handle reference image
    const handleReferenceImageUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        handleFileAsBlob(e, (blobUrl: string) => {
            onStateChange({ ...appState, referenceImage: blobUrl });
        });
    }, [appState, onStateChange]);

    // Handle text effect image
    const handleTextEffectUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        handleFileUpload(e, (imageDataUrl: string) => {
            onStateChange({ ...appState, textEffectImage: imageDataUrl });
            // REMOVED: addImagesToGallery([imageDataUrl]); // User requested NO auto-save for inputs
        });
    }, [appState, onStateChange]);

    const handleOptionChange = (field: keyof PosterCreatorState['options'], value: string | boolean | number) => {
        onStateChange({ ...appState, options: { ...appState.options, [field]: value } });
    };

    // Build prompt
    const buildPrompt = () => {
        const preset = STYLE_PRESETS[selectedStyle];
        const desc = productDescription || 'the product in the image';
        const posterTypePrompt = POSTER_TYPE_PROMPTS[appState.options.posterType] || 'professional product poster';
        const bgPrompt = BACKGROUND_PROMPTS[appState.options.backgroundStyle] || 'professional background';
        const lightPrompt = LIGHTING_PROMPTS[appState.options.lightingStyle] || 'professional lighting';
        const anglePrompt = ANGLE_PROMPTS[appState.options.productAngle] || 'optimal angle';
        const envDesc = localEnvDesc || '';
        const notes = localNotes || '';
        const domainPrompt = DOMAIN_PROMPTS[appState.options.domain] || DOMAIN_PROMPTS['Tự do sáng tạo'];

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
            if (appState.secondaryObjectImage) {
                environmentContext += 'Include secondary objects from the uploaded reference as surrounding elements. ';
            }
            mainPrompt = `${environmentContext}${fullDomainContext}${preset.buildPrompt(desc, posterTypePrompt, bgPrompt, lightPrompt, anglePrompt, notes)}`;
        }

        // Handle text on poster - Replace text at same positions as reference
        let textContext = '';
        if (appState.options.includeText) {
            const hasTextEffect = !!appState.textEffectImage;

            if (hasReferenceImage) {
                // Reference mode: Replace text at same positions
                textContext = `

**STEP 3 - TEXT REPLACEMENT (MANDATORY):**
Analyze where text/titles appear in the reference image and replace with my content.
⚠️ YOU MUST ADD ALL TEXT ELEMENTS I PROVIDE BELOW - DO NOT SKIP ANY!

${localHeadline ? `📌 **MAIN HEADLINE:** "${localHeadline}"
   - MUST BE ADDED at the SAME position as the main title in reference
   - Make it bold, prominent, and eye-catching
   - Scale to fit the space while maintaining readability` : ''}

${localSubheadline ? `📌 **SUBHEADLINE:** "${localSubheadline}"
   - MUST BE ADDED below or near the headline as in reference
   - Slightly smaller than headline but still readable` : ''}

${localCTA ? `📌 **CTA BUTTON (MANDATORY):** "${localCTA}"
   - ⚠️ THIS IS REQUIRED - YOU MUST ADD THIS CTA BUTTON
   - Look at the reference image to find the CTA button position (usually bottom area)
   - Create a button/badge with the text "${localCTA}" at that position
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
- If my text says "${localHeadline || ''}" - write EXACTLY that, character by character
- If my text says "${localSubheadline || ''}" - write EXACTLY that, character by character  
- If my text says "${localCTA || ''}" - write EXACTLY that, character by character
- ANY spelling error in Vietnamese text is UNACCEPTABLE
- Double-check each word before rendering
`;
            } else {
                textContext = '\n\n**TEXT ON POSTER:**\n';
                if (localHeadline) textContext += `- Main headline: "${localHeadline}" - Make it bold and prominent at top\n`;
                if (localSubheadline) textContext += `- Subheadline: "${localSubheadline}" - Below headline, supporting text\n`;
                if (localCTA) textContext += `- CTA: "${localCTA}" - Design as elegant button that matches poster style, NOT overly bright or flashy\n`;
                textContext += `\n**⚠️ VIETNAMESE TEXT - COPY EXACTLY:**\nThe text is in Vietnamese with diacritical marks. Copy EVERY character EXACTLY as provided - do NOT guess or substitute letters.\n`;
            }

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
            } else if (hasReferenceImage) {
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
            } else {
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

        // Color scheme override (only if reference image exists)
        let colorOverride = '';
        if (hasReferenceImage && appState.options.colorScheme && appState.options.colorScheme !== 'Tự động theo ảnh tham khảo') {
            colorOverride = `\nCOLOR ADJUSTMENT: While keeping the layout, adjust the color palette to: ${appState.options.colorScheme}.\n`;
        }

        // Aspect ratio instruction - MUST be at the very beginning for emphasis
        let aspectRatioContext = '';
        const selectedAspectRatio = appState.options.aspectRatio || 'Giữ nguyên theo ảnh tham khảo';
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
        const advancedStyling = appState.options.enableAdvancedStyling ? SMART_STYLING_PROMPT : '';
        return `${aspectRatioContext}${mainPrompt}${textContext}${colorOverride}${advancedStyling}`;
    };

    const executeInitialGeneration = async () => {
        console.log('Đang tạoooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo...');
        console.log(appState.productImages);

        // Prevent double execution
        if (isGenerating) {
            console.log('⚠️ Already generating, skipping duplicate call');
            return;
        }

        if (appState.productImages.length === 0) return;

        const imageCount = appState.options.imageCount || 1;

        // Check credits for TOTAL images FIRST (before UI changes)
        const creditCostPerImage = modelVersion === 'v3' ? 2 : 1;
        const totalCost = imageCount * creditCostPerImage;
        console.log('CHECK CREDITTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT');

        if (!await checkCredits(totalCost)) {
            // Credits insufficient - stay in current state, popup will show
            console.log('CHECK CREDITTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT loi');

            return;
        }

        // Set generating flag
        setIsGenerating(true);

        // Clear previous images but KEEP placeholders active
        generatedBlobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
        generatedBlobUrlsRef.current = [];
        setDisplayImages([]);
        setPendingImageSlots(imageCount); // Set slots immediately for feedback

        // Switch to configuring stage immediately (ensure UI shows results section)
        onStateChange({ ...appState, stage: 'configuring', error: null });

        // Scroll to results area immediately
        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

        try {
            const prompt = buildPrompt();
            console.log(`Generating ${imageCount} poster(s) in PARALLEL...`);

            const imagesToUse: string[] = [];

            // Helper to convert blob URL to base64 for API
            const getBase64 = async (url: string): Promise<string> => {
                if (url.startsWith('data:')) return url;
                const blob = await fetch(url).then(r => r.blob());
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            };

            // Process inputs sequentially to save memory (inputs are few)
            for (const img of appState.productImages) imagesToUse.push(await getBase64(img));
            if (appState.secondaryObjectImage) imagesToUse.push(await getBase64(appState.secondaryObjectImage));
            if (appState.referenceImage) imagesToUse.push(await getBase64(appState.referenceImage));
            if (appState.textEffectImage) imagesToUse.push(await getBase64(appState.textEffectImage));

            // Map aspect ratio to Gemini API format
            const aspectRatioMap: Record<string, string> = {
                '1:1 (Vuông - Instagram)': '1:1',
                '16:9 (Ngang - YouTube)': '16:9',
                '9:16 (Story/Reels)': '9:16',
                '4:5 (Dọc - Instagram Post)': '4:5',
                '5:4 (Ngang - Instagram)': '5:4',
                '4:3 (Ngang chuẩn)': '4:3',
                '3:4 (Dọc chuẩn)': '3:4',
                '3:2 (Poster ngang)': '3:2',
                '2:3 (Poster dọc)': '2:3',
            };
            const selectedAspectRatio = appState.options.aspectRatio || 'Giữ nguyên theo ảnh tham khảo';
            const geminiAspectRatio = aspectRatioMap[selectedAspectRatio] || undefined;

            console.log('[PosterCreator] Selected aspect ratio:', selectedAspectRatio);
            console.log('[PosterCreator] Mapped to Gemini format:', geminiAspectRatio);
            console.log('[PosterCreator] ✅ About to create promises, imageCount:', imageCount);

            // Create an array of promises for parallel execution
            const generationPromises = Array.from({ length: imageCount }).map(async (_, index) => {
                try {
                    // Generate with aspect ratio parameter (undefined is OK - means no constraint)
                    const resultBase64 = await generateStyledImage(
                        prompt,
                        imagesToUse,
                        `Style: ${selectedStyle} - Variation ${index}`,
                        geminiAspectRatio // Pass aspect ratio to API (undefined = no constraint)
                    );

                    let imageUrlForDisplay = '';

                    // Upload / Process Result
                    // Upload / Process Result
                    try {
                        // Use context method to ensure sync with Global Gallery State + DB + Cloudinary
                        // This handles both User and Guest flows internally
                        const savedUrls = await addImagesToGallery([resultBase64]);

                        if (savedUrls && savedUrls.length > 0) {
                            imageUrlForDisplay = savedUrls[0];
                        } else {
                            // Fallback if save returned nothing (shouldn't happen usually)
                            const blob = await dataURLtoBlob(resultBase64);
                            imageUrlForDisplay = URL.createObjectURL(blob);
                            generatedBlobUrlsRef.current.push(imageUrlForDisplay);
                        }
                    } catch (uploadErr) {
                        console.error("Cloud upload/save failed, falling back to local blob:", uploadErr);
                        const blob = await dataURLtoBlob(resultBase64);
                        imageUrlForDisplay = URL.createObjectURL(blob);
                        generatedBlobUrlsRef.current.push(imageUrlForDisplay);
                    }

                    try {
                        const preGenState = { ...appState, selectedStyle };
                        logGeneration('poster-creator', preGenState, imageUrlForDisplay, {
                            credits_used: creditCostPerImage,
                            generation_count: 1,
                            api_model_used: modelVersion === 'v3' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image'
                        });
                    } catch (e) {
                        console.error("Failed to log generation", e);
                    }

                    // UPDATE STATE IMMEDIATELY upon completion of THIS image
                    setDisplayImages(prev => [...prev, imageUrlForDisplay]);

                } catch (err) {
                    console.error(`❌ [PosterCreator] Error generating image ${index + 1}:`, err);
                    console.error('[PosterCreator] Error details:', {
                        message: err instanceof Error ? err.message : String(err),
                        stack: err instanceof Error ? err.stack : undefined,
                        imageCount: imagesToUse.length,
                        promptLength: prompt.length,
                        aspectRatio: geminiAspectRatio
                    });

                    // Show error to user
                    toast.error(`Lỗi khi tạo ảnh ${index + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`, {
                        duration: 5000
                    });
                } finally {
                    // Decrement pending count regardless of success/failure
                    setPendingImageSlots(prev => Math.max(0, prev - 1));
                }
            });

            // Await all to ensure function doesn't exit early (though state updates happen generally)
            await Promise.all(generationPromises);
            console.log("All parallel generations completed.");

            // Reset generating flag
            setIsGenerating(false);

        } catch (error) {
            console.error('Fatal error in generation setup:', error);
            onStateChange({ ...appState, error: 'Failed to start generation.' });
            setPendingImageSlots(0);

            // Reset generating flag on error
            setIsGenerating(false);
        }
    };


    const handleDownloadAll = () => {
        const inputImages: ImageForZip[] = appState.productImages.map((url, i) => ({
            url,
            filename: `product-${i + 1}`,
            folder: 'input',
        }));

        processAndDownloadAll({
            inputImages,
            historicalImages: displayImages, // Use displayImages from IndexedDB
            videoTasks,
            zipFilename: 'ket-qua-poster.zip',
            baseOutputFilename: 'poster',
        });
    };

    const isLoading = appState.stage === 'generating';
    const canGenerate = appState.productImages.length > 0;
    const hasResults = displayImages.length > 0 || pendingImageSlots > 0;
    const [showOptions, setShowOptions] = useState(!hasResults);

    useEffect(() => {
        if (hasResults) setShowOptions(false);
    }, [hasResults]);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-0">
            <AnimatePresence>
                {!isLoading && (<AppScreenHeader {...headerProps} />)}
            </AnimatePresence>

            <div className="flex flex-col items-center w-full flex-1 px-4 ">
                <motion.div
                    className="flex flex-col items-center gap-6 w-full max-w-7xl py-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Image Upload Section - 2x2 Grid on Mobile */}
                    {!isLoading && (
                        <div className="w-full max-w-4xl px-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {/* Product Image */}
                                <div className="themed-card backdrop-blur-md p-0 md:p-2 pb-2 rounded-2xl flex flex-col items-center gap-2">
                                    <ActionablePolaroidCard
                                        type={appState.productImages.length > 0 ? 'content-input' : 'uploader'}
                                        status="done"
                                        mediaUrl={appState.productImages[0] ?? undefined}
                                        caption={appState.productImages.length > 0 ? 'Sản phẩm' : 'Tải ảnh lên'}
                                        placeholderType="clothing"
                                        onImageChange={(imageDataUrl) => {
                                            if (imageDataUrl) {
                                                onStateChange({
                                                    ...appState,
                                                    stage: 'configuring',
                                                    productImages: [imageDataUrl],
                                                    error: null,
                                                });
                                                // REMOVED: addImagesToGallery([imageDataUrl]); - We only save AI generated images now
                                            } else {
                                                onStateChange({
                                                    ...appState,
                                                    productImages: [],
                                                });
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-yellow-400 text-center font-bold">
                                        {t('posterCreator_productImagesLabel') || 'Ảnh sản phẩm'}
                                    </p>
                                </div>

                                {/* Secondary Object Image */}
                                <div className="themed-card backdrop-blur-md rounded-2xl p-0 md:p-2 pb-2 flex flex-col items-center gap-2">
                                    <ActionablePolaroidCard
                                        type={appState.secondaryObjectImage ? 'content-input' : 'uploader'}
                                        status="done"
                                        mediaUrl={appState.secondaryObjectImage ?? undefined}
                                        caption={t('posterCreator_secondaryObjectLabel') || 'Ảnh vật thể phụ'}
                                        onImageChange={(url) => onStateChange({ ...appState, secondaryObjectImage: url })}
                                        placeholderType="architecture"
                                    />
                                    <p className="text-xs text-neutral-400 text-center">
                                        {t('posterCreator_secondaryObjectDesc') || 'Vật thể phụ (tùy chọn)'}
                                    </p>
                                </div>

                                {/* Reference Image */}
                                <div className="themed-card backdrop-blur-md rounded-2xl p-0 md:p-2 pb-2 flex flex-col items-center gap-2">
                                    <ActionablePolaroidCard
                                        type={appState.referenceImage ? 'content-input' : 'uploader'}
                                        status="done"
                                        mediaUrl={appState.referenceImage ?? undefined}
                                        caption={t('posterCreator_referenceImageLabel') || 'Ảnh tham khảo bố cục'}
                                        onImageChange={(url) => onStateChange({ ...appState, referenceImage: url })}
                                        placeholderType="architecture"
                                    />
                                    <p className="text-xs text-neutral-400 text-center">
                                        {t('posterCreator_referenceImageDesc') || 'Bố cục tham khảo'}
                                    </p>
                                </div>

                                {/* Text Effect Image */}
                                <div className="themed-card backdrop-blur-md rounded-2xl p-0 md:p-2 pb-2 flex flex-col items-center gap-2">
                                    <ActionablePolaroidCard
                                        type={appState.textEffectImage ? 'content-input' : 'uploader'}
                                        status="done"
                                        mediaUrl={appState.textEffectImage ?? undefined}
                                        caption={t('posterCreator_textEffectLabel') || 'Ảnh hiệu ứng chữ'}
                                        onImageChange={(url) => onStateChange({ ...appState, textEffectImage: url })}
                                        placeholderType="architecture"
                                    />
                                    <p className="text-xs text-neutral-400 text-center">
                                        {t('posterCreator_textEffectDesc') || 'Font chữ mẫu'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <motion.div className="flex flex-col items-center justify-center gap-4 py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                            <p className="text-neutral-300">{t('common_processing') || 'Đang tạo poster...'}</p>
                            <button
                                onClick={() => onStateChange({ ...appState, stage: 'configuring', error: null })}
                                className="mt-4 px-6 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm"
                            >
                                {t('common_cancel') || 'Hủy'}
                            </button>
                        </motion.div>
                    )}

                    {/* Results Section */}
                    {!isLoading && (appState.error || hasResults) && (
                        <div className="w-full max-w-4xl" ref={resultsRef}>
                            <div className="themed-card backdrop-blur-md rounded-2xl p-4 md:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="base-font font-bold text-xl text-yellow-400">{t('common_result') || 'Kết quả'}</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowOptions(!showOptions)} className="px-4 py-2 bg-yellow-400/20 text-yellow-400 border border-yellow-400/50 rounded-full hover:bg-yellow-400/30 transition-colors text-sm">
                                            {showOptions ? (t('posterCreator_hideOptions') || 'Ẩn tùy chọn') : (t('posterCreator_editOptions') || 'Sửa tùy chọn')}
                                        </button>
                                        <button
                                            onClick={() => {
                                                // Clear local state first
                                                setDisplayImages([]);
                                                setPendingImageSlots(0);
                                                generatedBlobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
                                                generatedBlobUrlsRef.current = [];
                                                // Then call parent reset
                                                onReset();
                                            }}
                                            className="px-4 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm"
                                        >
                                            {t('common_startOver') || 'Bắt đầu lại'}
                                        </button>
                                    </div>
                                </div>

                                {appState.error && (
                                    <div className="w-full p-4 mb-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-center">
                                        {appState.error}
                                    </div>
                                )}

                                {(displayImages.length > 0 || pendingImageSlots > 0) && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                                        {/* Show completed images from IndexedDB */}
                                        {displayImages.map((imgUrl, index) => (
                                            <ActionablePolaroidCard
                                                key={`display-${index}`}
                                                type="output"
                                                status="done"
                                                mediaUrl={imgUrl}
                                                caption={`${t('common_result') || 'Kết quả'} ${index + 1}`}
                                                onClick={() => openLightbox(appState.productImages.length + index)}
                                                onGenerateVideoFromPrompt={(prompt) => generateVideo(imgUrl, prompt)}
                                            />
                                        ))}
                                        {/* Show loading cards for pending images */}
                                        {Array.from({ length: pendingImageSlots }).map((_, index) => (
                                            <div
                                                key={`pending-${index}`}
                                                className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border-2 border-yellow-400/40 flex flex-col items-center justify-center gap-4"
                                            >
                                                {/* Spinning loader */}
                                                <div className="relative">
                                                    <div className="w-16 h-16 rounded-full border-4 border-neutral-700" />
                                                    <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-yellow-400 border-r-yellow-400 animate-spin" />
                                                </div>

                                                <div className="text-center">
                                                    <p className="text-yellow-400 font-bold text-sm">
                                                        {t('common_creating') || 'Đang tạo...'}
                                                    </p>
                                                    <p className="text-neutral-400 text-xs mt-1">
                                                        Ảnh {displayImages.length + index + 1}/{displayImages.length + pendingImageSlots}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {displayImages.length > 0 && pendingImageSlots === 0 && (
                                    <div className="flex gap-4 flex-wrap justify-center pt-4 border-t border-neutral-700">
                                        <button onClick={handleDownloadAll} className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-400 transition-colors">
                                            {t('common_downloadAll') || 'Tải về tất cả'}
                                        </button>
                                        <button onClick={executeInitialGeneration} disabled={!canGenerate} className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-full hover:from-yellow-300 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                            {t('posterCreator_generateMore') || 'Tạo thêm'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Options Panel */}
                    <AnimatePresence>
                        {!isLoading && (showOptions || !hasResults) && (
                            <motion.div className="w-full max-w-4xl" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                                <div className="themed-card backdrop-blur-md rounded-2xl p-4 md:p-6">
                                    <h2 className="base-font font-bold text-2xl text-yellow-400 border-b border-yellow-400/20 pb-2 mb-4">
                                        {t('posterCreator_optionsTitle') || 'Tùy chọn Poster'}
                                    </h2>

                                    {/* ===== BASIC OPTIONS (Always Visible) ===== */}

                                    {/* Domain Selector */}
                                    <div className="mb-4">
                                        <SearchableSelect
                                            id="domain"
                                            label={t('posterCreator_domainLabel') || 'Lĩnh vực / Chủ đề'}
                                            options={DOMAIN_OPTIONS}
                                            value={appState.options.domain || 'Tự do sáng tạo'}
                                            onChange={(val) => handleOptionChange('domain', val)}
                                            placeholder={t('common_select') || 'Chọn lĩnh vực...'}
                                        />
                                    </div>

                                    {/* Product Description */}
                                    <div className="mb-4">
                                        <label className="block text-neutral-200 font-bold mb-2">
                                            {t('posterCreator_productDescription') || 'Mô tả sản phẩm (tùy chọn)'}
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full bg-neutral-800/50 text-neutral-200 rounded-xl p-3 border border-neutral-700 focus:border-yellow-400 focus:outline-none"
                                            placeholder={t('posterCreator_productPlaceholder') || 'VD: Chai nước hoa hồng, Lon nước ngọt...'}
                                            value={productDescription}
                                            onChange={(e) => setProductDescription(e.target.value)}
                                        />
                                    </div>

                                    {/* Environment Description */}
                                    <div className="mb-4">
                                        <label className="block text-neutral-200 font-bold mb-2">
                                            {t('posterCreator_environmentDescLabel') || 'Mô tả vật xung quanh (tùy chọn)'}
                                        </label>
                                        <textarea
                                            className="w-full h-20 bg-neutral-800/50 text-neutral-200 rounded-xl p-3 border border-neutral-700 focus:border-yellow-400 focus:outline-none resize-none"
                                            placeholder={t('posterCreator_environmentPlaceholder') || 'VD: Lá bạc hà, chanh, đá lạnh...'}
                                            value={localEnvDesc}
                                            onChange={(e) => setLocalEnvDesc(e.target.value)}
                                            onBlur={() => handleOptionChange('environmentDescription', localEnvDesc)}
                                        />
                                    </div>

                                    {/* Text Toggle and Inputs */}
                                    <div className="mb-4 bg-neutral-800/30 rounded-xl">
                                        <div className="flex items-center gap-3 mb-4">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={appState.options.includeText}
                                                    onChange={(e) => handleOptionChange('includeText', e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-neutral-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                                            </label>
                                            <span className="text-neutral-200 font-bold">
                                                {t('posterCreator_includeText') || 'Thêm tiêu đề'}
                                            </span>
                                        </div>

                                        {appState.options.includeText && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-neutral-300 text-sm mb-1">{t('posterCreator_headline') || 'Tiêu đề chính'}</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-neutral-800/50 text-neutral-200 rounded-lg p-2 border border-neutral-700 focus:border-yellow-400 focus:outline-none text-sm"
                                                        placeholder="VD: SALE 50%"
                                                        value={localHeadline}
                                                        onChange={(e) => setLocalHeadline(e.target.value)}
                                                        onBlur={() => handleOptionChange('headline', localHeadline)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-neutral-300 text-sm mb-1">{t('posterCreator_subheadline') || 'Tiêu đề phụ'}</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-neutral-800/50 text-neutral-200 rounded-lg p-2 border border-neutral-700 focus:border-yellow-400 focus:outline-none text-sm"
                                                        placeholder="VD: Ưu đãi có hạn"
                                                        value={localSubheadline}
                                                        onChange={(e) => setLocalSubheadline(e.target.value)}
                                                        onBlur={() => handleOptionChange('subheadline', localSubheadline)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-neutral-300 text-sm mb-1">{t('posterCreator_callToAction') || 'Lời kêu gọi'}</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-neutral-800/50 text-neutral-200 rounded-lg p-2 border border-neutral-700 focus:border-yellow-400 focus:outline-none text-sm"
                                                        placeholder="VD: Mua ngay!"
                                                        value={localCTA}
                                                        onChange={(e) => setLocalCTA(e.target.value)}
                                                        onBlur={() => handleOptionChange('callToAction', localCTA)}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Aspect Ratio */}
                                    <div className="mb-4">
                                        <SearchableSelect id="aspectRatio" label={t('common_aspectRatio') || 'Tỷ lệ khung ảnh'} options={ASPECT_RATIO_OPTIONS} value={appState.options.aspectRatio || ''} onChange={(val) => handleOptionChange('aspectRatio', val)} placeholder={t('common_select') || 'Chọn...'} />
                                        {appState.options.aspectRatio && appState.options.aspectRatio !== 'Giữ nguyên theo ảnh tham khảo' && modelVersion !== 'v3' && (
                                            <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                                                <span>⚠️</span>
                                                <span>Tỷ lệ khung ảnh chỉ hoạt động với Model v3. Vui lòng chuyển sang v3 trong Settings.</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Image Count Selector */}
                                    <div className="mb-4">
                                        <label className="block text-neutral-200 font-bold mb-2">
                                            {t('posterCreator_imageCount') || 'Số lượng ảnh tạo'}
                                        </label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[1, 2, 3, 4].map((count) => (
                                                <button
                                                    key={count}
                                                    type="button"
                                                    className={`py-2 px-3 rounded-lg font-semibold transition-all ${(appState.options.imageCount || 1) === count
                                                        ? 'bg-yellow-400 text-black shadow-lg'
                                                        : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                                                        }`}
                                                    onClick={() => handleOptionChange('imageCount', count)}
                                                >
                                                    {count}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ===== ADVANCED OPTIONS (Toggle) ===== */}
                                    <div className="border-t border-neutral-700 pt-4 mt-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={showAdvancedOptions}
                                                    onChange={(e) => {
                                                        setShowAdvancedOptions(e.target.checked);
                                                        handleOptionChange('enableAdvancedStyling', e.target.checked);
                                                    }}
                                                />
                                                <div className="w-11 h-6 bg-neutral-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                                            </label>
                                            <span className="text-neutral-200 font-bold">
                                                ⚙️ {t('posterCreator_advancedOptions') || 'Tùy chọn chuyên sâu'}
                                            </span>
                                        </div>

                                        <AnimatePresence>
                                            {showAdvancedOptions && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="mt-4 space-y-4"
                                                >
                                                    {/* Style Presets */}
                                                    <div>
                                                        <label className="block text-neutral-200 font-bold mb-2">
                                                            {t('posterCreator_stylePreset') || 'Phong cách quảng cáo'}
                                                        </label>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                            {(Object.entries(STYLE_PRESETS) as [StylePresetKey, StylePreset][]).map(([key, preset]) => (
                                                                <button
                                                                    key={key}
                                                                    onClick={() => setSelectedStyle(key)}
                                                                    className={`p-3 rounded-xl text-left border transition-all ${selectedStyle === key
                                                                        ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400'
                                                                        : 'bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:border-neutral-500'
                                                                        }`}
                                                                >
                                                                    <div className="font-bold text-sm">{preset.name}</div>
                                                                    <div className="text-xs opacity-75 mt-1">{preset.description}</div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Additional Options Grid */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        <SearchableSelect id="posterType" label={t('posterCreator_posterType') || 'Loại poster'} options={POSTER_TYPES} value={appState.options.posterType || ''} onChange={(val) => handleOptionChange('posterType', val)} placeholder={t('common_select') || 'Chọn...'} />
                                                        <SearchableSelect id="backgroundStyle" label={t('posterCreator_backgroundStyle') || 'Kiểu nền'} options={BACKGROUND_STYLES} value={appState.options.backgroundStyle || ''} onChange={(val) => handleOptionChange('backgroundStyle', val)} placeholder={t('common_select') || 'Chọn...'} />
                                                        <SearchableSelect id="lightingStyle" label={t('posterCreator_lightingStyle') || 'Kiểu ánh sáng'} options={LIGHTING_STYLES} value={appState.options.lightingStyle || ''} onChange={(val) => handleOptionChange('lightingStyle', val)} placeholder={t('common_select') || 'Chọn...'} />
                                                        <SearchableSelect id="productAngle" label={t('posterCreator_productAngle') || 'Góc sản phẩm'} options={PRODUCT_ANGLES} value={appState.options.productAngle || ''} onChange={(val) => handleOptionChange('productAngle', val)} placeholder={t('common_select') || 'Chọn...'} />
                                                    </div>

                                                    {/* Additional Notes */}
                                                    <div>
                                                        <label className="block text-neutral-200 font-bold mb-2">
                                                            {t('common_additionalNotesOptional') || 'Ghi chú bổ sung (tùy chọn)'}
                                                        </label>
                                                        <textarea
                                                            className="w-full h-20 bg-neutral-800/50 text-neutral-200 rounded-xl p-3 border border-neutral-700 focus:border-yellow-400 focus:outline-none resize-none"
                                                            placeholder={t('posterCreator_notesPlaceholder') || 'VD: Thêm logo ở góc phải...'}
                                                            value={localNotes}
                                                            onChange={(e) => setLocalNotes(e.target.value)}
                                                            onBlur={() => handleOptionChange('notes', localNotes)}
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Generate Button */}
                                    <div className="mt-6 flex justify-center">
                                        <button
                                            onClick={executeInitialGeneration}
                                            disabled={!canGenerate || isLoading}
                                            className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-full hover:from-yellow-300 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {hasResults ? (t('posterCreator_generateMore') || 'Tạo thêm') : (t('posterCreator_generate') || 'Tạo Poster')}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            <Lightbox
                images={lightboxImages}
                selectedIndex={lightboxIndex}
                onClose={closeLightbox}
                onNavigate={navigateLightbox}
            />
        </div>
    );
};

export default PosterCreator;
