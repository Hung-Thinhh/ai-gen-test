/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStyledImage } from '../services/gemini/advancedImageService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import { AppScreenHeader, handleFileUpload as utilHandleFileUpload, ResultsView, OptionsPanel, useAppControls } from './uiUtils';

interface ProductSceneState { stage: 'configuring' | 'generating' | 'results'; productImage: string | null; resultImage: string | null; options: { scene: string; lighting: string; angle: string }; error: string | null; }
interface ProductSceneProps { mainTitle: string; subtitle: string; useSmartTitleWrapping: boolean; smartTitleWrapWords: number; uploaderCaption: string; uploaderDescription: string; addImagesToGallery: (images: string[]) => void; appState: ProductSceneState; onStateChange: (newState: ProductSceneState) => void; onReset: () => void; onGoBack: () => void; logGeneration: (appId: string, preGenState: any, thumbnailUrl: string) => void; }

const ProductSceneGenerator: React.FC<ProductSceneProps> = (props) => {
    const { uploaderCaption, uploaderDescription, addImagesToGallery, appState, onStateChange, onReset, logGeneration, ...headerProps } = props;
    const { t, checkCredits } = useAppControls();

    const handleGenerate = async () => {
        if (!appState.productImage) return;
        if (!await checkCredits()) return;
        const preGenState = { ...appState };
        onStateChange({ ...appState, stage: 'generating', error: null });
        try {
            const prompt = `Product scene: ${appState.options.scene || 'lifestyle'}. Lighting: ${appState.options.lighting || 'natural'}. Angle: ${appState.options.angle || 'front'}. Professional product photography.`;
            const result = await generateStyledImage(prompt, [appState.productImage]);
            onStateChange({ ...appState, stage: 'results', resultImage: result });
            addImagesToGallery([result]);
            logGeneration('product-scene', preGenState, result);
        } catch (err) {
            onStateChange({ ...appState, stage: 'results', error: err instanceof Error ? err.message : "Lỗi." });
        }
    };

    const isLoading = appState.stage === 'generating';

    return (<div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-0"><AnimatePresence>{appState.stage === 'configuring' && <AppScreenHeader {...headerProps} />}</AnimatePresence>{appState.stage === 'configuring' && (<motion.div className="flex flex-col items-center gap-6 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Input images grid */}
        <div className="w-full pb-4 max-w-4xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-7xl mx-auto px-4">
                <div className="flex flex-col items-center gap-2">
                    <label htmlFor="prodscene-upload" className="cursor-pointer w-full"><ActionablePolaroidCard type={appState.productImage ? 'multi-input' : 'uploader'} caption={uploaderCaption} status="done" mediaUrl={appState.productImage || undefined} placeholderType="magic" onImageChange={(url) => onStateChange({ ...appState, productImage: url })} /></label>
                    <input id="prodscene-upload" type="file" className="hidden" accept="image/*" onChange={(e) => { utilHandleFileUpload(e, (url) => { onStateChange({ ...appState, productImage: url, resultImage: null, error: null }); /* addImagesToGallery([url]); */ }); }} />
                    <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">{uploaderDescription}</p>
                </div>
            </div>
        </div>
        {/* Options always visible */}
        <OptionsPanel><h2 className="base-font font-bold text-2xl text-yellow-400 border-b border-yellow-400/20 pb-2 mb-4">{t('common_options')}</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label className="block text-neutral-200 font-bold mb-2">{t('productScene_scene')}</label><select value={appState.options.scene} onChange={(e) => onStateChange({ ...appState, options: { ...appState.options, scene: e.target.value } })} className="form-input"><option value="lifestyle">Lifestyle</option><option value="studio">Studio</option><option value="outdoor">Outdoor</option><option value="minimal">Minimal</option></select></div><div><label className="block text-neutral-200 font-bold mb-2">{t('productScene_lighting')}</label><select value={appState.options.lighting} onChange={(e) => onStateChange({ ...appState, options: { ...appState.options, lighting: e.target.value } })} className="form-input"><option value="natural">Natural</option><option value="studio">Studio</option><option value="dramatic">Dramatic</option><option value="soft">Soft</option></select></div><div><label className="block text-neutral-200 font-bold mb-2">{t('productScene_angle')}</label><select value={appState.options.angle} onChange={(e) => onStateChange({ ...appState, options: { ...appState.options, angle: e.target.value } })} className="form-input"><option value="front">Front</option><option value="top">Top</option><option value="angle">3/4 Angle</option><option value="closeup">Close-up</option></select></div></div><div className="flex justify-end gap-4 pt-4"><button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button><button onClick={handleGenerate} className="btn btn-primary" disabled={!appState.productImage || isLoading}>{isLoading ? t('common_processing') : t('common_generate')}</button></div></OptionsPanel></motion.div>)}

        {/* Generating Stage */}
        {appState.stage === 'generating' && (
            <motion.div className="flex flex-col items-center gap-8 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex flex-col md:flex-row items-start justify-center gap-8 w-full px-4">
                    <div className="flex flex-col items-center gap-4">
                        <ActionablePolaroidCard type="multi-input" caption={uploaderCaption} status="done" mediaUrl={appState.productImage!} placeholderType="magic" onImageChange={() => { }} />
                        <p className="text-neutral-300 text-center max-w-xs text-sm">{uploaderDescription}</p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <ActionablePolaroidCard type="output" caption={t('productScene_result')} status="pending" mediaUrl={undefined} placeholderType="magic" onImageChange={() => { }} />
                        <p className="text-yellow-400 text-center max-w-xs text-sm animate-pulse font-semibold">⏳ {t('common_processing')}</p>
                    </div>
                </div>
            </motion.div>
        )}

        {/* Results Stage */}
        {appState.stage === 'results' && (
            <ResultsView stage={appState.stage} originalImage={appState.productImage} onOriginalClick={() => { }} error={appState.error} isMobile={false} actions={(<><button onClick={() => onStateChange({ ...appState, stage: 'configuring' })} className="btn btn-secondary">{t('common_edit')}</button><button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button></>)}>
                {appState.resultImage && (<motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ActionablePolaroidCard type="output" caption={t('productScene_result')} status="done" mediaUrl={appState.resultImage} onImageChange={(url) => { if (url) { onStateChange({ ...appState, resultImage: url }); addImagesToGallery([url]); } }} /></motion.div>)}
            </ResultsView>
        )}</div>);
};

export default ProductSceneGenerator;
