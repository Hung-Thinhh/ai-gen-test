/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useSidebar } from '../contexts/SidebarContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAppControls, useAuth, useImageEditor } from './uiUtils';
import {
    HomeIcon,
    SparklesIcon,
    EditorIcon,
    StoryboardIcon,
    ToolIcon,
    BookmarkIcon,
    GalleryIcon,

    GlobeIcon,
    SettingsIcon,
    LogoutIcon,
    ChevronRightIcon,
    DownArrowIcon,
    BeforeAfterIcon,
    LayoutIcon,
    AppCoverIcon,
    PlaceholderPersonIcon,
    BrushIcon
} from './icons';

interface NavItem {
    id: string;
    label: string;
    icon: React.FC<any>;
    href?: string; // Add href for links
    action?: () => void;
    children?: NavItem[];
}

const Sidebar: React.FC = () => {
    const router = useRouter();
    const { setActivePage, expandedSections, toggleSection } = useSidebar();
    const { handleGoHome, handleOpenGallery, openLayerComposer, openStoryboardingModal, t, handleSelectApp, language, handleLanguageChange, navigateTo, addImagesToGallery, openImageLayoutModal, openBeforeAfterModal, openAppCoverCreatorModal } = useAppControls();
    const { isLoggedIn, user, loginGoogle, logout } = useAuth();
    const { theme } = useTheme();
    const { openEmptyImageEditor } = useImageEditor();
    const pathname = usePathname();

    // Derive active page from current URL path
    const activePage = useMemo(() => {
        const path = pathname || '/';

        // Exact matches first
        if (path === '/' || path === '/overview') return 'overview';
        if (path === '/storyboarding') return 'storyboard';
        if (path === '/prompt-library') return 'prompts';
        if (path === '/gallery') return 'gallery';
        if (path === '/history') return 'history';

        // Extract first segment for pattern matching
        const segments = path.split('/').filter(Boolean);
        const firstSegment = segments[0];

        // /tool/* routes map to generators
        if (firstSegment === 'tool') return 'generators';
        if (firstSegment === 'studio') return 'studio';

        return 'overview'; // Default
    }, [pathname]);

    // Navigation structure
    const navItems: NavItem[] = [
        {
            id: 'overview',
            label: t('sidebar_overview'),
            icon: HomeIcon,
            href: '/',
            action: () => {
                setActivePage('overview');
                handleGoHome();
            },
        },
        {
            id: 'generators',
            label: t('sidebar_generators'),
            icon: SparklesIcon,
            href: '/tool',
            action: () => {
                setActivePage('generators');
                navigateTo('generators');
            },
        },
        {
            id: 'studio',
            label: 'Studio',
            icon: BrushIcon,
            href: '/studio',
            action: () => {
                setActivePage('studio');
                navigateTo('studio');
            }
        },
        {
            id: 'editor',
            label: t('sidebar_editor'),
            icon: EditorIcon,
            action: () => {
                setActivePage('editor');
                openEmptyImageEditor((newUrl) => {
                    addImagesToGallery([newUrl]);
                });
            },
        },
        {
            id: 'storyboard',
            label: t('sidebar_storyboard'),
            icon: StoryboardIcon,
            href: '/storyboarding',
            action: () => {
                setActivePage('storyboard');
                navigateTo('storyboarding');
            },
        },
        {
            id: 'tools',
            label: t('sidebar_tools'),
            icon: ToolIcon,
            children: [
                {
                    id: 'before-after',
                    label: t('sidebar_beforeAfter'),
                    icon: BeforeAfterIcon,
                    action: () => {
                        setActivePage('before-after');
                        openBeforeAfterModal();
                    },
                },
                {
                    id: 'image-layout',
                    label: t('sidebar_imageLayout'),
                    icon: LayoutIcon,
                    action: () => {
                        setActivePage('image-layout');
                        openImageLayoutModal();
                    },
                },
                {
                    id: 'app-cover',
                    label: t('sidebar_appCover'),
                    icon: AppCoverIcon,
                    action: () => {
                        setActivePage('app-cover');
                        openAppCoverCreatorModal();
                    },
                },
            ],
        },
        {
            id: 'prompts',
            label: t('sidebar_prompts'),
            icon: BookmarkIcon,
            href: '/prompt-library',
            action: () => {
                setActivePage('prompts');
                navigateTo('prompt-library');
            },
        },
        {
            id: 'gallery',
            label: t('sidebar_gallery'),
            icon: GalleryIcon,
            href: '/gallery',
            action: () => {
                setActivePage('gallery');
                navigateTo('gallery');
            },
        },


    ];

    const handleNavClick = (item: NavItem) => {
        if (item.children) {
            toggleSection(item.id);
        } else {
            setActivePage(item.id);
            // Only call action if there's NO href (Link handles navigation for items with href)
            if (!item.href && item.action) {
                item.action();
            }
        }
    };

    const handleLoginClick = async () => {
        try {
            await loginGoogle();
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    const handleLogoutClick = async () => {
        try {
            await logout();
            console.log('Logout successful');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <aside className="sidebar fixed left-0 top-0 h-screen w-64 themed-card backdrop-blur-xl flex flex-col z-50 overflow-hidden">
            {/* Logo */}
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                <div className="flex items-center gap-3">
                    <img src="/img/logo_site.webp" alt="Duky AI" className="w-10 h-10 rounded-lg" />
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold themed-text">Duky AI</h1>
                        <p className="text-xs themed-text-tertiary">Tạo ảnh bằng AI</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
                {navItems.map((item) => (
                    <div key={item.id} className="mb-1">
                        {item.href ? (
                            <Link
                                href={item.href}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleNavClick(item);
                                    if (item.href) router.push(item.href);
                                }}
                                className={cn(
                                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                    activePage === item.id
                                        ? 'themed-text shadow-lg'
                                        : 'themed-text-secondary hover:themed-text'
                                )}
                                style={activePage === item.id ? {
                                    backgroundColor: 'var(--accent-primary)',
                                    color: theme === 'dark' ? '#0a0a0a' : '#ffffff',
                                    boxShadow: 'var(--shadow-glow)'
                                } : {}}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                                <span className="flex-1 text-left">{item.label}</span>
                                {item.children && (
                                    <motion.div
                                        animate={{ rotate: expandedSections.has(item.id) ? 90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronRightIcon className="w-4 h-4" strokeWidth={2.5} />
                                    </motion.div>
                                )}
                            </Link>
                        ) : (
                            <button
                                onClick={() => handleNavClick(item)}
                                className={cn(
                                    'w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                    activePage === item.id
                                        ? 'themed-text shadow-lg'
                                        : 'themed-text-secondary hover:themed-text'
                                )}
                                style={activePage === item.id ? {
                                    backgroundColor: 'var(--accent-primary)',
                                    color: theme === 'dark' ? '#0a0a0a' : '#ffffff',
                                    boxShadow: 'var(--shadow-glow)'
                                } : {}}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                                <span className="flex-1 text-left">{item.label}</span>
                                {item.children && (
                                    <motion.div
                                        animate={{ rotate: expandedSections.has(item.id) ? 90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronRightIcon className="w-4 h-4" strokeWidth={2.5} />
                                    </motion.div>
                                )}
                            </button>
                        )}

                        {/* Submenu */}
                        <AnimatePresence>
                            {item.children && expandedSections.has(item.id) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden ml-3 mt-1"
                                >
                                    {item.children.map((child) => (
                                        <button
                                            key={child.id}
                                            onClick={() => {
                                                setActivePage(child.id);
                                                if (child.action) {
                                                    child.action();
                                                }
                                            }}
                                            className={cn(
                                                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                                                activePage === child.id
                                                    ? 'themed-text font-medium'
                                                    : 'themed-text-tertiary hover:themed-text-secondary'
                                            )}
                                            style={activePage === child.id ? {
                                                backgroundColor: theme === 'dark' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.2)',
                                                color: 'var(--accent-primary)'
                                            } : {}}
                                        >
                                            {child.icon && <child.icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />}
                                            <span className="flex-1 text-left truncate">{child.label}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </nav>

            {/* User Section */}
            <div className="border-t p-4" style={{ borderColor: 'var(--border-primary)' }}>
                {isLoggedIn && user ? (
                    <div className="flex items-center gap-3 mb-4">
                        <img
                            src={user?.user_metadata?.avatar_url || '/default-avatar.png'}
                            alt={user?.user_metadata?.full_name || user?.email || 'User'}
                            className="w-10 h-10 rounded-full"
                            style={{ border: '2px solid var(--border-glow)' }}
                        />
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium themed-text truncate">
                                {user?.user_metadata?.full_name || user?.email || 'User'}
                            </p>
                            <p className="text-xs themed-text-tertiary">
                                {t('sidebar_generations') || 'Số lần tạo'}: <span className="font-semibold" style={{ color: 'var(--accent-primary)' }}>0</span>
                            </p>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={handleLoginClick}
                        className="w-full flex cursor-pointer items-center justify-center gap-2 bg-white hover:opacity-80 text-gray-800 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors mb-4"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>{t('sidebar_login') || 'Đăng nhập'}</span>
                    </button>
                )}

                {/* Bottom Controls */}
                <div className="flex items-center justify-between gap-2">
                    <button
                        onClick={() => handleLanguageChange(language === 'vi' ? 'en' : 'vi')}
                        className="flex-1 cursor-pointer bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] flex items-center justify-center gap-2 px-3 py-2 rounded-lg themed-text-secondary transition-all hover:themed-text hover:bg-black"
                        title={`${t('sidebar_language') || 'Ngôn ngữ'}: ${language === 'vi' ? 'VI' : 'EN'}`}
                    >
                        <GlobeIcon className="w-5 h-5" strokeWidth={2} />
                        <span className="text-xs font-semibold">{language === 'vi' ? 'VI' : 'EN'}</span>
                    </button>

                    <button
                        onClick={() => {
                            setActivePage('settings');
                            navigateTo('settings');
                            router.push('/settings');
                        }}
                        className="flex-1 cursor-pointer bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] flex items-center justify-center gap-2 px-3 py-2 rounded-lg themed-text-secondary transition-all hover:themed-text"
                        title={t('sidebar_settings') || 'Cài đặt'}
                    >
                        <SettingsIcon className="w-5 h-5" strokeWidth={2} />
                    </button>

                    {isLoggedIn && (
                        <button
                            onClick={handleLogoutClick}
                            className="flex-1 bg-[rgba(248,113,113,0.1)] cursor-pointer hover:bg-[rgba(248,113,113,0.2)] flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all"
                            style={{
                                color: '#f87171'
                            }}
                            title={t('sidebar_logout') || 'Đăng xuất'}
                        >
                            <LogoutIcon className="w-5 h-5" strokeWidth={2} />
                        </button>
                    )}
                </div>
            </div>

            {/* Custom Scrollbar Styles */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </aside>
    );
};

export default Sidebar;
