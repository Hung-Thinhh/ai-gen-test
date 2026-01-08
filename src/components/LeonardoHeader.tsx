'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppControls } from './uiUtils';
import { useAuth } from '../contexts/AuthContext';

export const LeonardoHeader = () => {
    const [scrolled, setScrolled] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { t, userCredits, guestCredits } = useAppControls();
    const { user, isLoggedIn, loginGoogle, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Determine credits to display
    const displayCredits = isLoggedIn ? userCredits : guestCredits;

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                "bg-black/90 backdrop-blur-xl border-b",
                scrolled
                    ? "border-orange-500/20 shadow-2xl shadow-orange-500/10"
                    : "border-white/5"
            )}
        >
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-3 group cursor-pointer"
                >
                    <div className="w-12 h-12 p-2 rounded-xl overflow-hidden shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-all duration-300">
                        <img
                            src="/img/logo_site.webp"
                            alt="Duky AI Logo"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                        Duky AI
                    </span>
                </button>

                {/* Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    <NavLink href="/tool" isActive={pathname?.startsWith('/tool')}>
                        Công cụ
                    </NavLink>
                    <NavLink href="/solutions" isActive={pathname === '/solutions'}>
                        Giải pháp
                    </NavLink>
                    <NavLink href="/learn" isActive={pathname === '/learn'}>
                        Hướng dẫn
                    </NavLink>
                    <NavLink href="/gallery" isActive={pathname === '/gallery'}>
                        Thư viện
                    </NavLink>
                    <NavLink href="/pricing" isActive={pathname === '/pricing'}>
                        Bảng giá
                    </NavLink>
                    <NavLink href="/contact" isActive={pathname === '/contact'}>
                        Liên hệ
                    </NavLink>
                </nav>

                {/* User Section */}
                <div className="flex items-center gap-4">
                    {/* Credits Badge - Always Visible (Hidden on mobile as per previous request? Yes `hidden md:block`) */}
                    <div className="hidden md:block px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 backdrop-blur-sm">
                        <span className="text-orange-400 font-semibold flex items-center gap-1">
                            <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                            </svg>
                            <span>{displayCredits}</span>
                        </span>
                    </div>

                    {isLoggedIn ? (
                        <>
                            {/* Profile Dropdown */}
                            <div className="relative hidden md:block">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 p-0.5 hover:scale-110 transition-transform duration-300"
                                >
                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                        {user?.user_metadata?.avatar_url ? (
                                            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-lg">👤</span>
                                        )}
                                    </div>
                                </button>

                                {/* Dropdown Menu */}
                                {isMenuOpen && (
                                    <>
                                        {/* Backdrop to close menu on click outside */}
                                        <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />

                                        <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                            {/* User Info Header */}
                                            <div className="px-4 py-2 border-b border-neutral-800 mb-1">
                                                <p className="text-sm font-bold text-white truncate">{user?.user_metadata?.full_name || 'User'}</p>
                                                <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    router.push('/profile');
                                                    setIsMenuOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span>Thông tin cá nhân</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    router.push('/gallery');
                                                    setIsMenuOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span>Thư viện</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setIsMenuOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                <span>Đăng xuất</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <button
                            onClick={() => loginGoogle()}
                            className="hidden md:flex px-6 py-2 cursor-pointer rounded-xl bg-white text-black font-semibold shadow-lg shadow-white/10 hover:bg-gray-100 hover:scale-105 transition-all duration-300 items-center gap-2"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span>Đăng nhập Google</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

const NavLink = ({ href, isActive, children }: { href: string; isActive?: boolean; children: React.ReactNode }) => {
    const router = useRouter();
    return (
        <button
            onClick={() => router.push(href)}
            className={cn(
                "transition-colors relative group",
                isActive ? "text-orange-400 font-medium" : "text-gray-400 hover:text-orange-400"
            )}
        >
            {children}
            <span className={cn(
                "absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-300",
                isActive ? "w-full" : "w-0 group-hover:w-full"
            )} />
        </button>
    );
};

export default LeonardoHeader;
