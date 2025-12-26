/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { removeObjectFromImage } from '../services/gemini/advancedImageService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import { AppScreenHeader, handleFileUpload as utilHandleFileUpload, ResultsView, OptionsPanel, useAppControls, type ObjectRemoverState } from './uiUtils';

interface ObjectRemoverProps {
    mainTitle: string;
    subtitle: string;
    useSmartTitleWrapping: boolean;
    smartTitleWrapWords: number;
    uploaderCaption: string;
    uploaderDescription: string;
    addImagesToGallery: (images: string[]) => void;
    appState: ObjectRemoverState;
    onStateChange: (newState: ObjectRemoverState) => void;
    onReset: () => void;
    onGoBack: () => void;
    logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: {
        api_model_used?: string;
        credits_used?: number;
        generation_count?: number;
    }) => void;
}

const ObjectRemover: React.FC<ObjectRemoverProps> = (props) => {
    const { uploaderCaption, uploaderDescription, addImagesToGallery, appState, onStateChange, onReset, logGeneration, ...headerProps } = props;
    const { t, checkCredits, modelVersion } = useAppControls();

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        utilHandleFileUpload(e, (imageDataUrl) => {
            onStateChange({ ...appState, uploadedImage: imageDataUrl, objectDescription: '', resultImage: null, error: null });
            // addImagesToGallery([imageDataUrl]);
        });
    };

    const handleGenerate = async () => {
        if (!appState.uploadedImage || !(appState.objectDescription || '').trim()) return;

        // Check credits FIRST
        const preGenState = { ...appState };
        const creditCostPerImage = modelVersion === 'v3' ? 2 : 1;
        if (!await checkCredits(creditCostPerImage)) {
            return; // Stay in configuring
        }

        // Set generating stage AFTER credits confirmed
        onStateChange({ ...appState, stage: 'generating', error: null });

        try {
            const result = await removeObjectFromImage(appState.uploadedImage, appState.objectDescription || '');
            onStateChange({ ...appState, stage: 'results', resultImage: result });
            addImagesToGallery([result]);
            logGeneration('object-remover', preGenState, result, {
                credits_used: creditCostPerImage,
                generation_count: 1,
                api_model_used: modelVersion === 'v3' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image'
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi.";
            onStateChange({ ...appState, stage: 'results', error: errorMessage });
        }
    };

    const canGenerate = !!appState.uploadedImage && !!(appState.objectDescription || '').trim();
    const isLoading = appState.stage === 'generating';

    return (
        <div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-0">
            <AnimatePresence>{appState.stage === 'configuring' && <AppScreenHeader {...headerProps} />}</AnimatePresence>
            {appState.stage === 'configuring' && (
                <motion.div className="flex flex-col items-center gap-6 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Input images grid */}
                    <div className="w-full pb-4 max-w-4xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-7xl mx-auto px-4">
                            <div className="flex flex-col items-center gap-2">
                                <label htmlFor="obj-upload" className="cursor-pointer w-full">
                                    <ActionablePolaroidCard type={appState.uploadedImage ? 'multi-input' : 'uploader'} caption={uploaderCaption} status="done" mediaUrl={appState.uploadedImage || undefined} placeholderType="magic" onImageChange={(url) => onStateChange({ ...appState, uploadedImage: url })} />
                                </label>
                                <input id="obj-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">{uploaderDescription}</p>
                            </div>
                        </div>
                    </div>

                    {/* Options always visible */}
                    <OptionsPanel>
                        <h2 className="base-font font-bold text-2xl text-yellow-400 border-b border-yellow-400/20 pb-2 mb-4">{t('objectRemover_objectLabel')}</h2>
                        <div>
                            <label className="block text-neutral-200 font-bold mb-2">{t('objectRemover_objectLabel')} *</label>
                            <textarea
                                value={appState.objectDescription || ''}
                                onChange={(e) => onStateChange({ ...appState, objectDescription: e.target.value })}
                                placeholder={t('objectRemover_objectPlaceholder')}
                                className="form-input !h-24"
                                rows={3}
                            />
                            <p className="text-neutral-400 text-sm mt-2">{t('objectRemover_objectHint')}</p>
                        </div>
                        <div className="flex justify-end gap-4 pt-4">
                            <button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button>
                            <button onClick={handleGenerate} className="btn btn-primary" disabled={!canGenerate || isLoading}>
                                {isLoading ? t('common_processing') : t('common_generate')}
                            </button>
                        </div>
                    </OptionsPanel>
                </motion.div>
            )}

            {/* Generating Stage - Show input image + loading result */}
            {appState.stage === 'generating' && (
                <motion.div className="flex flex-col items-center gap-8 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex flex-col md:flex-row items-start justify-center gap-8 w-full px-4">
                        <div className="flex flex-col items-center gap-4">
                            <ActionablePolaroidCard type="multi-input" caption={uploaderCaption} status="done" mediaUrl={appState.uploadedImage!} placeholderType="magic" onImageChange={() => { }} />
                            <p className="text-neutral-300 text-center max-w-xs text-sm">{uploaderDescription}</p>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <ActionablePolaroidCard type="output" caption={t('objectRemover_result')} status="pending" mediaUrl={undefined} placeholderType="magic" onImageChange={() => { }} />
                            <p className="text-yellow-400 text-center max-w-xs text-sm animate-pulse font-semibold">⏳ {t('common_processing')}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Results Stage */}
            {appState.stage === 'results' && (
                <ResultsView stage={appState.stage} originalImage={appState.uploadedImage} onOriginalClick={() => { }} error={appState.error} isMobile={false} actions={(<><button onClick={() => onStateChange({ ...appState, stage: 'configuring' })} className="btn btn-secondary">{t('common_edit')}</button><button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button></>)}>
                    {appState.resultImage && (<motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ActionablePolaroidCard type="output" caption={t('objectRemover_result')} status="done" mediaUrl={appState.resultImage} onImageChange={(url) => { if (url) { onStateChange({ ...appState, resultImage: url }); addImagesToGallery([url]); } }} /></motion.div>)}
                </ResultsView>
            )}
        </div>
    );
};

export default ObjectRemover;
