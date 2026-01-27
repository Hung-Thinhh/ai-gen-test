/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
'use client';

import React, { useState, useCallback } from 'react';
// import { AppControlContext } from '@/components/uiContexts';
import { useAppControls } from '@/components/uiUtils';
import ProductProcessCreator from '@/components/ProductProcessCreator';
import { PosterCreatorState } from '@/components/uiTypes';
import { useRouter } from 'next/navigation';

export default function ProductProcessCreatorPage() {
    const router = useRouter();
    const {
        logGeneration,
        addImagesToGallery
    } = useAppControls();

    // Reusing PosterCreatorState basically, or we can define a simpler state if we wanted.
    // But since the component uses PosterCreatorState props, we use it here.
    const [appState, setAppState] = useState<PosterCreatorState>({
        stage: 'idle',
        productImages: [],
        secondaryObjectImage: null,
        referenceImage: null,
        textEffectImage: null,
        generatedImage: null,
        historicalImages: [],
        options: {
            posterType: 'Poster quảng cáo sản phẩm', // Default
            backgroundStyle: 'Tự động phân tích',
            lightingStyle: 'Studio chuyên nghiệp',
            productAngle: 'Góc chụp studio chuẩn',
            aspectRatio: '9:16',
            environmentDescription: '',
            notes: '',
            includeText: false,
            headline: '',
            subheadline: '',
            callToAction: '',
            colorScheme: '',
            enableAdvancedStyling: false,
            imageCount: 1,
            domain: 'F&B',
        },
        error: null,
    });

    const handleStateChange = useCallback((newState: PosterCreatorState) => {
        setAppState(newState);
    }, []);

    const handleReset = useCallback(() => {
        setAppState(prev => ({
            ...prev,
            productImages: [],
            generatedImage: null,
        }));
    }, []);

    const handleGoBack = useCallback(() => {
        router.push('/');
    }, [router]);

    return (
        <ProductProcessCreator
            appState={appState}
            onStateChange={handleStateChange}
            onReset={handleReset}
            onGoBack={handleGoBack}
            logGeneration={logGeneration}
            addImagesToGallery={addImagesToGallery}
        />
    );
}
