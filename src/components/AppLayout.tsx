"use client";

import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { cn } from '../lib/utils';
import Sidebar from './Sidebar';
import LeonardoHeader from './LeonardoHeader';
import AppToolbar from './AppToolbar';
import Footer from './Footer';
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
    HomeIcon, SparklesIcon, GalleryIcon, GridSquaresIcon, PlaceholderPersonIcon, LoadingSpinnerIcon, LayerComposerIcon,
    CameraSparklesIcon
} from './icons';
import { useIsMobile } from '../utils/mobileUtils';
import { MobilePageHeader } from './MobileHeader';

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
        closeStoryboardingModal,
        isLoginModalOpen,
        closeLoginModal,
        t,
        language,
        modelVersion,
        v2UsageCount,
        v3UsageCount,
        handleModelVersionChange,
        guestCredits,
        userCredits,
        user,
        isLoggedIn
    } = useAppControls();

    const { imageToEdit, closeImageEditor } = useImageEditor();
    const { isLoading, loginGoogle } = useAuth();
    const isMobile = useIsMobile();

    // DEBUG AUTH STATE IN UI
    useEffect(() => {
        console.log('🖥️ [AppLayout] Rendered. isLoggedIn:', isLoggedIn, 'User:', user?.email, 'isLoading:', isLoading);
    }, [isLoggedIn, user, isLoading]);

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
                    const showModelSelector = isTool;

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

                {/* Model Version Selector (Desktop) - Only show in Tools */}
                {settings?.apps.some((app: AppConfig) => app.id === currentView.viewId) && (
                    <div className={cn(
                        "fixed z-40 gap-4", // Increased z-index to be above content
                        "hidden md:flex md:top-[80px] md:left-8 md:flex-row", // Positioned below header (top-20/80px) and left aligned
                        "top-4 right-2 flex-row"
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
                                Model V2
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
                                Model V3
                            </button>
                        </div>

                        {/* Credits Display - Optional: Hide if duplication is annoying, but kept for now as per previous logic */}
                        {/* <div className="themed-card backdrop-blur-sm rounded-full px-3 py-1 text-xs flex items-center gap-1 border border-white/10 shadow-lg">
                            <svg className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                            </svg>
                            <span className="font-bold text-orange-400">
                                {isLoggedIn ? userCredits.toLocaleString('vi-VN') : guestCredits}
                            </span>
                            <span className="text-neutral-400">credits</span>
                        </div> */}
                    </div>
                )}

                {/* AppToolbar Removed as requested */}

                <div className={cn(
                    "relative z-10 w-full flex-1 flex flex-col md:pt-16",
                    currentView?.viewId !== 'overview' && currentView?.viewId !== 'home' && "pt-16"
                )}>
                    <div className="flex-1 w-full flex flex-col">
                        {children}
                    </div>
                    {!isMobile && <Footer />}
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
