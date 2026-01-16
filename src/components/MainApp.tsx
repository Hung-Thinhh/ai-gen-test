/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
"use client";

import React, { useEffect, Suspense, lazy, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

// Sidebar and Contexts are now provided by parent Providers component
import Sidebar from './Sidebar';
import Home from './Home';
import Overview from './Overview';
import { PromptLibrary } from './PromptLibrary';
import SearchModal from './SearchModal';
import GalleryModal from './GalleryModal';
import AppToolbar from './AppToolbar';
import Footer from './Footer';
import LoginScreen from './LoginScreen';
import UserStatus from './UserStatus';
import LanguageSwitcher from './LanguageSwitcher';

import { ImageEditorModal } from './ImageEditorModal';
// FIX: Import LayerComposerModal directly to break circular dependency.
import { StoryboardingInline } from './StoryboardingInline';
import { GalleryInline } from './GalleryInline';

import {
    renderSmartlyWrappedTitle,
    useImageEditor,
    useAppControls,
    ImageLayoutModal,
    BeforeAfterModal,
    AppCoverCreatorModal,
    useAuth,
    createThumbnailDataUrl,
    type AppConfig,
    type GenerationHistoryEntry,
    type ImageResolution
} from './uiUtils';
import { type IDPhotoCreatorState } from './uiTypes';
import { LoadingSpinnerIcon, HomeIcon, SparklesIcon, GalleryIcon, GridSquaresIcon, PlaceholderPersonIcon } from './icons';
import { BottomNavigation } from './BottomNavigation';
import { MobilePageHeader } from './MobileHeader';
import { useIsMobile } from '../utils/mobileUtils';
import { setGlobalModelConfig } from '../services/gemini/baseService';
// Removed react-router-dom imports

// Lazy load app components for code splitting
const ArchitectureIdeator = lazy(() => import('./ArchitectureIdeator'));
const AvatarCreator = lazy(() => import('./AvatarCreator'));
const BabyPhotoCreator = lazy(() => import('./BabyPhotoCreator'));
const BeautyCreator = lazy(() => import('./BeautyCreator'));
const MidAutumnCreator = lazy(() => import('./MidAutumnCreator'));
const EntrepreneurCreator = lazy(() => import('./EntrepreneurCreator'));
const DressTheModel = lazy(() => import('./DressTheModel'));
const PhotoRestoration = lazy(() => import('./PhotoRestoration'));
const SwapStyle = lazy(() => import('./SwapStyle'));
const FreeGeneration = lazy(() => import('./FreeGeneration'));
const ToyModelCreator = lazy(() => import('./ToyModelCreator'));
const ImageInterpolation = lazy(() => import('./ImageInterpolation'));

// NEW: Missing tool components
const FaceSwap = lazy(() => import('./FaceSwap'));
const PhotoBooth = lazy(() => import('./PhotoBooth'));
const CloneEffect = lazy(() => import('./CloneEffect'));
const ColorPaletteSwap = lazy(() => import('./ColorPaletteSwap'));
const ObjectRemover = lazy(() => import('./ObjectRemover'));
const Inpainter = lazy(() => import('./Inpainter'));
const OutfitExtractor = lazy(() => import('./OutfitExtractor'));
const ProductMockupGenerator = lazy(() => import('./ProductMockupGenerator'));
const TypographicIllustrator = lazy(() => import('./TypographicIllustrator'));
const ConceptStudio = lazy(() => import('./ConceptStudio'));
const PortraitGenerator = lazy(() => import('./PortraitGenerator'));
const Photoshoot = lazy(() => import('./Photoshoot'));
const StudioPhotoshoot = lazy(() => import('./StudioPhotoshoot'));
const ProductSceneGenerator = lazy(() => import('./ProductSceneGenerator'));
const PoseAnimator = lazy(() => import('./PoseAnimator'));
const PosterCreator = lazy(() => import('./PosterCreator'));
const MilkTeaPosterWrapper = lazy(() => import('./MilkTeaPosterWrapper'));
const UserProfile = lazy(() => import('./UserProfile'));
const Settings = lazy(() => import('./Settings'));
const Pricing = lazy(() => import('./Pricing'));
const IDPhotoCreator = lazy(() => import('./IDPhotoCreator'));
const KhmerPhotoMerge = lazy(() => import('./KhmerPhotoMerge'));
const NotFound = lazy(() => import('./NotFound'));


const AppLoadingFallback = () => (
    <div className="w-full h-full flex items-center justify-center">
        <LoadingSpinnerIcon className="animate-spin h-10 w-10 text-yellow-400" />
    </div>
);

const AppComponents: Record<string, any> = {
    'architecture-ideator': { Component: ArchitectureIdeator, settingsKey: 'architectureIdeator', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), uploaderCaption: t(s.uploaderCaptionKey), uploaderDescription: t(s.uploaderDescriptionKey) }) },
    'avatar-creator': { Component: AvatarCreator, settingsKey: 'avatarCreator', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), uploaderCaption: t(s.uploaderCaptionKey), uploaderDescription: t(s.uploaderDescriptionKey), uploaderCaptionStyle: t(s.uploaderCaptionStyleKey), uploaderDescriptionStyle: t(s.uploaderDescriptionStyleKey) }) },
    'baby-photo-creator': { Component: BabyPhotoCreator, settingsKey: 'babyPhotoCreator', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), uploaderCaption: t(s.uploaderCaptionKey), uploaderDescription: t(s.uploaderDescriptionKey), uploaderCaptionStyle: t(s.uploaderCaptionStyleKey), uploaderDescriptionStyle: t(s.uploaderDescriptionStyleKey) }) },
    'beauty-creator': { Component: BeautyCreator, settingsKey: 'beautyCreator', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), minIdeas: s.minIdeas, maxIdeas: s.maxIdeas, uploaderCaption: t(s.uploaderCaptionKey), uploaderDescription: t(s.uploaderDescriptionKey), uploaderCaptionStyle: t(s.uploaderCaptionStyleKey), uploaderDescriptionStyle: t(s.uploaderDescriptionStyleKey) }) },
    'mid-autumn-creator': { Component: MidAutumnCreator, settingsKey: 'midAutumnCreator', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), uploaderCaption: t(s.uploaderCaptionKey), uploaderDescription: t(s.uploaderDescriptionKey), uploaderCaptionStyle: t(s.uploaderCaptionStyleKey), uploaderDescriptionStyle: t(s.uploaderDescriptionStyleKey) }) },
    'entrepreneur-creator': { Component: EntrepreneurCreator, settingsKey: 'entrepreneurCreator', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), uploaderCaption: t(s.uploaderCaptionKey), uploaderDescription: t(s.uploaderDescriptionKey), uploaderCaptionStyle: t(s.uploaderCaptionStyleKey), uploaderDescriptionStyle: t(s.uploaderDescriptionStyleKey) }) },
    'dress-the-model': { Component: DressTheModel, settingsKey: 'dressTheModel', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), uploaderCaptionModel: t(s.uploaderCaptionModelKey), uploaderDescriptionModel: t(s.uploaderDescriptionModelKey), uploaderCaptionClothing: t(s.uploaderCaptionClothingKey), uploaderDescriptionClothing: t(s.uploaderDescriptionClothingKey) }) },
    'photo-restoration': { Component: PhotoRestoration, settingsKey: 'photoRestoration', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), uploaderCaption: t(s.uploaderCaptionKey), uploaderDescription: t(s.uploaderDescriptionKey) }) },
    'swap-style': { Component: SwapStyle, settingsKey: 'swapStyle', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), uploaderCaptionContent: t(s.uploaderCaptionContentKey), uploaderDescriptionContent: t(s.uploaderDescriptionContentKey), uploaderCaptionStyle: t(s.uploaderCaptionStyleKey), uploaderDescriptionStyle: t(s.uploaderDescriptionStyleKey) }) },
    'free-generation': { Component: FreeGeneration, settingsKey: 'freeGeneration', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), uploaderCaption1: t(s.uploaderCaption1Key), uploaderDescription1: t(s.uploaderDescription1Key), uploaderCaption2: t(s.uploaderCaption2Key), uploaderDescription2: t(s.uploaderDescription2Key), uploaderCaption3: t(s.uploaderCaption3Key), uploaderDescription3: t(s.uploaderDescription3Key), uploaderCaption4: t(s.uploaderCaption4Key), uploaderDescription4: t(s.uploaderDescription4Key) }) },
    'toy-model-creator': { Component: ToyModelCreator, settingsKey: 'toyModelCreator', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), uploaderCaption: t(s.uploaderCaptionKey), uploaderDescription: t(s.uploaderDescriptionKey) }) },
    'image-interpolation': { Component: ImageInterpolation, settingsKey: 'imageInterpolation', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), uploaderCaptionInput: t(s.uploaderCaptionInputKey), uploaderDescriptionInput: t(s.uploaderDescriptionInputKey), uploaderCaptionOutput: t(s.uploaderCaptionOutputKey), uploaderDescriptionOutput: t(s.uploaderDescriptionOutputKey), uploaderCaptionReference: t(s.uploaderCaptionReferenceKey), uploaderDescriptionReference: t(s.uploaderDescriptionReferenceKey) }) },
    // NEW: Previously missing tools - now with proper settings
    'face-swap': { Component: FaceSwap, settingsKey: 'faceSwap', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), useSmartTitleWrapping: s.useSmartTitleWrapping, smartTitleWrapWords: s.smartTitleWrapWords, uploaderCaptionSource: t(s.uploaderCaptionSourceKey), uploaderDescriptionSource: t(s.uploaderDescriptionSourceKey), uploaderCaptionFace: t(s.uploaderCaptionFaceKey), uploaderDescriptionFace: t(s.uploaderDescriptionFaceKey) }) },
    'photo-booth': { Component: PhotoBooth, settingsKey: 'photoBooth', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), useSmartTitleWrapping: s.useSmartTitleWrapping, smartTitleWrapWords: s.smartTitleWrapWords, uploaderCaption: t(s.uploaderCaptionKey), uploaderDescription: t(s.uploaderDescriptionKey) }) },
    'clone-effect': { Component: CloneEffect, settingsKey: 'cloneEffect', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), useSmartTitleWrapping: s.useSmartTitleWrapping, smartTitleWrapWords: s.smartTitleWrapWords, uploaderCaption: t(s.uploaderCaptionKey), uploaderDescription: t(s.uploaderDescriptionKey) }) },
    'color-palette-swap': { Component: ColorPaletteSwap, settingsKey: 'colorPaletteSwap', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), useSmartTitleWrapping: s.useSmartTitleWrapping, smartTitleWrapWords: s.smartTitleWrapWords, uploaderCaptionSource: t(s.uploaderCaptionSourceKey), uploaderDescriptionSource: t(s.uploaderDescriptionSourceKey), uploaderCaptionPalette: t(s.uploaderCaptionPaletteKey), uploaderDescriptionPalette: t(s.uploaderDescriptionPaletteKey) }) },
    'object-remover': { Component: ObjectRemover, settingsKey: 'objectRemover', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), useSmartTitleWrapping: s.useSmartTitleWrapping, smartTitleWrapWords: s.smartTitleWrapWords, uploaderCaption: t(s.uploaderCaptionKey), uploaderDescription: t(s.uploaderDescriptionKey) }) },
    'inpainter': { Component: Inpainter, settingsKey: 'inpainter', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), useSmartTitleWrapping: s.useSmartTitleWrapping, smartTitleWrapWords: s.smartTitleWrapWords, uploaderCaption: t(s.uploaderCaptionKey), uploaderDescription: t(s.uploaderDescriptionKey) }) },
    'outfit-extractor': { Component: OutfitExtractor, settingsKey: 'outfitExtractor', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), useSmartTitleWrapping: s.useSmartTitleWrapping, smartTitleWrapWords: s.smartTitleWrapWords, uploaderCaption: t(s.uploaderCaptionKey), uploaderDescription: t(s.uploaderDescriptionKey) }) },
    'product-mockup': { Component: ProductMockupGenerator, settingsKey: 'productMockup', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), useSmartTitleWrapping: s.useSmartTitleWrapping, smartTitleWrapWords: s.smartTitleWrapWords, uploaderCaptionLogo: t(s.uploaderCaptionLogoKey), uploaderDescriptionLogo: t(s.uploaderDescriptionLogoKey), uploaderCaptionProduct: t(s.uploaderCaptionProductKey), uploaderDescriptionProduct: t(s.uploaderDescriptionProductKey) }) },
    'typographic-illustrator': { Component: TypographicIllustrator, settingsKey: 'typographicIllustrator', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), useSmartTitleWrapping: s.useSmartTitleWrapping, smartTitleWrapWords: s.smartTitleWrapWords }) },
    'concept-studio': { Component: ConceptStudio, settingsKey: 'conceptStudio', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), useSmartTitleWrapping: s.useSmartTitleWrapping, smartTitleWrapWords: s.smartTitleWrapWords, uploaderCaption: t(s.uploaderCaptionKey), uploaderDescription: t(s.uploaderDescriptionKey) }) },
    'portrait-generator': { Component: PortraitGenerator, settingsKey: 'portraitGenerator', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), useSmartTitleWrapping: s.useSmartTitleWrapping, smartTitleWrapWords: s.smartTitleWrapWords }) },
    'photoshoot': { Component: Photoshoot, settingsKey: 'photoshoot', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), useSmartTitleWrapping: s.useSmartTitleWrapping, smartTitleWrapWords: s.smartTitleWrapWords, uploaderCaptionPerson: t(s.uploaderCaptionPersonKey), uploaderDescriptionPerson: t(s.uploaderDescriptionPersonKey), uploaderCaptionOutfit: t(s.uploaderCaptionOutfitKey), uploaderDescriptionOutfit: t(s.uploaderDescriptionOutfitKey) }) },
    'studio-photoshoot': { Component: StudioPhotoshoot, settingsKey: 'studioPhotoshoot', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), useSmartTitleWrapping: s.useSmartTitleWrapping, smartTitleWrapWords: s.smartTitleWrapWords, uploaderCaption: t(s.uploaderCaptionKey), uploaderDescription: t(s.uploaderDescriptionKey) }) },
    'product-scene': { Component: ProductSceneGenerator, settingsKey: 'productScene', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), useSmartTitleWrapping: s.useSmartTitleWrapping, smartTitleWrapWords: s.smartTitleWrapWords, uploaderCaption: t(s.uploaderCaptionKey), uploaderDescription: t(s.uploaderDescriptionKey) }) },
    'pose-animator': { Component: PoseAnimator, settingsKey: 'poseAnimator', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), useSmartTitleWrapping: s.useSmartTitleWrapping, smartTitleWrapWords: s.smartTitleWrapWords, uploaderCaptionPose: t(s.uploaderCaptionPoseKey), uploaderDescriptionPose: t(s.uploaderDescriptionPoseKey), uploaderCaptionTarget: t(s.uploaderCaptionTargetKey), uploaderDescriptionTarget: t(s.uploaderDescriptionTargetKey) }) },
    'poster-creator': { Component: PosterCreator, settingsKey: 'posterCreator', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), useSmartTitleWrapping: s.useSmartTitleWrapping, smartTitleWrapWords: s.smartTitleWrapWords, uploaderCaption: t(s.uploaderCaptionKey), uploaderDescription: t(s.uploaderDescriptionKey) }) },
    'milk-tea-poster': { Component: MilkTeaPosterWrapper, settingsKey: 'milkTeaPoster', props: (s: any, t: any) => ({}) },
    'khmer-photo-merge': { Component: KhmerPhotoMerge, settingsKey: 'khmerPhotoMerge', props: (s: any, t: any) => ({ mainTitle: t(s.mainTitleKey), subtitle: t(s.subtitleKey), uploaderCaption: t(s.uploaderCaptionKey), uploaderDescription: t(s.uploaderDescriptionKey), useSmartTitleWrapping: s.useSmartTitleWrapping, smartTitleWrapWords: s.smartTitleWrapWords }) },
};



