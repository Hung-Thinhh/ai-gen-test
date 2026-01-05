'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppControls } from './uiUtils';

export const LeonardoHeader = () => {
    const [scrolled, setScrolled] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { t, user, isLoggedIn } = useAppControls();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
                    className="flex items-center gap-3 group"
                >
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-all duration-300">
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
                    {isLoggedIn && (
                        <>
                            {/* Credits Badge */}
                            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 backdrop-blur-sm">
                                <span className="text-orange-400 font-semibold flex items-center gap-1">
                                    <span>💎</span>
                                    <span>50</span>
                                </span>
                            </div>

                            {/* Profile */}
                            <button
                                onClick={() => router.push('/#profile')}
                                className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 p-0.5 hover:scale-110 transition-transform duration-300"
                            >
                                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                    <span className="text-lg">👤</span>
                                </div>
                            </button>
                        </>
                    )}

                    {!isLoggedIn && (
                        <button
                            onClick={() => router.push('/login')}
                            className="px-6 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300"
                        >
                            Đăng nhập
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
