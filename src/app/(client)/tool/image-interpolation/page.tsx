"use client";

import ImageInterpolation from '@/components/ImageInterpolation';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';
import { withToolState } from '@/components/hoc/withToolState';

function ImageInterpolationPage({ appState, onStateChange, onReset, onGoBack }: any) {
    return (
        <ToolPageWrapper toolId="image-interpolation" settingsKey="imageInterpolation">
            {({ settings: s, t, addImagesToGallery, logGeneration }) => (
                <ImageInterpolation
                    mainTitle={t(s.mainTitleKey)}
                    subtitle={t(s.subtitleKey)}
                    useSmartTitleWrapping={s.useSmartTitleWrapping}
                    smartTitleWrapWords={s.smartTitleWrapWords}
                    uploaderCaptionInput={t(s.uploaderCaptionInputKey)}
                    uploaderDescriptionInput={t(s.uploaderDescriptionInputKey)}
                    uploaderCaptionOutput={t(s.uploaderCaptionOutputKey)}
                    uploaderDescriptionOutput={t(s.uploaderDescriptionOutputKey)}
                    uploaderCaptionReference={t(s.uploaderCaptionReferenceKey)}
                    uploaderDescriptionReference={t(s.uploaderDescriptionReferenceKey)}
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

export default withToolState(ImageInterpolationPage, 'image-interpolation');
