/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { swapFaces } from '../services/gemini/advancedImageService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import Lightbox from './Lightbox';
import {
    AppScreenHeader,
    handleFileUpload as utilHandleFileUpload,
    OptionsPanel,
    useAppControls,
    useLightbox,
    useMediaQuery,
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
        credits_used?: number;
        generation_count?: number;
    }) => void;
}

const FaceSwap: React.FC<FaceSwapProps> = (props) => {
    const {
        mainTitle,
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
    const { lightboxIndex, openLightbox, closeLightbox, navigateLightbox } = useLightbox();
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Build lightbox images array
    const lightboxImages = [
        appState.sourceImage,
        appState.targetFaceImage,
        appState.resultImage
    ].filter((img): img is string => !!img);

    const handleImageUpload = (imageKey: 'sourceImage' | 'targetFaceImage') => (e: ChangeEvent<HTMLInputElement>) => {
        utilHandleFileUpload(e, (imageDataUrl) => {
            onStateChange({
                ...appState,
                [imageKey]: imageDataUrl,
                resultImage: null,
                error: null,
            });
        });
    };

    const handleGenerate = async () => {
        if (!appState.sourceImage || !appState.targetFaceImage) return;

        const preGenState = { ...appState };
        const creditCostPerImage = modelVersion === 'v3' ? 2 : 1;
        if (!await checkCredits(creditCostPerImage)) {
            return;
        }

        onStateChange({ ...appState, stage: 'generating', error: null });

        try {
            const result = await swapFaces(
                appState.sourceImage,
                appState.targetFaceImage,
                appState.options.additionalInstructions || undefined
            );
            onStateChange({ ...appState, stage: 'results', resultImage: result });
            addImagesToGallery([result]);
            logGeneration('face-swap', preGenState, result, {
                credits_used: creditCostPerImage,
                generation_count: 1,
                api_model_used: modelVersion === 'v3' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image'
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi.";
            onStateChange({ ...appState, stage: 'results', error: errorMessage });
        }
    };

    const isLoading = appState.stage === 'generating';
    const canGenerate = appState.sourceImage && appState.targetFaceImage;

    return (
        <div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-screen">
            <AnimatePresence>{appState.stage === 'configuring' && <AppScreenHeader mainTitle={mainTitle} {...headerProps} />}</AnimatePresence>

            {/* Configuring Stage */}
            {appState.stage === 'configuring' && (
                <motion.div className="flex flex-col items-center gap-6 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="w-full pb-4 max-w-4xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-7xl mx-auto px-4">
                            <div className="flex flex-col items-center gap-2">
                                <label htmlFor="source-upload" className="cursor-pointer w-full">
                                    <ActionablePolaroidCard
                                        type={appState.sourceImage ? 'multi-input' : 'uploader'}
                                        caption={uploaderCaptionSource}
                                        status="done"
                                        mediaUrl={appState.sourceImage || undefined}
                                        placeholderType="person"
                                        onImageChange={(url) => onStateChange({ ...appState, sourceImage: url })}
                                        onClick={appState.sourceImage ? () => openLightbox(0) : undefined}
                                    />
                                </label>
                                <input id="source-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload('sourceImage')} />
                                <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">{uploaderDescriptionSource}</p>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <label htmlFor="face-upload" className="cursor-pointer w-full">
                                    <ActionablePolaroidCard
                                        type={appState.targetFaceImage ? 'multi-input' : 'uploader'}
                                        caption={uploaderCaptionFace}
                                        status="done"
                                        mediaUrl={appState.targetFaceImage || undefined}
                                        placeholderType="person"
                                        onImageChange={(url) => onStateChange({ ...appState, targetFaceImage: url })}
                                        onClick={appState.targetFaceImage ? () => openLightbox(1) : undefined}
                                    />
                                </label>
                                <input id="face-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload('targetFaceImage')} />
                                <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">{uploaderDescriptionFace}</p>
                            </div>
                        </div>
                    </div>

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

            {/* Generating Stage - Two Column Layout */}
            {appState.stage === 'generating' && (
                <motion.div
                    className="flex flex-col items-center gap-6 w-full max-w-4xl py-6 px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-white mb-2">{mainTitle}</h1>
                        <p className="text-orange-400 animate-pulse">Đang ghép mặt...</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        {/* Left: Input Images */}
                        <div className="themed-card border border-neutral-700 rounded-2xl p-4">
                            <h3 className="text-orange-400 font-bold text-lg mb-4 text-center">Ảnh đầu vào</h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={appState.sourceImage!}
                                        alt="Source"
                                        className="w-24 h-24 object-cover rounded-lg border border-neutral-600"
                                    />
                                    <div>
                                        <p className="text-neutral-300 text-sm font-medium">{uploaderCaptionSource}</p>
                                        <p className="text-neutral-500 text-xs">{uploaderDescriptionSource}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <img
                                        src={appState.targetFaceImage!}
                                        alt="Face"
                                        className="w-24 h-24 object-cover rounded-lg border border-neutral-600"
                                    />
                                    <div>
                                        <p className="text-neutral-300 text-sm font-medium">{uploaderCaptionFace}</p>
                                        <p className="text-neutral-500 text-xs">{uploaderDescriptionFace}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Loading Output */}
                        <div className="themed-card border border-neutral-700 rounded-2xl p-4">
                            <h3 className="text-orange-400 font-bold text-lg mb-4 text-center">Kết quả</h3>
                            <div className="aspect-[3/4] bg-neutral-800 rounded-lg border border-neutral-700 flex flex-col items-center justify-center">
                                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-neutral-300 text-sm">Đang ghép mặt...</p>
                                <p className="text-neutral-500 text-xs mt-1">Vui lòng đợi trong giây lát</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => onStateChange({ ...appState, stage: 'configuring' })}
                        className="mt-4 px-6 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm"
                    >
                        Hủy
                    </button>
                </motion.div>
            )}

            {/* Results Stage - Two Column Layout */}
            {appState.stage === 'results' && (
                <motion.div
                    className="flex flex-col items-center gap-6 w-full max-w-4xl py-6 px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-white mb-2">{mainTitle}</h1>
                        {appState.error ? (
                            <p className="text-red-400">{appState.error}</p>
                        ) : (
                            <p className="text-green-400">Hoàn thành!</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        {/* Left: Input Images */}
                        <div className="themed-card border border-neutral-700 rounded-2xl p-4">
                            <h3 className="text-orange-400 font-bold text-lg mb-4 text-center">Ảnh đầu vào</h3>
                            <div className="flex flex-col gap-4">
                                <div
                                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => openLightbox(0)}
                                >
                                    <img
                                        src={appState.sourceImage!}
                                        alt="Source"
                                        className="w-24 h-24 object-cover rounded-lg border border-neutral-600"
                                    />
                                    <div>
                                        <p className="text-neutral-300 text-sm font-medium">{uploaderCaptionSource}</p>
                                        <p className="text-neutral-500 text-xs">{uploaderDescriptionSource}</p>
                                    </div>
                                </div>
                                <div
                                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => openLightbox(1)}
                                >
                                    <img
                                        src={appState.targetFaceImage!}
                                        alt="Face"
                                        className="w-24 h-24 object-cover rounded-lg border border-neutral-600"
                                    />
                                    <div>
                                        <p className="text-neutral-300 text-sm font-medium">{uploaderCaptionFace}</p>
                                        <p className="text-neutral-500 text-xs">{uploaderDescriptionFace}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Result */}
                        <div className="themed-card border border-neutral-700 rounded-2xl p-4">
                            <h3 className="text-orange-400 font-bold text-lg mb-4 text-center">Kết quả</h3>
                            {appState.resultImage ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="cursor-pointer"
                                    onClick={() => openLightbox(lightboxImages.indexOf(appState.resultImage!))}
                                >
                                    <img
                                        src={appState.resultImage}
                                        alt="Result"
                                        className="w-full aspect-[3/4] object-cover rounded-lg border border-orange-500/50 hover:opacity-90 transition-opacity"
                                    />
                                </motion.div>
                            ) : (
                                <div className="aspect-[3/4] bg-neutral-800 rounded-lg border border-red-500/30 flex items-center justify-center">
                                    <p className="text-red-400 text-center px-4">Lỗi: {appState.error}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-center mt-4">
                        <button
                            onClick={() => onStateChange({ ...appState, stage: 'configuring' })}
                            className="px-6 py-2.5 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors font-medium"
                        >
                            Sửa tùy chọn
                        </button>
                        <button
                            onClick={onReset}
                            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-black rounded-full hover:from-orange-600 hover:to-orange-500 transition-all font-bold"
                        >
                            Bắt đầu lại
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Lightbox */}
            <Lightbox
                images={lightboxImages}
                selectedIndex={lightboxIndex}
                onClose={closeLightbox}
                onNavigate={navigateLightbox}
            />
        </div>
    );
};

export default FaceSwap;
