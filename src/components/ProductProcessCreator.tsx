/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ChangeEvent, useCallback, useEffect, useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import Lightbox from './Lightbox';
import {
    AppScreenHeader,
    handleFileUpload,
    useLightbox,
    useAppControls,
    dataURLtoBlob,
} from './uiUtils';
import { generateProductProcessImage } from '../services/gemini/productProcessCreatorService';
import { embedJsonInPng } from './uiFileUtilities';
import { PosterCreatorState } from './uiTypes';
import { ImageUploadGrid, UploadSlot } from './upload';
import SearchableSelect from './SearchableSelect';
import { processApiError } from '@/services/gemini/baseService';

// --- STYLES ---
const PROCESS_STYLES: Record<string, string> = {
    'Mô hình 3D (Diorama)': '3D CUTE BLENDER RENDER, isometric view, soft lighting, pastel colors, clay texture, clean background, highly detailed miniature world',
    'Siêu thực & Ấn tượng': 'Surreal cinematic composition, floating ingredients seamlessly transforming into the product, dramatic steam and smoke, magical lighting, hyper-realistic food photography, 8k resolution, rich colors, advertising masterpiece',
    'Nhà máy Thực tế': 'Realistic industrial photography, stainless steel machinery, clean factory environment, professional lighting, 4k detail',
    'Bản vẽ Kỹ thuật': 'Technical sketch style, blueprint aesthetic, white lines on blue background, architectural drawing style',
    'Minh họa Phẳng (Vector)': 'Modern flat vector illustration, corporate memphis style, vibrant solid colors, simple shapes',
    'Phép thuật / Kỳ ảo': 'Magical fantasy style, floating elements, glowing particles, whimsical atmosphere, dreamlike lighting',
    'Thiên nhiên / Organic': 'Organic nature style, wooden machinery, green leaves, natural sunlight, sustainable aesthetic',
    'Sang trọng & Vàng kim': 'Luxury product photography, splashes of gold liquid, black marble background, dramatic lighting, premium elegant feel',
    'Cyberpunk Neo': 'Futuristic cyberpunk style, neon lights, high-tech machinery, holographic elements, dark atmosphere with vibrant blue and pink accents',
};

const ASPECT_RATIO_OPTIONS = [
    '16:9 (Ngang - Mặc định)',
    '1:1 (Vuông)',
    '3:4 (Dọc)',
    '2:3 (Dọc - Poster)',
    '4:5 (Dọc - Instagram)'
];

interface ProductProcessCreatorProps {
    appState: PosterCreatorState;
    onStateChange: (newState: PosterCreatorState) => void;
    onReset: () => void;
    onGoBack: () => void;
    logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: any) => void;
    addImagesToGallery: (images: string[]) => Promise<string[] | undefined>;
}

