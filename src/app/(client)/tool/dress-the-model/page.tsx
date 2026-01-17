"use client";

import DressTheModel from '@/components/DressTheModel';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';
import { withToolState } from '@/components/hoc/withToolState';

function DressTheModelPage({ appState, onStateChange, onReset, onGoBack }: any) {
    return (
        <ToolPageWrapper toolId="dress-the-model" settingsKey="dressTheModel">
            {({ settings: s, t, addImagesToGallery, logGeneration }) => (
                <DressTheModel
                    mainTitle={t(s.mainTitleKey)}
                    subtitle={t(s.subtitleKey)}
                    useSmartTitleWrapping={s.useSmartTitleWrapping}
                    smartTitleWrapWords={s.smartTitleWrapWords}
                    uploaderCaptionModel={t(s.uploaderCaptionModelKey)}
                    uploaderDescriptionModel={t(s.uploaderDescriptionModelKey)}
                    uploaderCaptionClothing={t(s.uploaderCaptionClothingKey)}
                    uploaderDescriptionClothing={t(s.uploaderDescriptionClothingKey)}
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

export default withToolState(DressTheModelPage, 'dress-the-model');
