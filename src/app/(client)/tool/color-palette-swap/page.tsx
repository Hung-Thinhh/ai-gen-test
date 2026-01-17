"use client";

import ColorPaletteSwap from '@/components/ColorPaletteSwap';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';
import { withToolState } from '@/components/hoc/withToolState';

function ColorPaletteSwapPage({ appState, onStateChange, onReset, onGoBack }: any) {
    return (
        <ToolPageWrapper toolId="color-palette-swap" settingsKey="colorPaletteSwap">
            {({ settings: s, t, addImagesToGallery, logGeneration }) => (
                <ColorPaletteSwap
                    mainTitle={t(s.mainTitleKey)}
                    subtitle={t(s.subtitleKey)}
                    useSmartTitleWrapping={s.useSmartTitleWrapping}
                    smartTitleWrapWords={s.smartTitleWrapWords}
                    uploaderCaptionSource={t(s.uploaderCaptionSourceKey)}
                    uploaderDescriptionSource={t(s.uploaderDescriptionSourceKey)}
                    uploaderCaptionPalette={t(s.uploaderCaptionPaletteKey)}
                    uploaderDescriptionPalette={t(s.uploaderDescriptionPaletteKey)}
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

export default withToolState(ColorPaletteSwapPage, 'color-palette-swap');
