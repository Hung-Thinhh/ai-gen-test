/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppControls } from './uiUtils';
import { SettingsIcon, LogoutIcon } from './icons';
import { useRouter } from 'next/navigation';

interface UserProfileProps {
    onClose?: () => void;
    onOpenSettings?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onClose, onOpenSettings }) => {
    const { isLoggedIn, user, loginGoogle, logout } = useAuth();
    const { t, v2UsageCount, v3UsageCount, guestCredits, userCredits } = useAppControls();
    const router = useRouter();

    const [subscriptionInfo, setSubscriptionInfo] = useState<{
        subscription_type: string | null;
        subscription_expires_at: string | null;
    }>({ subscription_type: null, subscription_expires_at: null });

    // Calculate total credits
    const totalCredits = isLoggedIn ? userCredits : guestCredits;

    // Fetch subscription info for logged-in users
    useEffect(() => {
        if (isLoggedIn) {
            fetch('/api/user/me')
                .then(res => res.json())
                .then(data => {
                    if (data.subscription_type || data.subscription_expires_at) {
                        setSubscriptionInfo({
                            subscription_type: data.subscription_type,
                            subscription_expires_at: data.subscription_expires_at
                        });
                    }
                })
                .catch(err => console.error('Failed to fetch subscription info:', err));
        }
    }, [isLoggedIn]);

    const handleLoginClick = async () => {
        try {
            await loginGoogle();
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const handleLogoutClick = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    // Safely get user info from the user object
    const userEmail = user?.email || '';
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const userPhoto = user?.user_metadata?.avatar_url || null;
    const username = userEmail ? userEmail.split('@')[0] : 'guest';

    // Check if user has active subscription
    const hasSubscription = subscriptionInfo.subscription_type && subscriptionInfo.subscription_expires_at;

    // Format expiration date
    const formatExpirationDate = (dateString: string | null) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="w-full h-full flex flex-col overflow-y-auto" style={{ background: 'linear-gradient(180deg, #2a1810 0%, #1a0f0a 50%, #0d0805 100%)' }}>
            <div className="flex-1 px-5 py-8 max-w-md mx-auto w-full">


                {/* Profile Card */}
                <div className="flex flex-col items-center text-center">
                    {isLoggedIn ? (
                        <>
                            {/* Avatar with glow effect */}
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-orange-500/30 rounded-full blur-xl scale-110"></div>
                                <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-orange-500/50 shadow-2xl">
                                    {userPhoto ? (
                                        <img
                                            src={userPhoto}
                                            alt={userName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-4xl font-bold">
                                            {userName[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Name with verified badge */}
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-2xl font-bold text-white">
                                    {userName}
                                </h2>
                                <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
                            </div>

                            {/* Username */}
                            <p className="text-neutral-500 text-sm mb-5">
                                @{username}
                            </p>

                            {/* Credits Badge */}
                            <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full mb-8">
                                <span className="text-xl">⚡</span>
                                <span className="font-bold text-yellow-400">{totalCredits} Credits</span>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Guest Avatar */}
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-neutral-600/30 rounded-full blur-xl scale-110"></div>
                                <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center ring-4 ring-neutral-600/30">
                                    <svg className="w-14 h-14 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Credits Badge for Guests */}
                            <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full mb-6">
                                <span className="text-xl">⚡</span>
                                <span className="font-bold text-yellow-400">{totalCredits} Credits</span>
                            </div>

                            <p className="text-neutral-400 mb-6 text-base">
                                {t('profile_signin_message') || 'Đăng nhập để lưu công việc và truy cập tính năng cao cấp'}
                            </p>

                            <button
                                onClick={handleLoginClick}
                                className="w-full bg-white text-gray-800 px-6 py-3.5 rounded-full font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-3 shadow-lg mb-8"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                {t('profile_signin_google') || 'Đăng nhập với Google'}
                            </button>
                        </>
                    )}
                </div>

                {/* Subscription Card - Show subscription info if exists, otherwise show upgrade prompt */}
                {isLoggedIn && (
                    <div className="w-full bg-neutral-800/60 rounded-2xl p-5 mt-4">
                        {hasSubscription ? (
                            <>
                                {/* Active Subscription Info */}
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-orange-400 mb-1">
                                            Gói {subscriptionInfo.subscription_type}
                                        </h3>
                                        <p className="text-neutral-400 text-sm">
                                            Hết hạn: {formatExpirationDate(subscriptionInfo.subscription_expires_at)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push('/pricing')}
                                    className="w-full bg-neutral-700/50 text-orange-400 px-6 py-3 rounded-full font-semibold hover:bg-neutral-700 transition-all border border-orange-500/20"
                                >
                                    Gia hạn hoặc nâng cấp
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Upgrade Prompt */}
                                <h3 className="text-lg font-bold text-orange-400 mb-2">
                                    {t('profile_upgrade_title') || 'Nâng cấp lên Premium'}
                                </h3>
                                <p className="text-neutral-400 text-sm mb-4">
                                    {t('profile_upgrade_description') || 'Nhận không giới hạn tạo ảnh và truy cập tất cả tính năng cao cấp'}
                                </p>
                                <button
                                    onClick={() => router.push('/pricing')}
                                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-all"
                                >
                                    {t('profile_buy_package') || 'Mua gói'}
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Logout Button */}
                {isLoggedIn && (
                    <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 mt-6 rounded-2xl text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all"
                    >
                        <LogoutIcon className="w-5 h-5" />
                        <span className="font-medium">{t('profile_signout') || 'Đăng xuất'}</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
