"use client";

import FaceSwap from '@/components/FaceSwap';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';
import { withToolState } from '@/components/hoc/withToolState';

function FaceSwapPage({ appState, onStateChange, onReset, onGoBack }: any) {
    return (
        <ToolPageWrapper toolId="face-swap" settingsKey="faceSwap">
            {({ settings: s, t, addImagesToGallery, logGeneration }) => (
                <FaceSwap
                    mainTitle={t(s.mainTitleKey)}
                    subtitle={t(s.subtitleKey)}
                    useSmartTitleWrapping={s.useSmartTitleWrapping}
                    smartTitleWrapWords={s.smartTitleWrapWords}
                    uploaderCaptionSource={t(s.uploaderCaptionSourceKey)}
                    uploaderDescriptionSource={t(s.uploaderDescriptionSourceKey)}
                    uploaderCaptionFace={t(s.uploaderCaptionFaceKey)}
                    uploaderDescriptionFace={t(s.uploaderDescriptionFaceKey)}
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

export default withToolState(FaceSwapPage, 'face-swap');
