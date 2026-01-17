"use client";

import OutfitExtractor from '@/components/OutfitExtractor';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';
import { withToolState } from '@/components/hoc/withToolState';

function OutfitExtractorPage({ appState, onStateChange, onReset, onGoBack }: any) {
    return (
        <ToolPageWrapper toolId="outfit-extractor" settingsKey="outfitExtractor">
            {({ settings: s, t, addImagesToGallery, logGeneration }) => (
                <OutfitExtractor
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

export default withToolState(OutfitExtractorPage, 'outfit-extractor');
