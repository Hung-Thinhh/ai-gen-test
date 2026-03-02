"use client";

import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { cn } from '../lib/utils';
import LeonardoHeader from './LeonardoHeader';
import LoginScreen from './LoginScreen';
import SearchModal from './SearchModal';
import { ImageEditorModal } from './ImageEditorModal';
import {
    useAppControls,
    useImageEditor,
    useAuth,
    ImageLayoutModal,
    BeforeAfterModal,
    AppCoverCreatorModal,
    type AppConfig
} from './uiUtils';
import { OutOfCreditsModal } from './OutOfCreditsModal';
import { BottomNavigation } from './BottomNavigation';
import {
    HomeIcon, GalleryIcon, GridSquaresIcon, PlaceholderPersonIcon, LoadingSpinnerIcon,
    CameraSparklesIcon
} from './icons';
import { useIsMobile } from '../utils/mobileUtils';
import { MobilePageHeader } from './MobileHeader';
import { FooterV2 } from './homev2/FooterV2';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const {
        currentView,
        settings,
        isSearchOpen,
        isGalleryOpen,
        isImageLayoutModalOpen,
        isBeforeAfterModalOpen,
        isAppCoverCreatorModalOpen,
        isStoryboardingModalVisible,
        isLayerComposerVisible,
        handleSelectApp,
        handleGoHome,
        handleCloseSearch,
        closeImageLayoutModal,
        closeBeforeAfterModal,
        closeAppCoverCreatorModal,
        isLoginModalOpen,
        closeLoginModal,
        t,
        language,
        modelVersion,
        handleModelVersionChange,
        isLoggedIn
    } = useAppControls();

    const { imageToEdit, closeImageEditor } = useImageEditor();
    const { isLoading } = useAuth();
    const isMobile = useIsMobile();

    // Prevent body scroll when modals are open
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
        return () => { document.body.style.overflow = 'auto'; };
    }, [isSearchOpen, isGalleryOpen, isImageLayoutModalOpen, isBeforeAfterModalOpen, isAppCoverCreatorModalOpen, isStoryboardingModalVisible, isLayerComposerVisible, imageToEdit]);

    if (isLoading) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-neutral-900">
                <LoadingSpinnerIcon className="animate-spin h-10 w-10 text-yellow-400" />
            </div>
        );
    }

    return (
        <main className="themed-bg text-neutral-200 h-screen w-full relative flex overflow-hidden">
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        fontFamily: '"Be Vietnam Pro", sans-serif',
                        background: 'rgba(38, 38, 38, 0.75)',
                        backdropFilter: 'blur(8px)',
                        color: '#E5E5E5',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                    },
                    success: { iconTheme: { primary: '#FBBF24', secondary: '#171717' } },
                    error: { iconTheme: { primary: '#f87171', secondary: '#171717' } },
                }}
            />

            {/* Sidebar - Hidden for Leonardo style */}
            {/* <Sidebar /> */}

            {/* Leonardo Header */}
            <LeonardoHeader />

            {/* Model Version Selector (Desktop) - Only show in Tools */}
            {settings?.apps.some((app: AppConfig) => app.id === currentView.viewId) && currentView.viewId !== 'template-composer' && (
                <div className={cn(
                    "fixed z-50 gap-4 flex md:top-[80px] md:right-8 flex-row top-[100px] right-2"
                )}>
                    <div className={cn(
                        "flex gap-1 themed-card backdrop-blur-md rounded-full p-1 border border-white/10 shadow-lg",
                        "md:flex-row md:text-sm",
                        "text-xs"
                    )}>
                        <button
                            onClick={() => handleModelVersionChange('v2')}
                            className={cn(
                                'rounded-full font-bold transition-all duration-200',
                                'md:px-4 md:py-1.5 md:text-xs',
                                'px-2 py-1 text-[10px]',
                                modelVersion === 'v2' ? 'text-black shadow-md' : 'text-neutral-400 hover:text-white'
                            )}
                            style={modelVersion === 'v2' ? { backgroundColor: '#f97316' } : {}} // Orange-500
                        >
                            <span className="hidden md:inline">Model </span>V2
                        </button>
                        <button
                            onClick={() => handleModelVersionChange('v3')}
                            className={cn(
                                'rounded-full font-bold transition-all duration-200',
                                'md:px-4 md:py-1.5 md:text-xs',
                                'px-2 py-1 text-[10px]',
                                modelVersion === 'v3' ? 'text-black shadow-md' : 'text-neutral-400 hover:text-white'
                            )}
                            style={modelVersion === 'v3' ? { backgroundColor: '#f97316' } : {}} // Orange-500
                        >
                            <span className="hidden md:inline">Model </span>V3
                        </button>
                        <button
                            onClick={() => handleModelVersionChange('pro')}
                            className={cn(
                                'rounded-full font-bold transition-all duration-200',
                                'md:px-4 md:py-1.5 md:text-xs',
                                'px-2 py-1 text-[10px]',
                                modelVersion === 'pro' ? 'text-black shadow-md' : 'text-neutral-400 hover:text-white'
                            )}
                            style={modelVersion === 'pro' ? { backgroundColor: '#f97316' } : {}} // Orange-500
                        >
                            <span className="hidden md:inline">Model </span>Pro
                        </button>
                    </div>
                </div>
            )}

            <div id="main-content-scroll" className="flex-1 relative h-full flex flex-col overflow-y-auto overflow-x-hidden">
                {/* Mobile Page Header */}
                {isMobile && currentView.viewId !== 'overview' && currentView.viewId !== 'home' && (() => {
                    const appConfig = settings?.apps.find((app: AppConfig) => app.id === currentView.viewId);
                    const pageTitle = appConfig ? t(appConfig.titleKey) :
                        currentView.viewId === 'generators' ? (language === 'vi' ? 'Danh sách Công cụ' : 'All Tools') :
                            currentView.viewId === 'gallery' ? (language === 'vi' ? 'Thư viện' : 'Gallery') :
                                currentView.viewId === 'prompt-library' ? (language === 'vi' ? 'Thư viện Prompt' : 'Prompt Library') :
                                    currentView.viewId === 'profile' ? (language === 'vi' ? 'Hồ sơ' : 'Profile') :
                                        currentView.viewId;
                    const isProfilePage = currentView.viewId === 'profile';
                    const isTool = settings?.apps.some((app: AppConfig) => app.id === currentView.viewId);
                    // Determine if we should show the model selector (only in tools, not in lists/libraries)
                    // The user explicitly requested to hide it in: gallery, prompt-library, tool list (generators), studio list.
                    // 'generators' is the tool list. 'studio' might be the studio list view ID (if it exists).
                    // Safer logic: Show ONLY if it matches an app ID.
                    const showModelSelector = isTool && currentView.viewId !== 'template-composer';

                    return <MobilePageHeader
                        title={pageTitle}
                        showSettings={isProfilePage}
                        showSearch={!isProfilePage}
                        onSettings={() => handleSelectApp('settings' as any)}
                        apps={settings ? settings.apps.map((app: AppConfig) => ({ ...app, title: t(app.titleKey), description: t(app.descriptionKey) })) : []}
                        onSelectApp={handleSelectApp}
                        modelVersion={showModelSelector ? modelVersion : undefined}
                        onModelChange={showModelSelector ? handleModelVersionChange : undefined}
                    />;
                })()}

                {/* Mobile Page Header logic handled above */}



                {/* AppToolbar Removed as requested */}

                <div className={cn(
                    "relative z-10 w-full flex-1 flex flex-col md:pt-16",
                    currentView?.viewId !== 'overview' && currentView?.viewId !== 'home' && "pt-16"
                )}>
                    <div className="flex-1 w-full flex flex-col">
                        {children}
                    </div>
                    <FooterV2 />
                </div>

                <SearchModal
                    isOpen={isSearchOpen}
                    onClose={handleCloseSearch}
                    onSelectApp={(appId) => { handleSelectApp(appId); handleCloseSearch(); }}
                    apps={settings ? settings.apps.map((app: AppConfig) => ({ ...app, title: t(app.titleKey), description: t(app.descriptionKey) })) : []}
                />
                <ImageEditorModal imageToEdit={imageToEdit} onClose={closeImageEditor} />
                <ImageLayoutModal isOpen={isImageLayoutModalOpen} onClose={closeImageLayoutModal} />
                <BeforeAfterModal isOpen={isBeforeAfterModalOpen} onClose={closeBeforeAfterModal} />
                <AppCoverCreatorModal isOpen={isAppCoverCreatorModalOpen} onClose={closeAppCoverCreatorModal} />
                <OutOfCreditsModal />
                {isLoginModalOpen && <LoginScreen onClose={closeLoginModal} />}
            </div>

            {isMobile && (
                <BottomNavigation
                    items={[
                        { id: 'overview', label: 'Home', icon: HomeIcon, onClick: handleGoHome, href: '/' },
                        { id: 'prompt-library', label: 'Prompt', icon: GridSquaresIcon, onClick: () => handleSelectApp('prompt-library'), href: '/prompt-library' },
                        { id: 'generators', label: 'Tools', icon: CameraSparklesIcon, onClick: () => handleSelectApp('generators'), href: '/tool' },
                        { id: 'gallery', label: 'Gallery', icon: GalleryIcon, onClick: () => handleSelectApp('gallery'), href: '/gallery' },
                        { id: 'profile', label: 'Profile', icon: PlaceholderPersonIcon, onClick: () => handleSelectApp('profile'), href: '/profile' },
                    ]}
                    activeId={currentView?.viewId}
                />
            )}
        </main>
    );
}
