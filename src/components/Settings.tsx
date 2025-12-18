/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Settings Page - Clean mobile-first design
 */
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppControls } from './uiUtils';
import {
    ChevronRightIcon,
    LogoutIcon,
    GlobeIcon,
    BellIcon,
    PaletteIcon,
    HelpIcon,
    ShieldIcon,
    DocumentIcon
} from './icons';

interface SettingsProps {
    onBack?: () => void;
}

// Image icon component since it may not exist
const ImageSettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
    const { isLoggedIn, user, logout } = useAuth();
    const { t, handleLanguageChange, language } = useAppControls();

    const handleLogoutClick = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    // Safely get user info from Supabase User object
    const userEmail = user?.email ?? 'guest@email.com';
    const userName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User';
    const userPhoto = user?.user_metadata?.avatar_url ?? null;

    return (
        <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] overflow-y-auto">
            <div className="flex-1 px-4 py-4 max-w-md mx-auto w-full">
                {/* User Info Card */}
                {isLoggedIn && (
                    <div className="flex items-center gap-4 mb-6 p-4 bg-neutral-800/50 rounded-2xl">
                        <div className="w-14 h-14 rounded-full overflow-hidden">
                            {userPhoto ? (
                                <img
                                    src={userPhoto}
                                    alt={userName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                    {userName[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate">{userName}</h3>
                            <p className="text-sm text-neutral-400 truncate">{userEmail}</p>
                        </div>
                        <button className="flex-shrink-0 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold rounded-full whitespace-nowrap">
                            ⚡ {t('settings_upgrade') || 'Nâng cấp'}
                        </button>
                    </div>
                )}

                {/* GENERAL Section */}
                <div className="mb-6">
                    <h4 className="text-xs text-neutral-500 uppercase tracking-wider mb-3 px-1">
                        {t('settings_general') || 'Chung'}
                    </h4>
                    <div className="bg-neutral-800/30 rounded-2xl overflow-hidden divide-y divide-neutral-700/50">
                        {/* Language */}
                        <button
                            onClick={() => handleLanguageChange(language === 'vi' ? 'en' : 'vi')}
                            className="w-full flex items-center gap-4 p-4 hover:bg-neutral-700/30 transition-colors"
                        >
                            <GlobeIcon className="w-5 h-5 text-orange-400" />
                            <span className="flex-1 text-left text-white">{t('settings_language') || 'Ngôn ngữ'}</span>
                            <span className="text-neutral-400 text-sm">{language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
                            <ChevronRightIcon className="w-5 h-5 text-neutral-500" />
                        </button>

                        {/* Notifications */}
                        <div className="flex items-center gap-4 p-4">
                            <BellIcon className="w-5 h-5 text-orange-400" />
                            <div className="flex-1">
                                <span className="text-white">{t('settings_notifications') || 'Thông báo'}</span>
                                <p className="text-xs text-neutral-500">{t('settings_notifications_desc') || 'Khi hoàn thành tạo ảnh'}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-neutral-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                            </label>
                        </div>

                        {/* Theme */}
                        <button className="w-full flex items-center gap-4 p-4 hover:bg-neutral-700/30 transition-colors">
                            <PaletteIcon className="w-5 h-5 text-orange-400" />
                            <span className="flex-1 text-left text-white">{t('settings_theme') || 'Giao diện'}</span>
                            <span className="text-neutral-400 text-sm">{t('settings_theme_dark') || 'Tối'}</span>
                            <ChevronRightIcon className="w-5 h-5 text-neutral-500" />
                        </button>
                    </div>
                </div>

                {/* AI CONFIG Section */}
                <div className="mb-6">
                    <h4 className="text-xs text-neutral-500 uppercase tracking-wider mb-3 px-1">
                        {t('settings_ai_config') || 'Cấu hình AI'}
                    </h4>
                    <div className="bg-neutral-800/30 rounded-2xl overflow-hidden divide-y divide-neutral-700/50">
                        {/* Default Aspect Ratio */}
                        <button className="w-full flex items-center gap-4 p-4 hover:bg-neutral-700/30 transition-colors">
                            <ImageSettingsIcon className="w-5 h-5 text-orange-400" />
                            <span className="flex-1 text-left text-white">{t('settings_default_ratio') || 'Tỉ lệ ảnh mặc định'}</span>
                            <span className="text-neutral-400 text-sm">1:1</span>
                            <ChevronRightIcon className="w-5 h-5 text-neutral-500" />
                        </button>

                        {/* High Quality Mode */}
                        <div className="flex items-center gap-4 p-4">
                            <span className="w-5 h-5 text-orange-400 font-bold text-xs text-center leading-5 bg-orange-400/20 rounded">HD</span>
                            <div className="flex-1">
                                <span className="text-white">{t('settings_hd_mode') || 'Chế độ chất lượng cao'}</span>
                                <p className="text-xs text-neutral-500">{t('settings_hd_desc') || 'Tốn nhiều credits hơn'}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-neutral-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* SUPPORT Section */}
                <div className="mb-6">
                    <h4 className="text-xs text-neutral-500 uppercase tracking-wider mb-3 px-1">
                        {t('settings_support') || 'Hỗ trợ & Pháp lý'}
                    </h4>
                    <div className="bg-neutral-800/30 rounded-2xl overflow-hidden divide-y divide-neutral-700/50">
                        {/* Help Center */}
                        <button className="w-full flex items-center gap-4 p-4 hover:bg-neutral-700/30 transition-colors">
                            <HelpIcon className="w-5 h-5 text-neutral-400" />
                            <span className="flex-1 text-left text-white">{t('settings_help') || 'Trung tâm trợ giúp'}</span>
                            <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </button>

                        {/* Privacy Policy */}
                        <button className="w-full flex items-center gap-4 p-4 hover:bg-neutral-700/30 transition-colors">
                            <ShieldIcon className="w-5 h-5 text-neutral-400" />
                            <span className="flex-1 text-left text-white">{t('settings_privacy') || 'Chính sách quyền riêng tư'}</span>
                            <ChevronRightIcon className="w-5 h-5 text-neutral-500" />
                        </button>

                        {/* Terms */}
                        <button className="w-full flex items-center gap-4 p-4 hover:bg-neutral-700/30 transition-colors">
                            <DocumentIcon className="w-5 h-5 text-neutral-400" />
                            <span className="flex-1 text-left text-white">{t('settings_terms') || 'Điều khoản sử dụng'}</span>
                            <ChevronRightIcon className="w-5 h-5 text-neutral-500" />
                        </button>
                    </div>
                </div>

                {/* Logout Button */}
                {isLoggedIn && (
                    <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-red-400 border border-red-400/30 hover:bg-red-500/10 transition-colors mb-6"
                    >
                        <LogoutIcon className="w-5 h-5" />
                        <span>{t('profile_signout') || 'Đăng xuất'}</span>
                    </button>
                )}

                {/* App Version */}
                <div className="text-center text-neutral-500 text-xs">
                    <p>AI Art Generator v2.4.0</p>
                    <p className="mt-1">Design by Duky AI   </p>
                </div>
            </div>
        </div>
    );
};

export default Settings;
