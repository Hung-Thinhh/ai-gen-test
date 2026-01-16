/**
 * Milk Tea Poster Generator
 * Specialized tool for creating professional milk tea / bubble tea posters
 * Simplified and improved from PosterCreator monolith
 */
import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import { AppScreenHeader, useAppControls } from './uiUtils';
import { generateStyledImage } from '../services/gemini/advancedImageService';

// Studio data structure from database
interface BackgroundStyle {
    id: string;
    name: string;
    name_vi: string;
    prompt: string;
}

interface PromptOption {
    id: string;
    name: string;
    name_vi: string;
    prompt: string;
}

interface StudioConfig {
    id: string;
    name: string;
    prompts: {
        background_styles: BackgroundStyle[];
        decorative_elements: PromptOption[];
        lighting_styles: PromptOption[];
        aspect_ratios: string[];
    };
}

interface MilkTeaPosterGeneratorProps {
    studio: StudioConfig;
    onGoBack: () => void;
}

const MilkTeaPosterGenerator: React.FC<MilkTeaPosterGeneratorProps> = ({ studio, onGoBack }) => {
    const { t, checkCredits, modelVersion, addImagesToGallery, logGeneration } = useAppControls();

    // Image uploads
    const [productImage, setProductImage] = useState<string | null>(null);
    const [referenceImage, setReferenceImage] = useState<string | null>(null);

    // Options with smart defaults
    const [selectedBackground, setSelectedBackground] = useState(
        studio.prompts.background_styles[0]?.id || ''
    );
    const [selectedDecoration, setSelectedDecoration] = useState(
        studio.prompts.decorative_elements[1]?.id || studio.prompts.decorative_elements[0]?.id || ''
    );
    const [selectedLighting, setSelectedLighting] = useState(
        studio.prompts.lighting_styles[0]?.id || ''
    );
    const [aspectRatio, setAspectRatio] = useState(
        studio.prompts.aspect_ratios[0] || '1:1 (Instagram Post)'
    );

    // Text options
    const [headline, setHeadline] = useState('');
    const [subheadline, setSubheadline] = useState('');
    const [cta, setCta] = useState('');
    const [includeText, setIncludeText] = useState(false);

    // UI state
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);

    // Build prompt based on selections
    const buildPrompt = useCallback(() => {
        const bgStyle = studio.prompts.background_styles.find(s => s.id === selectedBackground);
        const decoStyle = studio.prompts.decorative_elements.find(s => s.id === selectedDecoration);
        const lightStyle = studio.prompts.lighting_styles.find(s => s.id === selectedLighting);

        const hasReference = !!referenceImage;

        if (hasReference) {
            return `
CREATE professional milk tea poster following reference layout.
PRODUCT: Milk tea / Bubble tea from uploaded image
BACKGROUND: ${bgStyle?.prompt || 'professional beverage photography background'}
DECORATION: ${decoStyle?.prompt || 'minimal clean composition'}
LIGHTING: ${lightStyle?.prompt || 'professional studio lighting'}
CRITICAL: Copy EXACT layout, composition, and aspect ratio from reference image
${includeText && headline ? `HEADLINE TEXT: "${headline}" - Place at same position as reference` : ''}
${includeText && subheadline ? `SUBHEADLINE: "${subheadline}" - Below headline` : ''}
${includeText && cta ? `CTA BUTTON: "${cta}" - At bottom area, styled to match reference` : ''}
Commercial quality beverage photography. Professional HD output.
      `.trim();
        } else {
            return `
CREATE professional milk tea product poster.
PRODUCT: Milk tea / Bubble tea from uploaded image
BACKGROUND: ${bgStyle?.prompt || 'soft pastel background'}
DECORATION: ${decoStyle?.prompt || 'bubble tea elements'}
LIGHTING: ${lightStyle?.prompt || 'natural soft light'}
ASPECT RATIO: ${aspectRatio}
${includeText && headline ? `HEADLINE: "${headline}" - Bold and prominent` : ''}
${includeText && subheadline ? `SUBHEADLINE: "${subheadline}" - Supporting text` : ''}
${includeText && cta ? `CTA: "${cta}" - Eye-catching button` : ''}
High-end beverage advertising photography. Professional commercial quality.
      `.trim();
        }
    }, [selectedBackground, selectedDecoration, selectedLighting, aspectRatio, headline, subheadline, cta, includeText, referenceImage, studio.prompts]);

    // Handle generation
    const handleGenerate = useCallback(async () => {
        if (!productImage) {
            toast.error('Vui lòng tải ảnh trà sữa lên!');
            return;
        }

        if (!await checkCredits()) {
            return;
        }

        setIsGenerating(true);

        try {
            const prompt = buildPrompt();
            const images = [productImage, referenceImage].filter(Boolean) as string[];


            const resultUrl = await generateStyledImage(prompt, images);

            // Add to displayed results
            setGeneratedImages(prev => [resultUrl, ...prev].slice(0, 6));

            // Save to gallery
            await addImagesToGallery([resultUrl]);


            // Log generation
            const creditCost = modelVersion === 'v3' ? 2 : 1;
            logGeneration('milk-tea-poster', {}, resultUrl, {
                credits_used: creditCost,
                api_model_used: modelVersion === 'v3' ? 'imagen-3.0-generate-001' : 'gemini-2.5-flash-image',
                generation_count: 1,
                input_prompt: prompt
            });

            toast.success('Đã tạo poster thành công! 🎨');
        } catch (error) {
            console.error('[MilkTeaPoster] Generation error:', error);
            toast.error('Lỗi khi tạo poster. Vui lòng thử lại!');
        } finally {
            setIsGenerating(false);
        }
    }, [productImage, referenceImage, buildPrompt, checkCredits, addImagesToGallery, logGeneration, modelVersion]);

    // Background color preview mapping
    const getBgGradientClass = (id: string) => {
        switch (id) {
            case 'bg_pastel_mint': return 'bg-gradient-to-br from-green-200 to-green-50';
            case 'bg_pink_cream': return 'bg-gradient-to-br from-pink-200 to-orange-50';
            case 'bg_brown_coffee': return 'bg-gradient-to-br from-amber-800 to-amber-600';
            case 'bg_vibrant_tropical': return 'bg-gradient-to-br from-yellow-400 via-pink-400 to-purple-400';
            case 'bg_white_minimal': return 'bg-white border border-neutral-300';
            default: return 'bg-neutral-700';
        }
    };

    const canGenerate = !!productImage && !isGenerating;

    return (
        <div className="flex flex-col items-center justify-center w-full min-h-screen">
            <AppScreenHeader
                mainTitle={studio.name}
                subtitle="Tạo poster chuyên nghiệp cho trà sữa trong vài giây"
                useSmartTitleWrapping={true}
                smartTitleWrapWords={4}
            />

            <div className="w-full max-w-5xl mx-auto p-4 space-y-6">
                {/* Upload Section */}
                {!isGenerating && (
                    <motion.div
                        className="grid grid-cols-2 gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="themed-card backdrop-blur-md p-3 rounded-xl">
                            <ActionablePolaroidCard
                                type={productImage ? 'content-input' : 'uploader'}
                                status="done"
                                mediaUrl={productImage ?? undefined}
                                caption="Ảnh Trà Sữa"
                                onImageChange={setProductImage}
                                placeholderType="style"
                            />
                            <p className="text-xs text-orange-500 font-bold text-center mt-2">
                                Bắt buộc *
                            </p>
                        </div>

                        <div className="themed-card backdrop-blur-md p-3 rounded-xl">
                            <ActionablePolaroidCard
                                type={referenceImage ? 'content-input' : 'uploader'}
                                status="done"
                                mediaUrl={referenceImage ?? undefined}
                                caption="Bố Cục Mẫu"
                                onImageChange={setReferenceImage}
                                placeholderType="architecture"
                            />
                            <p className="text-xs text-neutral-400 text-center mt-2">
                                Tùy chọn
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Options Panel */}
                {!isGenerating && (
                    <motion.div
                        className="themed-card backdrop-blur-md rounded-xl p-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className="text-xl font-bold text-orange-500 mb-4 border-b border-orange-500/20 pb-2">
                            Tùy chỉnh Style
                        </h2>

                        {/* Background Style with Visual Previews */}
                        <div className="mb-5">
                            <label className="block text-neutral-200 font-semibold mb-3 text-sm">
                                🎨 Màu nền
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                {studio.prompts.background_styles.map(style => (
                                    <button
                                        key={style.id}
                                        onClick={() => setSelectedBackground(style.id)}
                                        className={`
                      p-2 rounded-lg border-2 transition-all
                      ${selectedBackground === style.id
                                                ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/30'
                                                : 'border-neutral-700 hover:border-neutral-600'
                                            }
                    `}
                                    >
                                        <div className={`w-full h-10 rounded mb-1.5 ${getBgGradientClass(style.id)}`} />
                                        <p className="text-[10px] text-neutral-300 font-medium leading-tight">
                                            {style.name_vi}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="mb-5">
                            <label className="block text-neutral-200 font-semibold mb-2 text-sm">
                                ✨ Trang trí
                            </label>
                            <select
                                value={selectedDecoration}
                                onChange={(e) => setSelectedDecoration(e.target.value)}
                                className="w-full bg-neutral-800/70 text-neutral-200 rounded-lg p-3 border border-neutral-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all"
                            >
                                {studio.prompts.decorative_elements.map(deco => (
                                    <option key={deco.id} value={deco.id}>
                                        {deco.name_vi}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Advanced Options Toggle */}
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-sm text-orange-500 hover:text-orange-400 mb-3 flex items-center gap-2 transition-colors"
                        >
                            <span className="transform transition-transform" style={{ transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                ▶
                            </span>
                            Tùy chọn nâng cao
                        </button>

                        <AnimatePresence>
                            {showAdvanced && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4 overflow-hidden"
                                >
                                    {/* Lighting */}
                                    <div>
                                        <label className="block text-neutral-200 font-semibold mb-2 text-sm">
                                            💡 Ánh sáng
                                        </label>
                                        <select
                                            value={selectedLighting}
                                            onChange={(e) => setSelectedLighting(e.target.value)}
                                            className="w-full bg-neutral-800/70 text-neutral-200 rounded-lg p-3 border border-neutral-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                        >
                                            {studio.prompts.lighting_styles.map(light => (
                                                <option key={light.id} value={light.id}>
                                                    {light.name_vi}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Aspect Ratio */}
                                    <div>
                                        <label className="block text-neutral-200 font-semibold mb-2 text-sm">
                                            📐 Kích thước
                                        </label>
                                        <select
                                            value={aspectRatio}
                                            onChange={(e) => setAspectRatio(e.target.value)}
                                            className="w-full bg-neutral-800/70 text-neutral-200 rounded-lg p-3 border border-neutral-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                        >
                                            {studio.prompts.aspect_ratios.map(ratio => (
                                                <option key={ratio} value={ratio}>{ratio}</option>
                                            ))}
                                        </select>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Text Options */}
                        <div className="border-t border-neutral-700/50 pt-5 mt-5">
                            <label className="flex items-center gap-3 mb-4 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={includeText}
                                    onChange={(e) => setIncludeText(e.target.checked)}
                                    className="w-5 h-5 rounded border-neutral-600 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer"
                                />
                                <span className="text-neutral-200 font-semibold group-hover:text-orange-500 transition-colors">
                                    📝 Thêm chữ lên poster
                                </span>
                            </label>

                            <AnimatePresence>
                                {includeText && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-3"
                                    >
                                        <input
                                            type="text"
                                            placeholder="Tiêu đề chính (VD: Trà Sữa Trân Châu)"
                                            value={headline}
                                            onChange={(e) => setHeadline(e.target.value)}
                                            className="w-full bg-neutral-800/70 text-neutral-200 rounded-lg p-3 border border-neutral-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-sm placeholder-neutral-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Phụ đề (VD: Thơm ngon - Giá chỉ 25k)"
                                            value={subheadline}
                                            onChange={(e) => setSubheadline(e.target.value)}
                                            className="w-full bg-neutral-800/70 text-neutral-200 rounded-lg p-3 border border-neutral-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-sm placeholder-neutral-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Nút kêu gọi (VD: Đặt Ngay)"
                                            value={cta}
                                            onChange={(e) => setCta(e.target.value)}
                                            className="w-full bg-neutral-800/70 text-neutral-200 rounded-lg p-3 border border-neutral-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-sm placeholder-neutral-500"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}

                {/* Generate Button */}
                {!isGenerating && (
                    <motion.button
                        onClick={handleGenerate}
                        disabled={!canGenerate}
                        className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-400 hover:to-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50"
                        whileHover={{ scale: canGenerate ? 1.02 : 1 }}
                        whileTap={{ scale: canGenerate ? 0.98 : 1 }}
                    >
                        🎨 Tạo Poster Trà Sữa
                    </motion.button>
                )}

                {/* Loading State */}
                {isGenerating && (
                    <motion.div
                        className="flex flex-col items-center justify-center py-16"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="w-20 h-20 rounded-full border-4 border-neutral-700 border-t-orange-500 animate-spin mb-4" />
                        <p className="text-orange-500 font-bold text-lg">Đang tạo poster...</p>
                        <p className="text-neutral-400 text-sm mt-2">Vui lòng đợi trong giây lát</p>
                    </motion.div>
                )}

                {/* Results Grid */}
                {generatedImages.length > 0 && !isGenerating && (
                    <motion.div
                        className="space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h3 className="text-xl font-bold text-neutral-200">
                            Kết quả ({generatedImages.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {generatedImages.map((img, index) => (
                                <ActionablePolaroidCard
                                    key={img}
                                    type="output"
                                    mediaUrl={img}
                                    caption={`Poster ${index + 1}`}
                                    status="done"
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Debug Prompt Preview */}
                {process.env.NODE_ENV === 'development' && productImage && (
                    <details className="mt-4 text-xs text-neutral-500 bg-neutral-900/50 rounded p-2">
                        <summary className="cursor-pointer hover:text-neutral-400">
                            🔍 Debug: Prompt Preview
                        </summary>
                        <pre className="bg-neutral-900 p-3 rounded mt-2 overflow-auto whitespace-pre-wrap text-[10px]">
                            {buildPrompt()}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
};

export default MilkTeaPosterGenerator;
