/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generatePhotoBooth } from '../services/gemini/advancedImageService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import {
    AppScreenHeader,
    handleFileUpload as utilHandleFileUpload,
    ResultsView,
    OptionsPanel,
    useAppControls,
    type PhotoBoothState,
} from './uiUtils';

interface PhotoBoothProps {
    mainTitle: string;
    subtitle: string;
    useSmartTitleWrapping: boolean;
    smartTitleWrapWords: number;
    uploaderCaption: string;
    uploaderDescription: string;
    addImagesToGallery: (images: string[]) => void;
    appState: PhotoBoothState;
    onStateChange: (newState: PhotoBoothState) => void;
    onReset: () => void;
    onGoBack: () => void;
    logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: {
        api_model_used?: string;
    }) => void;
}

const PhotoBooth: React.FC<PhotoBoothProps> = (props) => {
    const {
        uploaderCaption,
        uploaderDescription,
        addImagesToGallery,
        appState,
        onStateChange,
        onReset,
        logGeneration,
        ...headerProps
    } = props;

    const { t, checkCredits, modelVersion } = useAppControls();

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        utilHandleFileUpload(e, (imageDataUrl) => {
            onStateChange({
                ...appState,
                uploadedImage: imageDataUrl,
                resultImage: null,
                error: null,
            });
            // addImagesToGallery([imageDataUrl]);
        });
    };

    const handleGenerate = async () => {
        if (!appState.uploadedImage) return;

        // Immediate Feedback
        const preGenState = { ...appState };
        onStateChange({ ...appState, stage: 'generating', error: null });

        if (!await checkCredits()) {
            onStateChange({ ...appState, stage: 'configuring' });
            return;
        }

        try {
            const result = await generatePhotoBooth(appState.uploadedImage, appState.options.photoCount);
            onStateChange({ ...appState, stage: 'results', resultImage: result });
            addImagesToGallery([result]);
            logGeneration('photo-booth', preGenState, result, {
                api_model_used: modelVersion === 'v3' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image'
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi.";
            onStateChange({ ...appState, stage: 'results', error: errorMessage });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-0">
            <AnimatePresence>
                {appState.stage === 'configuring' && <AppScreenHeader {...headerProps} />}
            </AnimatePresence>

            {appState.stage === 'configuring' && (
                <motion.div
                    className="flex flex-col items-center gap-6 w-full max-w-screen-xl py-6 overflow-y-auto px-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* 2-Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                        {/* Left: Upload Section */}
                        <div className="flex flex-col gap-4">
                            <h3 className="text-xl font-bold text-neutral-200">{t('photoBooth_uploadTitle')}</h3>
                            <label htmlFor="photo-upload" className="cursor-pointer">
                                <ActionablePolaroidCard
                                    type={appState.uploadedImage ? 'multi-input' : 'uploader'}
                                    caption={uploaderCaption}
                                    status="done"
                                    mediaUrl={appState.uploadedImage || undefined}
                                    placeholderType="person"
                                    onImageChange={(url) => onStateChange({ ...appState, uploadedImage: url })}
                                />
                            </label>
                            <input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            <p className="text-neutral-400 text-sm text-center">{uploaderDescription}</p>
                        </div>

                        {/* Right: Options Panel */}
                        <div className="flex flex-col gap-6 bg-neutral-800/50 p-6 rounded-xl border border-neutral-700">
                            <h3 className="text-xl font-bold text-neutral-200">{t('common_options')}</h3>

                            {/* Photo Count Grid Selector */}
                            <div>
                                <label className="block text-neutral-300 font-semibold mb-3">{t('photoBooth_photoCount')}</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[4, 6, 8, 9, 12].map((count, index) => {
                                        return (
                                            <button
                                                key={count}
                                                onClick={() => onStateChange({ ...appState, options: { photoCount: count } })}
                                                className={`col-span-1
                                                    py-3 px-4 rounded-lg font-semibold transition-all
                                                    ${appState.options.photoCount === count
                                                        ? 'bg-white text-black shadow-lg'
                                                        : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                                                    }
                                                `}
                                            >
                                                {count} {t('photoBooth_photos')}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerate}
                                className="w-full py-4 bg-neutral-600 hover:bg-neutral-500 text-white font-bold rounded-lg transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!appState.uploadedImage}
                            >
                                {t('photoBooth_generateButton')}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Generating Stage - Show input + loading result side by side */}
            {appState.stage === 'generating' && (
                <motion.div className="flex flex-col items-center gap-8 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex flex-col md:flex-row items-start justify-center gap-8 w-full px-4">
                        {/* Input Image */}
                        <div className="flex flex-col items-center gap-4">
                            <ActionablePolaroidCard type="multi-input" caption={uploaderCaption} status="done" mediaUrl={appState.uploadedImage!} placeholderType="person" onImageChange={() => { }} />
                            <p className="text-neutral-300 text-center max-w-xs text-sm">{uploaderDescription}</p>
                        </div>

                        {/* Loading Result */}
                        <div className="flex flex-col items-center gap-4">
                            <ActionablePolaroidCard
                                type="output"
                                caption={t('photoBooth_result')}
                                status="pending"
                                mediaUrl={undefined}
                                placeholderType="magic"
                                onImageChange={() => { }}
                            />
                            <p className="text-yellow-400 text-center max-w-xs text-sm animate-pulse font-semibold">⏳ {t('common_processing')}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Results Stage */}
            {appState.stage === 'results' && (
                <ResultsView
                    stage={appState.stage}
                    originalImage={appState.uploadedImage}
                    onOriginalClick={() => { }}
                    error={appState.error}
                    isMobile={false}
                    actions={(
                        <>
                            <button onClick={() => onStateChange({ ...appState, stage: 'configuring' })} className="btn btn-secondary">
                                {t('common_edit')}
                            </button>
                            <button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button>
                        </>
                    )}
                >
                    {appState.resultImage && (
                        <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <ActionablePolaroidCard
                                type="output"
                                caption={t('photoBooth_result')}
                                status="done"
                                mediaUrl={appState.resultImage}
                                onImageChange={(url) => {
                                    if (url) {
                                        onStateChange({ ...appState, resultImage: url });
                                        addImagesToGallery([url]);
                                    }
                                }}
                            />
                        </motion.div>
                    )}
                </ResultsView>
            )}
        </div>
    );
};

export default PhotoBooth;
