/**
 * TemplateComposer - Ghép Trang Phục Vào Mẫu
 * Cấu trúc giống FreeGeneration: Uploaders + Prompt + Options + Results
 */
import React, { ChangeEvent, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { editImageWithPrompt } from '../services/geminiService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import { processApiError, GeminiErrorCodes, GeminiError, normalizeImageInput, callGeminiWithRetry, processGeminiResponse, setGlobalModelConfig, getModelConfig } from '@/services/gemini/baseService';
import Lightbox from './Lightbox';
import {
    AppScreenHeader,
    handleFileUpload,
    useMediaQuery,
    ImageForZip,
    OptionsPanel,
    type TemplateComposerState,
    useLightbox,
    useVideoGeneration,
    processAndDownloadAll,
    embedJsonInPng,
    useAppControls,
    getInitialStateForApp,
    Switch,
    limitHistoricalImages,
} from './uiUtils';
import toast from 'react-hot-toast';
import { MagicWandIcon } from './icons';

interface TemplateComposerProps {
    mainTitle: string;
    subtitle: string;
    useSmartTitleWrapping: boolean;
    smartTitleWrapWords: number;
    uploaderCaptionModel: string;
    uploaderDescriptionModel: string;
    uploaderCaptionOutfit1: string;
    uploaderDescriptionOutfit1: string;
    uploaderCaptionOutfit2: string;
    uploaderDescriptionOutfit2: string;
    uploaderCaptionOutfit3: string;
    uploaderDescriptionOutfit3: string;
    addImagesToGallery: (images: string[], persist?: boolean) => void;
    appState: TemplateComposerState;
    onStateChange: (newState: TemplateComposerState) => void;
    onReset: () => void;
    onGoBack: () => void;
    logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: {
        tool_id?: number;
        credits_used?: number;
        api_model_used?: string;
        generation_time_ms?: number;
        error_message?: string;
        output_images?: any;
        generation_count?: number;
        input_prompt?: string;
    }) => void;
}

const NUMBER_OF_IMAGES_OPTIONS = ['1', '2', '3', '4'] as const;
const ASPECT_RATIO_OPTIONS = ['Giữ nguyên', '1:1', '16:9', '9:16', '4:5', '5:4', '4:3', '3:4', '3:2', '2:3'];

