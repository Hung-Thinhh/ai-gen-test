/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PoseAnimator - Simplified version for pose-to-image generation
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStyledImage } from '../services/gemini/advancedImageService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import { AppScreenHeader, handleFileUpload as utilHandleFileUpload, ResultsView, OptionsPanel, useAppControls } from './uiUtils';

interface PoseAnimatorState { stage: 'configuring' | 'generating' | 'results'; poseReferenceImage: string | null; targetImage: string | null; resultImage: string | null; options: { instructions: string }; error: string | null; }
interface PoseAnimatorProps { mainTitle: string; subtitle: string; useSmartTitleWrapping: boolean; smartTitleWrapWords: number; uploaderCaptionPose: string; uploaderDescriptionPose: string; uploaderCaptionTarget: string; uploaderDescriptionTarget: string; addImagesToGallery: (images: string[]) => void; appState: PoseAnimatorState; onStateChange: (newState: PoseAnimatorState) => void; onReset: () => void; onGoBack: () => void; logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: { api_model_used?: string; credits_used?: number; generation_count?: number; }) => void; }

const PoseAnimator: React.FC<PoseAnimatorProps> = (props) => {
    const { uploaderCaptionPose, uploaderDescriptionPose, uploaderCaptionTarget, uploaderDescriptionTarget, addImagesToGallery, appState, onStateChange, onReset, logGeneration, ...headerProps } = props;
    const { t, checkCredits, modelVersion } = useAppControls();

    const handleGenerate = async () => {
        if (!appState.poseReferenceImage || !appState.targetImage) return;

        // Immediate Feedback
        const preGenState = { ...appState };
        onStateChange({ ...appState, stage: 'generating', error: null });

        const creditCostPerImage = modelVersion === 'v3' ? 2 : 1;
        if (!await checkCredits(creditCostPerImage)) {
            onStateChange({ ...appState, stage: 'configuring' });
            return;
        }

        try {
            const prompt = `Transfer the pose from the first image to match the person in the second image. ${appState.options.instructions}`;
            const result = await generateStyledImage(prompt, [appState.poseReferenceImage, appState.targetImage]);
            onStateChange({ ...appState, stage: 'results', resultImage: result });
            addImagesToGallery([result]);
            logGeneration('pose-animator', preGenState, result, {
                credits_used: creditCostPerImage,
                generation_count: 1,
                api_model_used: modelVersion === 'v3' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image'
            });
        } catch (err) {
            onStateChange({ ...appState, stage: 'results', error: err instanceof Error ? err.message : "Lỗi." });
        }
    };

    const canGenerate = appState.poseReferenceImage && appState.targetImage;
    const isLoading = appState.stage === 'generating';

    return (<div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-0"><AnimatePresence>{appState.stage === 'configuring' && <AppScreenHeader {...headerProps} />}</AnimatePresence>{appState.stage === 'configuring' && (<motion.div className="flex flex-col items-center gap-6 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Input images grid */}
        <div className="w-full pb-4 max-w-4xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-7xl mx-auto px-4">
                <div className="flex flex-col items-center gap-2">
                    <label htmlFor="pose-upload" className="cursor-pointer w-full"><ActionablePolaroidCard type={appState.poseReferenceImage ? 'multi-input' : 'uploader'} caption={uploaderCaptionPose} status="done" mediaUrl={appState.poseReferenceImage || undefined} placeholderType="person" onImageChange={(url) => onStateChange({ ...appState, poseReferenceImage: url })} /></label>
                    <input id="pose-upload" type="file" className="hidden" accept="image/*" onChange={(e) => { utilHandleFileUpload(e, (url) => { onStateChange({ ...appState, poseReferenceImage: url }); /* addImagesToGallery([url]); */ }); }} />
                    <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">{uploaderDescriptionPose}</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <label htmlFor="target-upload" className="cursor-pointer w-full"><ActionablePolaroidCard type={appState.targetImage ? 'multi-input' : 'uploader'} caption={uploaderCaptionTarget} status="done" mediaUrl={appState.targetImage || undefined} placeholderType="person" onImageChange={(url) => onStateChange({ ...appState, targetImage: url })} /></label>
                    <input id="target-upload" type="file" className="hidden" accept="image/*" onChange={(e) => { utilHandleFileUpload(e, (url) => { onStateChange({ ...appState, targetImage: url }); /* addImagesToGallery([url]); */ }); }} />
                    <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">{uploaderDescriptionTarget}</p>
                </div>
            </div>
        </div>
        {/* Options always visible */}
        <OptionsPanel><h2 className="base-font font-bold text-2xl text-yellow-400 border-b border-yellow-400/20 pb-2 mb-4">{t('common_options')}</h2><div><label className="block text-neutral-200 font-bold mb-2">{t('common_additionalInstructions')}</label><textarea value={appState.options.instructions} onChange={(e) => onStateChange({ ...appState, options: { instructions: e.target.value } })} placeholder={t('poseAnimator_instructionsPlaceholder')} className="form-input !h-24" rows={3} /></div><div className="flex justify-end gap-4 pt-4"><button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button><button onClick={handleGenerate} className="btn btn-primary" disabled={!canGenerate || isLoading}>{isLoading ? t('common_processing') : t('common_generate')}</button></div></OptionsPanel></motion.div>)}

        {/* Generating Stage */}
        {appState.stage === 'generating' && (
            <motion.div className="flex flex-col items-center gap-8 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex flex-col md:flex-row items-start justify-center gap-8 w-full px-4">
                    <div className="flex flex-col items-center gap-4">
                        <ActionablePolaroidCard type="multi-input" caption={uploaderCaptionPose} status="done" mediaUrl={appState.poseReferenceImage!} placeholderType="person" onImageChange={() => { }} />
                        <p className="text-neutral-300 text-center max-w-xs text-sm">{uploaderDescriptionPose}</p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <ActionablePolaroidCard type="multi-input" caption={uploaderCaptionTarget} status="done" mediaUrl={appState.targetImage!} placeholderType="person" onImageChange={() => { }} />
                        <p className="text-neutral-300 text-center max-w-xs text-sm">{uploaderDescriptionTarget}</p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <ActionablePolaroidCard type="output" caption={t('poseAnimator_result')} status="pending" mediaUrl={undefined} placeholderType="person" onImageChange={() => { }} />
                        <p className="text-yellow-400 text-center max-w-xs text-sm animate-pulse font-semibold">⏳ {t('common_processing')}</p>
                    </div>
                </div>
            </motion.div>
        )}

        {/* Results Stage */}
        {appState.stage === 'results' && (
            <ResultsView stage={appState.stage} originalImage={appState.targetImage} onOriginalClick={() => { }} error={appState.error} isMobile={false} actions={(<><button onClick={() => onStateChange({ ...appState, stage: 'configuring' })} className="btn btn-secondary">{t('common_edit')}</button><button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button></>)}>
                {appState.resultImage && (<motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ActionablePolaroidCard type="output" caption={t('poseAnimator_result')} status="done" mediaUrl={appState.resultImage} onImageChange={(url) => { if (url) { onStateChange({ ...appState, resultImage: url }); addImagesToGallery([url]); } }} /></motion.div>)}
            </ResultsView>
        )}</div>);
};

export default PoseAnimator;
