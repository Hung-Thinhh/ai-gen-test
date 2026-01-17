"use client";

import FreeGeneration from '@/components/FreeGeneration';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';
import { withToolState } from '@/components/hoc/withToolState';

function FreeGenerationPage({ appState, onStateChange, onReset, onGoBack }: any) {
    return (
        <ToolPageWrapper toolId="free-generation" settingsKey="freeGeneration">
            {({ settings: s, t, addImagesToGallery, logGeneration }) => (
                <FreeGeneration
                    mainTitle={t(s.mainTitleKey)}
                    subtitle={t(s.subtitleKey)}
                    useSmartTitleWrapping={s.useSmartTitleWrapping}
                    smartTitleWrapWords={s.smartTitleWrapWords}
                    uploaderCaption1={t(s.uploaderCaption1Key)}
                    uploaderDescription1={t(s.uploaderDescription1Key)}
                    uploaderCaption2={t(s.uploaderCaption2Key)}
                    uploaderDescription2={t(s.uploaderDescription2Key)}
                    uploaderCaption3={t(s.uploaderCaption3Key)}
                    uploaderDescription3={t(s.uploaderDescription3Key)}
                    uploaderCaption4={t(s.uploaderCaption4Key)}
                    uploaderDescription4={t(s.uploaderDescription4Key)}
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

export default withToolState(FreeGenerationPage, 'free-generation');
