/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStyledImage } from '../services/gemini/advancedImageService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import { AppScreenHeader, handleFileUpload as utilHandleFileUpload, ResultsView, OptionsPanel, useAppControls, useLightbox } from './uiUtils';
import Lightbox from './Lightbox';
import { processApiError } from '@/services/gemini/baseService';
import CameraControlPanel, { CameraSettings, getCameraPrompt } from './CameraControlPanel';

interface ProductSceneState {
    stage: 'configuring' | 'generating' | 'results';
    productImage: string | null;
    resultImages: { preset: string; url: string }[]; // Changed to array of results
    options: { scene: string; lighting: string; camera: CameraSettings };
    error: string | null;
}
interface ProductSceneProps { mainTitle: string; subtitle: string; useSmartTitleWrapping: boolean; smartTitleWrapWords: number; uploaderCaption: string; uploaderDescription: string; addImagesToGallery: (images: string[]) => void; appState: ProductSceneState; onStateChange: (newState: ProductSceneState) => void; onReset: () => void; onGoBack: () => void; logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: { api_model_used?: string; credits_used?: number; generation_count?: number; }) => void; }

const ProductSceneGenerator: React.FC<ProductSceneProps> = (props) => {
    const { uploaderCaption, uploaderDescription, addImagesToGallery, appState, onStateChange, onReset, logGeneration, ...headerProps } = props;
    const { t, checkCredits, modelVersion } = useAppControls();
    const { lightboxIndex, openLightbox, closeLightbox, navigateLightbox } = useLightbox();

    // Images for lightbox
    const lightboxImages = [appState.productImage, ...appState.resultImages.map(r => r.url)].filter((img): img is string => !!img);

    const handleGenerate = async () => {
        if (!appState.productImage) return;
        const selectedPresets = appState.options.camera?.presets || ['front'];
        const creditCostPerImage = modelVersion === 'v3' ? 2 : 1;
        const totalCredits = creditCostPerImage * selectedPresets.length;

        if (!await checkCredits(totalCredits)) return;

        const preGenState = { ...appState };
        onStateChange({ ...appState, stage: 'generating', error: null, resultImages: [] });

        try {
            const results: { preset: string; url: string }[] = [];

            // Generate images for each selected preset
            for (const preset of selectedPresets) {
                const cameraPrompt = getCameraPrompt(preset);
                const prompt = `Product scene: ${appState.options.scene || 'lifestyle'}. Lighting: ${appState.options.lighting || 'natural'}. ${cameraPrompt}. Professional product photography, high quality.`;
                const result = await generateStyledImage(prompt, [appState.productImage], undefined, undefined, 'product-scene');
                results.push({ preset, url: result });

                // Update state with partial results
                onStateChange({ ...appState, stage: 'generating', resultImages: results, error: null });
            }

            onStateChange({ ...appState, stage: 'results', resultImages: results });
            // addImagesToGallery(results.map(r => r.url));
            // logGeneration('product-scene', preGenState, results[0]?.url || '', {
            //     credits_used: totalCredits,
            //     generation_count: results.length,
            //     api_model_used: modelVersion === 'v3' ? 'imagen-3.0-generate-001' : 'gemini-2.5-flash-image'
            // });
        } catch (err: any) {
            const error = processApiError(err);
            onStateChange({ ...appState, stage: 'results', error: error.message });
        }
    };

    const isLoading = appState.stage === 'generating';

    return (
        <div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-screen">
            <AnimatePresence>
                <AppScreenHeader {...headerProps} />
            </AnimatePresence>

            <motion.div className="flex flex-col lg:flex-row items-start justify-center gap-8 w-full max-w-[1600px] px-6 py-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {/* Left Column: Results & Image Input */}
                <div className="w-full lg:w-[400px] xl:w-[450px] flex-shrink-0 sticky top-6 flex flex-col gap-6">

                    {/* Result Area (Shows when generating or has results) */}
                    <AnimatePresence>
                        {(appState.stage === 'generating' || appState.resultImages.length > 0) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, y: -20 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex flex-col items-center gap-4 bg-neutral-900/50 p-6 rounded-2xl border border-white/5 shadow-2xl overflow-hidden max-h-[600px] overflow-y-auto"
                            >
                                <label className="text-lg font-bold text-yellow-400 w-full text-center mb-2">
                                    {appState.stage === 'generating'
                                        ? `Generating ${appState.resultImages.length}/${appState.options.camera?.presets?.length || 1}...`
                                        : `✨ ${appState.resultImages.length} Result${appState.resultImages.length > 1 ? 's' : ''}`}
                                </label>

                                {/* Grid of results */}
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    {appState.resultImages.map((result, idx) => (
                                        <div key={idx} className="flex flex-col gap-1">
                                            <ActionablePolaroidCard
                                                type="output"
                                                caption={result.preset}
                                                status="done"
                                                mediaUrl={result.url}
                                                placeholderType="magic"
                                                onImageChange={() => { }}
                                                onClick={() => openLightbox(lightboxImages.indexOf(result.url))}
                                            />
                                        </div>
                                    ))}

                                    {/* Show pending slots while generating */}
                                    {appState.stage === 'generating' && Array.from({
                                        length: (appState.options.camera?.presets?.length || 1) - appState.resultImages.length
                                    }).map((_, idx) => (
                                        <div key={`pending-${idx}`} className="flex flex-col gap-1">
                                            <ActionablePolaroidCard
                                                type="output"
                                                caption="Generating..."
                                                status="pending"
                                                mediaUrl={undefined}
                                                placeholderType="magic"
                                                onImageChange={() => { }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Original Upload Image (Shrinks when results are present) */}
                    <div className={`flex flex-col items-center gap-4 bg-neutral-900/50 p-6 rounded-2xl border border-white/5 transition-all duration-500 ease-in-out ${appState.resultImages.length > 0 || appState.stage === 'generating' ? 'scale-90 opacity-60 hover:opacity-100 hover:scale-95 origin-top' : ''}`}>
                        <label className="text-lg font-bold text-neutral-200 w-full text-center mb-2">Upload Image</label>
                        <div className="w-full max-w-[320px]">
                            <label htmlFor="prodscene-upload" className="cursor-pointer w-full block transform hover:scale-[1.02] transition-transform">
                                <ActionablePolaroidCard type={appState.productImage ? 'multi-input' : 'uploader'} caption={uploaderCaption} status="done" mediaUrl={appState.productImage || undefined} onImageChange={(url) => onStateChange({ ...appState, productImage: url })} />
                            </label>
                            <input id="prodscene-upload" type="file" className="hidden" accept="image/*" onChange={(e) => { utilHandleFileUpload(e, (url) => { onStateChange({ ...appState, productImage: url, resultImages: [], error: null }); }); }} />
                        </div>
                        <p className="base-font font-medium text-neutral-400 text-center text-sm">{uploaderDescription}</p>
                    </div>
                </div>

                {/* Right Column: Options Panel */}
                <div className="flex-1 w-full min-w-0">
                    <OptionsPanel>
                        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                            <h2 className="base-font font-bold text-2xl text-yellow-500">{t('common_options')}</h2>
                            <div className="flex gap-3">
                                <button onClick={onReset} className="btn btn-secondary text-sm px-4 py-2">{t('common_startOver')}</button>
                                <button onClick={handleGenerate} className="btn btn-primary text-sm px-6 py-2" disabled={!appState.productImage || isLoading}>{isLoading ? t('common_processing') : t('common_generate')}</button>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Scene & Lighting */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-black/20 rounded-xl border border-white/5">
                                <div>
                                    <label className="block text-neutral-300 text-sm font-bold mb-2 uppercase tracking-wide">{t('productScene_scene')}</label>
                                    <select value={appState.options.scene} onChange={(e) => onStateChange({ ...appState, options: { ...appState.options, scene: e.target.value } })} className="form-input bg-neutral-900 border-neutral-700 text-neutral-200">
                                        <option value="lifestyle">Lifestyle</option>
                                        <option value="studio">Studio</option>
                                        <option value="outdoor">Outdoor</option>
                                        <option value="minimal">Minimal</option>
                                        <option value="luxury">Luxury</option>
                                        <option value="nature">Nature</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-neutral-300 text-sm font-bold mb-2 uppercase tracking-wide">{t('productScene_lighting')}</label>
                                    <select value={appState.options.lighting} onChange={(e) => onStateChange({ ...appState, options: { ...appState.options, lighting: e.target.value } })} className="form-input bg-neutral-900 border-neutral-700 text-neutral-200">
                                        <option value="natural">Natural</option>
                                        <option value="studio">Studio</option>
                                        <option value="dramatic">Dramatic</option>
                                        <option value="soft">Soft</option>
                                        <option value="cinematic">Cinematic</option>
                                        <option value="neon">Neon</option>
                                    </select>
                                </div>
                            </div>

                            {/* Camera Controls */}
                            <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                                <div className="mb-4 text-neutral-300 text-sm font-bold uppercase tracking-wide">Camera Configuration</div>
                                <div className="flex justify-center">
                                    <CameraControlPanel
                                        value={appState.options.camera || { preset: 'front' }}
                                        onChange={(newSettings) => onStateChange({ ...appState, options: { ...appState.options, camera: newSettings } })}
                                        productImage={appState.productImage}
                                    />
                                </div>
                            </div>
                        </div>
                    </OptionsPanel>
                </div>
            </motion.div>

            {/* Lightbox */}
            <Lightbox
                images={lightboxImages}
                selectedIndex={lightboxIndex}
                onClose={closeLightbox}
                onNavigate={navigateLightbox}
            />
        </div>);
};

export default ProductSceneGenerator;
