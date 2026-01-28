/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, ChangeEvent, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { generatePatrioticImage, editImageWithPrompt, analyzeAvatarForConcepts } from '../services/geminiService';
import { processApiError } from '@/services/gemini/baseService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import Lightbox from './Lightbox';
import {
    useMediaQuery,
    AppScreenHeader,
    ImageUploader,
    ResultsView,
    ImageForZip,
    type AvatarCreatorState,
    handleFileUpload,
    useLightbox,
    useVideoGeneration,
    processAndDownloadAll,
    useAppControls,
    embedJsonInPng,
} from './uiUtils';
import { MagicWandIcon } from './icons';

interface AvatarCreatorProps {
    mainTitle: string;
    subtitle: string;
    minIdeas: number;
    maxIdeas: number;
    useSmartTitleWrapping: boolean;
    smartTitleWrapWords: number;
    uploaderCaption: string;
    uploaderDescription: string;
    uploaderCaptionStyle: string;
    uploaderDescriptionStyle: string;
    addImagesToGallery: (images: string[]) => void;
    appState: AvatarCreatorState;
    onStateChange: (newState: AvatarCreatorState) => void;
    onReset: () => void;
    onGoBack: () => void;
    logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: {
        api_model_used?: string;
        credits_used?: number;
        generation_count?: number;
        input_prompt?: string;
    }) => void;
}

