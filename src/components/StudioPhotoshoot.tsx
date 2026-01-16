/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStyledImage } from '../services/gemini/advancedImageService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import { AppScreenHeader, handleFileUpload as utilHandleFileUpload, ResultsView, OptionsPanel, useAppControls } from './uiUtils';

interface StudioPhotoshootState { stage: 'configuring' | 'generating' | 'results'; subjectImage: string | null; resultImage: string | null; options: { style: string; setup: string; mood: string; notes: string }; error: string | null; }
interface StudioPhotoshootProps { mainTitle: string; subtitle: string; useSmartTitleWrapping: boolean; smartTitleWrapWords: number; uploaderCaption: string; uploaderDescription: string; addImagesToGallery: (images: string[]) => void; appState: StudioPhotoshootState; onStateChange: (newState: StudioPhotoshootState) => void; onReset: () => void; onGoBack: () => void; logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: { api_model_used?: string; credits_used?: number; generation_count?: number; }) => void; }

const StudioPhotoshoot: React.FC<StudioPhotoshootProps> = (props) => {
    const { uploaderCaption, uploaderDescription, addImagesToGallery, appState, onStateChange, onReset, logGeneration, ...headerProps } = props;
    const { t, checkCredits, modelVersion } = useAppControls();

    const handleGenerate = async () => {
        if (!appState.subjectImage) return;

        // Check credits FIRST
        const preGenState = { ...appState };
        const creditCostPerImage = modelVersion === 'v3' ? 2 : 1;
        if (!await checkCredits(creditCostPerImage)) {
            return; // Stay in configuring
        }

        // Set generating stage AFTER credits confirmed
        onStateChange({ ...appState, stage: 'generating', error: null });

        try {
            const prompt = `**CRITICAL: PRESERVE EXACT IDENTITY**
Create a professional studio photoshoot of the person in the provided image.

**ABSOLUTE REQUIREMENT - FACE IDENTITY PRESERVATION:**
- The person in the output MUST be the EXACT SAME PERSON as in the input image.
- Preserve 100% of facial features: eyes, nose, mouth, face shape, jawline, cheekbones.
- Maintain the original skin tone and any distinguishing features.
- If someone knows this person, they MUST immediately recognize them.

**STUDIO SETTINGS:**
- Style: ${appState.options.style || 'commercial'}
- Setup: ${appState.options.setup || 'clean backdrop'}
- Mood: ${appState.options.mood || 'professional'}
${appState.options.notes ? `- Additional notes: ${appState.options.notes}` : ''}

**QUALITY:** High resolution, professional photography, photorealistic result.`;
            const result = await generateStyledImage(prompt, [appState.subjectImage], undefined, undefined, 'studio-photoshoot');
            onStateChange({ ...appState, stage: 'results', resultImage: result });
            addImagesToGallery([result]);
            logGeneration('studio-photoshoot', preGenState, result, {
                credits_used: creditCostPerImage,
                generation_count: 1,
                api_model_used: modelVersion === 'v3' ? 'imagen-3.0-generate-001' : 'gemini-2.5-flash-image'
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
                    <label htmlFor="studio-upload" className="cursor-pointer w-full"><ActionablePolaroidCard type={appState.subjectImage ? 'multi-input' : 'uploader'} caption={uploaderCaption} status="done" mediaUrl={appState.subjectImage || undefined} placeholderType="person" onImageChange={(url) => onStateChange({ ...appState, subjectImage: url })} /></label>
                    <input id="studio-upload" type="file" className="hidden" accept="image/*" onChange={(e) => { utilHandleFileUpload(e, (url) => { onStateChange({ ...appState, subjectImage: url, resultImage: null, error: null }); /* addImagesToGallery([url]); */ }); }} />
                    <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">{uploaderDescription}</p>
                </div>
            </div>
        </div>
        {/* Options always visible */}
        <OptionsPanel><h2 className="base-font font-bold text-2xl text-yellow-400 border-b border-yellow-400/20 pb-2 mb-4">{t('common_options')}</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label className="block text-neutral-200 font-bold mb-2">{t('studioPhotoshoot_style')}</label><select value={appState.options.style} onChange={(e) => onStateChange({ ...appState, options: { ...appState.options, style: e.target.value } })} className="form-input"><option value="commercial">Commercial</option><option value="editorial">Editorial</option><option value="fashion">Fashion</option><option value="beauty">Beauty</option></select></div><div><label className="block text-neutral-200 font-bold mb-2">{t('studioPhotoshoot_setup')}</label><select value={appState.options.setup} onChange={(e) => onStateChange({ ...appState, options: { ...appState.options, setup: e.target.value } })} className="form-input"><option value="clean backdrop">Clean Backdrop</option><option value="seamless">Seamless</option><option value="textured">Textured</option><option value="cyclorama">Cyclorama</option></select></div><div><label className="block text-neutral-200 font-bold mb-2">{t('studioPhotoshoot_mood')}</label><select value={appState.options.mood} onChange={(e) => onStateChange({ ...appState, options: { ...appState.options, mood: e.target.value } })} className="form-input"><option value="professional">Professional</option><option value="dramatic">Dramatic</option><option value="bright">Bright</option><option value="moody">Moody</option></select></div></div><div><label className="block text-neutral-200 font-bold mb-2">{t('common_additionalNotes')}</label><textarea value={appState.options.notes} onChange={(e) => onStateChange({ ...appState, options: { ...appState.options, notes: e.target.value } })} className="form-input !h-24" rows={3} /></div><div className="flex justify-end gap-4 pt-4"><button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button><button onClick={handleGenerate} className="btn btn-primary" disabled={!appState.subjectImage || isLoading}>{isLoading ? t('common_processing') : t('common_generate')}</button></div></OptionsPanel></motion.div>)}

        {/* Generating Stage */}
        {appState.stage === 'generating' && (
            <motion.div className="flex flex-col items-center gap-8 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex flex-col md:flex-row items-start justify-center gap-8 w-full px-4">
                    <div className="flex flex-col items-center gap-4">
                        <ActionablePolaroidCard type="multi-input" caption={uploaderCaption} status="done" mediaUrl={appState.subjectImage!} placeholderType="person" onImageChange={() => { }} />
                        <p className="text-neutral-300 text-center max-w-xs text-sm">{uploaderDescription}</p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <ActionablePolaroidCard type="output" caption={t('studioPhotoshoot_result')} status="pending" mediaUrl={undefined} placeholderType="person" onImageChange={() => { }} />
                        <p className="text-yellow-400 text-center max-w-xs text-sm animate-pulse font-semibold">⏳ {t('common_processing')}</p>
                    </div>
                </div>
            </motion.div>
        )}

        {/* Results Stage */}
        {appState.stage === 'results' && (
            <ResultsView stage={appState.stage} originalImage={appState.subjectImage} onOriginalClick={() => { }} error={appState.error} isMobile={false} actions={(<><button onClick={() => onStateChange({ ...appState, stage: 'configuring' })} className="btn btn-secondary">{t('common_edit')}</button><button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button></>)}>
                {appState.resultImage && (<motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ActionablePolaroidCard type="output" caption={t('studioPhotoshoot_result')} status="done" mediaUrl={appState.resultImage} onImageChange={(url) => { if (url) { onStateChange({ ...appState, resultImage: url }); addImagesToGallery([url]); } }} /></motion.div>)}
            </ResultsView>
        )}</div>);
};

export default StudioPhotoshoot;
