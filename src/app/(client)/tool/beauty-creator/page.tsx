"use client";

import BeautyCreator from '@/components/BeautyCreator';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';
import { withToolState } from '@/components/hoc/withToolState';

function BeautyCreatorPage({ appState, onStateChange, onReset, onGoBack }: any) {
    return (
        <ToolPageWrapper toolId="beauty-creator" settingsKey="beautyCreator">
            {({ settings: s, t, addImagesToGallery, logGeneration }) => (
                <BeautyCreator
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

export default withToolState(BeautyCreatorPage, 'beauty-creator');
