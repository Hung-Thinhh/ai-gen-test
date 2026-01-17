"use client";

import SwapStyle from '@/components/SwapStyle';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';
import { withToolState } from '@/components/hoc/withToolState';

function SwapStylePage({ appState, onStateChange, onReset, onGoBack }: any) {
    return (
        <ToolPageWrapper toolId="swap-style" settingsKey="swapStyle">
            {({ settings: s, t, addImagesToGallery, logGeneration }) => (
                <SwapStyle
                    mainTitle={t(s.mainTitleKey)}
                    subtitle={t(s.subtitleKey)}
                    useSmartTitleWrapping={s.useSmartTitleWrapping}
                    smartTitleWrapWords={s.smartTitleWrapWords}
                    uploaderCaptionContent={t(s.uploaderCaptionContentKey)}
                    uploaderDescriptionContent={t(s.uploaderDescriptionContentKey)}
                    uploaderCaptionStyle={t(s.uploaderCaptionStyleKey)}
                    uploaderDescriptionStyle={t(s.uploaderDescriptionStyleKey)}
                    appState={appState}
                    onStateChange={onStateChange}
                    onReset={onReset}
                    onGoBack={onGoBack}
                    addImagesToGallery={addImagesToGallery}
                    logGeneration={logGeneration}
                />
            )}
        </ToolPageWrapper>
    );
}

export default withToolState(SwapStylePage, 'swap-style');
