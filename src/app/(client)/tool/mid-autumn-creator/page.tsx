"use client";

import MidAutumnCreator from '@/components/MidAutumnCreator';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';
import { withToolState } from '@/components/hoc/withToolState';

function MidAutumnCreatorPage({ appState, onStateChange, onReset, onGoBack }: any) {
    return (
        <ToolPageWrapper toolId="mid-autumn-creator" settingsKey="midAutumnCreator">
            {({ settings: s, t, addImagesToGallery, logGeneration }) => (
                <MidAutumnCreator
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

export default withToolState(MidAutumnCreatorPage, 'mid-autumn-creator');
