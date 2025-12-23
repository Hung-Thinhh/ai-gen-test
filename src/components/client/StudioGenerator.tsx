/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ChangeEvent, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStudioImage } from '../../services/geminiService';
import ActionablePolaroidCard from '../ActionablePolaroidCard';
import Lightbox from '../Lightbox';
import {
    useMediaQuery,
    AppScreenHeader,
    handleFileUpload,
    useLightbox,
    useVideoGeneration,
    useAppControls,
    embedJsonInPng,
    KhmerPhotoMergeState // We can reuse this state or define a new one if needed
} from '../uiUtils';
import { useRouter } from 'next/navigation';

export interface Studio {
    id: string;
    name: string;
    slug: string;
    description: string;
    preview_image_url: string;
    category: string;
    categories?: { name: string };
    prompts: any; // JSONB
}

interface StudioGeneratorProps {
    studio: Studio;
}

const StudioGenerator: React.FC<StudioGeneratorProps> = ({ studio }) => {
    const router = useRouter();
    const { t, settings, checkCredits, modelVersion } = useAppControls();
    const { lightboxIndex, openLightbox, closeLightbox, navigateLightbox } = useLightbox();
    const { generateVideo } = useVideoGeneration();
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Parse prompts from studio data
    const TEMPLATES = React.useMemo(() => {
        try {
            return typeof studio.prompts === 'string' ? JSON.parse(studio.prompts) : studio.prompts;
        } catch (e) {
            console.error("Error parsing studio prompts:", e);
            return [];
        }
    }, [studio.prompts]);

    const ASPECT_RATIO_OPTIONS = t('aspectRatioOptions') || ['Giữ nguyên', '1:1', '3:4', '4:3', '16:9'];

    const [appState, setAppState] = useState<KhmerPhotoMergeState>({
        stage: 'idle',
        uploadedImage: null,
        uploadedImage2: null,
        selectedStyleImage: null,
        generatedImage: null,
        error: null,
        historicalImages: [],
        options: {
            customPrompt: '',
            removeWatermark: false,
            aspectRatio: '3:4',
        },
        activeTab: 'female' // Default tab
    });


    // Effect to set default tab if available templates dictate it (optional)
    // For now keep default 'female' or first available gender in templates
    // useEffect(() => { ... }, [TEMPLATES]);


    const outputLightboxImages = appState.generatedImage ? [appState.generatedImage] : [];
    const lightboxImages = [appState.uploadedImage, appState.selectedStyleImage, ...outputLightboxImages].filter((img): img is string => !!img);

    const handleGoBack = () => {
        router.push('/studio');
    };

    const handleReset = () => {
        setAppState(prev => ({
            ...prev,
            stage: 'idle',
            uploadedImage: null,
            uploadedImage2: null,
            selectedStyleImage: null,
            generatedImage: null,
            error: null
        }));
    };

    const logGeneration = (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: any) => {
        // Placeholder for logGeneration if not passed from parent. 
        // In KhmerPhotoMerge it was passed from MainApp. 
        // We might need to import the logging logic or ignore it for now if not strictly required, 
        // OR we can implement a basic version here using storageService directly if needed.
        // For now, let's log to console.
        console.log("Logging generation:", appId, extraDetails);
    };


    const handleImageSelectedForUploader = (imageDataUrl: string) => {
        setAppState(prev => ({
            ...prev,
            stage: 'configuring',
            uploadedImage: imageDataUrl,
            generatedImage: null,
            error: null,
        }));
    };

    const handleImageUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        handleFileUpload(e, handleImageSelectedForUploader);
    }, []);

    const activeTab = appState.activeTab || 'female';

    const handleUploadedImageChange = (newUrl: string | null) => {
        setAppState(prev => ({
            ...prev,
            uploadedImage: newUrl,
            stage: (newUrl && (activeTab !== 'couple' || prev.uploadedImage2)) ? 'configuring' : 'idle'
        }));
    };

    const handleImage2Change = (newUrl: string | null) => {
        setAppState(prev => ({
            ...prev,
            uploadedImage2: newUrl,
            stage: (newUrl && prev.uploadedImage) ? 'configuring' : 'idle'
        }));
    };

    const handleTabChange = (tab: 'female' | 'male' | 'couple') => {
        setAppState(prev => ({
            ...prev,
            activeTab: tab,
            selectedStyleImage: null // Clear selection when switching tabs
        }));
    };

    const handleStyleSelect = (templateUrl: string) => {
        console.log("Selecting style:", templateUrl);
        setAppState(prev => ({
            ...prev,
            selectedStyleImage: templateUrl,
        }));
    };

    const handleOptionChange = (field: keyof KhmerPhotoMergeState['options'], value: string | boolean) => {
        setAppState(prev => ({
            ...prev,
            options: { ...prev.options, [field]: value },
        }));
    };

    const handleGenerate = async () => {
        const isCoupleMode = activeTab === 'couple';
        const hasRequiredImages = isCoupleMode
            ? (appState.uploadedImage && appState.uploadedImage2)
            : appState.uploadedImage;

        if (!hasRequiredImages || !appState.selectedStyleImage) {
            console.warn("Missing inputs - aborting generation");
            return;
        }

        const preGenState = { ...appState };
        setAppState(prev => ({ ...prev, stage: 'generating', error: null }));

        const creditCost = modelVersion === 'v3' ? 3 : 1;

        if (!await checkCredits(creditCost)) {
            setAppState(prev => ({ ...prev, stage: 'configuring' }));
            return;
        }

        try {
            const selectedTemplate = TEMPLATES.find((t: any) => t.image_url === appState.selectedStyleImage || t.url === appState.selectedStyleImage);
            const templatePrompt = selectedTemplate ? (selectedTemplate.prompt || selectedTemplate.content) : "Portrait style";
            // Note: DB schema uses 'content' for prompt, Khmer hardcoded used 'prompt'. 
            // Also DB uses 'image_url', hardcoded used 'url'. Adapted above.

            console.log("Generating with prompt:", templatePrompt);

            const secondImage = isCoupleMode ? appState.uploadedImage2 : undefined;

            // Using generic generateStudioImage
            const resultUrl = await generateStudioImage(
                appState.uploadedImage!,
                studio.name, // Pass studio name as Style Context
                templatePrompt,
                appState.options.customPrompt,
                appState.options.removeWatermark,
                appState.options.aspectRatio,
                secondImage
            );

            const settingsToEmbed = {
                viewId: 'studio-generator',
                state: { ...preGenState, stage: 'configuring', generatedImage: null, error: null },
            };
            const urlWithMetadata = await embedJsonInPng(resultUrl, settingsToEmbed, settings.enableImageMetadata);

            logGeneration(studio.id, preGenState, urlWithMetadata, {
                generation_count: 1,
                credits_used: creditCost,
                api_model_used: modelVersion === 'v3' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image'
            });

            setAppState(prev => ({
                ...prev,
                stage: 'results',
                generatedImage: urlWithMetadata,
                historicalImages: [...prev.historicalImages, { style: prev.selectedStyleImage!, url: urlWithMetadata }],
            }));
            // addImagesToGallery([urlWithMetadata]); // If we have this function
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            console.error("Generation failed:", err);
            setAppState(prev => ({
                ...prev,
                stage: 'results',
                error: errorMessage
            }));
        }
    };

    const isLoading = appState.stage === 'generating';
    const hasResults = !!appState.generatedImage;

    const currentTemplates = TEMPLATES.filter((t: any) => (t.gender || 'female') === activeTab);

    return (
        <div className="flex flex-col items-center justify-center w-full h-full flex-1 min-h-0 mb-40" id="studio-top">
            <div className="w-full max-w-7xl pt-6 px-4">
                <button onClick={handleGoBack} className="text-neutral-400 hover:text-white flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Quay lại
                </button>
            </div>

            <AnimatePresence>
                {!isLoading && (
                    <AppScreenHeader
                        mainTitle={studio.name}
                        subtitle={studio.description || "Create amazing photos with AI"}
                        useSmartTitleWrapping={true}
                        smartTitleWrapWords={4}
                    />
                )}
            </AnimatePresence>

            <div className="flex flex-col items-center w-full flex-1 px-4 overflow-y-auto">
                <motion.div
                    className="flex flex-col items-center gap-6 w-full max-w-7xl py-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* 1. Inputs Section */}
                    {(!isLoading && appState.stage !== 'results') && (
                        <div className="w-full max-w-4xl flex flex-col items-center">
                            {/* Tabs */}
                            <div className="flex gap-2 mb-6 bg-neutral-900/40 p-1.5 rounded-full border border-neutral-800">
                                {[
                                    { id: 'female', label: 'Nữ' },
                                    { id: 'male', label: 'Nam' },
                                    { id: 'couple', label: 'Cặp đôi' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleTabChange(tab.id as any)}
                                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab.id
                                            ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20'
                                            : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className={`grid gap-6 w-full ${activeTab === 'couple' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:max-w-md mx-auto'}`}>
                                {activeTab === 'couple' ? (
                                    <>
                                        <div className="themed-card backdrop-blur-md p-4 rounded-2xl flex flex-col items-center gap-4">
                                            <h3 className="text-lg font-bold text-yellow-400">1. Ảnh Nữ (Chính)</h3>
                                            <ActionablePolaroidCard
                                                type={appState.uploadedImage ? 'photo-input' : 'uploader'}
                                                mediaUrl={appState.uploadedImage ?? undefined}
                                                caption="Ảnh nữ"
                                                placeholderType="person"
                                                status="done"
                                                onClick={appState.uploadedImage ? () => openLightbox(lightboxImages.indexOf(appState.uploadedImage!)) : undefined}
                                                onImageChange={handleUploadedImageChange}
                                                isMobile={isMobile}
                                            />
                                        </div>
                                        <div className="themed-card backdrop-blur-md p-4 rounded-2xl flex flex-col items-center gap-4">
                                            <h3 className="text-lg font-bold text-yellow-400">2. Ảnh Nam (Phụ)</h3>
                                            <ActionablePolaroidCard
                                                type={appState.uploadedImage2 ? 'photo-input' : 'uploader'}
                                                mediaUrl={appState.uploadedImage2 ?? undefined}
                                                caption="Ảnh nam"
                                                placeholderType="person"
                                                status="done"
                                                onClick={appState.uploadedImage2 ? () => openLightbox(lightboxImages.indexOf(appState.uploadedImage2!)) : undefined}
                                                onImageChange={handleImage2Change}
                                                isMobile={isMobile}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="themed-card backdrop-blur-md p-4 rounded-2xl flex flex-col items-center gap-4">
                                            <h3 className="text-lg font-bold text-yellow-400">1. Tải ảnh lên</h3>
                                            <ActionablePolaroidCard
                                                type={appState.uploadedImage ? 'photo-input' : 'uploader'}
                                                mediaUrl={appState.uploadedImage ?? undefined}
                                                caption="Tải ảnh của bạn"
                                                placeholderType="person"
                                                status="done"
                                                onClick={appState.uploadedImage ? () => openLightbox(lightboxImages.indexOf(appState.uploadedImage!)) : undefined}
                                                onImageChange={handleUploadedImageChange}
                                                isMobile={isMobile}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 2. Loading State */}
                    {isLoading && (
                        <motion.div className="flex flex-col items-center justify-center gap-4 py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                            <p className="text-neutral-300">Đang tạo ảnh...</p>
                            <button
                                onClick={() => setAppState(prev => ({ ...prev, stage: 'configuring', error: null }))}
                                className="mt-4 px-6 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm"
                            >
                                Hủy
                            </button>
                        </motion.div>
                    )}

                    {/* 3. Results Section */}
                    {!isLoading && appState.stage === 'results' && (
                        <div className="w-full max-w-4xl mt-6">
                            <div className="themed-card backdrop-blur-md rounded-2xl p-6 relative border-dashed! border-orange-600! px-0!">
                                <h3 className="base-font font-bold text-xl text-yellow-400 mb-4 text-center">Kết quả</h3>

                                {appState.error && (
                                    <div className="w-full p-4 mb-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-center">
                                        {appState.error}
                                    </div>
                                )}

                                {appState.generatedImage && (
                                    <div className="flex justify-center mb-6">
                                        <div className="w-full max-w-sm">
                                            <ActionablePolaroidCard
                                                type="output"
                                                caption="Kết quả"
                                                status="done"
                                                mediaUrl={appState.generatedImage}
                                                onClick={() => openLightbox(lightboxImages.indexOf(appState.generatedImage!))}
                                                isMobile={isMobile}
                                                onGenerateVideoFromPrompt={(prompt) => generateVideo(appState.generatedImage!, prompt)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={() => setAppState(prev => ({ ...prev, stage: 'configuring' }))}
                                        className="px-6 py-2 bg-neutral-600 cursor-pointer text-white rounded-full hover:bg-neutral-500 transition-colors"
                                    >
                                        Sửa
                                    </button>
                                    <button onClick={handleReset} className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 shadow-orange-500/20 text-white rounded-full cursor-pointer transition-colors">
                                        Bắt đầu lại
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. Template Grid & Options */}
                    {(!isLoading && appState.stage !== 'results') && (
                        <div className="w-full max-w-4xl space-y-6 mt-6">
                            <div>
                                <h3 className="text-lg font-bold text-neutral-300 mb-3 ml-1">Danh sách mẫu ({currentTemplates.length})</h3>
                                {currentTemplates.length === 0 ? (
                                    <div className="text-center text-neutral-500 py-8">Chưa có mẫu nào cho mục này.</div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                        {currentTemplates.map((tpl: any, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleStyleSelect(tpl.image_url || tpl.url)}
                                                className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 aspect-[3/4] ${appState.selectedStyleImage === (tpl.image_url || tpl.url) ? 'border-yellow-400 scale-105 shadow-lg shadow-yellow-400/20' : 'border-neutral-700 hover:border-neutral-500'}`}
                                            >
                                                <img src={tpl.image_url || tpl.url} alt={`Template ${idx + 1}`} className="w-full h-full object-cover" />
                                                {appState.selectedStyleImage === (tpl.image_url || tpl.url) && (
                                                    <div className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center">
                                                        <div className="bg-yellow-400 rounded-full p-1">
                                                            <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Options */}
                            <div className="themed-card backdrop-blur-md rounded-2xl p-6 border border-neutral-700">
                                <h3 className="text-lg font-bold text-white mb-4 border-b border-neutral-700 pb-2">Tuỳ chọn</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1">Ghi chú thêm</label>
                                        <textarea
                                            value={appState.options.customPrompt}
                                            onChange={(e) => handleOptionChange('customPrompt', e.target.value)}
                                            placeholder="Nhập ghi chú thêm cho AI..."
                                            className="w-full bg-neutral-900/50 border border-neutral-700 rounded-xl p-3 text-white focus:border-yellow-400 focus:outline-none"
                                            rows={2}
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-300 mb-1">Tỉ lệ khung hình</label>
                                            <select
                                                value={appState.options.aspectRatio}
                                                onChange={(e) => handleOptionChange('aspectRatio', e.target.value)}
                                                className="bg-neutral-900/50 border border-neutral-700 rounded-xl px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
                                            >
                                                {Array.isArray(ASPECT_RATIO_OPTIONS) && ASPECT_RATIO_OPTIONS.map((opt: string) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center pt-6">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={appState.options.removeWatermark}
                                                    onChange={(e) => handleOptionChange('removeWatermark', e.target.checked)}
                                                    className="rounded border-neutral-600 bg-neutral-800 text-yellow-400 focus:ring-yellow-400"
                                                />
                                                <span className="text-sm font-medium text-neutral-300">Xóa watermark</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-center">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={!appState.uploadedImage || !appState.selectedStyleImage || isLoading}
                                        className={`px-12 py-3 rounded-full font-bold text-black text-lg transition-all transform active:scale-95 shadow-lg ${!appState.uploadedImage || !appState.selectedStyleImage || isLoading
                                            ? 'bg-neutral-600 cursor-not-allowed opacity-50'
                                            : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 shadow-orange-500/20'
                                            }`}
                                    >
                                        {hasResults ? 'Tạo lại' : 'Tạo ảnh'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            <Lightbox
                images={lightboxImages}
                selectedIndex={lightboxIndex}
                onClose={closeLightbox}
                onNavigate={navigateLightbox}
            />
        </div>
    );
};

export default StudioGenerator;
