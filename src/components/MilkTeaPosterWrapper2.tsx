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
            // If it's an object with 'context' key, use that
            if (studio.domain_prompts.context) {
                return studio.domain_prompts.context;
            }
            // Otherwise get the first string value
            const keys = Object.keys(studio.domain_prompts);
            const firstValue = studio.domain_prompts[keys[0]];
            return typeof firstValue === 'string' ? firstValue : undefined;
        }
        return undefined;
    }, [studio?.domain_prompts]);

    // Extract custom prompts from DB (backgrounds, lighting, angles, posterTypes)
    const domainPrompts = useMemo(() => {
        if (!studio?.domain_prompts || typeof studio.domain_prompts !== 'object') {
            return undefined;
        }
        return {
            backgrounds: studio.domain_prompts.backgrounds,
            lighting: studio.domain_prompts.lighting,
            angles: studio.domain_prompts.angles,
            posterTypes: studio.domain_prompts.posterTypes,
        };
    }, [studio?.domain_prompts]);

    // Extract theme from DB ui_config
    const theme = useMemo(() => {
        if (studio?.ui_config?.theme) {
            return studio.ui_config.theme;
        }
        return undefined;
    }, [studio?.ui_config]);

    return (
        <PosterCreatorInternal
            mainTitle={studio?.name || 'Milk Tea Poster Creator'}
            subtitle={studio?.description_vi || studio?.description || 'Tạo poster sản phẩm chuyên nghiệp'}
            useSmartTitleWrapping={true}
            smartTitleWrapWords={4}
            uploaderCaption="Tải ảnh sản phẩm"
            uploaderDescription="Chọn ảnh sản phẩm của bạn"
            addImagesToGallery={addImagesToGallery}
            appState={appState}
            onStateChange={setAppState}
            onReset={handleReset}
            onGoBack={() => { }}
            logGeneration={logGeneration}
            stylePresets={stylePresets}
            domainContext={domainContext}
            domainPrompts={domainPrompts}
            theme={theme}
        />
    );
};

export default MilkTeaPosterGenerator;
