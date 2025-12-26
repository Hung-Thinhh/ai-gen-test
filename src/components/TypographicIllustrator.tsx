/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateTypographicIllustration } from '../services/gemini/advancedImageService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import { AppScreenHeader, ResultsView, OptionsPanel, useAppControls } from './uiUtils';

interface TypographicIllustratorState { stage: 'configuring' | 'generating' | 'results'; phrase: string; resultImage: string | null; error: string | null; }
interface TypographicIllustratorProps { mainTitle: string; subtitle: string; useSmartTitleWrapping: boolean; smartTitleWrapWords: number; addImagesToGallery: (images: string[]) => void; appState: TypographicIllustratorState; onStateChange: (newState: TypographicIllustratorState) => void; onReset: () => void; onGoBack: () => void; logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: { api_model_used?: string; credits_used?: number; generation_count?: number; }) => void; }

const TypographicIllustrator: React.FC<TypographicIllustratorProps> = (props) => {
    const { addImagesToGallery, appState, onStateChange, onReset, logGeneration, ...headerProps } = props;
    const { t, checkCredits, modelVersion } = useAppControls();

    const handleGenerate = async () => {
        if (!appState.phrase.trim()) return;

        // Check credits FIRST
        const preGenState = { ...appState };
        const creditCostPerImage = modelVersion === 'v3' ? 2 : 1;
        const hasCredits = await checkCredits(creditCostPerImage);
        if (!hasCredits) {
            return; // Stay in configuring
        }

        // Set generating stage AFTER credits confirmed
        onStateChange({ ...appState, stage: 'generating', error: null });
        try {
            const result = await generateTypographicIllustration(appState.phrase);
            onStateChange({ ...appState, stage: 'results', resultImage: result });
            addImagesToGallery([result]);
            logGeneration('typographic-illustrator', preGenState, result, {
                credits_used: creditCostPerImage,
                generation_count: 1,
                api_model_used: modelVersion === 'v3' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image'
            });
        } catch (err) {
            onStateChange({ ...appState, stage: 'results', error: err instanceof Error ? err.message : "Lỗi." });
        }
    };

    const isLoading = appState.stage === 'generating';

    return (<div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-0"><AnimatePresence>{appState.stage === 'configuring' && <AppScreenHeader {...headerProps} />}</AnimatePresence>{appState.stage === 'configuring' && (<motion.div className="flex flex-col items-center gap-6 w-full max-w-screen-xl py-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><OptionsPanel><h2 className="base-font font-bold text-2xl text-yellow-400 border-b border-yellow-400/20 pb-2 mb-4">{t('typographicIllustrator_title')}</h2><div><label className="block text-neutral-200 font-bold mb-2">{t('typographicIllustrator_phraseLabel')} *</label><input type="text" value={appState.phrase} onChange={(e) => onStateChange({ ...appState, phrase: e.target.value })} placeholder={t('typographicIllustrator_phrasePlaceholder')} className="form-input" /></div><p className="text-neutral-400 text-sm">{t('typographicIllustrator_description')}</p><div className="flex justify-end gap-4 pt-4"><button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button><button onClick={handleGenerate} className="btn btn-primary" disabled={!appState.phrase.trim() || isLoading}>{isLoading ? t('common_processing') : t('common_generate')}</button></div></OptionsPanel></motion.div>)}

        {/* Generating Stage */}
        {appState.stage === 'generating' && (
            <motion.div className="flex flex-col items-center gap-8 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex flex-col items-center gap-4">
                    <ActionablePolaroidCard type="output" caption={t('typographicIllustrator_result')} status="pending" mediaUrl={undefined} placeholderType="magic" onImageChange={() => { }} />
                    <p className="text-yellow-400 text-center max-w-xs text-sm animate-pulse font-semibold">⏳ {t('common_processing')}</p>
                    <p className="text-neutral-300 text-center max-w-md text-sm">Đang tạo minh họa cho: "{appState.phrase}"</p>
                </div>
            </motion.div>
        )}

        {/* Results Stage */}
        {appState.stage === 'results' && (
            <ResultsView stage={appState.stage} originalImage={null} onOriginalClick={() => { }} error={appState.error} isMobile={false} actions={(<><button onClick={() => onStateChange({ ...appState, stage: 'configuring' })} className="btn btn-secondary">{t('common_edit')}</button><button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button></>)}>
                {appState.resultImage && (<motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ActionablePolaroidCard type="output" caption={t('typographicIllustrator_result')} status="done" mediaUrl={appState.resultImage} onImageChange={(url) => { if (url) { onStateChange({ ...appState, resultImage: url }); addImagesToGallery([url]); } }} /></motion.div>)}
            </ResultsView>
        )}</div>);
};

export default TypographicIllustrator;