const TemplateComposer: React.FC<TemplateComposerProps> = (props) => {
    const {
        uploaderCaptionModel, uploaderDescriptionModel,
        uploaderCaptionOutfit1, uploaderDescriptionOutfit1,
        uploaderCaptionOutfit2, uploaderDescriptionOutfit2,
        uploaderCaptionOutfit3, uploaderDescriptionOutfit3,
        addImagesToGallery,
        appState, onStateChange, onReset,
        logGeneration,
        ...headerProps
    } = props;

    const { t, settings, checkCredits, modelVersion, isLoggedIn, openLoginModal, refreshGallery } = useAppControls();

    const { videoTasks, generateVideo } = useVideoGeneration();
    const { lightboxIndex, openLightbox, closeLightbox, navigateLightbox } = useLightbox();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [localPrompt, setLocalPrompt] = useState(appState.options.prompt);
    const [generationErrors, setGenerationErrors] = useState<Record<number, string>>({});

    // Refs to track accumulation during async generation
    const generationResults = React.useRef<string[]>([]);
    const generationErrorsRef = React.useRef<Record<number, string>>({});

    useEffect(() => {
        setLocalPrompt(appState.options.prompt);
    }, [appState.options.prompt]);

    const lightboxImages = [...new Set([
        appState.modelImage, appState.outfit1, appState.outfit2, appState.outfit3,
        ...appState.generatedImages.filter(img => img && img.length > 0),
        ...appState.historicalImages
    ].filter((img): img is string => !!img))];

    const handleSaveImage = (imageKey: 'modelImage' | 'outfit1' | 'outfit2' | 'outfit3') => (newUrl: string | null) => {
        onStateChange({
            ...appState,
            [imageKey]: newUrl,
            generatedImages: [],
            historicalImages: [],
            error: null
        });
    };

    const handleSaveGeneratedImage = (index: number) => (newUrl: string | null) => {
        if (!newUrl) return;
        const newGeneratedImages = [...appState.generatedImages];
        newGeneratedImages[index] = newUrl;
        const newHistoricalImages = [...appState.historicalImages, newUrl];
        onStateChange({
            ...appState,
            stage: 'results',
            generatedImages: newGeneratedImages,
            historicalImages: newHistoricalImages,
        });
        addImagesToGallery([newUrl]);
    };

    const handleOptionChange = (field: keyof TemplateComposerState['options'], value: string | boolean | number) => {
        onStateChange({
            ...appState,
            options: { ...appState.options, [field]: value }
        });
    };

    /**
     * Build specialized prompt for outfit composition (virtual try-on).
     * Key insight: outfit images often show OTHER PEOPLE wearing the outfit.
     * AI must extract ONLY the clothing design, not the person/background from outfit images.
     */
    const buildOutfitCompositionPrompt = (userNotes: string): string => {
        const outfits = [appState.outfit1, appState.outfit2, appState.outfit3].filter(Boolean);
        const outfitCount = outfits.length;
        const promptParts: string[] = [];

        // Image labeling
        promptParts.push(
            `Đây là bài toán THỬ ĐỒ ẢO (Virtual Try-On). Tôi cung cấp ${outfitCount + 1} ảnh:`,
        );

        for (let i = 0; i < outfitCount; i++) {
            promptParts.push(`- Ảnh ${i + 1}: Chứa một bộ trang phục mà tôi muốn thử. LƯU Ý: Ảnh này có thể có một người khác đang mặc bộ đồ này - hãy BỎ QUA người đó, CHỈ tập trung vào KIỂU DÁNG, MÀU SẮC, HỌA TIẾT, CHẤT LIỆU của bộ trang phục.`);
        }
        promptParts.push(`- Ảnh ${outfitCount + 1}: ĐÂY LÀ ẢNH GỐC - người mẫu của tôi. Đây là ảnh CHÍNH, khuôn mặt CẦN GIỮ NGUYÊN 100%.`);

        // Core task
        promptParts.push(
            '',
            `**NHIỆM VỤ:** Tạo ảnh mới trong đó người mẫu từ Ảnh ${outfitCount + 1} đang mặc trang phục từ ${outfitCount > 1 ? 'các ảnh trang phục' : 'Ảnh 1'}.`,
            '',
        );

        // Special case: model image may be close-up / headshot only
        promptParts.push(
            '**TRƯỜNG HỢP ĐẶC BIỆT - ẢNH GỐC CHỈ LÀ CLOSE-UP / CHÂN DUNG:**',
            `Nếu ảnh người mẫu (Ảnh ${outfitCount + 1}) chỉ chụp khuôn mặt hoặc nửa người trên (không thấy đầy đủ thân người):`,
            '- Hãy TỰ TẠO dáng toàn thân (full body) cho người mẫu để SHOW được trọn vẹn bộ trang phục.',
            '- Chọn tư thế tự nhiên, thanh lịch, phù hợp với kiểu trang phục (ví dụ: tư thế đứng thẳng, nghiêng nhẹ, hoặc pose thời trang).',
            '- GIỮ NGUYÊN 100% khuôn mặt, biểu cảm, kiểu tóc, make-up, màu da từ ảnh gốc.',
            '- Tạo background phù hợp, đẹp mắt, phong cách chụp thời trang chuyên nghiệp.',
            '- Dáng người phải cân đối, tự nhiên, phù hợp với khuôn mặt trong ảnh gốc.',
            '',
        );

        // Standard case rules
        promptParts.push(
            '**TRƯỜNG HỢP THÔNG THƯỜNG - ẢNH GỐC CÓ DÁNG ĐẦY ĐỦ:**',
            '**Giữ nguyên 100% từ ảnh gốc:**',
            '- Khuôn mặt, biểu cảm, make-up, màu da, kiểu tóc',
            '- Tư thế, dáng đứng/ngồi, hướng nhìn',
            '- Bối cảnh (background), ánh sáng, góc chụp, phong cách chụp',
            '- Phụ kiện đang cầm/đeo (túi xách, điện thoại, đồ trên tay, v.v.)',
            '',
            '**Điều duy nhất được thay đổi:**',
            `- Chỉ thay thế QUẦN ÁO trên người mẫu bằng kiểu dáng trang phục từ ${outfitCount > 1 ? 'các ảnh trang phục' : 'ảnh trang phục'}.`,
            '- Trang phục mới phải được mặc tự nhiên, phù hợp với dáng người.',
            '- Giữ nguyên chính xác màu sắc, họa tiết, kiểu dáng của trang phục trong ảnh trang phục.',
            '',
            '**TUYỆT ĐỐI KHÔNG ĐƯỢC (cả 2 trường hợp):**',
            '- KHÔNG thay đổi khuôn mặt người mẫu',
            '- KHÔNG lấy bất kỳ yếu tố nào từ ảnh trang phục ngoài bộ quần áo (không lấy background, người, phụ kiện từ ảnh trang phục)',
            '- KHÔNG thay đổi style/filter/màu sắc tổng thể ảnh',
        );

        if (userNotes.trim()) {
            promptParts.push('', `**GHI CHÚ BỔ SUNG TỪ NGƯỜI DÙNG:** ${userNotes}`);
        }

        if (appState.options.aspectRatio && appState.options.aspectRatio !== 'Giữ nguyên') {
            promptParts.push('', `**TỶ LỆ KHUNG HÌNH:** Kết quả phải có tỷ lệ ${appState.options.aspectRatio}.`);
        }

        promptParts.push(
            '',
            'Kết quả: Một bức ảnh duy nhất, chất lượng cao, nhìn tự nhiên như ảnh thật. Chỉ trả về ảnh, không text.'
        );

        if (appState.options.removeWatermark) {
            promptParts.push('Ảnh kết quả KHÔNG được chứa watermark, logo hay chữ ký nào mới.');
        }

        return promptParts.join('\n');
    };

    const handleGenerate = async () => {
        if (!appState.modelImage) {
            onStateChange({ ...appState, error: "Vui lòng tải lên ảnh mẫu (model)." });
            return;
        }

        if (!appState.outfit1) {
            onStateChange({ ...appState, error: "Vui lòng tải lên ít nhất 1 ảnh trang phục." });
            return;
        }

        // Force v3 model for this tool - always use v3 credits (2 per image)
        const count = appState.options.numberOfImages;
        const creditCostPerImage = 2 * count; // v3 always costs 2 credits
        if (!await checkCredits(creditCostPerImage)) {
            return;
        }

        // Build specialized prompt
        const finalPrompt = buildOutfitCompositionPrompt(localPrompt);

        // Initialize streaming state
        const initialImages = new Array(count).fill('');
        generationResults.current = new Array(count).fill('');
        generationErrorsRef.current = {};
        setGenerationErrors({});

        const preGenState = { ...appState, options: { ...appState.options, prompt: localPrompt } };
        onStateChange({ ...preGenState, stage: 'generating', error: null, generatedImages: initialImages });

        // Force v3 model before API calls
        const originalConfig = getModelConfig();
        setGlobalModelConfig({ modelVersion: 'v3' });

        try {
            // Collect outfit images (sent first, then model)
            const outfitUrls = [appState.outfit1, appState.outfit2, appState.outfit3].filter(Boolean) as string[];
            const allImageUrls = [...outfitUrls, appState.modelImage];

            // Normalize all images
            const normalizedImages = await Promise.all(
                allImageUrls.map(url => normalizeImageInput(url))
            );

            // Generate N images in parallel
            const promises = Array.from({ length: count }).map(async (_, i) => {
                try {
                    const parts: object[] = [];

                    // Add images: outfits first, then model (matching prompt order)
                    normalizedImages.forEach(({ mimeType, data }) => {
                        parts.push({ inlineData: { mimeType, data } });
                    });

                    parts.push({ text: finalPrompt });

                    const config: any = { tool_key: 'template-composer' };
                    const validRatios = ['1:1', '3:4', '4:3', '9:16', '16:9', '2:3', '4:5', '3:2', '5:4', '21:9'];
                    if (appState.options.aspectRatio && appState.options.aspectRatio !== 'Giữ nguyên' && validRatios.includes(appState.options.aspectRatio)) {
                        config.imageConfig = { aspectRatio: appState.options.aspectRatio };
                    }

                    const response = await callGeminiWithRetry(parts, config);
                    const rawUrl = processGeminiResponse(response);

                    // Embed metadata
                    const settingsToEmbed = {
                        viewId: 'template-composer',
                        state: { ...preGenState, stage: 'configuring', generatedImages: [], historicalImages: [], error: null },
                    };
                    const urlWithMetadata = await embedJsonInPng(rawUrl, settingsToEmbed, settings.enableImageMetadata);

                    generationResults.current[i] = urlWithMetadata;
                    const currentImagesSnapshot = [...generationResults.current].map(u => u || '');
                    onStateChange({ ...preGenState, stage: 'generating', generatedImages: currentImagesSnapshot });

                    return urlWithMetadata;
                } catch (error) {
                    const processedError = processApiError(error);
                    generationErrorsRef.current[i] = processedError.message;
                    setGenerationErrors({ ...generationErrorsRef.current });
                    return null;
                }
            });

            await Promise.all(promises);

            const validImages = generationResults.current.filter(url => url && url.length > 0);

            if (validImages.length > 0) {
                onStateChange({
                    ...preGenState,
                    stage: 'results',
                    generatedImages: [...generationResults.current].map(u => u || ''),
                    historicalImages: limitHistoricalImages(appState.historicalImages, validImages),
                    error: null
                });
                refreshGallery();
            } else {
                const errorCount = Object.keys(generationErrorsRef.current).length;
                if (errorCount > 0) {
                    onStateChange({ ...preGenState, stage: 'results', generatedImages: initialImages, error: null });
                } else {
                    onStateChange({ ...preGenState, stage: 'results', error: "Không tạo được ảnh nào." });
                }
            }

        } catch (err: any) {
            let error = processApiError(err);
            if (error instanceof GeminiError && error.code === GeminiErrorCodes.INSUFFICIENT_CREDITS) {
                toast.error(error.message);
                onStateChange({ ...preGenState, stage: 'configuring', error: null });
            } else {
                onStateChange({ ...preGenState, stage: 'results', error: error.message });
            }
        } finally {
            // Restore original model config
            setGlobalModelConfig({ modelVersion: originalConfig.modelVersion });
        }
    };

    const handleRegeneration = async (index: number, prompt: string) => {
        // v3 always costs 2 credits
        if (!await checkCredits(2)) return;

        const sourceImage = appState.generatedImages[index];
        if (!sourceImage) return;

        // Force v3 model
        const originalConfig = getModelConfig();
        setGlobalModelConfig({ modelVersion: 'v3' });

        const preGenState = { ...appState };
        const currentImages = [...appState.generatedImages];
        currentImages[index] = '';
        onStateChange({ ...appState, stage: 'generating', generatedImages: currentImages });

        try {
            const resultUrl = await editImageWithPrompt(sourceImage, prompt);
            const settingsToEmbed = {
                viewId: 'template-composer',
                state: { ...preGenState, stage: 'configuring', generatedImages: [], historicalImages: [], error: null },
            };
            const urlWithMetadata = await embedJsonInPng(resultUrl, settingsToEmbed, settings.enableImageMetadata);

            const newImages = [...appState.generatedImages];
            newImages[index] = urlWithMetadata;
            onStateChange({
                ...preGenState,
                stage: 'results',
                generatedImages: newImages,
                historicalImages: limitHistoricalImages(appState.historicalImages, [urlWithMetadata]),
            });
            refreshGallery();
        } catch (err: any) {
            let error = processApiError(err);
            setGenerationErrors(prev => ({ ...prev, [index]: error.message }));
            onStateChange({ ...preGenState, stage: 'results' });
        } finally {
            // Restore original model config
            setGlobalModelConfig({ modelVersion: originalConfig.modelVersion });
        }
    };

    const handleBackToOptions = () => {
        onStateChange({ ...appState, stage: 'configuring', error: null });
    };

    const handleDownloadAll = () => {
        const inputImages: ImageForZip[] = [];
        if (appState.modelImage) inputImages.push({ url: appState.modelImage, filename: 'model', folder: 'input' });
        if (appState.outfit1) inputImages.push({ url: appState.outfit1, filename: 'outfit-1', folder: 'input' });
        if (appState.outfit2) inputImages.push({ url: appState.outfit2, filename: 'outfit-2', folder: 'input' });
        if (appState.outfit3) inputImages.push({ url: appState.outfit3, filename: 'outfit-3', folder: 'input' });

        processAndDownloadAll({
            inputImages,
            historicalImages: appState.historicalImages,
            videoTasks,
            zipFilename: 'ket-qua-ghep-trang-phuc.zip',
            baseOutputFilename: 'ket-qua',
        });
    };

    const Uploader = ({ id, onImageChange, caption, description, currentImage, placeholderType }: any) => (
        <div className="flex flex-col items-center gap-4">
            <div className="cursor-pointer w-full group transform hover:scale-105 transition-transform duration-300">
                <ActionablePolaroidCard
                    type={currentImage ? 'multi-input' : 'uploader'}
                    caption={caption}
                    status="done"
                    mediaUrl={currentImage || undefined}
                    placeholderType={placeholderType}
                    onClick={currentImage ? () => openLightbox(lightboxImages.indexOf(currentImage)) : undefined}
                    onImageChange={onImageChange}
                />
            </div>
            <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">
                {description}
            </p>
        </div>
    );

    const isLoading = appState.stage === 'generating';
    const getButtonText = () => {
        if (appState.stage === 'generating') return t('templateComposer_creating');
        return t('templateComposer_createButton');
    };

    const anyImageUploaded = appState.modelImage || appState.outfit1 || appState.outfit2 || appState.outfit3;

    return (
        <div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-screen pt-16 sm:pt-0">
            <AnimatePresence>
                {(appState.stage === 'configuring') && (
                    <AppScreenHeader {...headerProps} titleClassName="text-orange-500" />
                )}
            </AnimatePresence>

            {appState.stage === 'configuring' && (
                <motion.div
                    className="flex flex-col items-center gap-8 w-full max-w-screen-2xl py-6 overflow-y-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="w-full pb-4 max-w-4xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-7xl mx-auto px-4">
                            {/* Model Image - always visible */}
                            <Uploader
                                id="tc-upload-model"
                                onImageChange={handleSaveImage('modelImage')}
                                caption={uploaderCaptionModel}
                                description={uploaderDescriptionModel}
                                currentImage={appState.modelImage}
                                placeholderType="person"
                            />
                            {/* Outfit 1 - always visible */}
                            <Uploader
                                id="tc-upload-outfit1"
                                onImageChange={handleSaveImage('outfit1')}
                                caption={uploaderCaptionOutfit1}
                                description={uploaderDescriptionOutfit1}
                                currentImage={appState.outfit1}
                                placeholderType="magic"
                            />
                            {/* Outfit 2 - visible when outfit1 is uploaded */}
                            <AnimatePresence>
                                {appState.outfit1 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                                        <Uploader
                                            id="tc-upload-outfit2"
                                            onImageChange={handleSaveImage('outfit2')}
                                            caption={uploaderCaptionOutfit2}
                                            description={uploaderDescriptionOutfit2}
                                            currentImage={appState.outfit2}
                                            placeholderType="magic"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {/* Outfit 3 - visible when outfit2 is uploaded */}
                            <AnimatePresence>
                                {appState.outfit2 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                                        <Uploader
                                            id="tc-upload-outfit3"
                                            onImageChange={handleSaveImage('outfit3')}
                                            caption={uploaderCaptionOutfit3}
                                            description={uploaderDescriptionOutfit3}
                                            currentImage={appState.outfit3}
                                            placeholderType="magic"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <OptionsPanel>
                        <h2 className="base-font font-bold text-2xl text-orange-500 border-b border-orange-500/30 pb-2">{t('templateComposer_promptTitle')}</h2>

                        <div>
                            <textarea
                                id="prompt"
                                value={localPrompt}
                                onChange={(e) => setLocalPrompt(e.target.value)}
                                onBlur={() => {
                                    if (localPrompt !== appState.options.prompt) {
                                        handleOptionChange('prompt', localPrompt);
                                    }
                                }}
                                placeholder={t('templateComposer_promptPlaceholder')}
                                className="form-input !h-32 border-neutral-700 focus:border-orange-500 focus:ring-orange-500"
                                rows={5}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="number-of-images" className="block text-left base-font font-bold text-lg text-neutral-200 mb-2">
                                    {t('templateComposer_numImagesLabel')}
                                </label>
                                <select
                                    id="number-of-images"
                                    value={appState.options.numberOfImages}
                                    onChange={(e) => handleOptionChange('numberOfImages', parseInt(e.target.value, 10))}
                                    className="form-input border-neutral-700 focus:border-orange-500 focus:ring-orange-500"
                                    aria-label={t('templateComposer_numImagesAriaLabel')}
                                >
                                    {NUMBER_OF_IMAGES_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="aspect-ratio" className="block text-left base-font font-bold text-lg text-neutral-200 mb-2">{t('common_aspectRatio')}</label>
                                <select
                                    id="aspect-ratio"
                                    value={appState.options.aspectRatio}
                                    onChange={(e) => handleOptionChange('aspectRatio', e.target.value)}
                                    className="form-input border-neutral-700 focus:border-orange-500 focus:ring-orange-500"
                                >
                                    {ASPECT_RATIO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>

                        {appState.error && (
                            <div className="w-full text-center p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                                {appState.error}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-4 pt-4">
                            {anyImageUploaded && <button onClick={() => { onStateChange({ ...appState, modelImage: null, outfit1: null, outfit2: null, outfit3: null }) }} className="btn btn-secondary">
                                {t('common_deleteImages')}
                            </button>}
                            <button onClick={handleGenerate} className="btn btn-primary" disabled={isLoading || !appState.modelImage || !appState.outfit1}>
                                {getButtonText()}
                            </button>
                        </div>
                    </OptionsPanel>
                </motion.div>
            )}

            {
                (appState.stage === 'generating' || appState.stage === 'results') && (
                    <div className="w-full flex-1 flex flex-col items-center pt-12">
                        {/* Title */}
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold text-white mb-2">Kết quả</h2>
                            <p className="text-neutral-400">{isLoading ? "Đang ghép trang phục..." : "Đã hoàn thành!"}</p>
                        </div>

                        <div className="w-full max-w-6xl px-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* LEFT COLUMN: Inputs */}
                                <div className="themed-card backdrop-blur-md p-4 rounded-2xl flex flex-col items-center gap-4 h-fit">
                                    <h3 className="text-lg font-bold text-orange-400">Ảnh gốc</h3>
                                    <div className="grid grid-cols-1 gap-4 w-full">
                                        {[
                                            { img: appState.modelImage, label: uploaderCaptionModel },
                                            { img: appState.outfit1, label: uploaderCaptionOutfit1 },
                                            { img: appState.outfit2, label: uploaderCaptionOutfit2 },
                                            { img: appState.outfit3, label: uploaderCaptionOutfit3 },
                                        ].map(({ img, label }, idx) => {
                                            if (!img) return null;
                                            return (
                                                <div key={idx} className="w-full flex flex-col items-center">
                                                    <div className="w-full max-w-xs">
                                                        <ActionablePolaroidCard
                                                            type="display"
                                                            mediaUrl={img}
                                                            caption={label}
                                                            status="done"
                                                            onClick={() => openLightbox(lightboxImages.indexOf(img))}
                                                            isMobile={isMobile}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {!anyImageUploaded && (
                                            <p className="text-neutral-500 text-center py-8">Không có ảnh gốc</p>
                                        )}
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: Results */}
                                <div className="themed-card backdrop-blur-md p-4 rounded-2xl flex flex-col items-center gap-4 h-fit">
                                    <h3 className="text-lg font-bold text-orange-400">
                                        {isLoading ? `Kết quả (${appState.options.numberOfImages} đang xử lý)` : `Kết quả (${appState.generatedImages.filter(Boolean).length} ảnh)`}
                                    </h3>

                                    <div className="grid grid-cols-2 gap-3 md:gap-4 w-full">
                                        {Array.from({ length: appState.options.numberOfImages }).map((_, index) => {
                                            const url = appState.generatedImages[index];
                                            const error = generationErrors[index];

                                            // Case 1: Success
                                            if (url && url.length > 0) {
                                                return (
                                                    <motion.div
                                                        key={`result-${index}`}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                                        className="w-full"
                                                    >
                                                        <ActionablePolaroidCard
                                                            type="output"
                                                            caption={t('templateComposer_resultCaption', index + 1)}
                                                            status={'done'}
                                                            mediaUrl={url}
                                                            onClick={() => openLightbox(lightboxImages.indexOf(url))}
                                                            onRegenerate={(prompt: string) => handleRegeneration(index, prompt)}
                                                            onGenerateVideoFromPrompt={(prompt: string) => generateVideo(url, prompt)}
                                                            onImageChange={handleSaveGeneratedImage(index)}
                                                            regenerationTitle={t('templateComposer_regenTitle')}
                                                            regenerationDescription={t('templateComposer_regenDescription')}
                                                            regenerationPlaceholder={t('templateComposer_regenPlaceholder')}
                                                            isMobile={isMobile}
                                                        />
                                                    </motion.div>
                                                );
                                            }

                                            // Case 2: Error
                                            if (error) {
                                                return (
                                                    <motion.div
                                                        key={`error-${index}`}
                                                        layout
                                                        className="w-full"
                                                    >
                                                        <ActionablePolaroidCard
                                                            type="output"
                                                            caption={t('common_error')}
                                                            status="error"
                                                            error={error}
                                                            isMobile={isMobile}
                                                        />
                                                    </motion.div>
                                                );
                                            }

                                            // Case 3: Pending
                                            if (isLoading || appState.stage === 'generating') {
                                                const aspectRatioClass = (() => {
                                                    switch (appState.options.aspectRatio) {
                                                        case '16:9': return 'aspect-video';
                                                        case '9:16': return 'aspect-[9/16]';
                                                        case '4:3': return 'aspect-[4/3]';
                                                        case '3:4': return 'aspect-[3/4]';
                                                        case '1:1':
                                                        default: return 'aspect-square';
                                                    }
                                                })();

                                                return (
                                                    <motion.div
                                                        className="w-full"
                                                        key={`pending-${index}`}
                                                    >
                                                        <div className={`${aspectRatioClass} w-full rounded-xl bg-neutral-900/50 border border-neutral-700 flex flex-col items-center justify-center gap-2 relative overflow-hidden shadow-lg`}>
                                                            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin relative z-10" />
                                                            <p className="text-neutral-300 text-xs font-bold relative z-10">{t('templateComposer_creating')}</p>
                                                            <p className="text-neutral-500 text-[10px] relative z-10">{t('templateComposer_resultCaption', index + 1)}</p>
                                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-pulse" />
                                                        </div>
                                                    </motion.div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 mt-4 justify-center w-full border-t border-neutral-700/50 pt-4">
                                        {isLoading ? (
                                            <button
                                                onClick={() => onStateChange({ ...appState, stage: 'configuring', error: null })}
                                                className="px-6 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm"
                                            >
                                                Hủy
                                            </button>
                                        ) : (
                                            <>
                                                {appState.historicalImages.length > 0 && !appState.error && (
                                                    <button onClick={handleDownloadAll} className="px-6 py-2 bg-blue-600/80 text-white rounded-full hover:bg-blue-500 transition-colors text-sm">{t('common_downloadAll')}</button>
                                                )}
                                                <button
                                                    onClick={handleBackToOptions}
                                                    className="px-6 py-2 bg-neutral-600 cursor-pointer text-white rounded-full hover:bg-neutral-500 transition-colors text-sm"
                                                >
                                                    {t('common_edit')}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        onStateChange(getInitialStateForApp('template-composer') as TemplateComposerState);
                                                        setGenerationErrors({});
                                                    }}
                                                    className="px-6 py-2 bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-600 hover:to-orange-400 text-white rounded-full cursor-pointer transition-colors text-sm"
                                                >
                                                    {t('common_startOver')}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    {/* Global Error fallback */}
                                    {appState.error && !Object.keys(generationErrors).length && !isLoading && (
                                        <div className="w-full text-center mt-2 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                                            {appState.error}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <Lightbox
                images={lightboxImages}
                selectedIndex={lightboxIndex}
                onClose={closeLightbox}
                onNavigate={navigateLightbox}
            />
        </div>
    );
};

export default TemplateComposer;
