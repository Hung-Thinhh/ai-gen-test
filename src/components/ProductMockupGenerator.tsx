/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateProductMockup } from '../services/gemini/advancedImageService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import { AppScreenHeader, handleFileUpload as utilHandleFileUpload, ResultsView, OptionsPanel, useAppControls } from './uiUtils';

interface ProductMockupState { stage: 'configuring' | 'generating' | 'results'; logoImage: string | null; productImage: string | null; resultImage: string | null; error: string | null; }
interface ProductMockupProps { mainTitle: string; subtitle: string; useSmartTitleWrapping: boolean; smartTitleWrapWords: number; uploaderCaptionLogo: string; uploaderDescriptionLogo: string; uploaderCaptionProduct: string; uploaderDescriptionProduct: string; addImagesToGallery: (images: string[]) => void; appState: ProductMockupState; onStateChange: (newState: ProductMockupState) => void; onReset: () => void; onGoBack: () => void; logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: { api_model_used?: string; credits_used?: number; generation_count?: number; }) => void; }

const ProductMockupGenerator: React.FC<ProductMockupProps> = (props) => {
    const { uploaderCaptionLogo, uploaderDescriptionLogo, uploaderCaptionProduct, uploaderDescriptionProduct, addImagesToGallery, appState, onStateChange, onReset, logGeneration, ...headerProps } = props;
    const { t, checkCredits, modelVersion } = useAppControls();

    const handleGenerate = async () => {
        if (!appState.logoImage || !appState.productImage) return;

        // Check credits FIRST
        const preGenState = { ...appState };
        const creditCostPerImage = modelVersion === 'v3' ? 2 : 1;
        if (!await checkCredits(creditCostPerImage)) {
            return; // Stay in configuring
        }

        // Set generating stage AFTER credits confirmed
        onStateChange({ ...appState, stage: 'generating', error: null });

        try {
            const result = await generateProductMockup(appState.logoImage, appState.productImage, 'product-mockup');
            onStateChange({ ...appState, stage: 'results', resultImage: result });
            addImagesToGallery([result]);
            logGeneration('product-mockup', preGenState, result, {
                credits_used: creditCostPerImage,
                generation_count: 1,
                api_model_used: modelVersion === 'v3' ? 'imagen-3.0-generate-001' : 'gemini-2.5-flash-image'
            });
        } catch (err) {
            onStateChange({ ...appState, stage: 'results', error: err instanceof Error ? err.message : "Lỗi." });
        }
    };

    const canGenerate = appState.logoImage && appState.productImage;
    const isLoading = appState.stage === 'generating';

    return (<div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-screen"><AnimatePresence>{appState.stage === 'configuring' && <AppScreenHeader {...headerProps} />}</AnimatePresence>{appState.stage === 'configuring' && (<motion.div className="flex flex-col items-center gap-6 w-full max-w-screen-xl py-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Input images grid */}
        <div className="w-full pb-4 max-w-4xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-7xl mx-auto px-4">
                <div className="flex flex-col items-center gap-2">
                    <label htmlFor="logo-upload" className="cursor-pointer w-full"><ActionablePolaroidCard type={appState.logoImage ? 'multi-input' : 'uploader'} caption={uploaderCaptionLogo} status="done" mediaUrl={appState.logoImage || undefined} placeholderType="magic" onImageChange={(url) => onStateChange({ ...appState, logoImage: url })} /></label>
                    <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={(e) => { utilHandleFileUpload(e, (url) => { onStateChange({ ...appState, logoImage: url }); /* addImagesToGallery([url]);*/ }); }} />
                    <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">{uploaderDescriptionLogo}</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <label htmlFor="product-upload" className="cursor-pointer w-full"><ActionablePolaroidCard type={appState.productImage ? 'multi-input' : 'uploader'} caption={uploaderCaptionProduct} status="done" mediaUrl={appState.productImage || undefined} placeholderType="magic" onImageChange={(url) => onStateChange({ ...appState, productImage: url })} /></label>
                    <input id="product-upload" type="file" className="hidden" accept="image/*" onChange={(e) => { utilHandleFileUpload(e, (url) => { onStateChange({ ...appState, productImage: url }); /* addImagesToGallery([url]);*/ }); }} />
                    <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">{uploaderDescriptionProduct}</p>
                </div>
            </div>
        </div>
        {/* Options always visible */}
        <OptionsPanel><div className="flex justify-end gap-4"><button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button><button onClick={handleGenerate} className="btn btn-primary" disabled={!canGenerate || isLoading}>{isLoading ? t('common_processing') : t('common_generate')}</button></div></OptionsPanel></motion.div>)}

        {/* Generating Stage */}
        {appState.stage === 'generating' && (
            <motion.div className="flex flex-col items-center gap-8 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex flex-col md:flex-row items-start justify-center gap-8 w-full px-4">
                    <div className="flex flex-col items-center gap-4">
                        <ActionablePolaroidCard type="multi-input" caption={uploaderCaptionLogo} status="done" mediaUrl={appState.logoImage!} placeholderType="magic" onImageChange={() => { }} />
                        <p className="text-neutral-300 text-center max-w-xs text-sm">{uploaderDescriptionLogo}</p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <ActionablePolaroidCard type="multi-input" caption={uploaderCaptionProduct} status="done" mediaUrl={appState.productImage!} placeholderType="magic" onImageChange={() => { }} />
                        <p className="text-neutral-300 text-center max-w-xs text-sm">{uploaderDescriptionProduct}</p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <ActionablePolaroidCard type="output" caption={t('productMockup_result')} status="pending" mediaUrl={undefined} placeholderType="magic" onImageChange={() => { }} />
                        <p className="text-yellow-400 text-center max-w-xs text-sm animate-pulse font-semibold">⏳ {t('common_processing')}</p>
                    </div>
                </div>
            </motion.div>
        )}

        {/* Results Stage */}
        {appState.stage === 'results' && (
            <ResultsView stage={appState.stage} originalImage={appState.productImage} onOriginalClick={() => { }} error={appState.error} isMobile={false} actions={(<><button onClick={() => onStateChange({ ...appState, stage: 'configuring' })} className="btn btn-secondary">{t('common_edit')}</button><button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button></>)}>
                {appState.resultImage && (<motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ActionablePolaroidCard type="output" caption={t('productMockup_result')} status="done" mediaUrl={appState.resultImage} onImageChange={(url) => { if (url) { onStateChange({ ...appState, resultImage: url }); addImagesToGallery([url]); } }} /></motion.div>)}
            </ResultsView>
        )}</div>);
};

export default ProductMockupGenerator;
