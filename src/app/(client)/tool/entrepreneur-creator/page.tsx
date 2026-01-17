"use client";

import EntrepreneurCreator from '@/components/EntrepreneurCreator';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';
import { withToolState } from '@/components/hoc/withToolState';

function EntrepreneurCreatorPage({ appState, onStateChange, onReset, onGoBack }: any) {
    return (
        <ToolPageWrapper toolId="entrepreneur-creator" settingsKey="entrepreneurCreator">
            {({ settings: s, t, addImagesToGallery, logGeneration }) => (
                <EntrepreneurCreator
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

export default withToolState(EntrepreneurCreatorPage, 'entrepreneur-creator');