function MainApp() {
    const {
        currentView,
        settings,
        imageGallery,
        isSearchOpen,
        isGalleryOpen,
        isInfoOpen,

        isImageLayoutModalOpen,
        isBeforeAfterModalOpen,
        isAppCoverCreatorModalOpen,
        isStoryboardingModalMounted,
        isStoryboardingModalVisible,
        isLayerComposerMounted,
        isLayerComposerVisible,
        handleSelectApp,
        handleStateChange,
        addImagesToGallery,
        addGenerationToHistory,
        handleResetApp,
        handleGoBack,
        handleGoHome,
        handleCloseSearch,
        handleCloseGallery,
        handleOpenInfo,
        handleCloseInfo,

        closeImageLayoutModal,
        closeBeforeAfterModal,
        closeAppCoverCreatorModal,
        closeStoryboardingModal,
        hideStoryboardingModal,
        closeLayerComposer,
        hideLayerComposer,
        isLoginModalOpen,
        closeLoginModal,
        t,
        language,
        modelVersion,
        imageResolution,
        v2UsageCount,
        v3UsageCount,
        refreshUsageCounts,
        handleModelVersionChange,
        handleResolutionChange,
        logGeneration // IMPORTED FROM CONTEXT
    } = useAppControls();

    const { imageToEdit, closeImageEditor } = useImageEditor();
    const { isLoggedIn, isLoading, currentUser, loginGoogle } = useAuth();
    const isMobile = useIsMobile();

    // Sync global service config when context changes
    useEffect(() => {
        setGlobalModelConfig({ modelVersion, imageResolution });
    }, [modelVersion, imageResolution]);

    // Handle error parameters from middleware redirects
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const error = params.get('error');

            if (error) {
                switch (error) {
                    case 'login_required':
                        toast.error('Vui lòng đăng nhập để truy cập trang quản trị');
                        break;
                    case 'invalid_session':
                        toast.error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại');
                        break;
                    case 'unauthorized':
                        toast.error('Bạn không có quyền truy cập trang này');
                        break;
                    case 'server_error':
                        toast.error('Lỗi hệ thống. Vui lòng thử lại sau');
                        break;
                }

                // Clean up URL
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    }, []);




    useEffect(() => {
        const isAnyModalOpen = isSearchOpen ||
            isGalleryOpen ||

            isImageLayoutModalOpen ||
            isBeforeAfterModalOpen ||
            isAppCoverCreatorModalOpen ||
            isStoryboardingModalVisible ||
            isLayerComposerVisible ||
            !!imageToEdit;

        if (isAnyModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        // Cleanup function to ensure overflow is reset when the component unmounts
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isSearchOpen, isGalleryOpen, isImageLayoutModalOpen, isBeforeAfterModalOpen, isAppCoverCreatorModalOpen, isStoryboardingModalVisible, isLayerComposerVisible, imageToEdit]);

    const renderContent = () => {
        if (!settings) return null; // Wait for settings to load

        const commonProps = {
            addImagesToGallery,
            onStateChange: handleStateChange,
            onReset: handleResetApp,
            onGoBack: handleGoBack,
            logGeneration,
        };

        const motionProps = {
            className: "w-full h-full flex-1 min-h-screen",
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -20 },
            transition: { duration: 0.4 },
        };

        // Overview page (home/landing)
        if (currentView.viewId === 'overview' || currentView.viewId === 'home') {
            return <Overview />;
        }

        // Generators page (app selection grid)
        if (currentView.viewId === 'generators') {
            return (
                <Home
                    key="generators-grid"
                    onSelectApp={handleSelectApp}
                    title={renderSmartlyWrappedTitle(t(settings.home.mainTitleKey), settings.home.useSmartTitleWrapping, settings.home.smartTitleWrapWords)}
                    subtitle={t(settings.home.subtitleKey)}
                    apps={settings.apps.map((app: AppConfig) => ({ ...app, title: t(app.titleKey), description: t(app.descriptionKey) }))}
                />
            );
        }

        // Storyboarding
        if (currentView.viewId === 'storyboarding') {
            return <StoryboardingInline onClose={handleGoHome} />;
        }

        // Gallery
        if (currentView.viewId === 'gallery') {
            return <GalleryInline onClose={handleGoHome} images={imageGallery} />;
        }



        // Prompt Library
        if (currentView.viewId === 'prompt-library') {
            return <PromptLibrary onClose={handleGoHome} />;
        }

        // Profile
        if (currentView.viewId === 'profile') {
            return <UserProfile
                onClose={handleGoHome}
                onOpenSettings={() => handleSelectApp('settings' as any)}
            />;
        }

        // Settings
        if (currentView.viewId === 'settings') {
            return <Settings onBack={() => handleSelectApp('profile' as any)} />;
        }

        // ID Photo Creator
        if (currentView.viewId === 'id-photo-creator') {
            return (
                <Suspense fallback={<AppLoadingFallback />}>
                    <IDPhotoCreator
                        appState={currentView.state as IDPhotoCreatorState}
                        onStateChange={(newState) => handleStateChange({ ...currentView.state, ...newState })}
                        onBack={handleGoHome}
                    />
                </Suspense>
            );
        }

        // Pricing Page
        if (currentView.viewId === 'pricing') {
            return (
                <div className="container mx-auto py-8 px-4 max-w-8xl">
                    <Pricing />
                </div>
            );
        }

        const appInfo = AppComponents[currentView.viewId];

        if (!appInfo) {
            // Show 404 page for unknown routes
            return <NotFound onClose={handleGoHome} />;
        }

        const { Component, settingsKey, props } = appInfo;
        const appSettings = settings[settingsKey] || {}; // Fallback to empty object if settings missing
        const translatedProps = props(appSettings, t);

        return (
            <Suspense fallback={<AppLoadingFallback />}>
                <motion.div key={currentView.viewId} {...motionProps}>
                    <Component
                        {...appSettings}
                        {...translatedProps}
                        {...commonProps}
                        appState={currentView.state}
                    />
                </motion.div>
            </Suspense>
        );
    };

    if (isLoading) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-neutral-900">
                <LoadingSpinnerIcon className="animate-spin h-10 w-10 text-yellow-400" />
            </div>
        );
    }

    // Blocking login removed to allow Guest Mode
    // if (loginSettings?.enabled && !isLoggedIn) {
    //     return <LoginScreen />;
    // }

    const handleLoginClick = async () => {
        try {
            await loginGoogle();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="w-full h-full">
            <AnimatePresence mode="wait">
                {renderContent()}
            </AnimatePresence>
        </div>
    );
}

export default MainApp;
