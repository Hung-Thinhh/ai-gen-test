"use client";

import ArchitectureIdeator from '@/components/ArchitectureIdeator';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';
import { withToolState } from '@/components/hoc/withToolState';

function ArchitectureIdeatorPage({ appState, onStateChange, onReset, onGoBack }: any) {
    return (
        <ToolPageWrapper toolId="architecture-ideator" settingsKey="architectureIdeator">
            {({ settings: s, t, addImagesToGallery, logGeneration }) => (
                <ArchitectureIdeator
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

export default withToolState(ArchitectureIdeatorPage, 'architecture-ideator');
