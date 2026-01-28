/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ChangeEvent, useCallback, useEffect, useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import ActionablePolaroidCard from './ActionablePolaroidCard';
import Lightbox from './Lightbox';
import {
    AppScreenHeader,
    handleFileUpload,
    useLightbox,
    useAppControls,
    dataURLtoBlob,
} from './uiUtils';
import { generateProductProcessImage } from '../services/gemini/productProcessCreatorService';
import { embedJsonInPng } from './uiFileUtilities';
import { PosterCreatorState } from './uiTypes';
import { ImageUploadGrid, UploadSlot } from './upload';
import SearchableSelect from './SearchableSelect';
import { processApiError } from '@/services/gemini/baseService';

// --- STYLES ---
const PROCESS_STYLES: Record<string, string> = {
    '3D Miniature (Diorama)': '3D CUTE BLENDER RENDER, isometric view, soft lighting, pastel colors, clay texture, clean background, highly detailed miniature world',
    'Realistic Factory': 'Realistic industrial photography, stainless steel machinery, clean factory environment, professional lighting, 4k detail',
    'Hand Drawn Sketch': 'Technical sketch style, blueprint aesthetic, white lines on blue background, architectural drawing style',
    'Flat Illustration': 'Modern flat vector illustration, corporate memphis style, vibrant solid colors, simple shapes',
    'Magical/Fantasy': 'Magical fantasy style, floating elements, glowing particles, whimsical atmosphere, dreamlike lighting',
    'Eco/Nature': 'Organic nature style, wooden machinery, green leaves, natural sunlight, sustainable aesthetic',
};

const ASPECT_RATIO_OPTIONS = [
    '16:9 (Ngang - Mặc định)',
    '1:1 (Vuông)',
    '3:4 (Dọc)',
    '2:3 (Dọc - Poster)',
    '4:5 (Dọc - Instagram)'
];

interface ProductProcessCreatorProps {
    appState: PosterCreatorState;
    onStateChange: (newState: PosterCreatorState) => void;
    onReset: () => void;
    onGoBack: () => void;
    logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: any) => void;
    addImagesToGallery: (images: string[]) => Promise<string[] | undefined>;
}

