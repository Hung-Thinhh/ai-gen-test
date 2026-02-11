'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppControls } from './uiUtils';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Menu, MenuItem } from '@mui/material';
export const LeonardoHeader = () => {
    const [scrolled, setScrolled] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { t, guestCredits } = useAppControls();
    const { user, isLoggedIn, loginGoogle, logout } = useAuth();
    const { data: session } = useSession();
    const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
    const isProfileOpen = Boolean(profileAnchorEl);

    const handleProfileClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setProfileAnchorEl(event.currentTarget);
    };

    const handleProfileClose = () => {
        setProfileAnchorEl(null);
    };

    // Local state for credits to allow real-time updates
    const [currentCredits, setCurrentCredits] = useState<number>(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Initialize and sync credits from session or context
    useEffect(() => {
        if (isLoggedIn) {
            const userCreditsFromSession = (session?.user as any)?.credits;
            if (userCreditsFromSession !== undefined) {
                setCurrentCredits(userCreditsFromSession);
            }
        } else {
            setCurrentCredits(guestCredits);
        }
    }, [session, isLoggedIn, guestCredits]);

    // Fetch fresh credits from API (on mount and when route changes)
    useEffect(() => {
        const fetchFreshCredits = async () => {
            try {
                if (isLoggedIn) {
                    // Fetch user credits from API
                    const response = await fetch('/api/user/me');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.current_credits !== undefined) {
                            console.log('[LeonardoHeader] Fresh user credits from API:', data.current_credits);
                            setCurrentCredits(data.current_credits);
                        }
                    }
                } else {
                    // Fetch guest credits from API
                    const guestId = localStorage.getItem('guest_device_id');
                    if (guestId) {
                        const response = await fetch(`/api/guest/credits?guestId=${guestId}`);
                        if (response.ok) {
                            const data = await response.json();
                            if (data.credits !== undefined) {
                                console.log('[LeonardoHeader] Fresh guest credits from API:', data.credits);
                                setCurrentCredits(data.credits);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('[LeonardoHeader] Failed to fetch fresh credits:', error);
            }
        };

        fetchFreshCredits();
    }, [isLoggedIn, pathname]); // Re-fetch when route changes or login status changes

    // Listen for credit updates from generation
    useEffect(() => {
        const handleCreditsUpdate = (event: CustomEvent) => {
            if (event.detail?.credits !== undefined) {
                console.log('[LeonardoHeader] Credit update event:', event.detail.credits);
                setCurrentCredits(event.detail.credits);
            }
        };

        window.addEventListener('user-credits-updated', handleCreditsUpdate as EventListener);
        return () => window.removeEventListener('user-credits-updated', handleCreditsUpdate as EventListener);
    }, []);

    // Determine credits to display (Always use local state which is synced with Context + Events)
    const displayCredits = currentCredits;

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                "bg-black/90 backdrop-blur-xl border-b hidden md:flex",
                scrolled
                    ? "border-orange-500/20 shadow-2xl shadow-orange-500/10"
                    : "border-white/5"
            )}
        >
            <div className="container mx-auto px-6 h-10 md:h-16 flex items-center justify-between">
                {/* Logo - Left side */}
                <Link href="/">
                    <button
                        className="flex items-center gap-3 group cursor-pointer"
                    >
                        <div className="md:w-12 md:h-12 w-8 h-8 p-2 rounded-xl overflow-hidden shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-all duration-300">
                            <img
                                src="/img/logo_site.webp"
                                alt="Duky AI Logo"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="hidden md:inline text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                            Duky AI
                        </span>
                    </button>
                </Link>

                {/* Desktop Navigation - Hidden on mobile */}
                <nav className="hidden lg:flex items-center gap-8">
                    <NavLink href="/tool" isActive={pathname?.startsWith('/tool')}>
                        Công cụ
                    </NavLink>
                    <SolutionsDropdown isActive={pathname?.startsWith('/solutions')} />
                    <NavLink href="/guide" isActive={pathname === '/guide'}>
                        Hướng dẫn
                    </NavLink>
                    <NavLink href="/prompt-library" isActive={pathname === '/prompt-library'}>
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
                    {/* Credits Badge - Visible on mobile and desktop */}
                    <div className="px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 backdrop-blur-sm">
                        <span className="text-orange-400 font-semibold flex items-center gap-1">
                            <svg className="w-4 h-4 md:w-5 md:h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm md:text-base">{displayCredits}</span>
                        </span>
                    </div>

                    {isLoggedIn ? (
                        <>
                            {/* Profile Dropdown */}
                            <div className="relative hidden md:block">
                                <button
                                    onClick={handleProfileClick}
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

                                {/* MUI Dropdown Menu */}
                                <Menu
                                    anchorEl={profileAnchorEl}
                                    open={isProfileOpen}
                                    onClose={handleProfileClose}
                                    onClick={handleProfileClose}
                                    slotProps={{
                                        paper: {
                                            sx: {
                                                mt: 1.5,
                                                width: 240,
                                                backgroundColor: 'rgba(9, 9, 11, 0.98)',
                                                backdropFilter: 'blur(24px)',
                                                border: '1px solid rgba(251, 146, 60, 0.15)',
                                                borderRadius: '16px',
                                                boxShadow: '0 25px 50px -12px rgba(249, 115, 22, 0.15), 0 0 30px rgba(0, 0, 0, 0.5)',
                                                padding: '8px',
                                                overflow: 'hidden'
                                            }
                                        }
                                    }}
                                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                >
                                    {/* User Info Header */}
                                    <div className="px-4 py-3 border-b border-white/10 mb-2 outline-none">
                                        <p className="text-sm font-bold text-white truncate">{user?.user_metadata?.full_name || 'User'}</p>
                                        <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
                                    </div>

                                    <MenuItem
                                        onClick={() => router.push('/profile')}
                                        sx={{ borderRadius: '12px', mb: 0.5, '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
                                    >
                                        <div className="flex items-center gap-3 w-full text-neutral-300">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span className="text-sm font-medium">Thông tin cá nhân</span>
                                        </div>
                                    </MenuItem>

                                    <MenuItem
                                        onClick={() => router.push('/gallery')}
                                        sx={{ borderRadius: '12px', mb: 0.5, '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
                                    >
                                        <div className="flex items-center gap-3 w-full text-neutral-300">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-sm font-medium">Thư viện</span>
                                        </div>
                                    </MenuItem>

                                    <div className="my-1 border-t border-white/5 mx-2" />

                                    <MenuItem
                                        onClick={() => logout()}
                                        sx={{ borderRadius: '12px', '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' } }}
                                    >
                                        <div className="flex items-center gap-3 w-full text-red-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span className="text-sm font-medium">Đăng xuất</span>
                                        </div>
                                    </MenuItem>
                                </Menu>
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


// Solutions Dropdown Component
const SolutionsDropdown = ({ isActive }: { isActive?: boolean }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const solutions = [
        {
            title: 'Công cụ Marketing AI',
            description: 'Nâng cấp chiến dịch marketing của bạn với sức mạnh AI.',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
            href: '/solutions/marketing-ads',
            color: 'from-orange-500/20 to-orange-600/20'
        },
        {
            title: 'Thiết kế Đồ họa AI',
            description: 'Tối ưu hóa quy trình thiết kế với các công cụ tạo ảnh nghệ thuật.',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
            ),
            href: '/solutions/graphic-design',
            color: 'from-orange-500/20 to-orange-600/20'
        },
        {
            title: 'In ấn theo yêu cầu (POD)',
            description: 'Biến tác phẩm kỹ thuật số thành các sản phẩm in ấn thực tế.',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
            ),
            href: '/solutions/pod',
            color: 'from-orange-500/20 to-orange-600/20'
        },
        {
            title: 'Chụp ảnh AI chuyên nghiệp',
            description: 'Công cụ chụp ảnh sản phẩm và chân dung chất lượng studio.',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            href: '/solutions/photography',
            color: 'from-orange-500/20 to-orange-600/20'
        },
        {
            title: 'Studio Chân dung AI',
            description: 'Tạo bộ ảnh chân dung chuyên nghiệp từ ảnh selfie cá nhân.',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
            ),
            href: '/solutions/ai-studio',
            color: 'from-orange-500/20 to-orange-600/20'
        }
    ];

    return (
        <div className="relative">
            <button
                onClick={handleClick}
                className={cn(
                    "transition-colors cursor-pointer relative group inline-flex items-center gap-1 py-4 md:py-6", // Tăng vùng tương tác
                    isActive ? "text-orange-400 font-medium" : "text-gray-400 hover:text-orange-400"
                )}
            >
                Giải pháp
                <svg
                    className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        open && "rotate-180"
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className={cn(
                    "absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-300",
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                )} />
            </button>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1, // Giảm margin top để gần button hơn
                            width: 1200, // Tăng thêm chiều rộng
                            maxWidth: '100vw',
                            backgroundColor: 'rgba(9, 9, 11, 0.98)', // Đậm hơn một chút
                            backdropFilter: 'blur(24px)',
                            border: '1px solid rgba(251, 146, 60, 0.15)', // Viền cam nhạt
                            borderRadius: '20px',
                            boxShadow: '0 25px 50px -12px rgba(249, 115, 22, 0.15), 0 0 30px rgba(0, 0, 0, 0.5)',
                            padding: '8px',
                            overflow: 'hidden'
                        }
                    }
                }}
                transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
                    {solutions.map((solution, index) => (
                        <MenuItem
                            key={index}
                            onClick={() => setAnchorEl(null)}
                            sx={{
                                padding: 0,
                                borderRadius: '16px',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    backgroundColor: 'rgba(251, 146, 60, 0.05)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 10px 20px -10px rgba(249, 115, 22, 0.2)'
                                }
                            }}
                            className="group/item"
                        >
                            <Link
                                href={solution.href}
                                className="w-full p-5 flex items-start gap-5 no-underline"
                            >
                                {/* Icon */}
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 transition-all duration-300",
                                    "border border-orange-500/20 group-hover/item:border-orange-500/40",
                                    "shadow-sm group-hover/item:shadow-orange-500/20 shadow-orange-500/5",
                                    solution.color
                                )}>
                                    <div className="text-orange-500 group-hover/item:text-orange-400 group-hover/item:scale-110 transition-transform duration-300">
                                        {solution.icon}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-1.5 pt-1">
                                    <h3 className="text-white text-[15px] font-bold tracking-wide group-hover/item:text-orange-400 transition-colors">
                                        {solution.title}
                                    </h3>
                                    <p className="text-[13px] text-zinc-400 leading-relaxed font-medium">
                                        {solution.description}
                                    </p>
                                </div>

                                {/* Arrow */}
                                <div className="pt-1 opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300">
                                    <svg className="w-5 h-5 text-orange-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </Link>
                        </MenuItem>
                    ))}
                </div>
                {/* Optional subtle footer */}
                <div className="mt-2 pt-3 px-4 pb-2 border-t border-white/5 flex justify-between items-center text-[11px] text-zinc-500 font-medium">
                    <span>Duky AI Solutions Suite</span>
                    <span className="text-orange-500/50 italic font-normal">Sức mạnh công nghệ trong tầm tay bạn</span>
                </div>
            </Menu>
        </div>
    );
};


const NavLink = ({ href, isActive, children }: { href: string; isActive?: boolean; children: React.ReactNode }) => {
    // Không cần dùng useRouter và router.push nữa
    return (
        <Link
            href={href}
            className={cn(
                "transition-colors relative group inline-block", // Thêm inline-block để padding/span hoạt động chuẩn
                isActive ? "text-orange-400 font-medium" : "text-gray-400 hover:text-orange-400"
            )}
        >
            {children}
            <span className={cn(
                "absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-300",
                isActive ? "w-full" : "w-0 group-hover:w-full"
            )} />
        </Link>
    );
};

export default LeonardoHeader;
