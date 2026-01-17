"use client";

import BabyPhotoCreator from '@/components/BabyPhotoCreator';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';
import { withToolState } from '@/components/hoc/withToolState';

function BabyPhotoCreatorPage({ appState, onStateChange, onReset, onGoBack }: any) {
    return (
        <ToolPageWrapper toolId="baby-photo-creator" settingsKey="babyPhotoCreator">
            {({ settings: s, t, addImagesToGallery, logGeneration }) => (
                <BabyPhotoCreator
                    mainTitle={t(s.mainTitleKey)}
                    subtitle={t(s.subtitleKey)}
                    useSmartTitleWrapping={s.useSmartTitleWrapping}
                    smartTitleWrapWords={s.smartTitleWrapWords}
                    minIdeas={s.minIdeas}
                    maxIdeas={s.maxIdeas}
                    uploaderCaption={t(s.uploaderCaptionKey)}
                    uploaderDescription={t(s.uploaderDescriptionKey)}
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

export default withToolState(BabyPhotoCreatorPage, 'baby-photo-creator');
