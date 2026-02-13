/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ChangeEvent, useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    SparklesIcon,
    CameraIcon,
    NoteIcon,
    PaletteIcon,
    SettingsIcon,
} from './icons/PosterIcons';
import { swapImageStyle, mixImageStyle, editImageWithPrompt } from '../services/geminiService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import Lightbox from './Lightbox';
import {
    AppScreenHeader,
    ImageUploader,
    ResultsView,
    ImageForZip,
    AppOptionsLayout,
    OptionsPanel,
    Slider,
    type SwapStyleState,
    handleFileUpload,
    useLightbox,
    useVideoGeneration,
    processAndDownloadAll,
    useAppControls,
    embedJsonInPng,
    getInitialStateForApp,
    SearchableSelect,
    Switch,
    useMediaQuery,
    limitHistoricalImages,
} from './uiUtils';
import toast from 'react-hot-toast';
import { processApiError, GeminiErrorCodes, GeminiError } from '@/services/gemini/baseService';

interface SwapStyleProps {
    mainTitle: string;
    subtitle: string;
    useSmartTitleWrapping: boolean;
    smartTitleWrapWords: number;
    uploaderCaptionContent: string;
    uploaderDescriptionContent: string;
    uploaderCaptionStyle: string;
    uploaderDescriptionStyle: string;
    addImagesToGallery: (images: string[]) => void;
    appState: SwapStyleState;
    onStateChange: (newState: SwapStyleState) => void;
    onReset: () => void;
    onGoBack: () => void;
    logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: {
        api_model_used?: string;
        credits_used?: number;
        generation_count?: number;
    }) => void;
}

