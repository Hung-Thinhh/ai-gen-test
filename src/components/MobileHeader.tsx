/**
 * Mobile Header Components
 * - HomeHeader: Logo, app name, model toggle, credits
 * - PageHeader: Back button, page title, search button
 */
import React from 'react';
import { useRouter } from 'next/navigation';
import { SearchIcon } from './icons';

interface HomeHeaderProps {
    modelVersion?: 'v2' | 'v3';
    onModelChange?: (version: 'v2' | 'v3') => void;
    credits?: number; // Unified credits from user/guest balance
}

export const MobileHomeHeader: React.FC<HomeHeaderProps> = ({
    modelVersion = 'v2',
    onModelChange,
    credits = 0
}) => {
    const currentCredits = credits;

    return (
        <header className="mobile-home-header">
            <div className="home-header-left">
                <div className="home-header-logo">
                    <img src="/img/logo_site.webp" alt="AI Creator" className="logo-img" />
                </div>
                <div className="home-header-text">
                    <h1 className="home-header-title">Duky AI</h1>
                    <p className="home-header-subtitle">Tạo ảnh bằng AI</p>
                </div>
            </div>
            <div className="home-header-right">
                {/* Model Version Toggle */}
                <div className="model-toggle-mini">
                    <button
                        onClick={() => onModelChange?.('v2')}
                        className={`model-btn ${modelVersion === 'v2' ? 'active' : ''}`}
                    >
                        v2
                    </button>
                    <button
                        onClick={() => onModelChange?.('v3')}
                        className={`model-btn ${modelVersion === 'v3' ? 'active' : ''}`}
                    >
                        v3
                    </button>
                </div>
                {/* Credits Display */}
                <div className="credits-badge">
                    <span className="credits-icon">💰</span>
                    <span className="credits-count">{credits.toLocaleString('vi-VN')}</span>
                </div>
            </div>
        </header>
    );
};

interface PageHeaderProps {
    title: string;
    onBack?: () => void;
    onSearch?: () => void;
    onSettings?: () => void;
    showSearch?: boolean;
    showSettings?: boolean;
}

export const MobilePageHeader: React.FC<PageHeaderProps> = ({
    title,
    onBack,
    onSearch,
    onSettings,
    showSearch = true,
    showSettings = false
}) => {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <header className="mobile-page-header">
            <button className="page-header-back" onClick={handleBack} aria-label="Go back">
                <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <h1 className="page-header-title">{title}</h1>
            {showSettings ? (
                <button className="page-header-search" onClick={onSettings} aria-label="Settings">
                    <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            ) : showSearch && (
                <button className="page-header-search" onClick={onSearch} aria-label="Search">
                    <SearchIcon className="search-icon" />
                </button>
            )}
        </header>
    );
};

export default MobilePageHeader;
