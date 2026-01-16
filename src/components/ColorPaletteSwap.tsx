/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { swapColorPalette } from '../services/gemini/advancedImageService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import {
    AppScreenHeader,
    handleFileUpload as utilHandleFileUpload,
    ResultsView,
    OptionsPanel,
    useAppControls,
} from './uiUtils';

interface ColorPaletteSwapState {
    stage: 'configuring' | 'generating' | 'results';
    sourceImage: string | null;
    paletteImage: string | null;
    resultImage: string | null;
    error: string | null;
}

interface ColorPaletteSwapProps {
    mainTitle: string;
    subtitle: string;
    useSmartTitleWrapping: boolean;
    smartTitleWrapWords: number;
    uploaderCaptionSource: string;
    uploaderDescriptionSource: string;
    uploaderCaptionPalette: string;
    uploaderDescriptionPalette: string;
    addImagesToGallery: (images: string[]) => void;
    appState: ColorPaletteSwapState;
    onStateChange: (newState: ColorPaletteSwapState) => void;
    onReset: () => void;
    onGoBack: () => void;
    logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: {
        api_model_used?: string;
        credits_used?: number;
        generation_count?: number;
    }) => void;
}

const ColorPaletteSwap: React.FC<ColorPaletteSwapProps> = (props) => {
    const { uploaderCaptionSource, uploaderDescriptionSource, uploaderCaptionPalette, uploaderDescriptionPalette, addImagesToGallery, appState, onStateChange, onReset, logGeneration, ...headerProps } = props;
    const { t, checkCredits, modelVersion } = useAppControls();

    const handleImageUpload = (imageKey: 'sourceImage' | 'paletteImage') => (e: ChangeEvent<HTMLInputElement>) => {
        utilHandleFileUpload(e, (imageDataUrl) => {
            onStateChange({ ...appState, [imageKey]: imageDataUrl, resultImage: null, error: null });
            // addImagesToGallery([imageDataUrl]);
        });
    };

    const handleGenerate = async () => {
        if (!appState.sourceImage || !appState.paletteImage) return;

        // Check credits FIRST
        const preGenState = { ...appState };
        const creditCostPerImage = modelVersion === 'v3' ? 2 : 1;
        if (!await checkCredits(creditCostPerImage)) {
            return; // Stay in configuring
        }

        // Set generating stage AFTER credits confirmed
        onStateChange({ ...appState, stage: 'generating', error: null });

        try {
            const result = await swapColorPalette(appState.sourceImage, appState.paletteImage, undefined, 'color-palette-swap');
            onStateChange({ ...appState, stage: 'results', resultImage: result });
            addImagesToGallery([result]);
            logGeneration('color-palette-swap', preGenState, result, {
                credits_used: creditCostPerImage,
                generation_count: 1,
                api_model_used: modelVersion === 'v3' ? 'imagen-3.0-generate-001' : 'gemini-2.5-flash-image'
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi.";
            onStateChange({ ...appState, stage: 'results', error: errorMessage });
        }
    };

    const canGenerate = appState.sourceImage && appState.paletteImage;
    const isLoading = appState.stage === 'generating';

    return (
        <div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-screen">
            <AnimatePresence>{appState.stage === 'configuring' && <AppScreenHeader {...headerProps} />}</AnimatePresence>
            {appState.stage === 'configuring' && (
                <motion.div className="flex flex-col items-center gap-6 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Input images grid */}
                    <div className="w-full pb-4 max-w-4xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-7xl mx-auto px-4">
                            <div className="flex flex-col items-center gap-2">
                                <label htmlFor="source-upload" className="cursor-pointer w-full"><ActionablePolaroidCard type={appState.sourceImage ? 'multi-input' : 'uploader'} caption={uploaderCaptionSource} status="done" mediaUrl={appState.sourceImage || undefined} placeholderType="magic" onImageChange={(url) => onStateChange({ ...appState, sourceImage: url })} /></label>
                                <input id="source-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload('sourceImage')} />
                                <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">{uploaderDescriptionSource}</p>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <label htmlFor="palette-upload" className="cursor-pointer w-full"><ActionablePolaroidCard type={appState.paletteImage ? 'multi-input' : 'uploader'} caption={uploaderCaptionPalette} status="done" mediaUrl={appState.paletteImage || undefined} placeholderType="magic" onImageChange={(url) => onStateChange({ ...appState, paletteImage: url })} /></label>
                                <input id="palette-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload('paletteImage')} />
                                <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">{uploaderDescriptionPalette}</p>
                            </div>
                        </div>
                    </div>

                    {/* Options panel - always visible */}
                    <OptionsPanel>
                        <div className="flex justify-end gap-4">
                            <button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button>
                            <button onClick={handleGenerate} className="btn btn-primary" disabled={!canGenerate || isLoading}>{isLoading ? t('common_processing') : t('common_generate')}</button>
                        </div>
                    </OptionsPanel>
                </motion.div>
            )}

            {/* Generating Stage - Show 2 inputs + loading result */}
            {appState.stage === 'generating' && (
                <motion.div className="flex flex-col items-center gap-8 w-full max-w-screen-xl py-6 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Input Images Row */}
                    <div className="flex flex-col md:flex-row items-start justify-center gap-8 w-full px-4">
                        <div className="flex flex-col items-center gap-4">
                            <ActionablePolaroidCard type="multi-input" caption={uploaderCaptionSource} status="done" mediaUrl={appState.sourceImage!} placeholderType="magic" onImageChange={() => { }} />
                            <p className="text-neutral-300 text-center max-w-xs text-sm">{uploaderDescriptionSource}</p>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <ActionablePolaroidCard type="multi-input" caption={uploaderCaptionPalette} status="done" mediaUrl={appState.paletteImage!} placeholderType="magic" onImageChange={() => { }} />
                            <p className="text-neutral-300 text-center max-w-xs text-sm">{uploaderDescriptionPalette}</p>
                        </div>
                    </div>

                    {/* Loading Result */}
                    <div className="flex flex-col items-center gap-4">
                        <ActionablePolaroidCard
                            type="output"
                            caption={t('colorPaletteSwap_result')}
                            status="pending"
                            mediaUrl={undefined}
                            placeholderType="magic"
                            onImageChange={() => { }}
                        />
                        <p className="text-yellow-400 text-center max-w-xs text-sm animate-pulse font-semibold">⏳ {t('common_processing')}</p>
                    </div>
                </motion.div>
            )}

            {/* Results Stage */}
            {appState.stage === 'results' && (
                <ResultsView stage={appState.stage} originalImage={appState.sourceImage} onOriginalClick={() => { }} error={appState.error} isMobile={false} actions={(<><button onClick={() => onStateChange({ ...appState, stage: 'configuring' })} className="btn btn-secondary">{t('common_edit')}</button><button onClick={onReset} className="btn btn-secondary">{t('common_startOver')}</button></>)}>
                    {appState.resultImage && (<motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><ActionablePolaroidCard type="output" caption={t('colorPaletteSwap_result')} status="done" mediaUrl={appState.resultImage} onImageChange={(url) => { if (url) { onStateChange({ ...appState, resultImage: url }); addImagesToGallery([url]); } }} /></motion.div>)}
                </ResultsView>
            )}
        </div>
    );
};

export default ColorPaletteSwap;