const SwapStyle: React.FC<SwapStyleProps> = (props) => {
    const {
        uploaderCaptionContent, uploaderDescriptionContent, uploaderCaptionStyle, uploaderDescriptionStyle, addImagesToGallery,
        appState, onStateChange, onReset,
        logGeneration,
        ...headerProps
    } = props;

    const { t, settings, checkCredits, modelVersion, refreshGallery } = useAppControls();
    const { lightboxIndex, openLightbox, closeLightbox, navigateLightbox } = useLightbox();
    const { videoTasks, generateVideo } = useVideoGeneration();
    const [localNotes, setLocalNotes] = useState(appState.options.notes);
    const isMobile = useMediaQuery('(max-width: 768px)');
    // Refs for multi-gen
    const generationResults = React.useRef<string[]>([]);
    const generationErrorsRef = React.useRef<Record<number, string>>({});
    const [generationErrors, setGenerationErrors] = useState<Record<number, string>>({});


    const { convertToReal } = appState.options;

    const STYLE_STRENGTH_LEVELS = t('style_strengthLevels');
    const FAITHFULNESS_LEVELS = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];

    const bilingualStyles: { en: string; vi: string }[] = Array.isArray(t('swapStyle_styles')) ? t('swapStyle_styles') : [];

    // Ensure we handle the "styles" array even if it wasn't initialized in legacy state
    const selectedStyles = appState.options.styles || (appState.options.style ? [appState.options.style] : []);

    const toggleStyle = (styleEn: string) => {
        let newStyles = [...selectedStyles];
        if (newStyles.includes(styleEn)) {
            newStyles = newStyles.filter(s => s !== styleEn);
        } else {
            if (newStyles.length >= 4) {
                toast.error("Bạn chỉ có thể chọn tối đa 4 phong cách cùng lúc.");
                return;
            }
            newStyles.push(styleEn);
        }
        onStateChange({
            ...appState,
            options: {
                ...appState.options,
                styles: newStyles,
                style: newStyles.length > 0 ? newStyles[0] : '' // Sync for compatibility
            }
        });
    };

    const lightboxImages = [...new Set([
        appState.contentImage, appState.styleImage,
        ...appState.generatedImages.filter(img => img && img.length > 0),
        ...appState.historicalImages
    ].filter((img): img is string => !!img))];

    useEffect(() => {
        setLocalNotes(appState.options.notes);
    }, [appState.options.notes]);

    const handleContentImageSelected = (imageDataUrl: string | null) => {
        onStateChange({
            ...appState,
            stage: imageDataUrl ? 'configuring' : 'idle',
            contentImage: imageDataUrl,
            // generatedImages: [],
            // historicalImages: [],
            error: null,
        });
    };

    const handleStyleImageChange = (newUrl: string | null) => {
        onStateChange({ ...appState, styleImage: newUrl });
    };

    const handleOptionChange = (field: keyof SwapStyleState['options'], value: any) => {
        onStateChange({
            ...appState,
            options: { ...appState.options, [field]: value },
        });
    };

    const handleGenerate = async () => {
        if (!appState.contentImage) return;

        // If converting to real, we treat it as 1 item.
        // If swapping styles, we use selectedStyles array.
        // If styleImage is present, we ignore selectedStyles (legacy single mix behavior or maybe 1:1 mix).
        // For simplicity: If styleImage exists -> Mix 1 style (image). 
        // If no styleImage & no convertToReal -> Use selectedStyles loop.

        const stylesToProcess = convertToReal
            ? ['image-to-real']
            : (appState.styleImage ? ['custom-ref'] : selectedStyles);

        if (stylesToProcess.length === 0) {
            toast.error("Vui lòng chọn ít nhất 1 phong cách.");
            return;
        }

        // Check credits
        const count = stylesToProcess.length;
        const creditCostPerImage = modelVersion === 'v3' ? 2 : 1;
        if (!await checkCredits(creditCostPerImage * count)) {
            return;
        }

        generationResults.current = new Array(count).fill('');
        generationErrorsRef.current = {};
        setGenerationErrors({});
        const processingPromises: Promise<void>[] = [];
        const preGenState = { ...appState };

        onStateChange({ ...appState, stage: 'generating', error: null, generatedImages: new Array(count).fill('') });

        try {
            stylesToProcess.forEach((styleItem, index) => {
                const processTask = async () => {
                    try {
                        let resultUrl: string;
                        // Determine which API to call based on the item
                        if (convertToReal) {
                            resultUrl = await swapImageStyle(appState.contentImage!, appState.options, 'image-to-real');
                        } else if (styleItem === 'custom-ref' && appState.styleImage) {
                            const { resultUrl: mixedUrl } = await mixImageStyle(appState.contentImage!, appState.styleImage, appState.options, 'swap-style');
                            resultUrl = mixedUrl;
                        } else {
                            // Standard swap style
                            const singleStyleOptions = { ...appState.options, style: styleItem };
                            resultUrl = await swapImageStyle(appState.contentImage!, singleStyleOptions, 'swap-style');
                        }

                        // Embed metadata
                        const settingsToEmbed = {
                            viewId: 'swap-style',
                            state: { ...preGenState, stage: 'configuring', generatedImages: [], historicalImages: [], error: null },
                        };
                        const urlWithMetadata = await embedJsonInPng(resultUrl, settingsToEmbed, settings.enableImageMetadata);

                        generationResults.current[index] = urlWithMetadata;

                        // Update UI
                        const currentImages = [...generationResults.current].map(u => u || '');
                        onStateChange({
                            ...appState,
                            stage: 'generating',
                            generatedImages: currentImages
                        });
                    } catch (err: any) {
                        const errorMsg = processApiError(err).message;
                        generationErrorsRef.current[index] = errorMsg;
                        setGenerationErrors({ ...generationErrorsRef.current });
                        // generationResults.current[index] = 'error'; // or keep empty?
                    }
                };
                processingPromises.push(processTask());
            });

            await Promise.all(processingPromises);

            // Finalize
            const validImages = generationResults.current.filter(url => url && url.length > 0);
            if (validImages.length > 0) {
                onStateChange({
                    ...appState,
                    stage: 'results',
                    generatedImages: generationResults.current.map(u => u || ''),
                    historicalImages: limitHistoricalImages(appState.historicalImages, validImages),
                    generatedImage: validImages[0] // sync for compat
                });
                refreshGallery();
            } else {
                if (Object.keys(generationErrorsRef.current).length > 0) {
                    // Stay in results to show errors
                    onStateChange({ ...appState, stage: 'results' });
                } else {
                    onStateChange({ ...appState, stage: 'results', error: "No images generated" });
                }
            }

        } catch (err: any) {
            onStateChange({ ...appState, stage: 'results', error: err.message });
        }
    };

    const handleRegeneration = async (index: number, prompt: string) => {
        const url = appState.generatedImages[index];
        if (!url) return;

        // Logic regen... (similar to FreeGen)
        // ...
        // Simplified for now: just call editImageWithPrompt and update slot
        if (!await checkCredits()) return;

        onStateChange({ ...appState, stage: 'generating' });
        try {
            const resultUrl = await editImageWithPrompt(url, prompt);
            const urlWithMetadata = await embedJsonInPng(resultUrl, { viewId: 'swap-style', state: appState }, settings.enableImageMetadata);

            const newImages = [...appState.generatedImages];
            newImages[index] = urlWithMetadata;

            onStateChange({
                ...appState,
                stage: 'results',
                generatedImages: newImages,
                historicalImages: limitHistoricalImages(appState.historicalImages, [urlWithMetadata])
            });
            refreshGallery();

        } catch (e: any) {
            onStateChange({ ...appState, stage: 'results', error: e.message });
        }
    };

    const handleDownloadAll = () => {
        const inputImages: ImageForZip[] = [];
        if (appState.contentImage) inputImages.push({ url: appState.contentImage, filename: 'anh-goc', folder: 'input' });
        if (appState.styleImage) inputImages.push({ url: appState.styleImage, filename: 'anh-style', folder: 'input' });

        processAndDownloadAll({
            inputImages,
            historicalImages: appState.historicalImages,
            videoTasks,
            zipFilename: 'anh-theo-style.zip',
            baseOutputFilename: 'ket-qua',
        });
    };

    const isLoading = appState.stage === 'generating';

    // Render logic for Style Selector
    const renderStyleSelector = () => {
        return (
            <div className="grid grid-cols-2 gap-2 mt-2">
                {bilingualStyles.map((s) => {
                    const isSelected = selectedStyles.includes(s.en);
                    return (
                        <button
                            key={s.en}
                            onClick={() => toggleStyle(s.en)}
                            className={`
                                relative p-2 rounded-lg text-sm text-center transition-all duration-200 border
                                ${isSelected
                                    ? 'bg-orange-500/20 border-orange-500 text-orange-200 shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                                    : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:border-neutral-500'
                                }
                            `}
                        >
                            <span className="block font-medium">{s.vi}</span>
                            <span className="block text-[10px] opacity-70 truncate">{s.en}</span>
                            {isSelected && (
                                <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full shadow-sm" />
                            )}
                        </button>
                    )
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="border-b border-neutral-800 px-6 py-4 pt-20 md:pt-10">
                <div className="max-w-7xl mx-auto flex items-end justify-between">
                    <div>
                        <h1 className="text-4xl font-bold flex items-center gap-2 text-orange-500">
                            <SparklesIcon className="w-10 h-10" />
                            {headerProps.mainTitle}
                        </h1>
                        <p className="text-md text-neutral-400 mt-1">
                            {headerProps.subtitle}
                        </p>
                    </div>
                </div>
            </div>

            {/* Model Selector Positioned like MilkTea V2 */}
            <div className=" px-6 p-0 md:py-3 relative">
                {/* Positioned absolutely on desktop to align with header right side, or handled by AppControls internal logic if reusable */}
            </div>

            {/* Main Content - 2 Column Layout (35% - 65%) */}
            <div className="max-w-[1600px] mx-auto px-6 p-2 md:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-6">

                    {/* LEFT COLUMN: Inputs */}
                    <div className="flex flex-col gap-6">
                        {/* Upload Section */}
                        <div className="bg-[#0c0c0c] rounded-xl p-6 border border-neutral-800">
                            <label className="text-white font-semibold text-base flex items-center gap-2 mb-4">
                                <CameraIcon className="w-6 h-6" />
                                Ảnh đầu vào
                            </label>

                            {/* Main Content Image */}
                            <div className="w-full">
                                <ActionablePolaroidCard
                                    uploadLabel="Tải ảnh nội dung"
                                    type={appState.contentImage ? 'content-input' : 'uploader'}
                                    mediaUrl={appState.contentImage ?? undefined}
                                    status="done"
                                    caption={uploaderCaptionContent}
                                    placeholderType="magic"
                                    onImageChange={(url) => handleContentImageSelected(url)}
                                    onClick={appState.contentImage ? () => openLightbox(lightboxImages.indexOf(appState.contentImage!)) : undefined}
                                />
                            </div>

                            {/* Reference/Style Image (if needed for Mix) */}
                            {!convertToReal && (
                                <div className="mt-6">
                                    <label className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                                        Ảnh tham chiếu (Tùy chọn)
                                    </label>
                                    <div className="h-40 w-40 mx-auto">
                                        <ActionablePolaroidCard
                                            uploadLabel="Ảnh phong cách"
                                            type="style-input"
                                            mediaUrl={appState.styleImage ?? undefined}
                                            caption={uploaderCaptionStyle}
                                            placeholderType='style'
                                            status='done'
                                            onImageChange={handleStyleImageChange}
                                            onClick={appState.styleImage ? () => openLightbox(lightboxImages.indexOf(appState.styleImage!)) : undefined}
                                        />
                                    </div>
                                    <p className="text-center text-xs text-neutral-500 mt-2">{uploaderDescriptionStyle}</p>
                                </div>
                            )}
                        </div>

                        {/* Notes Section */}
                        <div className="bg-[#0c0c0c] border border-neutral-800 rounded-xl p-6">
                            <label className="text-white font-semibold text-xl flex items-center gap-2 mb-4">
                                <NoteIcon className="w-5 h-6" />
                                Ghi chú
                            </label>
                            <textarea
                                value={localNotes}
                                onChange={(e) => {
                                    setLocalNotes(e.target.value);
                                    handleOptionChange('notes', e.target.value);
                                }}
                                placeholder="Nhập ghi chú thêm cho AI..."
                                rows={3}
                                className="w-full px-4 py-2 bg-[#0c0c0c] border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 resize-none"
                            />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Settings & Results */}
                    <div className="flex flex-col gap-6">

                        {/* Styles Grid */}
                        {!convertToReal && !appState.styleImage && (
                            <div className="bg-[#0c0c0c] border border-neutral-800 rounded-xl p-6">
                                <label className="block text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
                                    <PaletteIcon className="w-4 h-4" />
                                    Chọn Phong Cách
                                    {selectedStyles.length > 0 && (
                                        <span className="ml-auto text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                                            {selectedStyles.length}/4 đã chọn
                                        </span>
                                    )}
                                </label>
                                {renderStyleSelector()}
                            </div>
                        )}

                        {/* Formatting Options */}
                        {/* Formatting Options */}
                        <div className="bg-[#0c0c0c] border border-neutral-800 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <SettingsIcon className="w-5 h-5 text-white" />
                                <label className="text-white font-semibold text-base">Cấu hình</label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Slider
                                        label="Cường độ phong cách"
                                        options={STYLE_STRENGTH_LEVELS}
                                        value={appState.options.styleStrength}
                                        onChange={(val) => handleOptionChange('styleStrength', val)}
                                        disabled={false}
                                    />
                                </div>
                                <div className="flex flex-col gap-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="remove-watermark" className="text-sm font-medium text-neutral-300">
                                            {t('remove_watermark')}
                                        </label>
                                        <Switch
                                            id="remove-watermark"
                                            checked={appState.options.removeWatermark}
                                            onChange={(checked) => handleOptionChange('removeWatermark', checked)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="convert-to-real" className="text-sm font-medium text-neutral-300">
                                            Chuyển sang ảnh thật
                                        </label>
                                        <Switch
                                            id="convert-to-real"
                                            checked={appState.options.convertToReal}
                                            onChange={(checked) => handleOptionChange('convertToReal', checked)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div className="sticky bottom-4 z-10">
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading || !appState.contentImage}
                                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-orange-500/20"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-5 h-5" />
                                        Tạo Ảnh Ngay
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Results Area */}
                        {(appState.generatedImages.length > 0 || isLoading) && (
                            <div className="bg-[#0c0c0c] border border-neutral-800 rounded-xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-white font-semibold text-xl flex items-center gap-2">
                                        Kết quả
                                    </label>
                                    {appState.generatedImages.some(img => img) && (
                                        <button
                                            onClick={handleDownloadAll}
                                            className="text-xs flex items-center gap-1 text-neutral-400 hover:text-white"
                                        >
                                            ⬇️ Tải tất cả
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {appState.generatedImages.map((img, idx) => (
                                        <div key={idx} className="relative group">
                                            <ActionablePolaroidCard
                                                type="output"
                                                mediaUrl={img || undefined}
                                                status={img ? 'done' : (isLoading ? 'pending' : 'pending')}
                                                caption={`Kết quả ${idx + 1}`}
                                                error={generationErrors[idx]}
                                                onClick={img ? () => openLightbox(lightboxImages.indexOf(img)) : undefined}
                                                onRegenerate={() => handleRegeneration(idx, localNotes)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
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

export default SwapStyle;