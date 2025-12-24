/**
 * Mobile Header Components
 * - HomeHeader: Logo, app name, model toggle, credits
 * - PageHeader: Back button, page title, search button
 */
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SearchIcon, LoadingSpinnerIcon } from './icons'; // Ensure LoadingSpinnerIcon is imported or use fallback
import { getAllStudios } from '../services/storageService';

// HomeHeaderProps removed as MobileHomeHeader now shares props structure or uses inline definition in previous step replacement.
// But to be clean, let's keep PageHeaderProps or Update it to include credits if needed.
// Actually, I can just delete HomeHeaderProps.

export const MobileHomeHeader: React.FC<PageHeaderProps> = ({
    credits = 0,
    apps = [],
    onSelectApp
}) => {
    const router = useRouter();
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [studios, setStudios] = useState<any[]>([]);
    const [filteredResults, setFilteredResults] = useState<{ type: 'tool' | 'studio', item: any }[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchStudios = async () => {
            const data = await getAllStudios();
            setStudios(data || []);
        };
        fetchStudios();
    }, []);

    useEffect(() => {
        if (isSearching && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isSearching]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredResults([]);
            return;
        }
        const lowerQuery = searchQuery.toLowerCase();
        const matchedTools = apps.filter(app =>
            (app.title?.toLowerCase().includes(lowerQuery) || app.description?.toLowerCase().includes(lowerQuery))
        ).map(app => ({ type: 'tool' as const, item: app }));
        const matchedStudios = studios.filter(studio =>
            (studio.name?.toLowerCase().includes(lowerQuery) || studio.description?.toLowerCase().includes(lowerQuery))
        ).map(studio => ({ type: 'studio' as const, item: studio }));

        setFilteredResults([...matchedTools, ...matchedStudios]);
    }, [searchQuery, apps, studios]);

    const handleSearchClick = () => {
        setIsSearching(true);
    };

    const handleCloseSearch = () => {
        setIsSearching(false);
        setSearchQuery('');
    };

    const handleResultClick = (result: { type: 'tool' | 'studio', item: any }) => {
        if (result.type === 'tool') {
            if (onSelectApp) onSelectApp(result.item.id);
        } else {
            router.push(`/studio/${result.item.slug}`);
        }
        handleCloseSearch();
    };

    return (
        <header className="mobile-home-header relative">
            <div className="home-header-left">
                {!isSearching && (
                    <>
                        <div className="home-header-logo">
                            <img src="/img/logo_site.webp" alt="AI Creator" className="logo-img" />
                        </div>
                        <div className="home-header-text">
                            <h1 className="home-header-title">Duky AI</h1>
                            <p className="home-header-subtitle">Tạo ảnh bằng AI</p>
                        </div>
                    </>
                )}
            </div>

            {isSearching ? (
                <div className="flex-1 mx-2 flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full bg-neutral-800 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-yellow-500 text-sm"
                        placeholder="Tìm công cụ, studio..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button onClick={handleCloseSearch} className="text-neutral-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ) : (
                <div className="home-header-right">
                    {/* Search Button */}
                    <button className="page-header-search mr-2" onClick={handleSearchClick} aria-label="Search">
                        <SearchIcon className="search-icon" />
                    </button>

                    {/* Credits Display */}
                    <div className="credits-badge">
                        <span className="credits-icon">💰</span>
                        <span className="credits-count">{credits.toLocaleString('vi-VN')}</span>
                    </div>
                </div>
            )}

            {/* LIVE RESULTS DROPDOWN */}
            {isSearching && searchQuery.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-neutral-900 border-t border-neutral-800 shadow-xl max-h-[60vh] overflow-y-auto z-50">
                    {filteredResults.length === 0 ? (
                        <div className="p-4 text-center text-neutral-500 text-sm">Không tìm thấy kết quả</div>
                    ) : (
                        <div className="flex flex-col">
                            {filteredResults.map((res, idx) => (
                                <button
                                    key={`${res.type}-${res.item.id || idx}`}
                                    onClick={() => handleResultClick(res)}
                                    className="flex items-center gap-3 p-3 hover:bg-neutral-800 border-b border-neutral-800 last:border-0 text-left transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800 flex items-center justify-center p-0!">
                                        {res.type === 'tool' ? (
                                            res.item.previewImageUrl ? (
                                                <img src={res.item.previewImageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-yellow-500 text-xl">✨</div>
                                            )
                                        ) : (
                                            res.item.preview_image_url ?
                                                <img src={res.item.preview_image_url} alt="" className="w-full h-full object-cover" /> :
                                                <div className="text-purple-500 text-xl">📷</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm text-neutral-200 truncate">
                                            {res.type === 'tool' ? res.item.title : res.item.name}
                                        </div>
                                        <div className="text-xs text-neutral-500 truncate">
                                            {res.type === 'tool' ? 'Công cụ AI' : 'Studio Chụp Ảnh'}
                                        </div>
                                    </div>
                                    <div className="text-neutral-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
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
    apps?: any[];
    onSelectApp?: (appId: string) => void;
    modelVersion?: 'v2' | 'v3';
    onModelChange?: (version: 'v2' | 'v3') => void;
    credits?: number;
}

export const MobilePageHeader: React.FC<PageHeaderProps> = ({
    title,
    onBack,
    onSearch,
    onSettings,
    showSearch = true,
    showSettings = false,
    apps = [],
    onSelectApp,
    modelVersion,
    onModelChange
}) => {
    const router = useRouter();
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [studios, setStudios] = useState<any[]>([]);
    const [filteredResults, setFilteredResults] = useState<{ type: 'tool' | 'studio', item: any }[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch studios on mount (lazy load implies only when component exists, but maybe better on search open?)
    // To be responsive, let's fetch once.
    useEffect(() => {
        const fetchStudios = async () => {
            const data = await getAllStudios();
            setStudios(data || []);
        };
        fetchStudios();
    }, []);

    // Effect to focus input when search opens
    useEffect(() => {
        if (isSearching && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isSearching]);

    // Filter logic
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredResults([]);
            return;
        }

        const lowerQuery = searchQuery.toLowerCase();

        // Filter Tools
        const matchedTools = apps.filter(app =>
            (app.title?.toLowerCase().includes(lowerQuery) || app.description?.toLowerCase().includes(lowerQuery))
        ).map(app => ({ type: 'tool' as const, item: app }));

        // Filter Studios
        const matchedStudios = studios.filter(studio =>
            (studio.name?.toLowerCase().includes(lowerQuery) || studio.description?.toLowerCase().includes(lowerQuery))
        ).map(studio => ({ type: 'studio' as const, item: studio }));

        setFilteredResults([...matchedTools, ...matchedStudios]);

    }, [searchQuery, apps, studios]);


    const handleBack = () => {
        if (isSearching) {
            setIsSearching(false);
            setSearchQuery('');
            return;
        }

        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    const handleSearchClick = () => {
        setIsSearching(true);
    };

    const handleResultClick = (result: { type: 'tool' | 'studio', item: any }) => {
        if (result.type === 'tool') {
            if (onSelectApp) onSelectApp(result.item.id);
        } else {
            router.push(`/studio/${result.item.slug}`);
        }
        setIsSearching(false);
        setSearchQuery('');
    };

    return (
        <header className="mobile-page-header relative">
            <button className="page-header-back" onClick={handleBack} aria-label="Go back">
                <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {isSearching ? (
                <div className="flex-1 mx-2">
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full bg-neutral-800 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-yellow-500 text-sm"
                        placeholder="Tìm công cụ, studio..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            ) : (
                <>
                    <h1 className="page-header-title truncate flex-1">{title}</h1>

                    {/* Model Selector in Page Header */}
                    {onModelChange && (
                        <div className="model-toggle-mini mr-2 absolute right-2 top-[75px]">
                            <button
                                onClick={() => onModelChange('v2')}
                                className={`model-btn ${modelVersion === 'v2' ? 'active' : ''}`}
                            >
                                v2
                            </button>
                            <button
                                onClick={() => onModelChange('v3')}
                                className={`model-btn ${modelVersion === 'v3' ? 'active' : ''}`}
                            >
                                v3
                            </button>
                        </div>
                    )}
                </>
            )}

            {showSettings ? (
                <button className="page-header-search" onClick={onSettings} aria-label="Settings">
                    <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            ) : showSearch && !isSearching && (
                <button className="page-header-search" onClick={handleSearchClick} aria-label="Search">
                    <SearchIcon className="search-icon" />
                </button>
            )}

            {/* LIVE RESULTS DROPDOWN */}
            {isSearching && searchQuery.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-neutral-900 border-t border-neutral-800 shadow-xl max-h-[60vh] overflow-y-auto z-50">
                    {filteredResults.length === 0 ? (
                        <div className="p-4 text-center text-neutral-500 text-sm">Không tìm thấy kết quả</div>
                    ) : (
                        <div className="flex flex-col">
                            {filteredResults.map((res, idx) => (
                                <button
                                    key={`${res.type}-${res.item.id || idx}`}
                                    onClick={() => handleResultClick(res)}
                                    className="flex items-center gap-3 p-3 hover:bg-neutral-800 border-b border-neutral-800 last:border-0 text-left transition-colors"
                                >
                                    {/* Icon/Image */}
                                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800 flex items-center justify-center p-0!">
                                        {res.type === 'tool' ? (
                                            /* Render Tool Image if available, else generic icon */
                                            res.item.previewImageUrl ? (
                                                <img src={res.item.previewImageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-yellow-500 text-xl">✨</div>
                                            )
                                        ) : (
                                            /* Render Studio Image */
                                            res.item.preview_image_url ?
                                                <img src={res.item.preview_image_url} alt="" className="w-full h-full object-cover" /> :
                                                <div className="text-purple-500 text-xl">📷</div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm text-neutral-200 truncate">
                                            {res.type === 'tool' ? res.item.title : res.item.name}
                                        </div>
                                        <div className="text-xs text-neutral-500 truncate">
                                            {res.type === 'tool' ? 'Công cụ AI' : 'Studio Chụp Ảnh'}
                                            {/* Could add description here too if brief */}
                                        </div>
                                    </div>

                                    <div className="text-neutral-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </header>
    );
};

export default MobilePageHeader;
