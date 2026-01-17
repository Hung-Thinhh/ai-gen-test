"use client";

import PosterCreator from '@/components/PosterCreator';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';
import { withToolState } from '@/components/hoc/withToolState';

function PosterCreatorPage({ appState, onStateChange, onReset, onGoBack }: any) {
    return (
        <ToolPageWrapper toolId="poster-creator" settingsKey="posterCreator">
            {({ settings: s, t, addImagesToGallery, logGeneration }) => (
                <PosterCreator
                    mainTitle={t(s.mainTitleKey)}
                    subtitle={t(s.subtitleKey)}
                    useSmartTitleWrapping={s.useSmartTitleWrapping}
                    smartTitleWrapWords={s.smartTitleWrapWords}
                    uploaderCaption={t(s.uploaderCaptionKey)}
                    uploaderDescription={t(s.uploaderDescriptionKey)}
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

export default withToolState(PosterCreatorPage, 'poster-creator');
