/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { ChangeEvent, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateFreeImage, editImageWithPrompt, enhancePrompt } from '../services/geminiService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
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

    const { t, settings, checkCredits, modelVersion, isLoggedIn, openLoginModal } = useAppControls();

    const { videoTasks, generateVideo } = useVideoGeneration();
    const { lightboxIndex, openLightbox, closeLightbox, navigateLightbox } = useLightbox();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [localPrompt, setLocalPrompt] = useState(appState.options.prompt);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [shouldEnhancePrompt, setShouldEnhancePrompt] = useState(false);

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
        if (newUrl) {
            addImagesToGallery([newUrl]);
        }
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
        // Backend API will validate guest credits via Guest-ID header

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
                // Update local UI state to show the user the enhanced prompt that was used
                setLocalPrompt(enhanced);
                // No need to call onStateChange here, as it will be part of the main state update below
            } catch (err) {
                toast.error(t('freeGeneration_enhanceError'));
                // Proceed with the original prompt if enhancement fails
            } finally {
                setIsEnhancing(false);
            }
        }

        // Check credits FIRST before entering generating stage
        const creditCostPerImage = modelVersion === 'v3' ? 2 * appState.options.numberOfImages : 1 * appState.options.numberOfImages;
        if (!await checkCredits(creditCostPerImage)) {
            // Don't change stage - stay in configuring
            return;
        }

        // Only set generating stage AFTER credits are confirmed
        onStateChange({ ...appState, stage: 'generating', error: null, generatedImages: [] });

        const preGenState = { ...appState, options: { ...appState.options, prompt: finalPrompt } };
        onStateChange({ ...preGenState, stage: 'generating', error: null, generatedImages: [] });

        try {
            const resultUrls = await generateFreeImage(
                finalPrompt,
                appState.options.numberOfImages,
                appState.options.aspectRatio,
                appState.image1 || undefined,
                appState.image2 || undefined,
                appState.image3 || undefined,
                appState.image4 || undefined,
                appState.options.removeWatermark,
                'free-generation'
            );

            const settingsToEmbed = {
                viewId: 'free-generation',
                state: { ...preGenState, stage: 'configuring', generatedImages: [], historicalImages: [], error: null },
            };

            const urlsWithMetadata = await Promise.all(
                resultUrls.map(url => embedJsonInPng(url, settingsToEmbed, settings.enableImageMetadata))
            );

            if (urlsWithMetadata.length > 0) {
                const creditCost = modelVersion === 'v3' ? 2 * urlsWithMetadata.length : 1 * urlsWithMetadata.length;

                // DEBUG: Verify we're passing R2 URLs
                console.log('[FreeGen] Logging to history with R2 URLs:', resultUrls);

                logGeneration('free-generation', preGenState, urlsWithMetadata[0], {
                    credits_used: creditCost,
                    api_model_used: modelVersion === 'v3' ? 'imagen-3.0-generate-001' : 'gemini-2.5-flash-image',
                    generation_count: urlsWithMetadata.length,
                    output_images: resultUrls, // Use R2 URLs instead of base64
                    input_prompt: finalPrompt
                });
            }

            onStateChange({
                ...preGenState,
                stage: 'results',
                generatedImages: urlsWithMetadata,
                historicalImages: limitHistoricalImages(appState.historicalImages, urlsWithMetadata),
            });
            addImagesToGallery(resultUrls, false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";

            // If out of credits, reset to configuring stage (remove loading)
            if (errorMessage.includes('hết Credit') || errorMessage.includes('Insufficient credits')) {
                onStateChange({
                    ...preGenState,
                    stage: 'configuring',
                    error: null
                });
            } else {
                // Other errors: show in results stage
                onStateChange({
                    ...preGenState,
                    stage: 'results',
                    error: errorMessage
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
            logGeneration('free-generation', preGenState, urlWithMetadata, {
                credits_used: creditCost,
                api_model_used: modelVersion === 'v3' ? 'imagen-3.0-generate-001' : 'gemini-2.5-flash-image',
                generation_count: 1,
                output_images: [resultUrl], // Use R2 URL instead of base64
                input_prompt: prompt
            });

            const newGeneratedImages = [...originalGeneratedImages];
            newGeneratedImages[index] = urlWithMetadata;

            onStateChange({
                ...appState,
                stage: 'results',
                generatedImages: newGeneratedImages,
                historicalImages: limitHistoricalImages(appState.historicalImages, [urlWithMetadata]),
            });
            addImagesToGallery([urlWithMetadata]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            onStateChange({ ...appState, stage: 'results', error: errorMessage, generatedImages: originalGeneratedImages });
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
            <div className="cursor-pointer group transform hover:scale-105 transition-transform duration-300">
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

                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
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
                        </div>

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
                    <ResultsView
                        stage={appState.stage}
                        inputImages={[
                            appState.image1 ? { url: appState.image1, caption: t('freeGeneration_originalImage1Caption'), onClick: () => openLightbox(lightboxImages.indexOf(appState.image1!)) } : null,
                            appState.image2 ? { url: appState.image2, caption: t('freeGeneration_originalImage2Caption'), onClick: () => openLightbox(lightboxImages.indexOf(appState.image2!)) } : null,
                            appState.image3 ? { url: appState.image3, caption: t('freeGeneration_originalImage3Caption'), onClick: () => openLightbox(lightboxImages.indexOf(appState.image3!)) } : null,
                            appState.image4 ? { url: appState.image4, caption: t('freeGeneration_originalImage4Caption'), onClick: () => openLightbox(lightboxImages.indexOf(appState.image4!)) } : null,
                        ].filter((item): item is { url: string; caption: string; onClick: () => void; } => item !== null)}
                        error={appState.error}
                        isMobile={isMobile}
                        actions={(
                            <>
                                {appState.historicalImages.length > 0 && !appState.error && (
                                    <button onClick={handleDownloadAll} className="btn btn-secondary">{t('common_downloadAll')}</button>
                                )}
                                <button onClick={handleBackToOptions} className="btn btn-secondary">{t('common_edit')}</button>
                                <button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button>
                            </>
                        )}
                    >
                        {
                            isLoading && !isEnhancing ?
                                Array.from({ length: appState.options.numberOfImages }).map((_, index) => (
                                    <motion.div
                                        className="w-full md:w-auto flex-shrink-0"
                                        key={`pending-${index}`}
                                    // initial={{ opacity: 0, scale: 0.5, y: 100 }}
                                    // animate={{ opacity: 1, scale: 1, y: 0 }}
                                    // transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.2 + index * 0.1 }}
                                    >
                                        <ActionablePolaroidCard type="output" caption={t('freeGeneration_resultCaption', index + 1)} status="pending" />
                                    </motion.div>
                                ))
                                :
                                appState.generatedImages.map((url, index) => (
                                    <motion.div
                                        className="w-full md:w-auto flex-shrink-0"
                                        key={url}
                                    // initial={{ opacity: 0, scale: 0.5, y: 100 }}
                                    // animate={{ opacity: 1, scale: 1, y: 0 }}
                                    // transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.2 + index * 0.1 }}
                                    // whileHover={{ scale: 1.05, zIndex: 10 }}
                                    >
                                        <ActionablePolaroidCard
                                            type="output"
                                            caption={t('freeGeneration_resultCaption', index + 1)}
                                            status={'done'}
                                            mediaUrl={url}
                                            onGenerateVideoFromPrompt={(prompt) => generateVideo(url, prompt)}
                                            onImageChange={handleSaveGeneratedImage(index)}
                                            onRegenerate={(prompt) => handleRegeneration(index, prompt)}
                                            regenerationTitle={t('freeGeneration_regenTitle')}
                                            regenerationDescription={t('freeGeneration_regenDescription')}
                                            regenerationPlaceholder={t('freeGeneration_regenPlaceholder')}
                                            onClick={() => openLightbox(lightboxImages.indexOf(url))}
                                            isMobile={isMobile}
                                        />
                                    </motion.div>
                                ))
                        }
                        {appState.historicalImages.map(sourceUrl => {
                            const videoTask = videoTasks[sourceUrl];
                            if (!videoTask) return null;
                            return (
                                <motion.div
                                    className="w-full md:w-auto flex-shrink-0"
                                    key={`${sourceUrl}-video`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                                >
                                    <ActionablePolaroidCard
                                        type="output"
                                        caption={t('common_video')}
                                        status={videoTask.status}
                                        mediaUrl={videoTask.resultUrl}
                                        error={videoTask.error}
                                        onClick={videoTask.resultUrl ? () => openLightbox(lightboxImages.indexOf(videoTask.resultUrl!)) : undefined}
                                        isMobile={isMobile}
                                    />
                                </motion.div>
                            );
                        })}
                        {appState.error && !isLoading && (
                            <motion.div
                                className="w-full md:w-full flex-shrink-0"
                                key="error-card"
                                initial={{ opacity: 0, scale: 0.5, y: 100 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                            >
                                <ActionablePolaroidCard
                                    type="output"
                                    caption={t('common_error')}
                                    status="error"
                                    error={appState.error}
                                    isMobile={isMobile}
                                />
                            </motion.div>
                        )}

                    </ResultsView>
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