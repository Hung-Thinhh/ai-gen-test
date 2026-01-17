"use client";

import PoseAnimator from '@/components/PoseAnimator';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';
import { withToolState } from '@/components/hoc/withToolState';

function PoseAnimatorPage({ appState, onStateChange, onReset, onGoBack }: any) {
    return (
        <ToolPageWrapper toolId="pose-animator" settingsKey="poseAnimator">
            {({ settings: s, t, addImagesToGallery, logGeneration }) => (
                <PoseAnimator
                    mainTitle={t(s.mainTitleKey)}
                    subtitle={t(s.subtitleKey)}
                    useSmartTitleWrapping={s.useSmartTitleWrapping}
                    smartTitleWrapWords={s.smartTitleWrapWords}
                    uploaderCaptionPose={t(s.uploaderCaptionPoseKey)}
                    uploaderDescriptionPose={t(s.uploaderDescriptionPoseKey)}
                    uploaderCaptionTarget={t(s.uploaderCaptionTargetKey)}
                    uploaderDescriptionTarget={t(s.uploaderDescriptionTargetKey)}
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

export default withToolState(PoseAnimatorPage, 'pose-animator');
