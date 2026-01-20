'use client';

import { useEffect, useState, useMemo } from 'react';
import PosterCreator from './MilkTeaPosterGeneratorV2'; // CHANGED: Using V2 for new UI
import { PosterCreatorState } from './uiTypes';
import { useAppControls } from './uiContexts';

interface MilkTeaPosterWrapperProps {
    onGoBack: () => void;
}

export default function MilkTeaPosterWrapper({ onGoBack }: MilkTeaPosterWrapperProps) {
    const { addImagesToGallery, logGeneration } = useAppControls();

    const [appState, setAppState] = useState<PosterCreatorState>({
        productImages: [],
        referenceImage: null,
        secondaryObjectImage: null,
        textEffectImage: null,
        generatedImage: null,
        historicalImages: [],
        stage: 'configuring',
        error: null,
        options: {
            aspectRatio: '1:1 (Vuông - Instagram)',
            posterType: 'Poster quảng cáo sản phẩm',
            backgroundStyle: 'Studio thuần túy',
            lightingStyle: 'Ánh sáng studio 3 điểm',
            productAngle: 'Chính diện thẳng',
            domain: 'Trà sữa & Đồ uống',
            colorScheme: 'Tự động theo ảnh tham khảo',
            headline: '',
            subheadline: '',
            callToAction: '',
            includeText: false,
            notes: '',
            environmentDescription: '',
            imageCount: 1,
            enableAdvancedStyling: false,
        },
    });

    const handleReset = () => {
        setAppState({
            productImages: [],
            referenceImage: null,
            secondaryObjectImage: null,
            textEffectImage: null,
            generatedImage: null,
            historicalImages: [],
            stage: 'configuring',
            error: null,
            options: {
                aspectRatio: '1:1 (Vuông - Instagram)',
                posterType: 'Poster quảng cáo sản phẩm',
                backgroundStyle: 'Studio thuần túy',
                lightingStyle: 'Ánh sáng studio 3 điểm',
                productAngle: 'Chính diện thẳng',
                domain: 'Trà sữa & Đồ uống',
                colorScheme: 'Tự động theo ảnh tham khảo',
                headline: '',
                subheadline: '',
                callToAction: '',
                includeText: false,
                notes: '',
                environmentDescription: '',
                imageCount: 1,
                enableAdvancedStyling: false,
            },
        });
    };

    const [studio, setStudio] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStudio() {
            try {
                const response = await fetch('/api/tool-custom?slug=milk-tea-poster');
                if (!response.ok) {
                    throw new Error('Failed to fetch studio');
                }
                const data = await response.json();
                setStudio(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        }

        fetchStudio();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-neutral-400">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (error || !studio) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-500 text-lg mb-2">❌ Lỗi</p>
                    <p className="text-neutral-400">{error || 'Studio not found'}</p>
                    <button
                        onClick={onGoBack}
                        className="mt-4 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    // Transform DB style presets to component format
    const stylePresets = useMemo(() => {
        if (!studio?.style_presets || studio.style_presets.length === 0) {
            return undefined;
        }

        const presetsMap: Record<string, any> = {};
        studio.style_presets.forEach((preset: any) => {
            const key = preset.name.toLowerCase().replace(/\s+/g, '_').replace(/&/g, '');
            presetsMap[key] = {
                name: preset.name_vi || preset.name,
                description: preset.metadata?.description_vi || preset.metadata?.description || '',
                prompt: preset.prompt_text,
                buildPrompt: () => preset.prompt_text
            };
        });

        return presetsMap;
    }, [studio?.style_presets]);

    // Extract domain context from DB (tool_custom.domain_prompts column)
    const domainContext = useMemo(() => {
        if (typeof studio?.domain_prompts === 'string') {
            return studio.domain_prompts;
        } else if (studio?.domain_prompts && typeof studio.domain_prompts === 'object') {
            const keys = Object.keys(studio.domain_prompts);
            return studio.domain_prompts[keys[0]] || undefined;
        }
        return undefined;
    }, [studio?.domain_prompts]);

    return (
        <PosterCreator
            mainTitle={studio?.name || 'Milk Tea Poster Creator'}
            subtitle="Tạo poster trà sữa chuyên nghiệp"
            useSmartTitleWrapping={true}
            smartTitleWrapWords={4}
            uploaderCaption="Tải ảnh sản phẩm"
            uploaderDescription="Chọn ảnh trà sữa của bạn"
            addImagesToGallery={addImagesToGallery}
            appState={appState}
            onStateChange={setAppState}
            onReset={handleReset}
            onGoBack={() => { }}
            logGeneration={logGeneration}
            stylePresets={stylePresets}
            domainContext={domainContext}
        />
    );
}
