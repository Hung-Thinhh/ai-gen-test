"use client";

import TemplateComposer from '@/components/TemplateComposer';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';
import { withToolState } from '@/components/hoc/withToolState';

function TemplateComposerPage({ appState, onStateChange, onReset, onGoBack }: any) {
    return (
        <ToolPageWrapper toolId="template-composer" settingsKey="templateComposer">
            {({ settings: s, t, addImagesToGallery, logGeneration }) => (
                <TemplateComposer
                    mainTitle={t(s.mainTitleKey)}
                    subtitle={t(s.subtitleKey)}
                    useSmartTitleWrapping={s.useSmartTitleWrapping}
                    smartTitleWrapWords={s.smartTitleWrapWords}
                    uploaderCaptionModel={t(s.uploaderCaptionModelKey)}
                    uploaderDescriptionModel={t(s.uploaderDescriptionModelKey)}
                    uploaderCaptionOutfit1={t(s.uploaderCaptionOutfit1Key)}
                    uploaderDescriptionOutfit1={t(s.uploaderDescriptionOutfit1Key)}
                    uploaderCaptionOutfit2={t(s.uploaderCaptionOutfit2Key)}
                    uploaderDescriptionOutfit2={t(s.uploaderDescriptionOutfit2Key)}
                    uploaderCaptionOutfit3={t(s.uploaderCaptionOutfit3Key)}
                    uploaderDescriptionOutfit3={t(s.uploaderDescriptionOutfit3Key)}
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

export default withToolState(TemplateComposerPage, 'template-composer');
