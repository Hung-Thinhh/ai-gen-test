"use client";

import ConceptStudio from '@/components/ConceptStudio';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';
import { withToolState } from '@/components/hoc/withToolState';

function ConceptStudioPage({ appState, onStateChange, onReset, onGoBack }: any) {
    return (
        <ToolPageWrapper toolId="concept-studio" settingsKey="conceptStudio">
            {({ settings: s, t, addImagesToGallery, logGeneration }) => (
                <ConceptStudio
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

export default withToolState(ConceptStudioPage, 'concept-studio');
