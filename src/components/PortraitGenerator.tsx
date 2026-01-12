"use client";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStyledImage } from '../services/gemini/advancedImageService';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import Lightbox from './Lightbox';
import {
    useMediaQuery,
    AppScreenHeader,
    useLightbox,
    useAppControls,
} from './uiUtils';

interface PortraitGeneratorState {
    stage: 'configuring' | 'generating' | 'results';
    prompt: string;
    uploadedImage: string | null;
    resultImages: string[];
    pendingCount: number;
    options: {
        style: string;
        lighting: string;
        background: string;
        angle: string;
        expression: string;
        aspectRatio: string;
        skinTone: string;
        attire: string;
        mood: string;
        colorTone: string;
        imageCount: number;
        notes: string;
    };
    error: string | null;
}

interface PortraitGeneratorProps {
    mainTitle: string;
    subtitle: string;
    useSmartTitleWrapping: boolean;
    smartTitleWrapWords: number;
    addImagesToGallery: (images: string[]) => void;
    appState: PortraitGeneratorState;
    onStateChange: (newState: PortraitGeneratorState) => void;
    onReset: () => void;
    onGoBack: () => void;
    logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: any) => void;
}

// Options Data
const STYLE_OPTIONS = [
    { value: '', label: 'Tự chọn' },
    { value: 'photorealistic', label: 'Chân thực' },
    { value: 'cinematic', label: 'Điện ảnh' },
    { value: 'film', label: 'Phim cổ điển' },
    { value: 'vintage', label: 'Cổ điển' },
    { value: 'hdr', label: 'HDR' },
    { value: 'black-white', label: 'Đen trắng' },
    { value: 'watercolor', label: 'Màu nước' },
    { value: 'oil-painting', label: 'Sơn dầu' },
    { value: 'anime', label: 'Anime' },
    { value: 'magazine', label: 'Tạp chí' },
    { value: 'editorial', label: 'Editorial' },
    { value: 'fashion', label: 'Thời trang' },
];

const LIGHTING_OPTIONS = [
    { value: '', label: 'Tự chọn' },
    { value: 'natural', label: 'Ánh sáng tự nhiên' },
    { value: 'studio', label: 'Studio' },
    { value: 'golden-hour', label: 'Giờ vàng' },
    { value: 'blue-hour', label: 'Giờ xanh' },
    { value: 'dramatic', label: 'Kịch tính' },
    { value: 'rembrandt', label: 'Rembrandt' },
    { value: 'split', label: 'Split lighting' },
    { value: 'loop', label: 'Loop lighting' },
    { value: 'butterfly', label: 'Butterfly' },
    { value: 'neon', label: 'Neon' },
    { value: 'silhouette', label: 'Bóng đổ' },
    { value: 'rim', label: 'Rim light' },
    { value: 'softbox', label: 'Soft box' },
];

const BACKGROUND_OPTIONS = [
    { value: '', label: 'Tự chọn' },
    { value: 'neutral', label: 'Trung tính' },
    { value: 'studio-white', label: 'Studio trắng' },
    { value: 'studio-black', label: 'Studio đen' },
    { value: 'gradient', label: 'Gradient' },
    { value: 'outdoor-nature', label: 'Thiên nhiên' },
    { value: 'outdoor-urban', label: 'Đô thị' },
    { value: 'bokeh', label: 'Bokeh' },
    { value: 'abstract', label: 'Trừu tượng' },
    { value: 'indoor-home', label: 'Trong nhà' },
    { value: 'cafe', label: 'Quán cà phê' },
    { value: 'office', label: 'Văn phòng' },
];

const ANGLE_OPTIONS = [
    { value: '', label: 'Tự chọn' },
    { value: 'front', label: 'Chính diện' },
    { value: 'three-quarter', label: '3/4 mặt' },
    { value: 'profile', label: 'Nghiêng' },
    { value: 'low-angle', label: 'Góc thấp' },
    { value: 'high-angle', label: 'Góc cao' },
    { value: 'dutch', label: 'Dutch angle' },
    { value: 'close-up', label: 'Cận cảnh' },
    { value: 'medium-shot', label: 'Trung cảnh' },
    { value: 'full-body', label: 'Toàn thân' },
];

const EXPRESSION_OPTIONS = [
    { value: '', label: 'Tự chọn' },
    { value: 'neutral', label: 'Trung tính' },
    { value: 'smile', label: 'Mỉm cười' },
    { value: 'laugh', label: 'Cười tươi' },
    { value: 'serious', label: 'Nghiêm túc' },
    { value: 'mysterious', label: 'Bí ẩn' },
    { value: 'pensive', label: 'Suy tư' },
    { value: 'confident', label: 'Tự tin' },
    { value: 'playful', label: 'Vui nhộn' },
    { value: 'elegant', label: 'Thanh lịch' },
];