const ProductProcessCreator: React.FC<ProductProcessCreatorProps> = (props) => {
    const {
        appState, onStateChange, onReset,
        logGeneration, addImagesToGallery,
        onGoBack
    } = props;

    const { t, checkCredits, user: currentUser, modelVersion } = useAppControls();
    const { lightboxIndex, openLightbox, closeLightbox, navigateLightbox } = useLightbox();

    // Local state
    const [creationMode, setCreationMode] = useState<'process' | 'analysis'>('process');
    const [selectedStyle, setSelectedStyle] = useState<string>('Mô hình 3D (Diorama)');
    const [selectedAnalysisType, setSelectedAnalysisType] = useState<string>('Phân tích Nguyên liệu (Infographic)');
    const [notes, setNotes] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [displayImages, setDisplayImages] = useState<string[]>([]);
    const [aspectRatio, setAspectRatio] = useState<string>('16:9 (Ngang - Mặc định)');

    const generatedBlobUrlsRef = React.useRef<string[]>([]);

    useEffect(() => {
        return () => {
            generatedBlobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    const lightboxImages = useMemo(() => {
        return [...(appState.productImages || []), ...displayImages].filter(Boolean);
    }, [appState.productImages, displayImages]);

    // --- TEMPLATES ---
    const ANALYSIS_TEMPLATES: Record<string, string> = {
        'Phân tích Nguyên liệu (Infographic)': `PROMPT: dành cho các nguyên liệu\n\n[INPUT IMAGE]\n\nSubject: [TÊN ĐỐI TƯỢNG]\n\nCreate a clean, modern, premium food infographic explaining\nwhich parts of [TÊN ĐỐI TƯỢNG] are good to eat, limited, or not recommended.\n\nOVERALL STYLE:\nMinimal, bright, professional.\nHigh-end food & beverage infographic style.\nEasy to understand at first glance.\n\nMAIN VISUAL:\nA fresh, high-quality [TÊN ĐỐI TƯỢNG] placed at the center.\n3/4 view or natural angle.\nSurface looks fresh, glossy, appetizing.\nSemi-transparent cutaway style to hint internal structure,\neducational but friendly, not medical, not disturbing.\n\nANNOTATION SYSTEM:\nEach body part is connected using:\n– thin curved arrows\n– rounded cards\n– small clean icons\n\nClear color-coded evaluation:\n🟢 Green = good / recommended\n🟡 Yellow = edible but should limit\n🔴 Red = not recommended\n\nCONTENT CARDS (auto-adapt logically to subject):\n\n🟢 MAIN EDIBLE PART (GOOD – RECOMMENDED)\n– Natural taste\n– High nutritional value\n– Suitable for most dishes\n\n🟢 SPECIAL PART (VERY GOOD – NUTRITIOUS) (if applicable)\n– Rich flavor or nutrients\n– Considered a delicacy\n\n🟡 CONDITIONAL PART (EDIBLE – LIMIT)\n– Can be eaten\n– Should not consume too much\n– Possible accumulation or heaviness\n\n🔴 WASTE / INTERNAL PART (NOT RECOMMENDED)\n– Contains waste or impurities\n– Should be removed before cooking\n\n🟡 NON-CULINARY PART (NOT FOR EATING)\n– No culinary value\n– Used only for stock or should be discarded\n\nTYPOGRAPHY:\nLarge clear title at top:\n“[TÊN ĐỐI TƯỢNG] – PHẦN NÀO NGON & NÊN ĂN?”\n\nSubtitle:\n“Infographic trực quan – dễ hiểu”\n\nSans-serif modern font.\nClear hierarchy: title → section → bullet points.\n\nCOLOR & LIGHT:\nWhite or very light gray background.\nSoft studio lighting.\nGentle shadows.\nNatural food colors.\nNo harsh contrast.\n\nMOOD:\nEducational but premium.\nFriendly, trustworthy.\nLooks suitable for:\n– food brands\n– nutrition education\n– social media sharing\n– restaurants & supermarkets\n\nRESTRICTIONS:\nNo gore.\nNo medical anatomy.\nNo scary visuals.\nNo clutter.\nNo watermark.`,
        'Phân tích Đồ uống (Menu/Ads)': `PROMPT: dành cho các đồ uống \n[INPUT IMAGE]\n\nDrink name: [TÊN ĐỒ UỐNG]\n\nCreate a modern, premium drink infographic in the style of high-end juice / beverage branding.\n\nOVERALL STYLE:\nClean, fresh, minimal, lifestyle-oriented.\nLooks suitable for cafés, beverage brands, menus, and social media.\nCombination of realistic drink photography and modern infographic UI.\n\nMAIN VISUAL:\nA glass of [TÊN ĐỒ UỐNG] placed at the center.\n3/4 view or slightly top-down angle.\nTransparent glass, visible liquid color.\nIce cubes inside if applicable.\nDrink looks cold, refreshing, and premium.\n\nINGREDIENT LAYOUT:\nIngredients float gently around the glass in a circular or radial composition.\nEach ingredient is cleanly separated, well-lit, and appetizing.\n\nTypical elements (auto-adapt by drink type):\n– Fresh fruit (sliced or whole)\n– Tea / coffee / base liquid\n– Citrus slices\n– Herbs (mint, basil, etc.)\n– Ice cubes\n– Liquid drops or syrup drips\n\nCurved arrows subtly indicate the preparation flow.\nNo rigid steps, just a smooth visual process.\n\nINFO CARDS:\nRounded cards with soft shadows.\nSmall, clean icons.\nClear text hierarchy.\n\nTypical cards (auto-adapt):\n– Select Fresh Ingredients\n– Brew / Prepare Base\n– Slice & Mix\n– Serve with Ice / Chill & Enjoy\n\nBOTTOM INFO BADGES (pill style):\n– Serving temperature (e.g. 4–8°C)\n– Freshness level\n– Flavor profile\n– Serving style (cold / hot)\n\nTYPOGRAPHY:\nModern sans-serif font.\nLarge clear title at top:\n“[TÊN ĐỒ UỐNG]”\nMedium subtitles.\nSmall supporting text.\nClean spacing, easy to read.\n\nCOLOR & LIGHT:\nBright background (white or very light gray).\nSoft studio lighting.\nNatural shadows.\nFresh, vibrant but controlled colors.\nNo harsh contrast.\n\nMOOD:\nFresh.\nTrendy.\nPremium.\nSocial-media-ready.\nLifestyle-focused.\n\nRESTRICTIONS:\nNo people.\nNo clutter.\nNo excessive text.\nNo watermark.\nNo cartoon style.`,
        'Phân tích Món ăn (Recipe)': `PROMPT: dành cho các sản phẩm món ăn\n[INPUT IMAGE]\n\nDish name: [TÊN MÓN ĂN]\n\nCreate a modern, premium cooking recipe infographic\ncombining editorial food photography and clean infographic design.\n\nOVERALL STYLE:\nClean, elegant, high-end.\nLooks like a premium food magazine or modern cooking app.\nBalanced between visual appeal and clear information.\n\nHERO VISUAL:\nThe finished dish of [TÊN MÓN ĂN] is placed at the center.\n3/4 view or slight perspective angle (not strict top-down).\nFood looks freshly cooked, appetizing, well-arranged.\nSubtle floating or lifted presentation is acceptable.\nNatural textures, realistic colors.\n\nINGREDIENT SECTION:\nIngredients are arranged around the dish in grouped clusters.\nEach ingredient uses:\n– small clean icon or mini illustration\n– name + quantity\n\nLayout options:\n– vertical list\n– circular cluster\n– modular cards\nVisually connected to the main dish.\n\nCOOKING STEPS SECTION:\nSteps are illustrated using numbered cards or rounded panels.\nConnected by arrows or curved paths that flow around the dish.\nEach step includes:\n– short action text\n– cooking icon (knife, pan, grill, rice cooker, clock, fire)\n\nTypical steps auto-adapt by dish:\n1. Prepare / Marinate\n2. Cook base (rice, noodles, dough, etc.)\n3. Main cooking method (grill, fry, boil, bake)\n4. Assemble & serve\n\nINFO BADGES (optional, compact bubbles):\n– Calories per serving\n– Prep time\n– Cook time\n– Servings\n– Flavor profile (savory, mild, spicy, etc.)\n\nPlaced subtly near the hero dish.\n\nTYPOGRAPHY:\nModern sans-serif font.\nClear hierarchy:\n– Large title\n– Medium section headers\n– Small body text\nReadable at social media size.\n\nCOLOR & LIGHT:\nSoft studio lighting.\nGentle shadows.\nNatural food colors.\nLight background or subtle editorial gradient.\nAccent color used for important info (time, calories).\n\nLAYOUT PRINCIPLES:\nDish is the hero.\nSteps flow around naturally.\nIngredients support visually.\nPlenty of negative space.\nClean, airy, easy to scan.\n\nMOOD:\nPremium.\nFriendly.\nTrustworthy.\nPerfect for:\n– recipe posts\n– cooking guides\n– food brands\n– restaurant content.\n\nRESTRICTIONS:\nNo watermark.\nNo messy layout.\nNo childish illustration.\nNo low-quality food look.`,
        'Phân tích Dinh dưỡng (Nutrition)': `PROMPT: dành cho phân tích dinh dưỡng\n[INPUT IMAGE]\n\nSubject: [TÊN ĐỐI TƯỢNG]\n\nCreate a sophisticated, health-focused Nutrition Infographic for [TÊN ĐỐI TƯỢNG].\n\nOVERALL STYLE:\nClean, scientific yet approachable, wellness-oriented.\nWhite background with soft pastel accents (green, blue, orange).\n\nHERO VISUAL:\nThe product [TÊN ĐỐI TƯỢNG] is isolated in the center, looking fresh and organic.\nSurrounded by floating infographic rings or data points.\n\nDATA VISUALIZATION:\nVisualize key nutrients (Vitamins, Protein, Fiber) using:\n– Sleek circular progress bars\n– Minimum typography\n– Floating percentage tags (e.g., "Vit C: 90%")\n\nHEALTH BENEFITS:\n3-4 key benefits listed with custom icons (e.g., Heart Health, Energy, Skin Care).\nShort, punchy descriptions.\n\nMOOD:\nHealthy, informative, trustworthy, scientific but beautiful.\n\nRESTRICTIONS:\nNo cluttered text blocks. No medical gore. No scary warnings.`,
        'Gợi ý Kết hợp (Food Pairing)': `PROMPT: dành cho gợi ý kết hợp món ăn\n[INPUT IMAGE]\n\nSubject: [TÊN ĐỐI TƯỢNG]\n\nCreate a "Perfect Pairing" Guide Visual for [TÊN ĐỐI TƯỢNG].\n\nOVERALL STYLE:\nEditorial food photography with overlay text. Elegant, warm, inviting.\n\nCOMPOSITION:\n[TÊN ĐỐI TƯỢNG] is the main focus.\nSurrounded by 2-3 compatible food/drink items (e.g., if Wine -> Cheese, Grapes; if Coffee -> Croissant).\nThe pairing items should overlap slightly or be arranged artistically around the subject.\n\nTEXT ELEMENTS:\nElegant serif font labels connecting the items.\n"Best served with..." or "Perfect Match" header.\n\nMOOD:\nCulinary excellence, fine dining, cozy atmosphere.\n\nRESTRICTIONS:\nNo messy scatter. No chaotic placement. Keep it organized and stylish.`
    };

    const handleGenerate = async () => {
        if (!appState.productImages?.[0]) {
            toast.error('Vui lòng tải lên ảnh sản phẩm mẫu (kết quả cuối cùng)');
            return;
        }

        if (!await checkCredits()) return;

        setIsGenerating(true);
        toast.loading(creationMode === 'process' ? 'Đang tạo quy trình...' : 'Đang phân tích thành phần...', { id: 'gen-process' });

        try {
            const productImg = appState.productImages[0];
            const ratioShort = aspectRatio ? aspectRatio.split(' ')[0] : '16:9';

            let resultUrl;

            if (creationMode === 'process') {
                resultUrl = await generateProductProcessImage(
                    productImg,
                    selectedStyle, // Style key
                    notes,
                    ratioShort
                );
            } else {
                // Analysis Mode
                const template = ANALYSIS_TEMPLATES[selectedAnalysisType];
                resultUrl = await generateProductProcessImage(
                    productImg,
                    selectedAnalysisType, // Pass type as style name for logging
                    notes,
                    ratioShort,
                    template // Pass the template
                );
            }

            const settingsToEmbed = {
                viewId: 'product-process-creator',
                state: {
                    mode: creationMode,
                    style: creationMode === 'process' ? selectedStyle : selectedAnalysisType,
                    notes
                }
            };

            const urlWithMetadata = await embedJsonInPng(resultUrl, settingsToEmbed, true);

            // ... rest of the function remains same ... update this part manually to close the bracket properly if replace range is tricky
            setDisplayImages(prev => [urlWithMetadata, ...prev]);
            // addImagesToGallery([urlWithMetadata]);
            // logGeneration('product-process-creator', settingsToEmbed, urlWithMetadata, {
            //     credits_used: modelVersion === 'v3' ? 2 : 1,
            //     api_model_used: modelVersion === 'v3' ? 'imagen-3.0' : 'gemini-2.5-flash-image',
            //     input_prompt: creationMode === 'process' ? `Process creation: ${selectedStyle}` : `Analysis: ${selectedAnalysisType}`
            // });

            toast.success('Tạo ảnh thành công!', { id: 'gen-process' });

        } catch (error: any) {
            console.error(error);
            toast.error(`Lỗi: ${error.message}`, { id: 'gen-process' });
        } finally {
            setIsGenerating(false);
        }
    };

    // Prepare slots for ImageUploadGrid
    const uploadSlots: UploadSlot[] = useMemo(() => [
        {
            id: 'product-image',
            image: appState.productImages?.[0] || null,
            caption: 'Ảnh gốc',
            description: 'AI sẽ tự động phân tích sản phẩm và tạo quy trình.',
            placeholderType: 'style'
        }
    ], [appState.productImages]);

    const handleGridImageChange = useCallback((slotId: string, url: string | null) => {
        if (slotId === 'product-image') {
            onStateChange({
                ...appState,
                productImages: url ? [url] : []
            });
        }
    }, [appState, onStateChange]);

    return (
        <div className="flex flex-col h-full text-gray-200 overflow-hidden font-sans">
            {/* HEADER */}
            <div className="flex-none z-50 pt-4 relative mt-10">
                <button
                    onClick={props.onGoBack}
                    className="absolute top-6 left-4 z-50 btn btn-circle btn-ghost text-white hover:bg-orange-500/20"
                    title="Quay lại"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-orange-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <AppScreenHeader
                    mainTitle={t("app_product-process-creator_title") || "Quy trình Sản phẩm"}
                    subtitle={t("app_product-process-creator_description") || "Tạo ảnh minh họa quy trình sản xuất kiểu diorama"}
                    useSmartTitleWrapping={true}
                    smartTitleWrapWords={3}
                />
            </div>

            <div className="flex-grow flex overflow-hidden">
                {/* LEFT SIDEBAR - CONTROLS */}
                <div className="w-full md:w-[400px] flex-none bg-[#1e1e1e] border-r border-[#333] flex flex-col h-full overflow-hidden z-20 shadow-2xl">
                    <div className="flex-grow overflow-y-auto p-5 space-y-6 custom-scrollbar">

                        {/* 1. PRODUCT IMAGE INPUT */}
                        <div className="form-control w-full">
                            <label className="block text-left font-bold text-lg text-orange-500 mb-3 flex items-center gap-2">
                                1. Ảnh sản phẩm
                                <span className="badge badge-sm badge-warning bg-orange-500 border-none text-white">Bắt buộc</span>
                            </label>

                            <ImageUploadGrid
                                slots={uploadSlots}
                                onImageChange={handleGridImageChange}
                                columns={2} // Using 2 columns to keep it not too wide, or we can use !grid-cols-1 if we want full width but contained
                                className="!grid-cols-1" // Force 1 column for this specific single input
                            />
                        </div>

                        {/* ROW: STYLE & RATIO */}
                        <div className="grid grid-cols-1 gap-4">

                            {/* MODE SWITCHER */}
                            <div className="form-control w-full">
                                <label className="block text-left text-orange-500 font-bold mb-2 text-sm">
                                    2. Chế độ tạo
                                </label>
                                <div className="flex bg-[#2a2a2a] p-1 rounded-xl border border-[#444]">
                                    <button
                                        onClick={() => setCreationMode('process')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${creationMode === 'process'
                                            ? 'bg-orange-500 text-white shadow-lg'
                                            : 'text-gray-400 hover:text-gray-200 hover:bg-[#333]'}`}
                                    >
                                        Tạo Quy Trình
                                    </button>
                                    <button
                                        onClick={() => setCreationMode('analysis')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${creationMode === 'analysis'
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'text-gray-400 hover:text-gray-200 hover:bg-[#333]'}`}
                                    >
                                        Phân tích Thành phần
                                    </button>
                                </div>
                            </div>

                            {/* 3. STYLE SELECTION (Dynamic based on Mode) */}
                            {creationMode === 'process' ? (
                                <SearchableSelect
                                    id="style-select"
                                    label="3. Phong cách Quy trình"
                                    options={Object.keys(PROCESS_STYLES)}
                                    value={selectedStyle}
                                    onChange={setSelectedStyle}
                                    placeholder="Chọn phong cách..."
                                />
                            ) : (
                                <SearchableSelect
                                    id="analysis-select"
                                    label="3. Loại Phân tích"
                                    options={Object.keys(ANALYSIS_TEMPLATES)}
                                    value={selectedAnalysisType}
                                    onChange={setSelectedAnalysisType}
                                    placeholder="Chọn loại phân tích..."
                                />
                            )}

                            {/* 4. ASPECT RATIO */}
                            <SearchableSelect
                                id="ratio-select"
                                label="4. Tỷ lệ khung hình"
                                options={ASPECT_RATIO_OPTIONS}
                                value={aspectRatio}
                                onChange={setAspectRatio}
                                placeholder="Chọn tỷ lệ..."
                            />
                        </div>

                        {/* 4. NOTES - 50% WIDTH (Per user request: "ghi chú thêm ô input có 1 nửa") */}
                        <div className="flex flex-wrap">
                            <div className="w-full">
                                <label className="block text-left text-gray-300 font-bold mb-2 text-sm">
                                    5. Ghi chú thêm
                                </label>
                                <textarea
                                    className="w-full bg-[#2a2a2a] text-gray-200 rounded-xl p-3 border border-[#444] focus:border-orange-500 focus:outline-none h-32 text-sm resize-none"
                                    placeholder="Tông màu ấm, thủ công..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                ></textarea>
                                <div className="text-xs text-gray-500 italic">
                                    Mẹo: Hãy mô tả chi tiết màu sắc, không gian hoặc các yếu tố phụ trợ bạn muốn xuất hiện trong quy trình.
                                </div>
                            </div>

                        </div>

                        {/* GENERATE BUTTON */}
                        <div className="pt-4 pb-8">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !appState.productImages?.[0]}
                                className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${isGenerating || !appState.productImages?.[0]
                                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                    : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-orange-500/30'
                                    }`}
                            >
                                {isGenerating ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="loading loading-spinner loading-md"></span>
                                        {creationMode === 'process' ? 'Đang sáng tạo...' : 'Đang phân tích...'}
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        ✨ {creationMode === 'process' ? 'Tạo Quy Trình' : 'Phân tích Thành phần'}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE - PREVIEW */}
                <div className="flex-grow bg-[#0a0a0a] overflow-y-auto p-4 relative">
                    {displayImages.length === 0 && !isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-6">
                            <div className="w-32 h-32 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-[#333]">
                                <span className="text-6xl grayscale opacity-50">🏭</span>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-medium text-gray-400 mb-2">Không gian sáng tạo</p>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                    Tải ảnh sản phẩm và chọn phong cách để bắt đầu hành trình.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {/* Loading Card */}
                            {isGenerating && (
                                <div className="aspect-[16/9] w-full rounded-2xl bg-[#1e1e1e] border-2 border-orange-500/40 flex flex-col items-center justify-center gap-4 animate-pulse relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />

                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-full border-4 border-[#333] border-t-orange-500 animate-spin mb-4" />
                                        <p className="text-orange-500 font-bold text-sm">Đang thiết kế...</p>
                                        <p className="text-gray-500 text-xs mt-1">AI đang phân tích và tạo quy trình</p>
                                    </div>
                                </div>
                            )}

                            {/* Results */}
                            {displayImages.map((imgUrl, index) => (
                                <ActionablePolaroidCard
                                    key={index + imgUrl}
                                    type="output"
                                    caption={`Quy trình ${displayImages.length - index}`}
                                    status="done"
                                    mediaUrl={imgUrl}
                                    onClick={() => openLightbox(appState.productImages?.length ? appState.productImages.length + index : index)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* LIGHTBOX */}
            <Lightbox
                selectedIndex={lightboxIndex}
                onClose={closeLightbox}
                images={lightboxImages}
                onNavigate={navigateLightbox}
            />
        </div>
    );
};

export default ProductProcessCreator;
