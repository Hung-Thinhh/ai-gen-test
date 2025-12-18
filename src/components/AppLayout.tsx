"use client";

import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { cn } from '../lib/utils';
import Sidebar from './Sidebar';
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
import { BottomNavigation } from './BottomNavigation';
import { HomeIcon, SparklesIcon, GalleryIcon, GridSquaresIcon, PlaceholderPersonIcon, LoadingSpinnerIcon } from './icons';
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
        handleModelVersionChange
    } = useAppControls();

    const { imageToEdit, closeImageEditor } = useImageEditor();
    const { isLoading, loginGoogle } = useAuth();
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

            <Sidebar />

            <div className="flex-1 md:ml-64 relative h-full flex flex-col overflow-y-auto overflow-x-hidden">
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
                    return <MobilePageHeader
                        title={pageTitle}
                        showSettings={isProfilePage}
                        showSearch={!isProfilePage}
                        onSettings={() => handleSelectApp('settings' as any)}
                    />;
                })()}

                {/* Model Version Selector (Desktop) - Adjusted position to account for missing Toolbar space if needed, or keep as is */}
                <div className={cn(
                    "fixed z-20 gap-2",
                    "hidden md:flex md:top-4 md:left-72 md:flex-row",
                    "top-4 right-2 flex-row"
                )}>
                    <div className={cn(
                        "flex gap-1 themed-card backdrop-blur-sm rounded-full p-1",
                        "md:flex-row md:text-sm",
                        " text-xs"
                    )}>
                        <button
                            onClick={() => handleModelVersionChange('v2')}
                            className={cn(
                                'rounded-full font-bold transition-colors duration-200',
                                'md:px-3 md:py-2 md:text-xs',
                                'px-2 py-1 text-[10px]',
                                modelVersion === 'v2' ? 'text-white' : 'hover:themed-text-secondary'
                            )}
                            style={modelVersion === 'v2' ? { backgroundColor: 'var(--accent-primary)', color: '#0a0a0a' } : { color: 'var(--text-tertiary)' }}
                        >
                            v2
                        </button>
                        <button
                            onClick={() => handleModelVersionChange('v3')}
                            className={cn(
                                'rounded-full font-bold transition-colors duration-200',
                                'md:px-3 md:py-0.5 md:text-xs',
                                'px-2 py-1 text-[10px]',
                                modelVersion === 'v3' ? 'text-white' : 'hover:themed-text-secondary'
                            )}
                            style={modelVersion === 'v3' ? { backgroundColor: 'var(--accent-primary)', color: '#0a0a0a' } : { color: 'var(--text-tertiary)' }}
                        >
                            v3
                        </button>
                    </div>
                    <div className="themed-card backdrop-blur-sm rounded-full px-3 py-1 text-xs flex items-center ">
                        <span className={cn(
                            "font-medium",
                            modelVersion === 'v2'
                                ? (10 - v2UsageCount) > 5 ? "text-green-500" : (10 - v2UsageCount) > 2 ? "text-yellow-500" : "text-red-500"
                                : (3 - v3UsageCount) > 1 ? "text-green-500" : "text-red-500"
                        )}>
                            {modelVersion === 'v2' ? `${10 - v2UsageCount}/10` : `${3 - v3UsageCount}/3`}
                        </span>
                        <span className="themed-text-tertiary ml-1">uses</span>
                    </div>
                </div>

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
                {isLoginModalOpen && <LoginScreen onClose={closeLoginModal} />}
            </div>

            {isMobile && (
                <BottomNavigation
                    items={[
                        { id: 'overview', label: 'Home', icon: HomeIcon, onClick: handleGoHome },
                        { id: 'prompt-library', label: 'Prompt', icon: GridSquaresIcon, onClick: () => handleSelectApp('prompt-library') },
                        { id: 'generators', label: 'Tools', icon: SparklesIcon, onClick: () => handleSelectApp('generators') },
                        { id: 'gallery', label: 'Gallery', icon: GalleryIcon, onClick: () => handleSelectApp('gallery') },
                        { id: 'profile', label: 'Profile', icon: PlaceholderPersonIcon, onClick: () => handleSelectApp('profile') },
                    ]}
                    activeId={currentView?.viewId}
                />
            )}
        </main>
    );
}
