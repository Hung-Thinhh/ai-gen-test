"use client";

import ProductMockupGenerator from '@/components/ProductMockupGenerator';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';
import { withToolState } from '@/components/hoc/withToolState';

function ProductMockupPage({ appState, onStateChange, onReset, onGoBack }: any) {
    return (
        <ToolPageWrapper toolId="product-mockup" settingsKey="productMockup">
            {({ settings: s, t, addImagesToGallery, logGeneration }) => (
                <ProductMockupGenerator
                    mainTitle={t(s.mainTitleKey)}
                    subtitle={t(s.subtitleKey)}
                    useSmartTitleWrapping={s.useSmartTitleWrapping}
                    smartTitleWrapWords={s.smartTitleWrapWords}
                    uploaderCaptionLogo={t(s.uploaderCaptionLogoKey)}
                    uploaderDescriptionLogo={t(s.uploaderDescriptionLogoKey)}
                    uploaderCaptionProduct={t(s.uploaderCaptionProductKey)}
                    uploaderDescriptionProduct={t(s.uploaderDescriptionProductKey)}
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

export default withToolState(ProductMockupPage, 'product-mockup');
