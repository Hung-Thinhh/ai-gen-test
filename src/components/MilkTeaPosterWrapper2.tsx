/**
 * Wrapper for Milk Tea Poster Generator
 * Provides state management and correct props interface
 */
'use client';

import React, { useState, useMemo } from 'react';
import type { PosterCreatorState } from './uiTypes';
import { useAppControls } from './uiUtils';

// Import the actual PosterCreator component (will rename MilkTeaPosterGenerator export)
// @ts-ignore - Will fix import after renaming
import PosterCreatorInternal from './MilkTeaPosterGeneratorV2'; // CHANGED: Using V2 for new UI

interface MilkTeaPosterGeneratorProps {
    studio: any;
}

const MilkTeaPosterGenerator: React.FC<MilkTeaPosterGeneratorProps> = ({ studio }) => {
    const { t, addImagesToGallery, logGeneration } = useAppControls();

    // Initialize state
    const [appState, setAppState] = useState<PosterCreatorState>({
        stage: 'idle',
        productImages: [],
        secondaryObjectImage: null,
        referenceImage: null,
        textEffectImage: null,
        generatedImage: null,
        historicalImages: [],
        error: null,
        options: {
            posterType: 'Poster quảng cáo sản phẩm',
            backgroundStyle: 'Tự động phân tích',
            lightingStyle: 'Studio chuyên nghiệp',
            productAngle: 'Góc chụp studio chuẩn',
            domain: 'Trà sữa & Đồ uống',
            aspectRatio: '1:1 (Vuông - Instagram)',
            colorScheme: 'Tự động theo ảnh tham khảo',
            environmentDescription: '',
            imageCount: 1,
            includeText: false,
            headline: '',
            subheadline: '',
            callToAction: '',
            notes: '',
            enableAdvancedStyling: false,
        }
    });

    const handleReset = () => {
        setAppState({
            stage: 'idle',
            productImages: [],
            secondaryObjectImage: null,
            referenceImage: null,
            textEffectImage: null,
            generatedImage: null,
            historicalImages: [],
            error: null,
            options: {
                posterType: 'Poster quảng cáo sản phẩm',
                backgroundStyle: 'Tự động phân tích',
                lightingStyle: 'Studio chuyên nghiệp',
                productAngle: 'Góc chụp studio chuẩn',
                domain: 'Trà sữa & Đồ uống',
                aspectRatio: '1:1 (Vuông - Instagram)',
                colorScheme: 'Tự động theo ảnh tham khảo',
                environmentDescription: '',
                imageCount: 1,
                includeText: false,
                headline: '',
                subheadline: '',
                callToAction: '',
                notes: '',
                enableAdvancedStyling: false,
            }
        });
    };

    // Transform DB style presets to component format
    const stylePresets = useMemo(() => {
        if (!studio?.style_presets || studio.style_presets.length === 0) {
            return undefined; // Fall back to hardcoded presets in component
        }

        const presetsMap: Record<string, any> = {};
        studio.style_presets.forEach((preset: any) => {
            const key = preset.name.toLowerCase().replace(/\s+/g, '_').replace(/&/g, '');
            presetsMap[key] = {
                name: preset.name_vi || preset.name,
                description: preset.metadata?.description_vi || preset.metadata?.description || '',
                prompt: preset.prompt_text,
                buildPrompt: () => preset.prompt_text // Fallback, no longer used for replacement
            };
        });

        return presetsMap;
    }, [studio?.style_presets]);

    // Extract domain context from DB (tool_custom.domain_prompts column)
    const domainContext = useMemo(() => {
        // domain_prompts might be a string or an object
        if (typeof studio?.domain_prompts === 'string') {
            return studio.domain_prompts;
        } else if (studio?.domain_prompts && typeof studio.domain_prompts === 'object') {
            // If it's an object, get the first value (or 'Trà sữa & Đồ uống' key if exists)
            const keys = Object.keys(studio.domain_prompts);
            return studio.domain_prompts[keys[0]] || undefined;
        }
        return undefined;
    }, [studio?.domain_prompts]);

    return (
        <PosterCreatorInternal
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
};

export default MilkTeaPosterGenerator;
