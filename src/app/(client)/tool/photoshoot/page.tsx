"use client";

import Photoshoot from '@/components/Photoshoot';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';
import { withToolState } from '@/components/hoc/withToolState';

function PhotoshootPage({ appState, onStateChange, onReset, onGoBack }: any) {
    return (
        <ToolPageWrapper toolId="photoshoot" settingsKey="photoshoot">
            {({ settings: s, t, addImagesToGallery, logGeneration }) => (
                <Photoshoot
                    mainTitle={t(s.mainTitleKey)}
                    subtitle={t(s.subtitleKey)}
                    useSmartTitleWrapping={s.useSmartTitleWrapping}
                    smartTitleWrapWords={s.smartTitleWrapWords}
                    uploaderCaptionPerson={t(s.uploaderCaptionPersonKey)}
                    uploaderDescriptionPerson={t(s.uploaderDescriptionPersonKey)}
                    uploaderCaptionOutfit={t(s.uploaderCaptionOutfitKey)}
                    uploaderDescriptionOutfit={t(s.uploaderDescriptionOutfitKey)}
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

export default withToolState(PhotoshootPage, 'photoshoot');
