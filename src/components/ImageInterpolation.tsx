/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, ChangeEvent, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeImagePairForPrompt, analyzeImagePairForPromptExpert, editImageWithPrompt, interpolatePrompts, adaptPromptToContext } from '../services/geminiService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import Lightbox from './Lightbox';
import {
    AppScreenHeader,
    ImageForZip,
    ResultsView,
    type ImageInterpolationState,
    useLightbox,
    OptionsPanel,
    PromptResultCard,
    useVideoGeneration,
    processAndDownloadAll,
    embedJsonInPng,
    getInitialStateForApp,
    useAppControls,
} from './uiUtils';

interface ImageInterpolationProps {
    mainTitle: string;
    subtitle: string;
    useSmartTitleWrapping: boolean;
    smartTitleWrapWords: number;
    uploaderCaptionInput: string;
    uploaderDescriptionInput: string;
    uploaderCaptionOutput: string;
    uploaderDescriptionOutput: string;
    uploaderCaptionReference: string;
    uploaderDescriptionReference: string;
    addImagesToGallery: (images: string[]) => void;
    appState: ImageInterpolationState;
    onStateChange: (newState: ImageInterpolationState) => void;
    onReset: () => void;
    onGoBack: () => void;
    logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: {
        api_model_used?: string;
        credits_used?: number;
        generation_count?: number;
    }) => void;
}

const ASPECT_RATIO_OPTIONS = ['Giữ nguyên', '1:1', '2:3', '4:5', '9:16', '1:2', '3:2', '5:4', '16:9', '2:1'];