const ASPECT_RATIO_OPTIONS = [
    { value: '1:1', label: '1:1 (Vuông)' },
    { value: '3:4', label: '3:4 (Chân dung)' },
    { value: '4:3', label: '4:3 (Ngang)' },
    { value: '9:16', label: '9:16 (Story)' },
    { value: '16:9', label: '16:9 (Widescreen)' },
    { value: '2:3', label: '2:3 (Ảnh thẻ)' },
];

const SKIN_TONE_OPTIONS = [
    { value: '', label: 'Tự nhiên' },
    { value: 'smooth', label: 'Mịn màng' },
    { value: 'matte', label: 'Matte' },
    { value: 'glowing', label: 'Rạng rỡ' },
    { value: 'porcelain', label: 'Trắng sứ' },
    { value: 'tan', label: 'Rám nắng' },
    { value: 'warm', label: 'Ấm áp' },
];

const ATTIRE_OPTIONS = [
    { value: '', label: 'Giữ nguyên' },
    { value: 'casual', label: 'Casual' },
    { value: 'formal', label: 'Trang trọng' },
    { value: 'business', label: 'Công sở' },
    { value: 'elegant', label: 'Thanh lịch' },
    { value: 'sporty', label: 'Thể thao' },
    { value: 'traditional-ao-dai', label: 'Áo dài' },
    { value: 'traditional-vest', label: 'Vest truyền thống' },
    { value: 'artistic', label: 'Nghệ thuật' },
];

const MOOD_OPTIONS = [
    { value: '', label: 'Tự chọn' },
    { value: 'romantic', label: 'Lãng mạn' },
    { value: 'professional', label: 'Chuyên nghiệp' },
    { value: 'artistic', label: 'Nghệ thuật' },
    { value: 'dreamy', label: 'Mộng mơ' },
    { value: 'energetic', label: 'Năng động' },
    { value: 'calm', label: 'Bình yên' },
    { value: 'dramatic', label: 'Kịch tính' },
    { value: 'vintage', label: 'Hoài cổ' },
];

const COLOR_TONE_OPTIONS = [
    { value: '', label: 'Tự chọn' },
    { value: 'warm', label: 'Tông ấm' },
    { value: 'cool', label: 'Tông lạnh' },
    { value: 'neutral', label: 'Trung tính' },
    { value: 'vibrant', label: 'Rực rỡ' },
    { value: 'muted', label: 'Nhẹ nhàng' },
    { value: 'sepia', label: 'Sepia' },
    { value: 'pastel', label: 'Pastel' },
    { value: 'high-contrast', label: 'Tương phản cao' },
];

// Simple Uploader Component
const Uploader = ({ onImageUpload, currentImage, onRemove }: { onImageUpload: (file: File) => void, currentImage: string | null, onRemove: () => void }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) onImageUpload(e.target.files[0]);
    };
    return (
        <div className="w-full">
            <label className="block text-neutral-200 font-bold mb-2">Ảnh tham khảo (Tùy chọn)</label>
            {currentImage ? (
                <div className="relative group w-32 h-40 rounded-lg overflow-hidden border border-neutral-700">
                    <img src={currentImage} alt="Uploaded" className="w-full h-full object-cover" />
                    <button onClick={onRemove} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ) : (
                <label className="cursor-pointer border-2 border-dashed border-neutral-700 hover:border-orange-500 rounded-lg h-40 w-32 flex flex-col items-center justify-center bg-white/5 transition-colors">
                    <svg className="w-8 h-8 text-neutral-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-neutral-400 text-xs text-center px-2">Tải ảnh tham khảo</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
            )}
        </div>
    );
};

// Select Component
const SelectField = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <div>
        <label className="block text-neutral-300 text-sm font-medium mb-1.5">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-neutral-900/50 border border-neutral-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-orange-400 focus:outline-none transition-colors"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

// Loading Card Component
const LoadingCard = ({ index }: { index: number }) => (
    <motion.div
        className="themed-card border border-neutral-700 rounded-2xl p-4 w-64 h-80 flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
    >
        <div className="w-full h-48 bg-neutral-800 rounded-lg flex flex-col items-center justify-center border border-neutral-700 mb-4">
            {/* Orange spinner */}
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-neutral-300 text-sm font-medium">Đang tạo ảnh...</p>
            <p className="text-neutral-500 text-xs mt-1">Vui lòng đợi trong giây lát</p>
        </div>
        <p className="text-orange-400 font-bold text-sm">Kết quả {index + 1}</p>
    </motion.div>
);

