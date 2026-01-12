/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStyledImage } from '../services/gemini/advancedImageService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import { AppScreenHeader, handleFileUpload as utilHandleFileUpload, ResultsView, OptionsPanel, useAppControls } from './uiUtils';

interface PhotoshootState { stage: 'configuring' | 'generating' | 'results'; personImage: string | null; outfitImage: string | null; resultImage: string | null; options: { background: string; pose: string; lighting: string; notes: string }; error: string | null; }
interface PhotoshootProps { mainTitle: string; subtitle: string; useSmartTitleWrapping: boolean; smartTitleWrapWords: number; uploaderCaptionPerson: string; uploaderDescriptionPerson: string; uploaderCaptionOutfit: string; uploaderDescriptionOutfit: string; addImagesToGallery: (images: string[]) => void; appState: PhotoshootState; onStateChange: (newState: PhotoshootState) => void; onReset: () => void; onGoBack: () => void; logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: { api_model_used?: string; credits_used?: number; generation_count?: number; }) => void; }

const Photoshoot: React.FC<PhotoshootProps> = (props) => {
    const { uploaderCaptionPerson, uploaderDescriptionPerson, uploaderCaptionOutfit, uploaderDescriptionOutfit, addImagesToGallery, appState, onStateChange, onReset, logGeneration, ...headerProps } = props;
    const { t, checkCredits, modelVersion } = useAppControls();

    const handleGenerate = async () => {
        if (!appState.personImage) return;

        // Check credits FIRST
        const preGenState = { ...appState };
        const creditCostPerImage = modelVersion === 'v3' ? 2 : 1;
        if (!await checkCredits(creditCostPerImage)) {
            return; // Stay in configuring
        }

        // Set generating stage AFTER credits confirmed
        onStateChange({ ...appState, stage: 'generating', error: null });

        try {
            const images = appState.outfitImage ? [appState.personImage, appState.outfitImage] : [appState.personImage];
            const prompt = `**CRITICAL: PRESERVE EXACT IDENTITY**
Create a professional photoshoot of the person in the provided image.

**ABSOLUTE REQUIREMENT - FACE IDENTITY PRESERVATION:**
- The person in the output MUST be the EXACT SAME PERSON as in the input image.
- Preserve 100% of facial features: eyes, nose, mouth, face shape, jawline, cheekbones.
- Maintain the original skin tone and any distinguishing features.
- If someone knows this person, they MUST immediately recognize them.

**PHOTOSHOOT SETTINGS:**
- Background: ${appState.options.background || 'studio'}
- Pose: ${appState.options.pose || 'standing'}
- Lighting: ${appState.options.lighting || 'professional'}
${appState.options.notes ? `- Additional notes: ${appState.options.notes}` : ''}

**QUALITY:** High resolution, professional photography, photorealistic result.`;
            const result = await generateStyledImage(prompt, images);
            onStateChange({ ...appState, stage: 'results', resultImage: result });
            addImagesToGallery([result]);
            logGeneration('photoshoot', preGenState, result, {
                credits_used: creditCostPerImage,
                generation_count: 1,
                api_model_used: modelVersion === 'v3' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image'
            });
        } catch (err) {
            onStateChange({ ...appState, stage: 'results', error: err instanceof Error ? err.message : "Lỗi." });
        }
    };

    const isLoading = appState.stage === 'generating';

    return (<div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-screen"><AnimatePresence>{appState.stage === 'configuring' && <AppScreenHeader {...headerProps} />}</AnimatePresence>{appState.stage === 'configuring' && (<motion.div className="flex flex-col items-center gap-6 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Input images grid */}
        <div className="w-full pb-4 max-w-4xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-7xl mx-auto px-4">
                <div className="flex flex-col items-center gap-2">
                    <label htmlFor="person-upload" className="cursor-pointer w-full"><ActionablePolaroidCard type={appState.personImage ? 'multi-input' : 'uploader'} caption={uploaderCaptionPerson} status="done" mediaUrl={appState.personImage || undefined} placeholderType="person" onImageChange={(url) => onStateChange({ ...appState, personImage: url })} /></label>
                    <input id="person-upload" type="file" className="hidden" accept="image/*" onChange={(e) => { utilHandleFileUpload(e, (url) => { onStateChange({ ...appState, personImage: url }); /* addImagesToGallery([url]); */ }); }} />
                    <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">{uploaderDescriptionPerson}</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <label htmlFor="outfit-upload2" className="cursor-pointer w-full"><ActionablePolaroidCard type={appState.outfitImage ? 'multi-input' : 'uploader'} caption={uploaderCaptionOutfit} status="done" mediaUrl={appState.outfitImage || undefined} placeholderType="magic" onImageChange={(url) => onStateChange({ ...appState, outfitImage: url })} /></label>
                    <input id="outfit-upload2" type="file" className="hidden" accept="image/*" onChange={(e) => { utilHandleFileUpload(e, (url) => { onStateChange({ ...appState, outfitImage: url }); /* addImagesToGallery([url]); */ }); }} />
                    <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">{uploaderDescriptionOutfit}</p>
                </div>
            </div>
        </div>
        {/* Options always visible */}
        <OptionsPanel><h2 className="base-font font-bold text-2xl text-yellow-400 border-b border-yellow-400/20 pb-2 mb-4">{t('common_options')}</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label className="block text-neutral-200 font-bold mb-2">{t('photoshoot_background')}</label><input type="text" value={appState.options.background} onChange={(e) => onStateChange({ ...appState, options: { ...appState.options, background: e.target.value } })} placeholder="studio, outdoor, urban..." className="form-input" /></div><div><label className="block text-neutral-200 font-bold mb-2">{t('photoshoot_pose')}</label><input type="text" value={appState.options.pose} onChange={(e) => onStateChange({ ...appState, options: { ...appState.options, pose: e.target.value } })} placeholder="standing, sitting, dynamic..." className="form-input" /></div><div><label className="block text-neutral-200 font-bold mb-2">{t('photoshoot_lighting')}</label><input type="text" value={appState.options.lighting} onChange={(e) => onStateChange({ ...appState, options: { ...appState.options, lighting: e.target.value } })} placeholder="natural, studio, golden hour..." className="form-input" /></div></div><div><label className="block text-neutral-200 font-bold mb-2">{t('common_additionalNotes')}</label><textarea value={appState.options.notes} onChange={(e) => onStateChange({ ...appState, options: { ...appState.options, notes: e.target.value } })} className="form-input !h-24" rows={3} /></div><div className="flex justify-end gap-4 pt-4"><button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button><button onClick={handleGenerate} className="btn btn-primary" disabled={!appState.personImage || isLoading}>{isLoading ? t('common_processing') : t('common_generate')}</button></div></OptionsPanel></motion.div>)}

        {/* Generating Stage */}
        {appState.stage === 'generating' && (
            <motion.div className="flex flex-col items-center gap-8 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex flex-col md:flex-row items-start justify-center gap-8 w-full px-4">
                    <div className="flex flex-col items-center gap-4">
                        <ActionablePolaroidCard type="multi-input" caption={uploaderCaptionPerson} status="done" mediaUrl={appState.personImage!} placeholderType="person" onImageChange={() => { }} />
                        <p className="text-neutral-300 text-center max-w-xs text-sm">{uploaderDescriptionPerson}</p>
                    </div>
                    {appState.outfitImage && (
                        <div className="flex flex-col items-center gap-4">
                            <ActionablePolaroidCard type="multi-input" caption={uploaderCaptionOutfit} status="done" mediaUrl={appState.outfitImage} placeholderType="magic" onImageChange={() => { }} />
                            <p className="text-neutral-300 text-center max-w-xs text-sm">{uploaderDescriptionOutfit}</p>
                        </div>
                    )}
                    <div className="flex flex-col items-center gap-4">
                        <ActionablePolaroidCard type="output" caption={t('photoshoot_result')} status="pending" mediaUrl={undefined} placeholderType="person" onImageChange={() => { }} />
                        <p className="text-yellow-400 text-center max-w-xs text-sm animate-pulse font-semibold">⏳ {t('common_processing')}</p>
                    </div>
                </div>
            </motion.div>
        )}

        {/* Results Stage */}
        {appState.stage === 'results' && (
            <ResultsView stage={appState.stage} originalImage={appState.personImage} onOriginalClick={() => { }} error={appState.error} isMobile={false} actions={(<><button onClick={() => onStateChange({ ...appState, stage: 'configuring' })} className="btn btn-secondary">{t('common_edit')}</button><button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button></>)}>
                {appState.resultImage && (<motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ActionablePolaroidCard type="output" caption={t('photoshoot_result')} status="done" mediaUrl={appState.resultImage} onImageChange={(url) => { if (url) { onStateChange({ ...appState, resultImage: url }); addImagesToGallery([url]); } }} /></motion.div>)}
            </ResultsView>
        )}</div>);
};

export default Photoshoot;