const ImageInterpolation: React.FC<ImageInterpolationProps> = (props) => {
    const {
        uploaderCaptionInput, uploaderDescriptionInput,
        uploaderCaptionOutput, uploaderDescriptionOutput,
        uploaderCaptionReference, uploaderDescriptionReference,
        addImagesToGallery, appState, onStateChange, onReset,
        logGeneration,
        ...headerProps
    } = props;

    const { t, settings, checkCredits, modelVersion } = useAppControls();
    const { lightboxIndex, openLightbox, closeLightbox, navigateLightbox } = useLightbox();
    const { videoTasks, generateVideo } = useVideoGeneration();
    const [localGeneratedPrompt, setLocalGeneratedPrompt] = useState(appState.generatedPrompt);
    const [localAdditionalNotes, setLocalAdditionalNotes] = useState(appState.additionalNotes);
    const lightboxImages = [appState.sourceImage, appState.referenceImage, ...appState.historicalImages.map(h => h.url)].filter((img): img is string => !!img);

    const appStateRef = useRef(appState);
    useEffect(() => {
        appStateRef.current = appState;
    });

    useEffect(() => {
        setLocalGeneratedPrompt(appState.generatedPrompt);
    }, [appState.generatedPrompt]);

    useEffect(() => {
        setLocalAdditionalNotes(appState.additionalNotes);
    }, [appState.additionalNotes]);

    const handleSourceImageChange = (url: string | null) => {
        if (!url) return;
        const currentAppState = appStateRef.current;
        onStateChange({
            ...currentAppState,
            sourceImage: url,
            generatedPrompt: '',
            promptSuggestions: '',
            analysisMode: null,
            finalPrompt: null,
            generatedImage: null,
            referenceImage: null,
            historicalImages: [],
            error: null,
            stage: 'idle',
        });
        addImagesToGallery([url]);
    };

    // Removed handleOutputImageChange - no longer needed

    const handleReferenceImageChange = (url: string | null) => {
        if (!url) return;
        onStateChange({ ...appState, referenceImage: url });
        addImagesToGallery([url]);
    };

    const handleGeneratedImageChange = (newUrl: string | null) => {
        if (!newUrl) return;
        const newHistorical = [...appState.historicalImages, { url: newUrl, prompt: appState.finalPrompt || '' }];
        onStateChange({ ...appState, stage: 'results', generatedImage: newUrl, historicalImages: newHistorical });
        addImagesToGallery([newUrl]);
    };

    const handleOptionChange = (field: keyof ImageInterpolationState['options'], value: string | boolean) => {
        onStateChange({
            ...appState,
            options: { ...appState.options, [field]: value }
        });
    };

    const handleAnalyzeClick = async (mode: 'quick' | 'expert') => {
        if (!appState.sourceImage) return;

        onStateChange({ ...appStateRef.current, stage: 'analyzing', error: null, analysisMode: mode });
        try {
            let result;
            if (mode === 'expert') {
                result = await analyzeImagePairForPromptExpert(appState.sourceImage);
            } else {
                result = await analyzeImagePairForPrompt(appState.sourceImage);
            }
            onStateChange({ ...appStateRef.current, stage: 'prompt-ready', generatedPrompt: result.mainPrompt, promptSuggestions: result.suggestions || '' });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            onStateChange({ ...appStateRef.current, stage: 'idle', generatedPrompt: '', promptSuggestions: '', error: t('imageInterpolation_analysisError', errorMessage) });
        }
    };

    const handleProceedToGeneration = () => {
        onStateChange({ ...appStateRef.current, stage: 'configuring' });
    };

    const handleGenerate = async () => {
        const referenceImageToUse = appState.referenceImage || appState.sourceImage;
        if (!referenceImageToUse || !appState.generatedPrompt) return;

        // Check credits FIRST
        const preGenState = { ...appState };
        const creditCostPerImage = modelVersion === 'v3' ? 2 : 1;
        if (!await checkCredits(creditCostPerImage)) {
            return; // Stay in configuring
        }

        // Set generating stage AFTER credits confirmed
        onStateChange({ ...appState, stage: 'generating', error: null, finalPrompt: null });

        const skipAdaptation = !appState.referenceImage && !appState.additionalNotes.trim();
        let finalPromptText = '';

        try {
            if (skipAdaptation) {
                finalPromptText = appState.generatedPrompt;
            } else {
                let intermediatePrompt = appState.generatedPrompt;
                if (appState.additionalNotes.trim()) {
                    intermediatePrompt = await interpolatePrompts(appState.generatedPrompt, appState.additionalNotes);
                }
                finalPromptText = await adaptPromptToContext(referenceImageToUse, intermediatePrompt);
            }

            const resultUrl = await editImageWithPrompt(
                referenceImageToUse,
                finalPromptText,
                appState.options.aspectRatio,
                appState.options.removeWatermark,
                'image-interpolation'
            );

            const settingsToEmbed = {
                viewId: 'image-interpolation',
                state: { ...appState, stage: 'configuring', finalPrompt: null, generatedImage: null, historicalImages: [], error: null },
            };
            const urlWithMetadata = await embedJsonInPng(resultUrl, settingsToEmbed, settings.enableImageMetadata);
            logGeneration('image-interpolation', preGenState, urlWithMetadata, {
                credits_used: creditCostPerImage,
                generation_count: 1,
                api_model_used: modelVersion === 'v3' ? 'imagen-3.0-generate-001' : 'gemini-2.5-flash-image'
            });

            const newHistory = [...appState.historicalImages, { url: urlWithMetadata, prompt: finalPromptText }];

            onStateChange({
                ...appState,
                stage: 'results',
                generatedImage: urlWithMetadata,
                historicalImages: newHistory,
                finalPrompt: finalPromptText,
            });
            addImagesToGallery([urlWithMetadata]);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            onStateChange({
                ...appState,
                stage: 'results',
                error: errorMessage,
                finalPrompt: finalPromptText,
            });
        }
    };

    const handleRegeneration = async (prompt: string) => {
        if (!appState.generatedImage) return;

        // Check credits FIRST
        const preGenState = { ...appState };
        const creditCostPerImage = modelVersion === 'v3' ? 2 : 1;
        if (!await checkCredits(creditCostPerImage)) {
            return; // Stay in results
        }

        // Set generating stage AFTER credits confirmed
        onStateChange({ ...appState, stage: 'generating', error: null });

        try {
            const resultUrl = await editImageWithPrompt(
                appState.generatedImage,
                prompt,
                appState.options.aspectRatio,
                appState.options.removeWatermark,
                'image-interpolation'
            );

            const settingsToEmbed = {
                viewId: 'image-interpolation',
                state: { ...appState, stage: 'configuring', finalPrompt: null, generatedImage: null, historicalImages: [], error: null },
            };
            const urlWithMetadata = await embedJsonInPng(resultUrl, settingsToEmbed, settings.enableImageMetadata);
            logGeneration('image-interpolation', preGenState, urlWithMetadata, {
                credits_used: creditCostPerImage,
                generation_count: 1,
                api_model_used: modelVersion === 'v3' ? 'imagen-3.0-generate-001' : 'gemini-2.5-flash-image'
            });

            const newHistory = [...appState.historicalImages, { url: urlWithMetadata, prompt: prompt }];

            onStateChange({
                ...appState,
                stage: 'results',
                generatedImage: urlWithMetadata,
                historicalImages: newHistory,
                finalPrompt: prompt,
            });
            addImagesToGallery([urlWithMetadata]);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            onStateChange({
                ...appState,
                stage: 'results',
                error: errorMessage,
                finalPrompt: prompt,
            });
        }
    };

    const handleDownloadAll = () => {
        const inputImages: ImageForZip[] = [];
        if (appState.sourceImage) inputImages.push({ url: appState.sourceImage, filename: 'anh-goc', folder: 'input' });
        if (appState.referenceImage) inputImages.push({ url: appState.referenceImage, filename: 'anh-tham-chieu', folder: 'input' });

        processAndDownloadAll({
            inputImages,
            historicalImages: appState.historicalImages,
            videoTasks,
            zipFilename: 'ket-qua-trich-xuat-prompt.zip',
            baseOutputFilename: 'ket-qua',
        });
    };

    const isLoading = appState.stage === 'analyzing' || appState.stage === 'generating';
    const getAnalyzingText = () => {
        if (appState.stage !== 'analyzing') return '';
        return appState.analysisMode === 'expert'
            ? t('imageInterpolation_analyzingExpert')
            : t('imageInterpolation_analyzingGeneral');
    };

    const referenceImageToShow = appState.referenceImage || appState.sourceImage;

    const isAnalyzing = appState.stage === 'analyzing';
    const isConfiguringOrGenerating = appState.stage === 'configuring' || appState.stage === 'generating' || appState.stage === 'results';
    const showPromptDisplay = appState.stage === 'analyzing' || appState.stage === 'prompt-ready' || isConfiguringOrGenerating;
    const showGenerator = isConfiguringOrGenerating;

    // Explicitly cast stage for TS checks in render to avoid overlap errors
    const currentStage = appState.stage as string;

    return (
        <div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-screen">
            <AnimatePresence>
                {appState.stage !== 'results' && appState.stage !== 'generating' && (
                    <AppScreenHeader {...headerProps} />
                )}
            </AnimatePresence>

            {(appState.stage === 'idle' || showPromptDisplay) && (
                <motion.div className="flex flex-col items-center gap-6 w-full max-w-screen-2xl py-6 overflow-y-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div className="w-full pb-4 max-w-4xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-7xl mx-auto px-4">
                            {/* Source Image Upload */}
                            <div className="flex flex-col items-center gap-2">
                                <ActionablePolaroidCard
                                    type={appState.sourceImage ? 'content-input' : 'uploader'}
                                    caption={uploaderCaptionInput}
                                    status="done"
                                    mediaUrl={appState.sourceImage || undefined}
                                    placeholderType="magic"
                                    onImageChange={handleSourceImageChange}
                                />
                                <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">
                                    {uploaderDescriptionInput}
                                </p>
                            </div>

                            {/* Reference Image Upload - Show after prompt ready */}
                            <AnimatePresence>
                                {appState.stage === 'configuring' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        <ActionablePolaroidCard
                                            type={appState.referenceImage ? 'content-input' : 'uploader'}
                                            caption={uploaderCaptionReference}
                                            status="done"
                                            mediaUrl={appState.referenceImage || undefined}
                                            placeholderType="magic"
                                            onImageChange={handleReferenceImageChange}
                                        />
                                        <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">
                                            {uploaderDescriptionReference}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Analysis Buttons - Only show when image uploaded and not analyzing */}
                    {appState.sourceImage && (appState.stage === 'idle' || appState.stage === 'analyzing') && (
                        <div className="flex flex-col items-center mt-4 mx-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleAnalyzeClick('quick')}
                                    className="btn btn-secondary"
                                    disabled={appState.stage === 'analyzing'}
                                >
                                    {appState.stage === 'analyzing' && appState.analysisMode === 'quick'
                                        ? getAnalyzingText()
                                        : '⚡ Phân tích nhanh'}
                                </button>
                                <button
                                    onClick={() => handleAnalyzeClick('expert')}
                                    className="btn btn-secondary"
                                    disabled={appState.stage === 'analyzing'}
                                >
                                    {appState.stage === 'analyzing' && appState.analysisMode === 'expert'
                                        ? getAnalyzingText()
                                        : '🎯 Phân tích chuyên sâu'}
                                </button>
                            </div>
                            {appState.error && <p className="text-yellow-300 text-sm mt-2 max-w-md text-center">{appState.error}</p>}
                        </div>
                    )}

                    <AnimatePresence>
                        {showPromptDisplay && (
                            <motion.div
                                className="w-full flex justify-center mt-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                                exit={{ opacity: 0, y: 20 }}
                            >
                                <OptionsPanel className="max-w-4xl flex flex-col gap-8">
                                    <div className="space-y-4">
                                        <h2 className="base-font font-bold text-2xl text-yellow-400 border-b border-yellow-400/20 pb-2">{t('imageInterpolation_generatedPromptTitle')}</h2>
                                        {appState.stage === 'analyzing' ? (
                                            <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div></div>
                                        ) : (
                                            <>
                                                <div>
                                                    <label htmlFor="generated-prompt" className="block text-left base-font font-bold text-lg text-neutral-200 mb-2">{t('imageInterpolation_mainPromptLabel')}</label>
                                                    <textarea
                                                        id="generated-prompt"
                                                        value={localGeneratedPrompt}
                                                        onChange={(e) => setLocalGeneratedPrompt(e.target.value)}
                                                        onBlur={() => {
                                                            if (localGeneratedPrompt !== appState.generatedPrompt) {
                                                                onStateChange({ ...appState, generatedPrompt: localGeneratedPrompt });
                                                            }
                                                        }}
                                                        className="form-input !h-28"
                                                        rows={4}
                                                    />
                                                </div>

                                                {/* Button to proceed to generation */}
                                                {appState.stage === 'prompt-ready' && (
                                                    <div className="flex justify-center mt-4">
                                                        <button
                                                            onClick={handleProceedToGeneration}
                                                            className="btn btn-primary"
                                                        >
                                                            ✨ Tạo ảnh từ prompt này
                                                        </button>
                                                    </div>
                                                )}

                                                {appState.promptSuggestions && (
                                                    <div>
                                                        <h4 className="base-font font-bold text-lg text-neutral-200 mb-2">{t('imageInterpolation_suggestionsTitle')}</h4>
                                                        <div className="flex flex-col items-start gap-2">
                                                            {appState.promptSuggestions.split('\n').map((suggestion, index) => {
                                                                const cleanSuggestion = suggestion.replace(/^- /, '').trim();
                                                                if (!cleanSuggestion) return null;
                                                                return (
                                                                    <button
                                                                        key={index}
                                                                        onClick={() => onStateChange({ ...appState, additionalNotes: `${appState.additionalNotes.trim()} ${cleanSuggestion}`.trim() })}
                                                                        className="bg-neutral-700/60 text-neutral-300 text-sm px-3 py-1.5 rounded-md hover:bg-neutral-700 transition-colors text-left w-full"
                                                                        title={t('imageInterpolation_addSuggestionTooltip')}
                                                                    >
                                                                        {cleanSuggestion}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Generator Section - Only show when configuring or generating/results */}
                                    {showGenerator && (
                                        <div className="space-y-4 border-t border-neutral-700/50 pt-8">
                                            <h2 className="base-font font-bold text-2xl text-yellow-400 border-b border-yellow-400/20 pb-2">{t('imageInterpolation_customizeTitle')}</h2>
                                            <div>
                                                <label htmlFor="additional-notes" className="block text-left base-font font-bold text-lg text-neutral-200 mb-2">{t('imageInterpolation_notesLabel')}</label>
                                                <textarea
                                                    id="additional-notes"
                                                    value={localAdditionalNotes}
                                                    onChange={(e) => setLocalAdditionalNotes(e.target.value)}
                                                    onBlur={() => {
                                                        if (localAdditionalNotes !== appState.additionalNotes) {
                                                            onStateChange({ ...appState, additionalNotes: localAdditionalNotes });
                                                        }
                                                    }}
                                                    placeholder={t('imageInterpolation_notesPlaceholder')}
                                                    className="form-input h-20"
                                                    rows={2}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                                <div>
                                                    <label htmlFor="aspect-ratio-interp" className="block text-left base-font font-bold text-lg text-neutral-200 mb-2">{t('common_aspectRatio')}</label>
                                                    <select id="aspect-ratio-interp" value={appState.options.aspectRatio} onChange={(e) => handleOptionChange('aspectRatio', e.target.value)} className="form-input">
                                                        {ASPECT_RATIO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex items-center pb-3">
                                                    <input type="checkbox" id="remove-watermark-interp" checked={appState.options.removeWatermark} onChange={(e) => handleOptionChange('removeWatermark', e.target.checked)} className="h-4 w-4 rounded border-neutral-500 bg-neutral-700 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-neutral-800" />
                                                    <label htmlFor="remove-watermark-interp" className="ml-3 block text-sm font-medium text-neutral-300">{t('common_removeWatermark')}</label>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end gap-4 pt-4">
                                                <button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button>
                                                <button onClick={handleGenerate} className="btn btn-primary" disabled={!appState.generatedPrompt || isLoading}>{isLoading ? t('common_creating') : t('imageInterpolation_createButton')}</button>
                                            </div>
                                        </div>
                                    )}
                                </OptionsPanel>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            {(appState.stage === 'generating' || appState.stage === 'results') && (
                <ResultsView
                    stage={appState.stage}
                    originalImage={referenceImageToShow}
                    onOriginalClick={referenceImageToShow ? () => openLightbox(lightboxImages.indexOf(referenceImageToShow!)) : undefined}
                    error={appState.error}
                    actions={(
                        <>
                            {appState.generatedImage && !appState.error && (<button onClick={handleDownloadAll} className="btn btn-secondary">{t('common_downloadAll')}</button>)}
                            <button onClick={() => onStateChange({ ...appState, stage: 'configuring' })} className="btn btn-secondary">{t('common_edit')}</button>
                            <button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button>
                        </>
                    )}
                >
                    <motion.div className="w-full md:w-auto flex-shrink-0" key="generated-interp" initial={{ opacity: 0, scale: 0.5, y: 100 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.2 }}>
                        <ActionablePolaroidCard
                            type="output"
                            caption={t('common_result')}
                            status={isLoading ? 'pending' : (appState.error ? 'error' : 'done')}
                            mediaUrl={appState.generatedImage ?? undefined} error={appState.error ?? undefined}
                            onImageChange={handleGeneratedImageChange}
                            onRegenerate={handleRegeneration}
                            onGenerateVideoFromPrompt={(prompt) => appState.generatedImage && generateVideo(appState.generatedImage, prompt)}
                            regenerationTitle={t('common_regenTitle')}
                            regenerationDescription={t('common_regenDescription')}
                            regenerationPlaceholder={t('imageInterpolation_regenPlaceholder')}
                            onClick={!appState.error && appState.generatedImage ? () => openLightbox(lightboxImages.indexOf(appState.generatedImage!)) : undefined}
                        />
                    </motion.div>

                    {appState.finalPrompt && (
                        <motion.div
                            className="w-full md:w-96 flex-shrink-0"
                            key="final-prompt"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.3 }}
                        >
                            <PromptResultCard
                                title="Prompt cuối cùng"
                                promptText={appState.finalPrompt}
                                className="h-full"
                            />
                        </motion.div>
                    )}

                    {appState.historicalImages.map(({ url: sourceUrl }) => {
                        const videoTask = videoTasks[sourceUrl];
                        if (!videoTask) return null;
                        return (
                            <motion.div className="w-full md:w-auto flex-shrink-0" key={`${sourceUrl}-video`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }}>
                                <ActionablePolaroidCard
                                    type="output"
                                    caption={t('common_video')}
                                    status={videoTask.status}
                                    mediaUrl={videoTask.resultUrl}
                                    error={videoTask.error}
                                    onClick={videoTask.resultUrl ? () => openLightbox(lightboxImages.indexOf(videoTask.resultUrl!)) : undefined}
                                />
                            </motion.div>
                        );
                    })}
                </ResultsView>
            )}

            <Lightbox images={lightboxImages} selectedIndex={lightboxIndex} onClose={closeLightbox} onNavigate={navigateLightbox} />
        </div>
    );
};

export default ImageInterpolation;