const PortraitGenerator: React.FC<PortraitGeneratorProps> = (props) => {
    const { addImagesToGallery, appState, onStateChange, onReset, logGeneration, mainTitle, ...headerProps } = props;
    const { t, checkCredits, modelVersion } = useAppControls();
    const { lightboxIndex, openLightbox, closeLightbox, navigateLightbox } = useLightbox();
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Build lightbox images array
    const lightboxImages = [
        appState.uploadedImage,
        ...appState.resultImages
    ].filter((img): img is string => !!img);

    const updateOption = (key: string, value: string | number) => {
        onStateChange({ ...appState, options: { ...appState.options, [key]: value } });
    };

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            onStateChange({ ...appState, uploadedImage: reader.result as string });
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (!appState.prompt.trim()) return;

        const preGenState = { ...appState };
        const imageCount = appState.options.imageCount;
        const creditCostPerImage = modelVersion === 'v3' ? 2 : 1;
        const totalCredits = creditCostPerImage * imageCount;

        if (!await checkCredits(totalCredits)) return;

        // Start generating - set pending count
        onStateChange({
            ...appState,
            stage: 'generating',
            error: null,
            resultImages: [],
            pendingCount: imageCount
        });

        const opts = appState.options;
        const hasReferenceImage = !!appState.uploadedImage;

        const promptParts = [
            hasReferenceImage
                ? `Create a high-quality portrait based on the reference person in the provided image. IMPORTANT: Preserve the exact face, facial features, skin tone, and identity of the person in the reference image. ${appState.prompt}`
                : `Generate a stunning portrait: ${appState.prompt}`,
            opts.style && `Style: ${opts.style}`,
            opts.lighting && `Lighting: ${opts.lighting}`,
            opts.background && `Background: ${opts.background}`,
            opts.angle && `Camera angle: ${opts.angle}`,
            opts.expression && `Expression: ${opts.expression}`,
            opts.skinTone && `Skin tone: ${opts.skinTone}`,
            opts.attire && `Attire: ${opts.attire}`,
            opts.mood && `Mood: ${opts.mood}`,
            opts.colorTone && `Color tone: ${opts.colorTone}`,
            opts.aspectRatio && `Aspect ratio: ${opts.aspectRatio}`,
            opts.notes && `Additional: ${opts.notes}`,
            hasReferenceImage
                ? 'CRITICAL: The generated portrait MUST look like the same person as in the reference image. Maintain facial likeness, face shape, eyes, nose, mouth, and overall identity.'
                : 'High quality, professional photography, detailed, sharp focus'
        ].filter(Boolean).join('. ');

        const images = appState.uploadedImage ? [appState.uploadedImage] : [];

        // Generate images in parallel
        const generateSingle = async (index: number): Promise<string | null> => {
            try {
                // Add variation to prompt for diversity
                const variedPrompt = index === 0
                    ? promptParts
                    : `${promptParts}. Variation ${index + 1}: Create a unique but equally stunning version.`;
                return await generateStyledImage(variedPrompt, images, undefined, opts.aspectRatio || undefined);
            } catch (err) {
                console.error(`Failed to generate image ${index + 1}:`, err);
                return null;
            }
        };

        const promises = Array.from({ length: imageCount }, (_, i) => generateSingle(i));
        const results = await Promise.all(promises);

        const successfulImages = results.filter((r): r is string => r !== null);

        if (successfulImages.length > 0) {
            onStateChange({
                ...appState,
                stage: 'results',
                resultImages: successfulImages,
                pendingCount: 0,
                error: successfulImages.length < imageCount ? `Đã tạo ${successfulImages.length}/${imageCount} ảnh` : null
            });
            addImagesToGallery(successfulImages);
            logGeneration('portrait-generator', preGenState, successfulImages[0], {
                credits_used: creditCostPerImage * successfulImages.length,
                generation_count: successfulImages.length,
                api_model_used: modelVersion === 'v3' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image'
            });
        } else {
            onStateChange({
                ...appState,
                stage: 'results',
                error: 'Không thể tạo ảnh. Vui lòng thử lại.',
                pendingCount: 0
            });
        }
    };

    const isLoading = appState.stage === 'generating';

    return (
        <div className="flex flex-col items-center justify-start w-full min-h-screen pt-4 pb-12">
            <AnimatePresence>
                {appState.stage === 'configuring' && <AppScreenHeader mainTitle={mainTitle} {...headerProps} />}
            </AnimatePresence>

            {/* Configuring Stage */}
            {appState.stage === 'configuring' && (
                <motion.div
                    className="flex flex-col items-center gap-6 w-full max-w-4xl px-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="themed-card backdrop-blur-md rounded-2xl p-6 w-full">
                        <h2 className="base-font font-bold text-xl text-orange-400 border-b border-orange-400/20 pb-3 mb-5">
                            🎨 Tùy chỉnh chân dung
                        </h2>

                        {/* Reference Image */}
                        <Uploader
                            onImageUpload={handleImageUpload}
                            currentImage={appState.uploadedImage}
                            onRemove={() => onStateChange({ ...appState, uploadedImage: null })}
                        />

                        {/* Prompt */}
                        <div className="mt-5">
                            <label className="block text-neutral-200 font-bold mb-2">Mô tả chân dung *</label>
                            <input
                                type="text"
                                value={appState.prompt}
                                onChange={(e) => onStateChange({ ...appState, prompt: e.target.value })}
                                placeholder="Ví dụ: Chân dung cô gái châu Á, tóc dài, mắt to..."
                                className="w-full bg-neutral-900/50 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:border-orange-400 focus:outline-none"
                            />
                        </div>

                        {/* Options Grid */}
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <SelectField label="Phong cách" value={appState.options.style} onChange={(v) => updateOption('style', v)} options={STYLE_OPTIONS} />
                            <SelectField label="Ánh sáng" value={appState.options.lighting} onChange={(v) => updateOption('lighting', v)} options={LIGHTING_OPTIONS} />
                            <SelectField label="Phông nền" value={appState.options.background} onChange={(v) => updateOption('background', v)} options={BACKGROUND_OPTIONS} />
                            <SelectField label="Góc chụp" value={appState.options.angle} onChange={(v) => updateOption('angle', v)} options={ANGLE_OPTIONS} />
                            <SelectField label="Biểu cảm" value={appState.options.expression} onChange={(v) => updateOption('expression', v)} options={EXPRESSION_OPTIONS} />
                            <SelectField label="Tỷ lệ" value={appState.options.aspectRatio} onChange={(v) => updateOption('aspectRatio', v)} options={ASPECT_RATIO_OPTIONS} />
                            <SelectField label="Tông da" value={appState.options.skinTone} onChange={(v) => updateOption('skinTone', v)} options={SKIN_TONE_OPTIONS} />
                            <SelectField label="Trang phục" value={appState.options.attire} onChange={(v) => updateOption('attire', v)} options={ATTIRE_OPTIONS} />
                            <SelectField label="Tâm trạng" value={appState.options.mood} onChange={(v) => updateOption('mood', v)} options={MOOD_OPTIONS} />
                            <SelectField label="Tông màu" value={appState.options.colorTone} onChange={(v) => updateOption('colorTone', v)} options={COLOR_TONE_OPTIONS} />
                        </div>

                        {/* Image Count Selector */}
                        <div className="mt-5">
                            <label className="block text-neutral-200 font-bold mb-3">Số lượng ảnh</label>
                            <div className="flex gap-3">
                                {[1, 2, 3, 4].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => updateOption('imageCount', num)}
                                        className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${appState.options.imageCount === num
                                            ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                            <p className="text-neutral-500 text-xs mt-2">
                                Chi phí: {appState.options.imageCount * (modelVersion === 'v3' ? 2 : 1)} credits
                            </p>
                        </div>

                        {/* Additional Notes */}
                        <div className="mt-5">
                            <label className="block text-neutral-300 text-sm font-medium mb-1.5">Ghi chú thêm</label>
                            <textarea
                                value={appState.options.notes}
                                onChange={(e) => updateOption('notes', e.target.value)}
                                placeholder="Thêm mô tả chi tiết nếu cần..."
                                className="w-full bg-neutral-900/50 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:border-orange-400 focus:outline-none h-20 resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-700/50">
                            <button onClick={onReset} className="px-5 py-2.5 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm font-medium">
                                Bắt đầu lại
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={!appState.prompt.trim() || isLoading}
                                className={`px-8 py-2.5 rounded-full font-bold text-sm transition-all ${!appState.prompt.trim() || isLoading
                                    ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-orange-400 to-orange-600 text-white hover:from-orange-500 hover:to-orange-700 shadow-lg shadow-orange-500/20'
                                    }`}
                            >
                                {isLoading ? 'Đang tạo...' : `✨ Tạo ${appState.options.imageCount} ảnh`}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Generating Stage - NEW UI like reference image */}
            {appState.stage === 'generating' && (
                <motion.div
                    className="flex flex-col items-center gap-6 w-full max-w-6xl px-4 py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {/* Title */}
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-white mb-2">{mainTitle}</h1>
                        <p className="text-orange-400 animate-pulse">Đang tạo ảnh...</p>
                    </div>

                    {/* Two column layout - fit screen height */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                        {/* Left: Input */}
                        <div className="themed-card border border-neutral-700 rounded-2xl p-6">
                            <h3 className="text-orange-400 font-bold text-lg mb-4 text-center">Ảnh gốc</h3>
                            <div className="flex flex-col items-center gap-4">
                                {appState.uploadedImage ? (
                                    <img
                                        src={appState.uploadedImage}
                                        alt="Input"
                                        className="max-h-64 rounded-lg object-contain border border-neutral-600"
                                    />
                                ) : (
                                    <div className="w-48 h-64 bg-neutral-800 rounded-lg flex items-center justify-center border border-neutral-700">
                                        <span className="text-neutral-500">Không có ảnh</span>
                                    </div>
                                )}
                                <p className="text-neutral-400 text-sm text-center max-w-xs">
                                    "{appState.prompt}"
                                </p>
                            </div>
                        </div>

                        {/* Right: Loading outputs */}
                        <div className="themed-card border border-neutral-700 rounded-2xl p-4">
                            <h3 className="text-orange-400 font-bold text-lg mb-3 text-center">Kết quả</h3>
                            <div className={`grid gap-2 ${appState.pendingCount > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                {Array.from({ length: appState.pendingCount }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`bg-neutral-800 rounded-lg border border-neutral-700 flex flex-col items-center justify-center ${appState.pendingCount <= 2 ? 'aspect-[3/4]' : 'aspect-square'}`}
                                    >
                                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
                                        <p className="text-neutral-300 text-sm">Đang tạo ảnh...</p>
                                        <p className="text-neutral-500 text-xs mt-1">Vui lòng đợi</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Cancel button */}
                    <button
                        onClick={() => onStateChange({ ...appState, stage: 'configuring', pendingCount: 0 })}
                        className="px-6 py-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm"
                    >
                        Hủy
                    </button>
                </motion.div>
            )}

            {/* Results Stage */}
            {appState.stage === 'results' && (
                <motion.div
                    className="flex flex-col items-center gap-6 w-full max-w-6xl px-4 py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {/* Title */}
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-white mb-2">{mainTitle}</h1>
                        {appState.error ? (
                            <p className="text-orange-400">{appState.error}</p>
                        ) : (
                            <p className="text-green-400">Hoàn thành! {appState.resultImages.length} ảnh đã được tạo</p>
                        )}
                    </div>

                    {/* Two column layout - fit screen height */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                        {/* Left: Input */}
                        <div className="themed-card border border-neutral-700 rounded-2xl p-6">
                            <h3 className="text-orange-400 font-bold text-lg mb-4 text-center">Ảnh gốc</h3>
                            <div className="flex flex-col items-center gap-4">
                                {appState.uploadedImage ? (
                                    <img
                                        src={appState.uploadedImage}
                                        alt="Input"
                                        className="max-h-48 rounded-lg object-contain border border-neutral-600 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => openLightbox(0)}
                                    />
                                ) : (
                                    <div className="w-32 h-40 bg-neutral-800 rounded-lg flex items-center justify-center border border-neutral-700">
                                        <span className="text-neutral-500 text-sm">Không có ảnh</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Results */}
                        <div className="themed-card border border-neutral-700 rounded-2xl p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                            <h3 className="text-orange-400 font-bold text-lg mb-3 text-center">Kết quả ({appState.resultImages.length})</h3>
                            <div className={`grid gap-2 ${appState.resultImages.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                {appState.resultImages.map((img, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="w-full"
                                    >
                                        <img
                                            src={img}
                                            alt={`Result ${i + 1}`}
                                            className={`w-full rounded-lg border border-neutral-600 cursor-pointer hover:opacity-90 transition-all hover:scale-[1.01] object-cover ${appState.resultImages.length <= 2 ? 'aspect-[3/4]' : 'aspect-square'}`}
                                            onClick={() => openLightbox(lightboxImages.indexOf(img))}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => onStateChange({ ...appState, stage: 'configuring' })}
                            className="px-6 py-2.5 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm font-medium"
                        >
                            ✏️ Sửa tùy chọn
                        </button>
                        <button
                            onClick={onReset}
                            className="px-6 py-2.5 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors text-sm font-medium"
                        >
                            🔄 Bắt đầu lại
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Lightbox */}
            <Lightbox
                images={lightboxImages}
                selectedIndex={lightboxIndex}
                onClose={closeLightbox}
                onNavigate={navigateLightbox}
            />
        </div>
    );
};

export default PortraitGenerator;
