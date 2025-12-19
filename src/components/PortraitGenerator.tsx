/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStyledImage } from '../services/gemini/advancedImageService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import { AppScreenHeader, ResultsView, OptionsPanel, useAppControls } from './uiUtils';

interface PortraitGeneratorState { stage: 'configuring' | 'generating' | 'results'; prompt: string; uploadedImage: string | null; resultImage: string | null; options: { style: string; lighting: string; background: string; notes: string }; error: string | null; }
interface PortraitGeneratorProps { mainTitle: string; subtitle: string; useSmartTitleWrapping: boolean; smartTitleWrapWords: number; addImagesToGallery: (images: string[]) => void; appState: PortraitGeneratorState; onStateChange: (newState: PortraitGeneratorState) => void; onReset: () => void; onGoBack: () => void; logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: { api_model_used?: string; }) => void; }

// Simple Uploader Component
const Uploader = ({ onImageUpload, currentImage, onRemove }: { onImageUpload: (file: File) => void, currentImage: string | null, onRemove: () => void }) => {
    const { t } = useAppControls();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) onImageUpload(e.target.files[0]);
    };
    return (
        <div className="w-full">
            <label className="block text-neutral-200 font-bold mb-2">{t('common_referenceImage')} (Optional)</label>
            {currentImage ? (
                <div className="relative group w-32 h-32 rounded-lg overflow-hidden border border-neutral-700">
                    <img src={currentImage} alt="Uploaded" className="w-full h-full object-cover" />
                    <button onClick={onRemove} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
            ) : (
                <label className="cursor-pointer border-2 border-dashed border-neutral-700 hover:border-neutral-500 rounded-lg h-32 w-full max-w-sm flex flex-col items-center justify-center bg-white/5 transition-colors">
                    <span className="text-neutral-400 text-sm">{t('idPhotoCreator_clickToUpload')}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
            )}
        </div>
    );
};

const PortraitGenerator: React.FC<PortraitGeneratorProps> = (props) => {
    const { addImagesToGallery, appState, onStateChange, onReset, logGeneration, ...headerProps } = props;
    const { t, checkCredits, modelVersion } = useAppControls();

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            onStateChange({ ...appState, uploadedImage: reader.result as string });
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (!appState.prompt.trim()) return;

        // Immediate Feedback
        const preGenState = { ...appState };
        onStateChange({ ...appState, stage: 'generating', error: null });

        if (!await checkCredits()) {
            onStateChange({ ...appState, stage: 'configuring' });
            return;
        }

        try {
            const fullPrompt = `Generate a portrait: ${appState.prompt}. Style: ${appState.options.style || 'photorealistic'}. Lighting: ${appState.options.lighting || 'natural'}. Background: ${appState.options.background || 'neutral'}. ${appState.options.notes}`;
            const images = appState.uploadedImage ? [appState.uploadedImage] : [];
            const result = await generateStyledImage(fullPrompt, images);
            onStateChange({ ...appState, stage: 'results', resultImage: result });
            addImagesToGallery([result]);
            logGeneration('portrait-generator', preGenState, result, {
                api_model_used: modelVersion === 'v3' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image'
            });
        } catch (err) {
            onStateChange({ ...appState, stage: 'results', error: err instanceof Error ? err.message : "Lỗi." });
        }
    };

    const isLoading = appState.stage === 'generating';

    return (<div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-0"><AnimatePresence>{appState.stage === 'configuring' && <AppScreenHeader {...headerProps} />}</AnimatePresence>{appState.stage === 'configuring' && (<motion.div className="flex flex-col items-center gap-6 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><OptionsPanel><h2 className="base-font font-bold text-2xl text-yellow-400 border-b border-yellow-400/20 pb-2 mb-4">{t('portraitGenerator_optionsTitle')}</h2>
        <Uploader onImageUpload={handleImageUpload} currentImage={appState.uploadedImage} onRemove={() => onStateChange({ ...appState, uploadedImage: null })} />
        <div><label className="block text-neutral-200 font-bold mb-2">{t('portraitGenerator_prompt')} *</label><input type="text" value={appState.prompt} onChange={(e) => onStateChange({ ...appState, prompt: e.target.value })} placeholder={t('portraitGenerator_promptPlaceholder')} className="form-input" /></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label className="block text-neutral-200 font-bold mb-2">{t('portraitGenerator_style')}</label><select value={appState.options.style} onChange={(e) => onStateChange({ ...appState, options: { ...appState.options, style: e.target.value } })} className="form-input"><option value="">Photorealistic</option><option value="artistic">Artistic</option><option value="dramatic">Dramatic</option><option value="soft">Soft</option></select></div><div><label className="block text-neutral-200 font-bold mb-2">{t('portraitGenerator_lighting')}</label><select value={appState.options.lighting} onChange={(e) => onStateChange({ ...appState, options: { ...appState.options, lighting: e.target.value } })} className="form-input"><option value="">Natural</option><option value="studio">Studio</option><option value="golden-hour">Golden Hour</option><option value="dramatic">Dramatic</option></select></div><div><label className="block text-neutral-200 font-bold mb-2">{t('portraitGenerator_background')}</label><select value={appState.options.background} onChange={(e) => onStateChange({ ...appState, options: { ...appState.options, background: e.target.value } })} className="form-input"><option value="">Neutral</option><option value="outdoor">Outdoor</option><option value="studio">Studio</option><option value="bokeh">Bokeh</option></select></div></div><div><label className="block text-neutral-200 font-bold mb-2">{t('common_additionalNotes')}</label><textarea value={appState.options.notes} onChange={(e) => onStateChange({ ...appState, options: { ...appState.options, notes: e.target.value } })} placeholder={t('portraitGenerator_notesPlaceholder')} className="form-input !h-24" rows={3} /></div><div className="flex justify-end gap-4 pt-4"><button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button><button onClick={handleGenerate} className="btn btn-primary" disabled={!appState.prompt.trim() || isLoading}>{isLoading ? t('common_processing') : t('common_generate')}</button></div></OptionsPanel></motion.div>)}

        {/* Generating Stage */}
        {appState.stage === 'generating' && (
            <motion.div className="flex flex-col items-center gap-8 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex flex-col items-center gap-4">
                    <ActionablePolaroidCard type="output" caption={t('portraitGenerator_result')} status="pending" mediaUrl={undefined} placeholderType="person" onImageChange={() => { }} />
                    <p className="text-yellow-400 text-center max-w-xs text-sm animate-pulse font-semibold">⏳ {t('common_processing')}</p>
                    <p className="text-neutral-300 text-center max-w-md text-sm">Đang tạo chân dung: "{appState.prompt}"</p>
                </div>
            </motion.div>
        )}

        {/* Results Stage */}
        {appState.stage === 'results' && (
            <ResultsView stage={appState.stage} originalImage={appState.uploadedImage} onOriginalClick={() => { }} error={appState.error} isMobile={false} actions={(<><button onClick={() => onStateChange({ ...appState, stage: 'configuring' })} className="btn btn-secondary">{t('common_edit')}</button><button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button></>)}>
                {appState.resultImage && (<motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ActionablePolaroidCard type="output" caption={t('portraitGenerator_result')} status="done" mediaUrl={appState.resultImage} onImageChange={(url) => { if (url) { onStateChange({ ...appState, resultImage: url }); addImagesToGallery([url]); } }} /></motion.div>)}
            </ResultsView>
        )}</div>);
};

export default PortraitGenerator;
