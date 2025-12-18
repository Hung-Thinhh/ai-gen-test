/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppControls, type Theme, THEME_DETAILS } from './uiUtils';

const Footer: React.FC<{}> = () => {
    const { theme, handleThemeChange, t } = useAppControls();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentThemeInfo = THEME_DETAILS.find(td => td.id === theme) || THEME_DETAILS[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectTheme = (newTheme: Theme) => {
        handleThemeChange(newTheme);
        setIsDropdownOpen(false);
    };

    return (
        <footer className="w-full mt-20 px-20 bg-black text-neutral-400 text-sm border-t border-white/10 relative z-10 pt-10 pb-6">
            <div className="w-full px-8 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Column 1: Brand & Language */}
                {/* Column 1: Brand & Description */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        {/* Logo */}
                        <img src="/img/logo_site.webp" alt="DUKY.AI" className="w-10 h-10 object-contain" />
                        <span className="text-white font-bold text-2xl tracking-wide">DUKY AI</span>
                    </div>

                    <p className="text-neutral-500 text-xs leading-relaxed max-w-xs">
                        DukyAI là nền tảng sáng tạo nghệ thuật AI tiên tiến, giúp bạn biến ý tưởng thành hiện thực chỉ trong tích tắc. Khám phá kho tàng công cụ mạnh mẽ và cộng đồng sáng tạo sôi động ngay hôm nay.
                    </p>
                </div>

                {/* Column 2: Applications */}
                <div>
                    <h3 className="text-white font-bold mb-4 uppercase text-sm">Ứng dụng</h3>
                    <ul className="space-y-3">
                        <li className="hover:text-white cursor-pointer transition-colors">Tạo Hình Ảnh</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Cyberpub</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Swift AI</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Huấn Luyện Mô Hình</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Bảng Vẽ Cao Cấp</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Ứng dụng nhanh</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Luồng Công việc</li>
                    </ul>
                </div>

                {/* Column 3: About & Help */}
                <div className="flex flex-col gap-8">
                    <div>
                        <h3 className="text-white font-bold mb-4 uppercase text-sm">Giới thiệu</h3>
                        <ul className="space-y-3">
                            <li className="hover:text-white cursor-pointer transition-colors">Phòng thí nghiệm</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Bảng Xếp Hạng</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Trò chuyện AI</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Blog AI</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Tin tức AI</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-white font-bold mb-4 uppercase text-sm">Trợ giúp</h3>
                        <ul className="space-y-3">
                            <li className="hover:text-white cursor-pointer transition-colors">Guides</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Customer Service</li>
                        </ul>
                    </div>
                </div>

                {/* Column 4: Download & Socials */}
                <div className="flex flex-col gap-8">
                    <div>
                        <h3 className="text-white font-bold mb-4 uppercase text-sm">Tải ứng dụng</h3>
                        <div className="flex flex-col gap-3">
                            {/* App Store Mock */}
                            <button className="flex items-center gap-3 bg-white/5 border border-white/20 rounded-lg px-4 py-2 hover:bg-white/10 transition-all w-full md:w-48">
                                <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.5 1.55-.03 3 .89 3.93.89 1.12 0 3.29-1.23 4.54-1.23a3.5 3.5 0 0 1 3.2 2.7 7.57 7.57 0 0 0 1.93-.07 3 3 0 0 1-3.71 10.32zM13 3.5c.73-.83 1.21-1.96 1.05-3.09-1.06.06-2.37.76-3.13 1.66-.68.79-1.27 2.08-1.07 3.12 1.18.1 2.4-.87 3.15-1.69z" /></svg>
                                <div className="text-left">
                                    <div className="text-[10px] leading-none text-neutral-400">Download on the</div>
                                    <div className="text-sm font-bold text-white leading-tight">App Store</div>
                                </div>
                            </button>
                            {/* Google Play Mock */}
                            <button className="flex items-center gap-3 bg-white/5 border border-white/20 rounded-lg px-4 py-2 hover:bg-white/10 transition-all w-full md:w-48">
                                <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" /></svg>
                                <div className="text-left">
                                    <div className="text-[10px] leading-none text-neutral-400">GET IT ON</div>
                                    <div className="text-sm font-bold text-white leading-tight">Google Play</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white font-bold mb-4 uppercase text-sm">Theo dõi chúng tôi</h3>
                        <div className="flex flex-wrap gap-3">
                            {/* Discord */}
                            <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#5865F2] flex items-center justify-center transition-colors text-white">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" /></svg>
                            </a>
                            {/* X (Twitter) */}
                            <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-black hover:text-white flex items-center justify-center transition-colors text-white">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                            </a>
                            {/* Facebook */}
                            <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#1877F2] flex items-center justify-center transition-colors text-white">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            </a>

                            {/* Youtube */}
                            <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#FF0000] flex items-center justify-center transition-colors text-white">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Disclaimer */}
            <div className="w-full px-8 md:px-12 mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-neutral-500">
                <p>&copy; 2025 DUKY.AI. All rights reserved.</p>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</a>
                    <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;