const AvatarCreator: React.FC<AvatarCreatorProps> = (props) => {
    const {
        minIdeas, maxIdeas,
        uploaderCaption, uploaderDescription, uploaderCaptionStyle, uploaderDescriptionStyle,
        addImagesToGallery,
        appState, onStateChange, onReset,
        logGeneration,
        ...headerProps
    } = props;

    const { t, settings, checkCredits, modelVersion } = useAppControls();
    const { lightboxIndex, openLightbox, closeLightbox, navigateLightbox } = useLightbox();
    const { videoTasks, generateVideo } = useVideoGeneration();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [localPrompt, setLocalPrompt] = useState(appState.options.additionalPrompt);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const hasLoggedGeneration = useRef(false);

    useEffect(() => {
        setLocalPrompt(appState.options.additionalPrompt);
    }, [appState.options.additionalPrompt]);

    const IDEAS_BY_CATEGORY = t('avatarCreator_ideasByCategory');
    const ASPECT_RATIO_OPTIONS = t('aspectRatioOptions');

    const outputLightboxImages = appState.selectedIdeas
        .map(idea => appState.generatedImages[idea])
        .filter(img => img?.status === 'done' && img.url)
        .map(img => img.url!);

    const lightboxImages = [appState.uploadedImage, appState.styleReferenceImage, ...outputLightboxImages].filter((img): img is string => !!img);

    const handleImageSelectedForUploader = (imageDataUrl: string) => {
        onStateChange({
            ...appState,
            stage: 'configuring',
            uploadedImage: imageDataUrl,
            generatedImages: {},
            selectedIdeas: [],
            historicalImages: [],
            error: null,
        });
        // REMOVED: addImagesToGallery([imageDataUrl]);
    };

    const handleStyleReferenceImageChange = (imageDataUrl: string | null) => {
        onStateChange({
            ...appState,
            styleReferenceImage: imageDataUrl,
            selectedIdeas: [],
        });
        // REMOVED: if (imageDataUrl) addImagesToGallery([imageDataUrl]);
    };

    const handleImageUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        handleFileUpload(e, handleImageSelectedForUploader);
    }, [appState, onStateChange]);

    const handleUploadedImageChange = (newUrl: string | null) => {
        onStateChange({ ...appState, uploadedImage: newUrl, stage: newUrl ? 'configuring' : 'idle' });
        // REMOVED: if (newUrl) addImagesToGallery([newUrl]);
    };

    const handleGeneratedImageChange = (idea: string) => (newUrl: string | null) => {
        if (!newUrl) return;
        const newGeneratedImages = { ...appState.generatedImages, [idea]: { status: 'done' as 'done', url: newUrl } };
        const newHistorical = [...appState.historicalImages, { idea: `${idea}-edit`, url: newUrl }];
        onStateChange({ ...appState, generatedImages: newGeneratedImages, historicalImages: newHistorical });
        // REMOVED: addImagesToGallery([newUrl]); // Manual change is an upload/input
    };

    const handleOptionChange = (field: keyof AvatarCreatorState['options'], value: string | boolean) => {
        onStateChange({
            ...appState,
            options: { ...appState.options, [field]: value },
        });
    };

    const handleIdeaSelect = (idea: string) => {
        const { selectedIdeas } = appState;
        let newSelectedIdeas: string[];

        if (selectedIdeas.includes(idea)) {
            newSelectedIdeas = selectedIdeas.filter(p => p !== idea);
        } else if (selectedIdeas.length < maxIdeas) {
            newSelectedIdeas = [...selectedIdeas, idea];
        } else {
            toast.error(t('avatarCreator_maxIdeasError', maxIdeas));
            return;
        }

        onStateChange({ ...appState, selectedIdeas: newSelectedIdeas });
    };

    const executeGeneration = async (ideas?: string[]) => {
        if (!appState.uploadedImage) return;

        // Removed early checkCredits() to allow immediate UI feedback

        const creditCostPerImage = modelVersion === 'v3' ? 2 : 1;
        hasLoggedGeneration.current = false;

        // --- Branch 1: Generation from Style Reference Image ---
        if (appState.styleReferenceImage) {
            const idea = "Style Reference";
            const preGenState = { ...appState, selectedIdeas: [idea] };
            const stage: 'generating' = 'generating';

            const generatingState = { ...appState, stage, generatedImages: { [idea]: { status: 'pending' as const } }, selectedIdeas: [idea] };
            // Immediate Feedback
            onStateChange(generatingState);

            if (!await checkCredits(creditCostPerImage)) {
                // Revert
                onStateChange({ ...appState, stage: 'configuring' });
                return;
            }

            try {
                const resultUrl = await generatePatrioticImage(
                    appState.uploadedImage,
                    '', // Idea is ignored by service when style ref is passed
                    appState.options.additionalPrompt,
                    appState.options.removeWatermark,
                    appState.options.aspectRatio,
                    appState.styleReferenceImage,
                    'avatar-creator'
                );

                const settingsToEmbed = {
                    viewId: 'avatar-creator',
                    state: { ...preGenState, stage: 'configuring', generatedImages: {}, historicalImages: [], error: null },
                };
                const urlWithMetadata = await embedJsonInPng(resultUrl, settingsToEmbed, settings.enableImageMetadata);
                logGeneration('avatar-creator', preGenState, urlWithMetadata, {
                    credits_used: creditCostPerImage,
                    generation_count: 1,
                    api_model_used: modelVersion === 'v3' ? 'imagen-3.0-generate-001' : 'gemini-2.5-flash-image',
                    input_prompt: appState.options.additionalPrompt || "Style Reference"
                });

                onStateChange({
                    ...generatingState,
                    stage: 'results',
                    generatedImages: { [idea]: { status: 'done' as const, url: urlWithMetadata } },
                    historicalImages: [...generatingState.historicalImages, { idea, url: urlWithMetadata }],
                });
                addImagesToGallery([urlWithMetadata]);
                addImagesToGallery([urlWithMetadata]);
            } catch (err: any) {
                const error = processApiError(err);
                onStateChange({
                    ...generatingState,
                    stage: 'results',
                    generatedImages: { [idea]: { status: 'error' as const, error: error.message } },
                });
            }
            return;
        }

        // --- Branch 2: Generation from Idea List ---
        if (!ideas || ideas.length === 0) return;
        if (ideas.length > maxIdeas && !ideas.includes(t('avatarCreator_randomConcept'))) {
            toast.error(t('avatarCreator_maxIdeasError', maxIdeas));
            return;
        }

        const preGenState = { ...appState, selectedIdeas: ideas };
        const randomConceptString = t('avatarCreator_randomConcept');

        let ideasToGenerate = [...ideas];
        const randomCount = ideasToGenerate.filter(i => i === randomConceptString).length;

        if (randomCount > 0) {
            // Immediate Feedback
            setIsAnalyzing(true);

            if (!await checkCredits(creditCostPerImage)) {
                setIsAnalyzing(false);
                return;
            }

            try {
                const allCategories = IDEAS_BY_CATEGORY.filter((c: any) => c.key !== 'random');
                const suggestedCategories = await analyzeAvatarForConcepts(appState.uploadedImage, allCategories);

                let ideaPool: string[] = [];
                if (suggestedCategories.length > 0) {
                    ideaPool = allCategories
                        .filter((c: any) => suggestedCategories.includes(c.category))
                        .flatMap((c: any) => c.ideas);
                }
                if (ideaPool.length === 0) {
                    ideaPool = allCategories.flatMap((c: any) => c.ideas);
                }

                const randomIdeas: string[] = [];
                for (let i = 0; i < randomCount; i++) {
                    if (ideaPool.length > 0) {
                        const randomIndex = Math.floor(Math.random() * ideaPool.length);
                        randomIdeas.push(ideaPool[randomIndex]);
                        ideaPool.splice(randomIndex, 1);
                    }
                }
                ideasToGenerate = ideasToGenerate.filter(i => i !== randomConceptString).concat(randomIdeas);
                ideasToGenerate = [...new Set(ideasToGenerate)];
                ideasToGenerate.filter(i => i !== randomConceptString).concat(randomIdeas);
                ideasToGenerate = [...new Set(ideasToGenerate)];
            } catch (err: any) {
                const error = processApiError(err);
                toast.error(`Lỗi phân tích: ${error.message}`);
                setIsAnalyzing(false);
                return;
            } finally {
                setIsAnalyzing(false);
            }
        }

        // Immediate Feedback for Generation Phase
        const stage: 'generating' = 'generating';

        const initialGeneratedImages = { ...appState.generatedImages };
        ideasToGenerate.forEach(idea => {
            initialGeneratedImages[idea] = { status: 'pending' as const };
        });

        onStateChange({ ...appState, stage: stage, generatedImages: initialGeneratedImages, selectedIdeas: ideasToGenerate });

        // Double check credits if we didn't check in analysis (or if analysis wasn't run)
        // If randomCount > 0, we checked credits above.
        // If randomCount == 0, we haven't checked credits yet.
        // It's safe to check again or check if we haven't checked.
        // checkCredits() usually doesn't deduct, just checks availability.
        if (randomCount === 0) {
            if (!await checkCredits(creditCostPerImage)) {
                onStateChange({ ...appState, stage: 'configuring' });
                return;
            }
        }

        const concurrencyLimit = 2;
        const ideasQueue = [...ideasToGenerate];

        let currentAppState: AvatarCreatorState = { ...appState, stage: stage, generatedImages: initialGeneratedImages, selectedIdeas: ideasToGenerate };
        const settingsToEmbed = {
            viewId: 'avatar-creator',
            state: { ...preGenState, stage: 'configuring', generatedImages: {}, historicalImages: [], error: null },
        };

        const processIdea = async (idea: string) => {
            try {
                const resultUrl = await generatePatrioticImage(
                    appState.uploadedImage!,
                    idea,
                    appState.options.additionalPrompt,
                    appState.options.removeWatermark,
                    appState.options.aspectRatio,
                    null,
                    'avatar-creator'
                );
                const urlWithMetadata = await embedJsonInPng(resultUrl, settingsToEmbed, settings.enableImageMetadata);

                if (!hasLoggedGeneration.current) {
                    logGeneration('avatar-creator', preGenState, urlWithMetadata, {
                        generation_count: 1,
                        credits_used: creditCostPerImage,
                        api_model_used: modelVersion === 'v3' ? 'imagen-3.0-generate-001' : 'gemini-2.5-flash-image',
                        input_prompt: idea
                    });
                    hasLoggedGeneration.current = true;
                }

                currentAppState = {
                    ...currentAppState,
                    generatedImages: {
                        ...currentAppState.generatedImages,
                        [idea]: { status: 'done' as const, url: urlWithMetadata },
                    },
                    historicalImages: [...currentAppState.historicalImages, { idea, url: urlWithMetadata }],
                };
                onStateChange(currentAppState);
                addImagesToGallery([urlWithMetadata]);

                addImagesToGallery([urlWithMetadata]);

            } catch (err: any) {
                const error = processApiError(err);
                currentAppState = {
                    ...currentAppState,
                    generatedImages: {
                        ...currentAppState.generatedImages,
                        [idea]: { status: 'error' as const, error: error.message },
                    },
                };
                onStateChange(currentAppState);
                console.error(`Failed to generate image for ${idea}:`, error);
            }
        };

        const workers = Array(concurrencyLimit).fill(null).map(async () => {
            while (ideasQueue.length > 0) {
                const idea = ideasQueue.shift();
                if (idea) {
                    await processIdea(idea);
                }
            }
        });

        await Promise.all(workers);

        onStateChange({ ...currentAppState, stage: 'results' });
    };

    const handleGenerateClick = async () => {
        if (appState.styleReferenceImage) {
            await executeGeneration(); // Call without ideas for style ref mode
        } else {
            const effectiveIdeas = appState.selectedIdeas.length > 0
                ? appState.selectedIdeas
                : [t('avatarCreator_randomConcept')];
            await executeGeneration(effectiveIdeas);
        }
    };

    const handleRandomGenerateClick = async () => {
        onStateChange({ ...appState, styleReferenceImage: null });
        await executeGeneration([t('avatarCreator_randomConcept')]);
    };

    const handleRegenerateIdea = async (idea: string, customPrompt: string) => {
        if (!await checkCredits()) return;

        // FIX: Cast to any to resolve TS error 'Property status does not exist on type unknown'.
        const imageToEditState = appState.generatedImages[idea] as any;
        if (!imageToEditState || imageToEditState.status !== 'done' || !imageToEditState.url) {
            return;
        }

        const imageUrlToEdit = imageToEditState.url;
        const preGenState = { ...appState };

        onStateChange({
            ...appState,
            // FIX: Add 'as const' to prevent type widening of 'status' to string.
            generatedImages: { ...appState.generatedImages, [idea]: { status: 'pending' as const } }
        });

        try {
            const resultUrl = await editImageWithPrompt(imageUrlToEdit, customPrompt);
            const settingsToEmbed = {
                viewId: 'avatar-creator',
                state: { ...appState, stage: 'configuring', generatedImages: {}, historicalImages: [], error: null },
            };
            const urlWithMetadata = await embedJsonInPng(resultUrl, settingsToEmbed, settings.enableImageMetadata);
            logGeneration('avatar-creator', preGenState, urlWithMetadata, {
                api_model_used: modelVersion === 'v3' ? 'imagen-3.0-generate-001' : 'gemini-2.5-flash-image',
                input_prompt: customPrompt
            });
            onStateChange({
                ...appState,
                // FIX: Add 'as const' to prevent type widening of 'status' to string.
                generatedImages: { ...appState.generatedImages, [idea]: { status: 'done' as const, url: urlWithMetadata } },
                historicalImages: [...appState.historicalImages, { idea: `${idea}-edit`, url: urlWithMetadata }],
            });
            addImagesToGallery([urlWithMetadata]);
            addImagesToGallery([urlWithMetadata]);
        } catch (err: any) {
            const error = processApiError(err);
            onStateChange({
                ...appState,
                // FIX: Add 'as const' to prevent type widening of 'status' to string.
                generatedImages: { ...appState.generatedImages, [idea]: { status: 'error' as const, error: error.message } }
            });
            console.error(`Failed to regenerate image for ${idea}:`, error);
        }
    };



    const handleChooseOtherIdeas = () => {
        onStateChange({ ...appState, stage: 'configuring', generatedImages: {}, historicalImages: [] });
    };

    const handleDownloadAll = () => {
        const inputImages: ImageForZip[] = [];
        if (appState.uploadedImage) {
            inputImages.push({
                url: appState.uploadedImage,
                filename: 'anh-goc',
                folder: 'input',
            });
        }

        processAndDownloadAll({
            inputImages,
            historicalImages: appState.historicalImages,
            videoTasks,
            zipFilename: 'anh-yeu-nuoc.zip',
            baseOutputFilename: 'anh-yeu-nuoc',
        });
    };

    const isLoading = appState.stage === 'generating' || isAnalyzing;
    const getButtonText = () => {
        if (isAnalyzing) return t('avatarCreator_analyzing');
        if (isLoading) return t('common_creating');
        return t('avatarCreator_createButton');
    };

    const hasPartialError = appState.stage === 'results' && Object.values(appState.generatedImages).some(img => img.status === 'error');

    const inputImagesForResults = [];
    if (appState.uploadedImage) {
        inputImagesForResults.push({
            url: appState.uploadedImage,
            caption: t('common_originalImage'),
            onClick: () => openLightbox(lightboxImages.indexOf(appState.uploadedImage!))
        });
    }
    if (appState.styleReferenceImage) {
        inputImagesForResults.push({
            url: appState.styleReferenceImage,
            caption: t('common_referenceImage'),
            onClick: () => openLightbox(lightboxImages.indexOf(appState.styleReferenceImage!))
        });
    }

    return (
        <div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-screen">
            <AnimatePresence>
                {(appState.stage === 'idle' || appState.stage === 'configuring') && (
                    <AppScreenHeader {...headerProps} />
                )}
            </AnimatePresence>

            {(appState.stage === 'idle' || appState.stage === 'configuring') && (
                <motion.div
                    className="flex flex-col items-center gap-6 w-full max-w-6xl py-6 overflow-y-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Input images grid */}
                    <div className="w-full pb-4 max-w-4xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-7xl mx-auto px-4">
                            <div className="flex flex-col items-center gap-2">
                                <ActionablePolaroidCard
                                    type={appState.uploadedImage ? 'photo-input' : 'uploader'}
                                    mediaUrl={appState.uploadedImage ?? undefined}
                                    caption={uploaderCaption}
                                    placeholderType="person"
                                    status="done"
                                    onClick={appState.uploadedImage ? () => openLightbox(lightboxImages.indexOf(appState.uploadedImage!)) : undefined}
                                    onImageChange={handleUploadedImageChange}
                                />
                                <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">
                                    {uploaderDescription}
                                </p>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <ActionablePolaroidCard
                                    type="style-input"
                                    mediaUrl={appState.styleReferenceImage ?? undefined}
                                    caption={uploaderCaptionStyle}
                                    placeholderType='magic'
                                    status='done'
                                    onImageChange={handleStyleReferenceImageChange}
                                    onClick={appState.styleReferenceImage ? () => openLightbox(lightboxImages.indexOf(appState.styleReferenceImage!)) : undefined}
                                />
                                <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">
                                    {uploaderDescriptionStyle}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Ideas selection - only show when no style reference */}
                    {!appState.styleReferenceImage ? (
                        <div className="w-full max-w-4xl text-center mt-4">
                            <h2 className="base-font font-bold text-2xl text-neutral-200">{t('avatarCreator_selectIdeasTitle', minIdeas, maxIdeas)}</h2>
                            <p className="text-neutral-400 mb-2">{t('avatarCreator_selectedCount', appState.selectedIdeas.length, maxIdeas)}</p>
                            <div className="mb-4">
                                <button
                                    onClick={handleRandomGenerateClick}
                                    className="btn btn-primary btn-sm"
                                    disabled={isLoading || isAnalyzing || !appState.uploadedImage}
                                >
                                    {t('avatarCreator_randomButton')}
                                </button>
                            </div>
                            <div className="max-h-[50vh] overflow-y-auto p-4 bg-black/20 border border-white/10 rounded-lg space-y-6">
                                {Array.isArray(IDEAS_BY_CATEGORY) && IDEAS_BY_CATEGORY.map((categoryObj: any) => (
                                    <div key={categoryObj.category}>
                                        <h3 className="text-xl base-font font-bold text-yellow-400 text-left mb-3 sticky top-[-20px] bg-black/80 py-2 -mx-4 px-4 z-10 flex items-center gap-2">
                                            {categoryObj.category}
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {categoryObj.ideas.map((p: string) => {
                                                const isSelected = appState.selectedIdeas.includes(p);
                                                return (
                                                    <button
                                                        key={p}
                                                        onClick={() => handleIdeaSelect(p)}
                                                        className={`base-font font-bold p-2 rounded-sm text-sm transition-all duration-200 ${isSelected
                                                            ? 'bg-orange-400 text-black ring-2 ring-orange-300 scale-105'
                                                            : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                                                            } ${!isSelected && appState.selectedIdeas.length === maxIdeas ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        disabled={!isSelected && appState.selectedIdeas.length === maxIdeas}
                                                    >
                                                        {p}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-w-4xl text-center p-4 bg-neutral-700/50 rounded-lg my-4">
                            <p className="text-sm text-yellow-300">{t('common_styleReferenceActive')}</p>
                        </div>
                    )}

                    {/* Options - always visible */}
                    <div className="w-full max-w-4xl mx-auto mt-2 space-y-4 px-4 px-4">
                        <div>
                            <label htmlFor="aspect-ratio-avatar" className="block text-left base-font font-bold text-lg text-neutral-200 mb-2">{t('common_aspectRatio')}</label>
                            <select
                                id="aspect-ratio-avatar"
                                value={appState.options.aspectRatio}
                                onChange={(e) => handleOptionChange('aspectRatio', e.target.value)}
                                className="form-input"
                            >
                                {ASPECT_RATIO_OPTIONS.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="additional-prompt-avatar" className="block text-left base-font font-bold text-lg text-neutral-200 mb-2">{t('common_additionalNotesOptional')}</label>
                            <textarea
                                id="additional-prompt-avatar"
                                value={localPrompt}
                                onChange={(e) => setLocalPrompt(e.target.value)}
                                onBlur={() => {
                                    if (localPrompt !== appState.options.additionalPrompt) {
                                        handleOptionChange('additionalPrompt', localPrompt);
                                    }
                                }}
                                placeholder={t('avatarCreator_notesPlaceholder')}
                                className="form-input h-20"
                                rows={2}
                                aria-label="Ghi chú bổ sung cho ảnh"
                            />
                        </div>
                        <div className="flex items-center pt-2">
                            <input
                                type="checkbox"
                                id="remove-watermark-avatar"
                                checked={appState.options.removeWatermark}
                                onChange={(e) => handleOptionChange('removeWatermark', e.target.checked)}
                                className="h-4 w-4 rounded border-neutral-500 bg-neutral-700 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-neutral-800"
                                aria-label={t('common_removeWatermark')}
                            />
                            <label htmlFor="remove-watermark-avatar" className="ml-3 block text-sm font-medium text-neutral-300">
                                {t('common_removeWatermark')}
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                        <button onClick={onReset} className="btn btn-secondary">
                            {t('common_startOver')}
                        </button>
                        <button
                            onClick={handleGenerateClick}
                            className="btn btn-primary"
                            disabled={
                                !appState.uploadedImage ||
                                (!appState.styleReferenceImage && appState.selectedIdeas.length < minIdeas && appState.selectedIdeas[0] !== t('avatarCreator_randomConcept')) ||
                                (!appState.styleReferenceImage && appState.selectedIdeas.length > maxIdeas) ||
                                isLoading ||
                                isAnalyzing
                            }
                        >
                            {getButtonText()}
                        </button>
                    </div>
                </motion.div>
            )}

            {(appState.stage === 'generating' || appState.stage === 'results') && (
                <ResultsView
                    stage={appState.stage}
                    inputImages={inputImagesForResults}
                    isMobile={isMobile}
                    hasPartialError={hasPartialError}
                    actions={
                        <>
                            <button onClick={handleDownloadAll} className="btn btn-secondary">
                                {t('common_downloadAll')}
                            </button>
                            <button onClick={handleChooseOtherIdeas} className="btn btn-secondary">
                                {t('avatarCreator_chooseOtherIdeas')}
                            </button>
                            <button onClick={onReset} className="btn btn-secondary">
                                {t('common_startOver')}
                            </button>
                        </>
                    }
                >
                    {appState.selectedIdeas.map((idea, index) => {
                        const imageState = appState.generatedImages[idea];
                        const currentImageIndexInLightbox = imageState?.url ? lightboxImages.indexOf(imageState.url) : -1;
                        return (
                            <motion.div
                                className="w-full md:w-auto flex-shrink-0"
                                key={idea}
                                initial={{ opacity: 0, scale: 0.5, y: 100 }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    y: 0,
                                    rotate: 0,
                                }}
                                transition={{ type: 'spring', stiffness: 80, damping: 15, delay: index * 0.15 }}
                                whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
                            >
                                <ActionablePolaroidCard
                                    type="output"
                                    caption={idea === 'Style Reference' ? t('common_result') : idea}
                                    status={imageState?.status || 'pending'}
                                    mediaUrl={imageState?.url}
                                    error={imageState?.error}
                                    onImageChange={handleGeneratedImageChange(idea)}
                                    onRegenerate={(prompt) => handleRegenerateIdea(idea, prompt)}
                                    onGenerateVideoFromPrompt={(prompt) => imageState?.url && generateVideo(imageState.url, prompt)}
                                    regenerationTitle={t('common_regenTitle')}
                                    regenerationDescription={t('common_regenDescription')}
                                    regenerationPlaceholder={t('avatarCreator_regenPlaceholder')}
                                    onClick={imageState?.status === 'done' && imageState.url ? () => openLightbox(currentImageIndexInLightbox) : undefined}
                                    isMobile={isMobile}
                                />
                            </motion.div>
                        );
                    })}
                    {appState.historicalImages.map(({ url: sourceUrl }) => {
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
                </ResultsView>
            )}

            <Lightbox
                images={lightboxImages}
                selectedIndex={lightboxIndex}
                onClose={closeLightbox}
                onNavigate={navigateLightbox}
            />
        </div>
    );
};

export default AvatarCreator;