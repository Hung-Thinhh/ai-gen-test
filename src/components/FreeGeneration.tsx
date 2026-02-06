/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { ChangeEvent, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { editImageWithPrompt, enhancePrompt } from '../services/geminiService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import { processApiError, GeminiErrorCodes, GeminiError } from '@/services/gemini/baseService';
import { generateFreeImage } from '@/services/gemini/freeGenerationService';
import Lightbox from './Lightbox';
import {
    AppScreenHeader,
    handleFileUpload,
    useMediaQuery,
    ImageForZip,
    ResultsView,
    OptionsPanel,
    type FreeGenerationState,
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

interface FreeGenerationProps {
    mainTitle: string;
    subtitle: string;
    useSmartTitleWrapping: boolean;
    smartTitleWrapWords: number;
    uploaderCaption1: string;
    uploaderDescription1: string;
    uploaderCaption2: string;
    uploaderDescription2: string;
    uploaderCaption3: string;
    uploaderDescription3: string;
    uploaderCaption4: string;
    uploaderDescription4: string;
    addImagesToGallery: (images: string[], persist?: boolean) => void;
    appState: FreeGenerationState;
    onStateChange: (newState: FreeGenerationState) => void;
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

const FreeGeneration: React.FC<FreeGenerationProps> = (props) => {
    const {
        uploaderCaption1, uploaderDescription1,
        uploaderCaption2, uploaderDescription2,
        uploaderCaption3, uploaderDescription3,
        uploaderCaption4, uploaderDescription4,
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
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [shouldEnhancePrompt, setShouldEnhancePrompt] = useState(false);
    const [generationErrors, setGenerationErrors] = useState<Record<number, string>>({});

    // Refs to track accumulation during async generation
    const generationResults = React.useRef<string[]>([]);
    const generationErrorsRef = React.useRef<Record<number, string>>({});

    useEffect(() => {
        setLocalPrompt(appState.options.prompt);
    }, [appState.options.prompt]);

    // Auto-fill prompt from Prompt Library
    useEffect(() => {
        const selectedPrompt = sessionStorage.getItem('selectedPrompt');
        if (selectedPrompt) {
            console.log('[FreeGeneration] Auto-filling prompt from library:', selectedPrompt);
            setLocalPrompt(selectedPrompt);
            onStateChange({
                ...appState,
                options: {
                    ...appState.options,
                    prompt: selectedPrompt
                }
            });
            // Clear from sessionStorage after using
            sessionStorage.removeItem('selectedPrompt');
        }
    }, []); // Run only once on mount

    // Auto-fill prompt and uploaded image from Hero section
    useEffect(() => {
        const heroPrompt = sessionStorage.getItem('heroPrompt');
        const heroUploadedImage = sessionStorage.getItem('heroUploadedImage');

        if (heroPrompt) {
            console.log('[FreeGeneration] Auto-filling prompt from hero:', heroPrompt);
            setLocalPrompt(heroPrompt);
            const newState: FreeGenerationState = {
                ...appState,
                options: {
                    ...appState.options,
                    prompt: heroPrompt
                }
            };

            // If there's an uploaded image from hero, set it as image1
            if (heroUploadedImage) {
                console.log('[FreeGeneration] Setting uploaded image from hero');
                newState.image1 = heroUploadedImage;
            }

            onStateChange(newState);

            // Clear from sessionStorage after using
            sessionStorage.removeItem('heroPrompt');
            sessionStorage.removeItem('heroUploadedImage');
        }
    }, []); // Run only once on mount




    const lightboxImages = [appState.image1, appState.image2, appState.image3, appState.image4, ...appState.historicalImages].filter((img): img is string => !!img);

    const handleImageUpload = (imageKey: 'image1' | 'image2' | 'image3' | 'image4') => (e: ChangeEvent<HTMLInputElement>) => {
        handleFileUpload(e, (imageDataUrl) => {
            onStateChange({
                ...appState,
                [imageKey]: imageDataUrl,
                generatedImages: [],
                historicalImages: [],
                error: null,
            });
            // REMOVED: addImagesToGallery([imageDataUrl]); // Don't save input images to Cloudinary
        });
    };

    const handleSaveImage = (imageKey: 'image1' | 'image2' | 'image3' | 'image4') => (newUrl: string | null) => {
        onStateChange({
            ...appState,
            [imageKey]: newUrl,
            // Reset state on new image upload or change
            generatedImages: [],
            historicalImages: [],
            error: null
        });
        // REMOVED: Don't save input images to gallery automatically
        // if (newUrl) {
        //     addImagesToGallery([newUrl]);
        // }
    };

    const handleSaveGeneratedImage = (index: number) => (newUrl: string | null) => {
        if (!newUrl) return; // Verify logic: if null, do we remove it? For now assume we don't save nulls back to generated list easily.
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

    const handleOptionChange = (field: keyof FreeGenerationState['options'], value: string | boolean | number) => {
        onStateChange({
            ...appState,
            options: { ...appState.options, [field]: value }
        });
    };

    const handleGenerate = async () => {
        // Strict login check removed to allow Guest access with credits
        if (!localPrompt.trim()) {
            onStateChange({ ...appState, error: "Vui lòng nhập prompt để tạo ảnh." });
            return;
        }

        let finalPrompt = localPrompt;
        if (shouldEnhancePrompt) {
            setIsEnhancing(true);
            if (!await checkCredits()) {
                setIsEnhancing(false);
                return;
            }
            try {
                const enhanced = await enhancePrompt(localPrompt);
                finalPrompt = enhanced;
                setLocalPrompt(enhanced);
            } catch (err) {
                toast.error(t('freeGeneration_enhanceError'));
            } finally {
                setIsEnhancing(false);
            }
        }

        // Check credits FIRST
        const creditCostPerImage = modelVersion === 'v3' ? 2 * appState.options.numberOfImages : 1 * appState.options.numberOfImages;
        if (!await checkCredits(creditCostPerImage)) {
            return;
        }

        // Initialize streaming state
        const count = appState.options.numberOfImages;
        const initialImages = new Array(count).fill(''); // Placeholders
        generationResults.current = new Array(count).fill('');
        generationErrorsRef.current = {};
        setGenerationErrors({});

        // Track async processing of each image (embedding metadata, updating UI)
        const processingPromises: Promise<void>[] = [];

        // Save pre-gen state for metadata
        const preGenState = { ...appState, options: { ...appState.options, prompt: finalPrompt } };

        // Start "Generating" stage with empty/pending slots
        onStateChange({ ...preGenState, stage: 'generating', error: null, generatedImages: initialImages });

        try {
            await generateFreeImage(
                finalPrompt,
                count,
                appState.options.aspectRatio,
                appState.image1 || undefined,
                appState.image2 || undefined,
                appState.image3 || undefined,
                appState.image4 || undefined,
                appState.options.removeWatermark,
                'free-generation',
                // onImageReady
                (index, rawUrl) => {
                    const processTask = async () => {
                        try {
                            const settingsToEmbed = {
                                viewId: 'free-generation',
                                state: { ...preGenState, stage: 'configuring', generatedImages: [], historicalImages: [], error: null },
                            };

                            const urlWithMetadata = await embedJsonInPng(rawUrl, settingsToEmbed, settings.enableImageMetadata);

                            // Update refs
                            generationResults.current[index] = urlWithMetadata;

                            // Immediately update UI with this new image
                            // Note: use functional update logic mechanism if needed, but here we construct new array from ref
                            // We need to preserve OTHER images/placeholders in their current state
                            const currentImagesSnapshot = [...generationResults.current].map(u => u || '');

                            onStateChange({
                                ...preGenState,
                                stage: 'generating', // Keep generating until totally finished or handle "Result" stage mixed? 
                                // Actually we switched rendering logic to handle Mixed states, so 'generating' is fine as long as `generatedImages` has data
                                generatedImages: currentImagesSnapshot,
                                // Keep history updated? No, update history at end to avoid flicker
                            });

                        } catch (e) {
                            console.error("Error processing generated image metadata:", e);
                            // Fallback to raw URL if embedding fails
                            generationResults.current[index] = rawUrl;
                            const currentImagesSnapshot = [...generationResults.current].map(u => u || '');
                            onStateChange({ ...preGenState, stage: 'generating', generatedImages: currentImagesSnapshot });
                        }
                    };
                    processingPromises.push(processTask());
                },
                // onImageError
                (index, error) => {
                    const errorMsg = error instanceof Error ? error.message : "Generation failed";
                    generationErrorsRef.current[index] = errorMsg;
                    setGenerationErrors({ ...generationErrorsRef.current });
                }
            );

            // Wait for all processing to complete (metadata embedding etc)
            await Promise.all(processingPromises);

            // Finalize
            const validImages = generationResults.current.filter(url => url && url.length > 0);

            if (validImages.length > 0) {
                const creditCost = modelVersion === 'v3' ? 2 * validImages.length : 1 * validImages.length;

                onStateChange({
                    ...preGenState,
                    stage: 'results',
                    generatedImages: [...generationResults.current].map(u => u || ''), // Ensure we keep empty strings for failed slots if we want to show errors there
                    historicalImages: limitHistoricalImages(appState.historicalImages, validImages),
                    error: null
                });

                refreshGallery();

            } else {
                // All failed?
                // Check errors
                const errorCount = Object.keys(generationErrorsRef.current).length;
                if (errorCount > 0) {
                    // Stay in 'results' stage (our UI logic handles errors per slot)
                    // But we might want to set a global error text if needed, or just let slots show errors
                    onStateChange({
                        ...preGenState,
                        stage: 'results',
                        generatedImages: initialImages, // All failed
                        error: null // Clear global error, let individual errors show
                    });
                } else {
                    // No images, no errors? (Shouldn't happen)
                    onStateChange({ ...preGenState, stage: 'results', error: "No images generated." });
                }
            }

        } catch (err: any) {
            let error = processApiError(err);

            // Handle Insufficient Credits
            if (error instanceof GeminiError && error.code === GeminiErrorCodes.INSUFFICIENT_CREDITS) {
                toast.error(error.message);
                onStateChange({
                    ...preGenState,
                    stage: 'configuring',
                    error: null
                });
            } else {
                // Global error (e.g. setup failed, safety, refusal)
                onStateChange({
                    ...preGenState,
                    stage: 'results',
                    error: error.message
                });
            }
        }
    };

    const handleRegeneration = async (index: number, prompt: string) => {
        const url = appState.generatedImages[index];
        if (!url) return;

        const originalGeneratedImages = [...appState.generatedImages];
        const preGenState = { ...appState };

        // Immediate feedback
        onStateChange({ ...appState, stage: 'generating', error: null });

        if (!await checkCredits()) {
            // Revert if failed
            onStateChange({ ...appState, stage: 'results' });
            return;
        }

        try {
            const resultUrl = await editImageWithPrompt(url, prompt, undefined, appState.options.removeWatermark, 'free-generation');
            const settingsToEmbed = {
                viewId: 'free-generation',
                state: { ...appState, stage: 'configuring', generatedImages: [], historicalImages: [], error: null },
            };
            const urlWithMetadata = await embedJsonInPng(resultUrl, settingsToEmbed, settings.enableImageMetadata);
            const creditCost = modelVersion === 'v3' ? 2 : 1;
            const newGeneratedImages = [...originalGeneratedImages];
            newGeneratedImages[index] = urlWithMetadata;

            onStateChange({
                ...appState,
                stage: 'results',
                generatedImages: newGeneratedImages,
                historicalImages: limitHistoricalImages(appState.historicalImages, [urlWithMetadata]),
            });
            refreshGallery();
        } catch (err: any) {
            let error = processApiError(err);

            // Check if it's an insufficient credit error to handle gracefully (e.g. show toast)
            // Otherwise set global error
            if (error instanceof GeminiError && error.code === GeminiErrorCodes.INSUFFICIENT_CREDITS) {
                toast.error(error.message);
                onStateChange({ ...appState, stage: 'results', error: null, generatedImages: originalGeneratedImages });
            } else {
                onStateChange({ ...appState, stage: 'results', error: error.message, generatedImages: originalGeneratedImages });
            }
        }
    };

    const handleBackToOptions = () => {
        onStateChange({ ...appState, stage: 'configuring', error: null, generatedImages: [] });
    };

    const handleDownloadAll = () => {
        const inputImages: ImageForZip[] = [];
        if (appState.image1) inputImages.push({ url: appState.image1, filename: 'anh-goc-1', folder: 'input' });
        if (appState.image2) inputImages.push({ url: appState.image2, filename: 'anh-goc-2', folder: 'input' });
        if (appState.image3) inputImages.push({ url: appState.image3, filename: 'anh-goc-3', folder: 'input' });
        if (appState.image4) inputImages.push({ url: appState.image4, filename: 'anh-goc-4', folder: 'input' });

        processAndDownloadAll({
            inputImages,
            historicalImages: appState.historicalImages,
            videoTasks,
            zipFilename: 'ket-qua-tao-anh-tu-do.zip',
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

    const isLoading = appState.stage === 'generating' || isEnhancing;
    const getButtonText = () => {
        if (isEnhancing) return t('freeGeneration_enhancing');
        if (appState.stage === 'generating') return t('common_creating');
        return t('freeGeneration_createButton');
    };

    const anyImageUploaded = appState.image1 || appState.image2 || appState.image3 || appState.image4;

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
                            <Uploader
                                id="free-gen-upload-1"
                                onImageChange={handleSaveImage('image1')}
                                caption={uploaderCaption1}
                                description={uploaderDescription1}
                                currentImage={appState.image1}
                                placeholderType="magic"
                            />
                            <AnimatePresence>
                                {appState.image1 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                                        <Uploader
                                            id="free-gen-upload-2"
                                            onImageChange={handleSaveImage('image2')}
                                            caption={uploaderCaption2}
                                            description={uploaderDescription2}
                                            currentImage={appState.image2}
                                            placeholderType="magic"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <AnimatePresence>
                                {appState.image2 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                                        <Uploader
                                            id="free-gen-upload-3"
                                            onImageChange={handleSaveImage('image3')}
                                            caption={uploaderCaption3}
                                            description={uploaderDescription3}
                                            currentImage={appState.image3}
                                            placeholderType="magic"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <AnimatePresence>
                                {appState.image3 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                                        <Uploader
                                            id="free-gen-upload-4"
                                            onImageChange={handleSaveImage('image4')}
                                            caption={uploaderCaption4}
                                            description={uploaderDescription4}
                                            currentImage={appState.image4}
                                            placeholderType="magic"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <OptionsPanel>
                        <h2 className="base-font font-bold text-2xl text-orange-500 border-b border-orange-500/30 pb-2">{t('freeGeneration_promptTitle')}</h2>

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
                                placeholder={t('freeGeneration_promptPlaceholder')}
                                className="form-input !h-32 border-neutral-700 focus:border-orange-500 focus:ring-orange-500"
                                rows={5}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="number-of-images" className="block text-left base-font font-bold text-lg text-neutral-200 mb-2">
                                    {t('freeGeneration_numImagesLabel')}
                                </label>
                                <select
                                    id="number-of-images"
                                    value={appState.options.numberOfImages}
                                    onChange={(e) => handleOptionChange('numberOfImages', parseInt(e.target.value, 10))}
                                    className="form-input border-neutral-700 focus:border-orange-500 focus:ring-orange-500"
                                    aria-label={t('freeGeneration_numImagesAriaLabel')}
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

                        {/* <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="remove-watermark-free"
                                    checked={appState.options.removeWatermark}
                                    onChange={(e) => handleOptionChange('removeWatermark', e.target.checked)}
                                    className="h-4 w-4 rounded border-neutral-500 bg-neutral-700 text-orange-500 focus:ring-orange-500 focus:ring-offset-neutral-800"
                                    aria-label={t('common_removeWatermark')}
                                />
                                <label htmlFor="remove-watermark-free" className="ml-3 block text-sm font-medium text-neutral-300">
                                    {t('common_removeWatermark')}
                                </label>
                            </div>
                            <div className="flex items-center">
                                <Switch
                                    id="enhance-prompt-switch"
                                    checked={shouldEnhancePrompt}
                                    onChange={setShouldEnhancePrompt}
                                    className="data-[state=checked]:bg-orange-500"
                                />
                                <label htmlFor="enhance-prompt-switch" className="ml-3 block text-sm font-medium text-neutral-300 flex items-center gap-1.5">
                                    <MagicWandIcon className="h-4 w-4 text-orange-400" />
                                    {t('freeGeneration_enhancePrompt')}
                                </label>
                            </div>
                        </div> */}

                        <div className="flex items-center justify-end gap-4 pt-4">
                            {anyImageUploaded && <button onClick={() => { onStateChange({ ...appState, image1: null, image2: null, image3: null, image4: null }) }} className="btn btn-secondary">
                                {t('common_deleteImages')}
                            </button>}
                            <button onClick={handleGenerate} className="btn btn-primary" disabled={isLoading || !localPrompt.trim()}>
                                {getButtonText()}
                            </button>
                        </div >
                    </OptionsPanel >
                </motion.div >
            )}

            {
                (appState.stage === 'generating' || appState.stage === 'results') && (
                    <div className="w-full flex-1 flex flex-col items-center pt-12">
                        {/* Title */}
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold text-white mb-2">Kết quả</h2>
                            <p className="text-neutral-400">{isLoading ? "Đang tạo ảnh..." : "Đã tạo xong!"}</p>
                        </div>

                        <div className="w-full max-w-6xl px-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* LEFT COLUMN: Inputs */}
                                <div className="themed-card backdrop-blur-md p-4 rounded-2xl flex flex-col items-center gap-4 h-fit">
                                    <h3 className="text-lg font-bold text-orange-400">Ảnh gốc</h3>
                                    <div className="grid grid-cols-1 gap-4 w-full">
                                        {[appState.image1, appState.image2, appState.image3, appState.image4].map((img, idx) => {
                                            if (!img) return null;
                                            return (
                                                <div key={idx} className="w-full flex flex-col items-center">
                                                    <div className="w-full max-w-xs">
                                                        <ActionablePolaroidCard
                                                            type="display"
                                                            mediaUrl={img}
                                                            caption={t(`freeGeneration_originalImage${idx + 1}Caption`)}
                                                            status="done"
                                                            onClick={() => openLightbox(lightboxImages.indexOf(img))}
                                                            isMobile={isMobile}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {![appState.image1, appState.image2, appState.image3, appState.image4].some(Boolean) && (
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
                                                            caption={t('freeGeneration_resultCaption', index + 1)}
                                                            status={'done'}
                                                            mediaUrl={url}
                                                            onClick={() => openLightbox(lightboxImages.indexOf(url))}
                                                            onRegenerate={(prompt) => handleRegeneration(index, prompt)}
                                                            onGenerateVideoFromPrompt={(prompt) => generateVideo(url, prompt)}
                                                            onImageChange={handleSaveGeneratedImage(index)}
                                                            regenerationTitle={t('freeGeneration_regenTitle')}
                                                            regenerationDescription={t('freeGeneration_regenDescription')}
                                                            regenerationPlaceholder={t('freeGeneration_regenPlaceholder')}
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
                                                            <p className="text-neutral-300 text-xs font-bold relative z-10">{t('common_creating')}</p>
                                                            <p className="text-neutral-500 text-[10px] relative z-10">{t('freeGeneration_resultCaption', index + 1)}</p>
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
                                                        onStateChange(getInitialStateForApp('free-generation') as FreeGenerationState);
                                                        setGenerationErrors([]);
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
        </div >
    );
};

export default FreeGeneration;