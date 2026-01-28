/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { toast } from 'react-hot-toast';
import React, { ChangeEvent, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStudioImage } from '../../services/geminiService';
import ActionablePolaroidCard from '../ActionablePolaroidCard';
import Lightbox from '../Lightbox';
import SearchableSelect from '../SearchableSelect';
import {
    useMediaQuery,
    AppScreenHeader,
    handleFileUpload,
    useLightbox,
    useVideoGeneration,
    useAppControls,
    embedJsonInPng,
    KhmerPhotoMergeState // We can reuse this state or define a new one if needed
} from '../uiUtils';

import { processApiError, GeminiErrorCodes, GeminiError } from '@/services/gemini/baseService';
import { useRouter } from 'next/navigation';

export interface Studio {
    id: string;
    name: string;
    slug: string;
    description: string;
    preview_image_url: string;
    category: string;
    categories?: { name: string };
    prompts: any; // JSONB
}

interface StudioGeneratorProps {
    studio: Studio;
}

const StudioGenerator: React.FC<StudioGeneratorProps> = ({ studio }) => {
    const router = useRouter();
    const { t, settings, checkCredits, modelVersion, handleModelVersionChange, logGeneration, addImagesToGallery, refreshGallery } = useAppControls();
    const { lightboxIndex, openLightbox, closeLightbox, navigateLightbox } = useLightbox();
    const { generateVideo } = useVideoGeneration();
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Parse prompts from studio data
    const TEMPLATES = React.useMemo(() => {
        try {
            return typeof studio.prompts === 'string' ? JSON.parse(studio.prompts) : studio.prompts;
        } catch (e) {
            console.error("Error parsing studio prompts:", e);
            return [];
        }
    }, [studio.prompts]);

    const ASPECT_RATIO_OPTIONS = t('aspectRatioOptions') || ['Giữ nguyên', '1:1', '3:4', '4:3', '16:9'];


    // Intelligent default tab selection
    const defaultTab = React.useMemo(() => {
        // 1. Try to detect from first available prompt
        if (Array.isArray(TEMPLATES) && TEMPLATES.length > 0) {
            const firstGender = TEMPLATES[0].gender;
            if (firstGender && ['male', 'female', 'couple'].includes(firstGender)) {
                return firstGender;
            }
        }
        // 2. Try to detect from category name
        if (studio.categories?.name) {
            const catName = studio.categories.name.toLowerCase();
            if (catName.includes('nam') || catName.includes('male')) return 'male';
            if (catName.includes('cặp') || catName.includes('couple')) return 'couple';
        }
        // 3. Fallback
        return 'female';
    }, [TEMPLATES, studio]);

    // Multi-select state for templates (max 4)
    const [selectedStyleImages, setSelectedStyleImages] = useState<string[]>([]);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [generationErrors, setGenerationErrors] = useState<Record<number, string>>({});

    // Refs to track accumulation during async generation
    const generationResults = React.useRef<string[]>([]);
    const generationErrorsRef = React.useRef<Record<number, string>>({});

    const [appState, setAppState] = useState<KhmerPhotoMergeState>({
        stage: 'idle',
        uploadedImage: null,
        uploadedImage2: null,
        selectedStyleImage: null,
        generatedImage: null,
        error: null,
        historicalImages: [],
        options: {
            customPrompt: '',
            removeWatermark: false,
            aspectRatio: '3:4',
        },
        activeTab: defaultTab as 'female' | 'male' | 'couple'
    });


    // Effect to set default tab if available templates dictate it (optional)
    // For now keep default 'female' or first available gender in templates
    // useEffect(() => { ... }, [TEMPLATES]);


    const lightboxImages = [appState.uploadedImage, ...selectedStyleImages, ...generatedImages].filter((img): img is string => !!img);

    const handleGoBack = () => {
        router.push('/studio');
    };

    const handleReset = () => {
        setSelectedStyleImages([]);
        setGeneratedImages([]);
        setPendingCount(0);
        setGenerationErrors({});
        generationResults.current = [];
        generationErrorsRef.current = {};

        setAppState(prev => ({
            ...prev,
            stage: 'idle',
            uploadedImage: null,
            uploadedImage2: null,
            selectedStyleImage: null,
            generatedImage: null,
            error: null
        }));
    };




    const handleImageSelectedForUploader = (imageDataUrl: string) => {
        setAppState(prev => ({
            ...prev,
            stage: 'configuring',
            uploadedImage: imageDataUrl,
            generatedImage: null,
            error: null,
        }));
    };



    const handleImageUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        handleFileUpload(e, handleImageSelectedForUploader);
    }, []);

    const handleUploadedImageChange = (newUrl: string | null) => {
        setAppState(prev => ({
            ...prev,
            uploadedImage: newUrl,
            stage: newUrl ? 'configuring' : 'idle'
        }));
    };

    const handleImage2Change = (newUrl: string | null) => {
        setAppState(prev => ({
            ...prev,
            uploadedImage2: newUrl,
            stage: (newUrl && prev.uploadedImage) ? 'configuring' : 'idle'
        }));
    };

    const handleStyleSelect = (templateUrl: string) => {
        setSelectedStyleImages(prev => {
            if (prev.includes(templateUrl)) {
                // Deselect if already selected
                return prev.filter(url => url !== templateUrl);
            } else if (prev.length < 4) {
                // Add if under limit
                return [...prev, templateUrl];
            }
            // At limit, don't add
            return prev;
        });
    };

    const handleOptionChange = (field: keyof KhmerPhotoMergeState['options'], value: string | boolean) => {
        setAppState(prev => ({
            ...prev,
            options: { ...prev.options, [field]: value },
        }));
    };

    const handleTabChange = (tab: 'female' | 'male') => {
        setSelectedStyleImages([]); // Clear selection when switching
        setAppState(prev => ({
            ...prev,
            activeTab: tab
        }));
    };

    const handleGenerate = async () => {
        if (!appState.uploadedImage || selectedStyleImages.length === 0) {
            console.warn("Missing inputs - aborting generation");
            return;
        }

        const preGenState = { ...appState };
        const imageCount = selectedStyleImages.length;
        const creditCostPerImage = modelVersion === 'v3' ? 2 : 1;
        const totalCredits = creditCostPerImage * imageCount;

        if (!await checkCredits(totalCredits)) {
            return;
        }

        // Initialize streaming state
        generationResults.current = new Array(imageCount).fill('');
        generationErrorsRef.current = {};
        setGenerationErrors({});

        // Start generating
        setAppState(prev => ({ ...prev, stage: 'generating', error: null }));
        setGeneratedImages(new Array(imageCount).fill('')); // Placeholders
        setPendingCount(imageCount);


        // Generate images in parallel
        const processingPromises = selectedStyleImages.map(async (styleUrl, index) => {
            try {
                const selectedTemplate = TEMPLATES.find((t: any) => t.image_url === styleUrl || t.url === styleUrl);
                const templatePrompt = selectedTemplate ? (selectedTemplate.prompt || selectedTemplate.content) : "Portrait style";

                // Reconstruct the full prompt just for logging purposes (approximation of service logic)
                const fullPrompt = `Style: "${studio.name}"\nScene: "${templatePrompt}"\nRequirements: Photorealistic.${appState.options.customPrompt ? ' ' + appState.options.customPrompt : ''}`;

                const resultUrl = await generateStudioImage(
                    appState.uploadedImage!,
                    studio.name,
                    templatePrompt,
                    appState.options.customPrompt,
                    appState.options.removeWatermark,
                    appState.options.aspectRatio,
                    undefined,
                    'studio-generator'
                );

                const settingsToEmbed = {
                    viewId: 'studio-generator',
                    state: { ...preGenState, stage: 'configuring', generatedImage: null, error: null },
                };
                const finalUrl = await embedJsonInPng(resultUrl, settingsToEmbed, settings.enableImageMetadata);

                // Synch gallery (Server already saved it to DB)
                let displayUrl = finalUrl;
                try {
                    await refreshGallery();
                } catch (e) {
                    console.error("Failed to refresh gallery:", e);
                }

                // Update refs
                generationResults.current[index] = displayUrl;

                // Update UI immediately (streaming)
                // We create a new array to trigger re-render, ensuring we keep preserve the whole array structure
                setGeneratedImages([...generationResults.current]);

                return { url: displayUrl, prompt: fullPrompt };
            } catch (err) {
                console.error("Generation failed for style:", styleUrl, err);
                const errorMessage = err instanceof Error ? err.message : String(err);

                // Show toast for immediate feedback if desired, or just rely on the card error
                // toast.error(`Lỗi: ${errorMessage}`, { duration: 3000 });

                generationErrorsRef.current[index] = errorMessage;
                setGenerationErrors({ ...generationErrorsRef.current });

                // Ensure placeholder remains empty or marked failed in data (optional)
                generationResults.current[index] = '';
                setGeneratedImages([...generationResults.current]);

                return null;
            }
        });

        const allResults = await Promise.all(processingPromises);

        // Finalize
        const successfulResults = allResults.filter((r): r is { url: string; prompt: string } => r !== null);
        const successfulImages = successfulResults.map(r => r.url);

        if (successfulResults.length > 0) {
            // Log for debugging
            console.log('[StudioGenerator] Successfully generated images:', successfulImages.length);
            // NOTE: History logging is now handled by the server API (/api/gemini/generate-image)
            // No need to call logGeneration() here to avoid double entries.
        }

        setPendingCount(0);

        // Determine final error state
        let finalError = null;
        if (successfulImages.length === 0 && imageCount > 0) {
            // All failed
            // Inspect the first error to determine a global user friendly error
            // We need to re-process to get the code if we only stored the string. 
            // Ideally we should have stored the error object.
            // But since processApiError returns a GeminiError with a good message, we can just use that message?
            // The user wants "tương tự với các chỗ hiện err ở các tool khác" -> blindly trust server message.
            const firstErrorMsg = Object.values(generationErrorsRef.current)[0] || "Lỗi không xác định";

            // Since we trust processApiError which now returns server messages directly,
            // we typically don't need to wrap it anymore.
            // But let's check for specific codes just in case we need special UI actions (like opening a modal).
            // For now, we just display the message as is.
            finalError = firstErrorMsg;

        } else if (Object.keys(generationErrorsRef.current).length > 0) {
            // Partial failure - maybe show a small toast or just let the cards show it?
            // finalError = `Đã tạo ${successfulImages.length}/${imageCount} ảnh.`;
        }

        setAppState(prev => ({
            ...prev,
            stage: 'results',
            error: finalError
        }));
    };

    const isLoading = appState.stage === 'generating';
    const hasResults = generatedImages.length > 0;

    const { activeTab } = appState;

    // Filter templates by gender
    const currentTemplates = TEMPLATES.filter((t: any) => {
        const gender = t.gender || 'female'; // Default to female if not specified
        return gender === activeTab;
    });

    return (
        <div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-screen mb-40" id="studio-top">
            <div className="w-full max-w-7xl pt-6 px-4 flex items-center justify-between">
                <button onClick={handleGoBack} className="text-neutral-400 hover:text-white flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Quay lại
                </button>

                {/* Model Version Selector */}
                <div className="flex gap-1 themed-card backdrop-blur-md rounded-full p-1 border border-white/10 shadow-lg">
                    <button
                        onClick={() => handleModelVersionChange('v2')}
                        className={`rounded-full font-bold transition-all duration-200 px-4 py-1.5 !text-xs ${modelVersion === 'v2' ? 'text-black shadow-md bg-orange-500' : 'text-neutral-400 hover:text-white'
                            }`}
                    >
                        <span className="hidden md:inline">Model </span>V2
                    </button>
                    <button
                        onClick={() => handleModelVersionChange('v3')}
                        className={`rounded-full font-bold transition-all duration-200 px-4 py-1.5 !text-xs ${modelVersion === 'v3' ? 'text-black shadow-md bg-orange-500' : 'text-neutral-400 hover:text-white'
                            }`}
                    >
                        <span className="hidden md:inline">Model </span>V3
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {!isLoading && (
                    <AppScreenHeader
                        mainTitle={studio.name}
                        subtitle={studio.description || "Tạo ảnh cực chất cùng Duky AI"}
                        useSmartTitleWrapping={true}
                        smartTitleWrapWords={4}
                    />
                )}
            </AnimatePresence>

            <div className="flex flex-col items-center w-full flex-1 px-4 overflow-y-auto">
                <motion.div
                    className="flex flex-col items-center gap-6 w-full max-w-7xl py-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* 1. Inputs Section */}
                    {(!isLoading && appState.stage !== 'results') && (
                        <div className="w-full max-w-4xl flex flex-col items-center">
                            <div className="grid gap-6 w-full grid-cols-1 md:max-w-md mx-auto">
                                <div className="themed-card backdrop-blur-md p-4 rounded-2xl flex flex-col items-center gap-4">
                                    <h3 className="text-lg font-bold text-orange-400">Tải ảnh lên</h3>
                                    <ActionablePolaroidCard
                                        type={appState.uploadedImage ? 'photo-input' : 'uploader'}
                                        mediaUrl={appState.uploadedImage ?? undefined}
                                        caption="Tải ảnh của bạn"
                                        placeholderType="person"
                                        status="done"
                                        onClick={appState.uploadedImage ? () => openLightbox(lightboxImages.indexOf(appState.uploadedImage!)) : undefined}
                                        onImageChange={handleUploadedImageChange}
                                        isMobile={isMobile}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. Loading/Results State - Show header, inputs and output */}
                    {(isLoading || appState.stage === 'results') && (
                        <div className="w-full max-w-4xl">
                            {/* Title */}
                            <div className="text-center mb-6">
                                {/* <h1 className="text-2xl md:text-3xl font-bold text-white">{studio.name}</h1> */}
                                <p className="text-neutral-400 mt-2">{studio.description || (isLoading ? "Đang tạo ảnh..." : "Đã tạo xong!")}</p>
                            </div>

                            {/* Input/Output Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Input Section */}
                                <div className="themed-card backdrop-blur-md p-4 rounded-2xl flex flex-col items-center gap-4">
                                    <h3 className="text-lg font-bold text-orange-400">Ảnh gốc</h3>
                                    <div className="w-full max-w-xs">
                                        <ActionablePolaroidCard
                                            type="photo-input"
                                            mediaUrl={appState.uploadedImage ?? undefined}
                                            caption="Ảnh của bạn"
                                            placeholderType="person"
                                            status="done"
                                            isMobile={isMobile}
                                        />
                                    </div>
                                    {selectedStyleImages.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-sm text-neutral-400 mb-2 text-center">Mẫu đã chọn ({selectedStyleImages.length})</p>
                                            <div className="flex gap-2 flex-wrap justify-center">
                                                {selectedStyleImages.map((url, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={url}
                                                        alt={`Mẫu ${idx + 1}`}
                                                        className="w-16 h-22 object-cover rounded-lg border border-orange-400/50"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Output Section - Loading or Results - UNIFIED GRID */}
                                <div className="themed-card backdrop-blur-md p-4 rounded-2xl flex flex-col items-center gap-4">
                                    <h3 className="text-lg font-bold text-orange-400">
                                        {isLoading ? `Kết quả (${pendingCount} đang xử lý)` : `Kết quả (${generatedImages.filter(Boolean).length} ảnh)`}
                                        {/* Use filter boolean to show actual success count? Or just length? length is fine. */}
                                    </h3>

                                    {/* Action buttons (Top or Bottom? - Let's keep them at bottom as originally intended, but we can have a cancel button here if needed) */}

                                    <div className="grid grid-cols-2 gap-3 md:gap-4 w-full">
                                        {selectedStyleImages.map((styleUrl, idx) => {
                                            const url = generatedImages[idx];
                                            const error = generationErrors[idx];
                                            const isDone = url && url.length > 0;

                                            if (isDone) {
                                                return (
                                                    <div key={idx}>
                                                        <ActionablePolaroidCard
                                                            type="output"
                                                            caption={`Kết quả ${idx + 1}`}
                                                            status="done"
                                                            mediaUrl={url}
                                                            onClick={() => openLightbox(lightboxImages.indexOf(url))}
                                                            isMobile={isMobile}
                                                            onGenerateVideoFromPrompt={(prompt) => generateVideo(url, prompt)}
                                                        />
                                                    </div>
                                                );
                                            }

                                            if (error) {
                                                return (
                                                    <div key={idx}>
                                                        <ActionablePolaroidCard
                                                            type="output"
                                                            caption="Lỗi"
                                                            status="error"
                                                            error={error}
                                                            isMobile={isMobile}
                                                        />
                                                    </div>
                                                );
                                            }

                                            // Default: Pending
                                            return (
                                                <div key={idx} className="aspect-[3/4] bg-neutral-900/50 rounded-xl border border-neutral-700 flex flex-col items-center justify-center gap-2">
                                                    <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
                                                    <p className="text-neutral-300 text-xs text-center px-1">Đang tạo...</p>
                                                </div>
                                            );
                                        })}
                                    </div>


                                    {/* Action buttons */}
                                    {isLoading ? (
                                        <button
                                            onClick={() => { setAppState(prev => ({ ...prev, stage: 'configuring', error: null })); setPendingCount(0); }}
                                            className="mt-2 px-6 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm"
                                        >
                                            Hủy
                                        </button>
                                    ) : (
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => setAppState(prev => ({ ...prev, stage: 'configuring' }))}
                                                className="px-6 py-2 bg-neutral-600 cursor-pointer text-white rounded-full hover:bg-neutral-500 transition-colors text-sm"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={handleReset}
                                                className="px-6 py-2 bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-600 hover:to-orange-400 text-white rounded-full cursor-pointer transition-colors text-sm"
                                            >
                                                Bắt đầu lại
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Error message */}
                            {appState.error && (
                                <div className="w-full p-4 mt-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-center">
                                    {appState.error}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 4. Template Grid & Options - Only show if NOT in results/loading stage - wait, original logic hid this in results. 
                        My new logic unifies 'results' and 'loading' into the block above.
                        So this block should only show if stage !== 'results' AND !isLoading.
                    */}
                    {(!isLoading && appState.stage !== 'results') && (
                        <div className="w-full max-w-4xl space-y-6 mt-6">
                            {/* Gender Tabs */}
                            <div className="flex justify-center gap-2 mb-6">
                                <button
                                    onClick={() => handleTabChange('female')}
                                    className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === 'female'
                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                        }`}
                                >
                                    Nữ
                                </button>
                                <button
                                    onClick={() => handleTabChange('male')}
                                    className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === 'male'
                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                        }`}
                                >
                                    Nam
                                </button>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-bold text-neutral-300 ml-1">Danh sách mẫu ({currentTemplates.length})</h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-medium ${selectedStyleImages.length >= 4 ? 'text-orange-400' : 'text-neutral-400'}`}>
                                            Đã chọn: {selectedStyleImages.length}/4
                                        </span>
                                        {selectedStyleImages.length > 0 && (
                                            <button
                                                onClick={() => setSelectedStyleImages([])}
                                                className="text-xs text-neutral-500 hover:text-white underline"
                                            >
                                                Bỏ chọn tất cả
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {currentTemplates.length === 0 ? (
                                    <div className="text-center text-neutral-500 py-8">Chưa có mẫu nào cho mục này.</div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                        {currentTemplates.map((tpl: any, idx: number) => {
                                            const templateUrl = tpl.image_url || tpl.url;
                                            const isSelected = selectedStyleImages.includes(templateUrl);
                                            const selectionIndex = selectedStyleImages.indexOf(templateUrl);
                                            const isAtLimit = selectedStyleImages.length >= 4 && !isSelected;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleStyleSelect(templateUrl)}
                                                    disabled={isAtLimit}
                                                    className={`relative rounded-xl overflow-hidden border-2 !p-0 transition-all duration-200 aspect-[9/16] ${isSelected ? 'border-orange-400 scale-105 shadow-lg shadow-orange-400/20' : isAtLimit ? 'border-neutral-800 opacity-50 cursor-not-allowed' : 'border-neutral-700 hover:border-neutral-500'}`}
                                                >
                                                    <img src={templateUrl} alt={`Template ${idx + 1}`} className="w-full h-full object-cover" />
                                                    {isSelected && (
                                                        <div className="absolute inset-0 bg-orange-400/20 flex items-center justify-center">
                                                            <div className="bg-orange-400 rounded-full w-6 h-6 flex items-center justify-center">
                                                                <span className="text-black font-bold text-sm">{selectionIndex + 1}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Options */}
                            <div className="themed-card backdrop-blur-md rounded-2xl p-6 border border-neutral-700">
                                <h3 className="text-lg font-bold text-white mb-4 border-b border-neutral-700 pb-2">Tuỳ chọn</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1">Ghi chú thêm</label>
                                        <textarea
                                            value={appState.options.customPrompt}
                                            onChange={(e) => handleOptionChange('customPrompt', e.target.value)}
                                            placeholder="Nhập ghi chú thêm cho AI..."
                                            className="w-full bg-neutral-900/50 border border-neutral-700 rounded-xl p-3 text-white focus:border-orange-400 focus:outline-none"
                                            rows={2}
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-6">
                                        <div>
                                            <SearchableSelect
                                                id="aspectRatio"
                                                label="Tỉ lệ khung hình"
                                                options={ASPECT_RATIO_OPTIONS}
                                                value={appState.options.aspectRatio || ''}
                                                onChange={(val) => handleOptionChange('aspectRatio', val)}
                                                placeholder="Chọn tỉ lệ..."
                                            />
                                        </div>
                                        <div className="flex items-center pt-6">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={appState.options.removeWatermark}
                                                    onChange={(e) => handleOptionChange('removeWatermark', e.target.checked)}
                                                    className="rounded border-neutral-600 bg-neutral-800 text-orange-400 focus:ring-orange-400"
                                                />
                                                <span className="text-sm font-medium text-neutral-300">Xóa watermark</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-col items-center gap-2">
                                    {selectedStyleImages.length > 0 && (
                                        <p className="text-sm text-neutral-400">
                                            Chi phí: {selectedStyleImages.length * (modelVersion === 'v3' ? 2 : 1)} credits
                                        </p>
                                    )}
                                    <button
                                        onClick={handleGenerate}
                                        disabled={!appState.uploadedImage || selectedStyleImages.length === 0 || isLoading}
                                        className={`px-12 py-3 rounded-full font-bold text-black text-lg transition-all transform active:scale-95 shadow-lg ${!appState.uploadedImage || selectedStyleImages.length === 0 || isLoading
                                            ? 'bg-neutral-600 cursor-not-allowed opacity-50'
                                            : 'bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-600 hover:to-orange-400 shadow-orange-500/20'
                                            }`}
                                    >
                                        {hasResults ? 'Tạo lại' : `Tạo ${selectedStyleImages.length} ảnh`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
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

export default StudioGenerator;