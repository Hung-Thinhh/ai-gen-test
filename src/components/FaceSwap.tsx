/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { swapFaces } from '../services/gemini/advancedImageService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import {
    AppScreenHeader,
    handleFileUpload as utilHandleFileUpload,
    ResultsView,
    OptionsPanel,
    useAppControls,
    type FaceSwapState,
} from './uiUtils';

interface FaceSwapProps {
    mainTitle: string;
    subtitle: string;
    useSmartTitleWrapping: boolean;
    smartTitleWrapWords: number;
    uploaderCaptionSource: string;
    uploaderDescriptionSource: string;
    uploaderCaptionFace: string;
    uploaderDescriptionFace: string;
    addImagesToGallery: (images: string[]) => void;
    appState: FaceSwapState;
    onStateChange: (newState: FaceSwapState) => void;
    onReset: () => void;
    onGoBack: () => void;
    logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: {
        api_model_used?: string;
    }) => void;
}

const FaceSwap: React.FC<FaceSwapProps> = (props) => {
    const {
        uploaderCaptionSource,
        uploaderDescriptionSource,
        uploaderCaptionFace,
        uploaderDescriptionFace,
        addImagesToGallery,
        appState,
        onStateChange,
        onReset,
        logGeneration,
        ...headerProps
    } = props;

    const { t, checkCredits, modelVersion } = useAppControls();

    const handleImageUpload = (imageKey: 'sourceImage' | 'targetFaceImage') => (e: ChangeEvent<HTMLInputElement>) => {
        utilHandleFileUpload(e, (imageDataUrl) => {
            onStateChange({
                ...appState,
                [imageKey]: imageDataUrl,
                resultImage: null,
                error: null,
            });
            // addImagesToGallery([imageDataUrl]);
        });
    };

    const handleGenerate = async () => {
        if (!appState.sourceImage || !appState.targetFaceImage) return;

        // Immediate Feedback
        const preGenState = { ...appState };
        onStateChange({ ...appState, stage: 'generating', error: null });

        if (!await checkCredits()) {
            onStateChange({ ...appState, stage: 'configuring' });
            return;
        }

        try {
            const result = await swapFaces(
                appState.sourceImage,
                appState.targetFaceImage,
                appState.options.additionalInstructions || undefined
            );
            onStateChange({ ...appState, stage: 'results', resultImage: result });
            addImagesToGallery([result]);
            logGeneration('face-swap', preGenState, result, {
                api_model_used: modelVersion === 'v3' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image'
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi.";
            onStateChange({ ...appState, stage: 'results', error: errorMessage });
        }
    };

    const handleSaveResult = (newUrl: string | null) => {
        if (newUrl) {
            onStateChange({ ...appState, resultImage: newUrl });
            addImagesToGallery([newUrl]);
        }
    };

    const isLoading = appState.stage === 'generating';
    const canGenerate = appState.sourceImage && appState.targetFaceImage;

    return (
        <div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-0">
            <AnimatePresence>{appState.stage === 'configuring' && <AppScreenHeader {...headerProps} />}</AnimatePresence>

            {/* Configuring Stage */}
            {appState.stage === 'configuring' && (
                <motion.div className="flex flex-col items-center gap-6 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Input images grid */}
                    <div className="w-full pb-4 max-w-4xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-7xl mx-auto px-4">
                            <div className="flex flex-col items-center gap-2">
                                <label htmlFor="source-upload" className="cursor-pointer w-full">
                                    <ActionablePolaroidCard type={appState.sourceImage ? 'multi-input' : 'uploader'} caption={uploaderCaptionSource} status="done" mediaUrl={appState.sourceImage || undefined} placeholderType="person" onImageChange={(url) => onStateChange({ ...appState, sourceImage: url })} />
                                </label>
                                <input id="source-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload('sourceImage')} />
                                <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">{uploaderDescriptionSource}</p>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <label htmlFor="face-upload" className="cursor-pointer w-full">
                                    <ActionablePolaroidCard type={appState.targetFaceImage ? 'multi-input' : 'uploader'} caption={uploaderCaptionFace} status="done" mediaUrl={appState.targetFaceImage || undefined} placeholderType="person" onImageChange={(url) => onStateChange({ ...appState, targetFaceImage: url })} />
                                </label>
                                <input id="face-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload('targetFaceImage')} />
                                <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">{uploaderDescriptionFace}</p>
                            </div>
                        </div>
                    </div>

                    {/* Options panel - always visible */}
                    <OptionsPanel>
                        <h2 className="base-font font-bold text-2xl text-yellow-400 border-b border-yellow-400/20 pb-2 mb-4">{t('common_options')}</h2>
                        <div>
                            <label className="block text-neutral-200 font-bold mb-2">{t('common_additionalInstructions')}</label>
                            <textarea value={appState.options.additionalInstructions} onChange={(e) => onStateChange({ ...appState, options: { additionalInstructions: e.target.value } })} placeholder={t('faceSwap_instructionsPlaceholder')} className="form-input !h-24" rows={3} />
                        </div>
                        <div className="flex justify-end gap-4 pt-4">
                            <button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button>
                            <button onClick={handleGenerate} className="btn btn-primary" disabled={!canGenerate || isLoading}>{isLoading ? t('common_processing') : t('common_generate')}</button>
                        </div>
                    </OptionsPanel>
                </motion.div>
            )}

            {/* Generating Stage - Show inputs in grid, loading result below */}
            {appState.stage === 'generating' && (
                <motion.div className="flex flex-col items-center gap-6 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Input Images Grid */}
                    <div className="w-full pb-4 max-w-4xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-7xl mx-auto px-4">
                            <div className="flex flex-col items-center gap-2">
                                <ActionablePolaroidCard type="multi-input" caption={uploaderCaptionSource} status="done" mediaUrl={appState.sourceImage!} placeholderType="person" onImageChange={() => { }} />
                                <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">{uploaderDescriptionSource}</p>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <ActionablePolaroidCard type="multi-input" caption={uploaderCaptionFace} status="done" mediaUrl={appState.targetFaceImage!} placeholderType="person" onImageChange={() => { }} />
                                <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">{uploaderDescriptionFace}</p>
                            </div>
                        </div>
                    </div>

                    {/* Loading Result */}
                    <div className="flex justify-center w-full px-4">
                        <div className="flex flex-col items-center gap-2">
                            <ActionablePolaroidCard
                                type="output"
                                caption={t('faceSwap_result')}
                                status="pending"
                                mediaUrl={undefined}
                                placeholderType="magic"
                                onImageChange={() => { }}
                            />
                            <p className="text-yellow-400 text-center max-w-xs text-xs sm:text-sm animate-pulse font-semibold">⏳ {t('common_processing')}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Results Stage - Show all 3 images */}
            {appState.stage === 'results' && (
                <motion.div className="flex flex-col items-center gap-8 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Row 1: Input Images */}
                    <div className="flex flex-col md:flex-row items-start justify-center gap-8 w-full px-4">
                        {/* Source Image */}
                        <div className="flex flex-col items-center gap-4">
                            <ActionablePolaroidCard type="multi-input" caption={uploaderCaptionSource} status="done" mediaUrl={appState.sourceImage!} placeholderType="person" onImageChange={() => { }} />
                            <p className="text-neutral-300 text-center max-w-xs text-sm">{uploaderDescriptionSource}</p>
                        </div>

                        {/* Face Image */}
                        <div className="flex flex-col items-center gap-4">
                            <ActionablePolaroidCard type="multi-input" caption={uploaderCaptionFace} status="done" mediaUrl={appState.targetFaceImage!} placeholderType="person" onImageChange={() => { }} />
                            <p className="text-neutral-300 text-center max-w-xs text-sm">{uploaderDescriptionFace}</p>
                        </div>
                    </div>

                    {/* Row 2: Result - Centered */}
                    <div className="flex justify-center w-full px-4">
                        {appState.error ? (
                            <div className="flex flex-col items-center gap-4 p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-red-400 text-center">❌ {appState.error}</p>
                            </div>
                        ) : appState.resultImage ? (
                            <div className="flex flex-col items-center gap-4">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <ActionablePolaroidCard
                                        type="output"
                                        caption={t('faceSwap_result')}
                                        status="done"
                                        mediaUrl={appState.resultImage}
                                        onImageChange={(url) => { if (url) { onStateChange({ ...appState, resultImage: url }); addImagesToGallery([url]); } }}
                                    />
                                </motion.div>
                                <p className="text-green-400 text-center max-w-xs text-sm font-semibold">✓ Hoàn thành!</p>
                            </div>
                        ) : null}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-center">
                        <button onClick={() => onStateChange({ ...appState, stage: 'configuring' })} className="btn btn-secondary">
                            {t('common_edit')}
                        </button>
                        <button onClick={onReset} className="btn btn-secondary">
                            {t('common_startOver')}
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default FaceSwap;