const ProductProcessCreator: React.FC<ProductProcessCreatorProps> = (props) => {
    const {
        appState, onStateChange, onReset,
        logGeneration, addImagesToGallery,
        onGoBack
    } = props;

    const { t, checkCredits, user: currentUser, modelVersion } = useAppControls();
    const { lightboxIndex, openLightbox, closeLightbox, navigateLightbox } = useLightbox();

    // Local state
    const [selectedStyle, setSelectedStyle] = useState<string>('3D Miniature (Diorama)');
    const [notes, setNotes] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [displayImages, setDisplayImages] = useState<string[]>([]);
    const [aspectRatio, setAspectRatio] = useState<string>('16:9 (Ngang - Mặc định)');

    const generatedBlobUrlsRef = React.useRef<string[]>([]);

    useEffect(() => {
        return () => {
            generatedBlobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    const lightboxImages = useMemo(() => {
        return [...(appState.productImages || []), ...displayImages].filter(Boolean);
    }, [appState.productImages, displayImages]);

    const handleRemoveProductImage = () => {
        onStateChange({ ...appState, productImages: [] });
    };

    const handleGenerate = async () => {
        if (!appState.productImages?.[0]) {
            toast.error('Vui lòng tải lên ảnh sản phẩm mẫu (kết quả cuối cùng)');
            return;
        }

        if (!await checkCredits()) return;

        setIsGenerating(true);
        toast.loading('Đang phân tích và tạo quy trình...', { id: 'gen-process' });

        try {
            const productImg = appState.productImages[0];
            const ratioShort = aspectRatio.split(' ')[0];

            // New signature: image, style, notes, ratio
            const resultUrl = await generateProductProcessImage(
                productImg,
                selectedStyle,
                notes,
                ratioShort
            );

            const settingsToEmbed = {
                viewId: 'product-process-creator',
                state: {
                    style: selectedStyle,
                    notes
                }
            };

            const urlWithMetadata = await embedJsonInPng(resultUrl, settingsToEmbed, true);

            setDisplayImages(prev => [urlWithMetadata, ...prev]);
            addImagesToGallery([urlWithMetadata]);

            logGeneration('product-process-creator', settingsToEmbed, urlWithMetadata, {
                credits_used: modelVersion === 'v3' ? 2 : 1,
                api_model_used: modelVersion === 'v3' ? 'imagen-3.0' : 'gemini-2.5-flash-image',
                input_prompt: `Process creation for uploaded product image`
            });

            toast.success('Tạo ảnh thành công!', { id: 'gen-process' });

        } catch (error: any) {
            console.error(error);
            toast.error(`Lỗi: ${error.message}`, { id: 'gen-process' });
        } finally {
            setIsGenerating(false);
        }
    };

    // Prepare slots for ImageUploadGrid
    const uploadSlots: UploadSlot[] = useMemo(() => [
        {
            id: 'product-image',
            image: appState.productImages?.[0] || null,
            caption: 'Ảnh gốc',
            description: 'AI sẽ tự động phân tích sản phẩm và tạo quy trình.',
            placeholderType: 'style'
        }
    ], [appState.productImages]);

    const handleGridImageChange = useCallback((slotId: string, url: string | null) => {
        if (slotId === 'product-image') {
            onStateChange({
                ...appState,
                productImages: url ? [url] : []
            });
        }
    }, [appState, onStateChange]);

    return (
        <div className="flex flex-col h-full bg-[#121212] text-gray-200 overflow-hidden font-sans">
            {/* HEADER */}
            <div className="flex-none z-50 pt-4 relative">
                <button
                    onClick={props.onGoBack}
                    className="absolute top-6 left-4 z-50 btn btn-circle btn-ghost text-white hover:bg-orange-500/20"
                    title="Quay lại"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-orange-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <AppScreenHeader
                    mainTitle={t("app_product-process-creator_title") || "Quy trình Sản phẩm"}
                    subtitle={t("app_product-process-creator_description") || "Tạo ảnh minh họa quy trình sản xuất kiểu diorama"}
                    useSmartTitleWrapping={true}
                    smartTitleWrapWords={3}
                />
            </div>

            <div className="flex-grow flex overflow-hidden">
                {/* LEFT SIDEBAR - CONTROLS */}
                <div className="w-full md:w-[400px] flex-none bg-[#1e1e1e] border-r border-[#333] flex flex-col h-full overflow-hidden z-20 shadow-2xl">
                    <div className="flex-grow overflow-y-auto p-5 space-y-6 custom-scrollbar">

                        {/* 1. PRODUCT IMAGE INPUT */}
                        <div className="form-control w-full">
                            <label className="block text-left font-bold text-lg text-orange-500 mb-3 flex items-center gap-2">
                                1. Ảnh sản phẩm
                                <span className="badge badge-sm badge-warning bg-orange-500 border-none text-white">Bắt buộc</span>
                            </label>

                            <ImageUploadGrid
                                slots={uploadSlots}
                                onImageChange={handleGridImageChange}
                                columns={2} // Using 2 columns to keep it not too wide, or we can use !grid-cols-1 if we want full width but contained
                                className="!grid-cols-1" // Force 1 column for this specific single input
                            />
                        </div>

                        {/* ROW: STYLE & RATIO */}
                        <div className="grid grid-cols-1 gap-4">
                            {/* 2. STYLE SELECTION */}
                            <SearchableSelect
                                id="style-select"
                                label="2. Phong cách"
                                options={Object.keys(PROCESS_STYLES)}
                                value={selectedStyle}
                                onChange={setSelectedStyle}
                                placeholder="Chọn phong cách..."
                            />

                            {/* 3. ASPECT RATIO */}
                            <SearchableSelect
                                id="ratio-select"
                                label="3. Tỷ lệ khung hình"
                                options={ASPECT_RATIO_OPTIONS}
                                value={aspectRatio}
                                onChange={setAspectRatio}
                                placeholder="Chọn tỷ lệ..."
                            />
                        </div>

                        {/* 4. NOTES - 50% WIDTH (Per user request: "ghi chú thêm ô input có 1 nửa") */}
                        <div className="flex flex-wrap">
                            <div className="w-full">
                                <label className="block text-left text-gray-300 font-bold mb-2 text-sm">
                                    4. Ghi chú thêm
                                </label>
                                <textarea
                                    className="w-full bg-[#2a2a2a] text-gray-200 rounded-xl p-3 border border-[#444] focus:border-orange-500 focus:outline-none h-32 text-sm resize-none"
                                    placeholder="Tông màu ấm, thủ công..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                ></textarea>
                                <div className="text-xs text-gray-500 italic">
                                    Mẹo: Hãy mô tả chi tiết màu sắc, không gian hoặc các yếu tố phụ trợ bạn muốn xuất hiện trong quy trình.
                                </div>
                            </div>

                        </div>

                        {/* GENERATE BUTTON */}
                        <div className="pt-4 pb-8">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !appState.productImages?.[0]}
                                className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${isGenerating || !appState.productImages?.[0]
                                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                    : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-orange-500/30'
                                    }`}
                            >
                                {isGenerating ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="loading loading-spinner loading-md"></span>
                                        Đang sáng tạo...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        ✨ Tạo Quy Trình
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE - PREVIEW */}
                <div className="flex-grow bg-[#0a0a0a] overflow-y-auto p-4 relative">
                    {displayImages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-6">
                            <div className="w-32 h-32 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-[#333]">
                                <span className="text-6xl grayscale opacity-50">🏭</span>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-medium text-gray-400 mb-2">Không gian sáng tạo</p>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                    Tải ảnh sản phẩm và chọn phong cách để bắt đầu hành trình.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {displayImages.map((imgUrl, index) => (
                                <ActionablePolaroidCard
                                    key={index + imgUrl}
                                    type="output"
                                    caption={`Quy trình ${index + 1}`}
                                    status="done"
                                    mediaUrl={imgUrl}
                                    onClick={() => openLightbox(appState.productImages?.length ? appState.productImages.length + index : index)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* LIGHTBOX */}
            <Lightbox
                selectedIndex={lightboxIndex}
                onClose={closeLightbox}
                images={lightboxImages}
                onNavigate={navigateLightbox}
            />
        </div>
    );
};

export default ProductProcessCreator;
