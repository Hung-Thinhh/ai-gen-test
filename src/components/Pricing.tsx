/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Pricing Component - Display subscription packages
 */
import React, { useState } from 'react';
import { useAppControls } from './uiUtils';
import { supabase } from '../lib/supabase/client';
import toast from 'react-hot-toast';
import type { PricingPackage } from '@/types/payment';
import { PRICING_PACKAGES } from '@/types/payment';

interface PricingProps {
    onClose?: () => void;
}

export const PricingCard: React.FC<{ plan: PricingPackage }> = ({ plan }) => {
    const { language, openLoginModal } = useAppControls();
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePurchase = async () => {
        // Handle free package
        if (plan.id === 'free') {
            toast.success('Bạn đang sử dụng gói miễn phí!');
            return;
        }

        // Handle enterprise package
        if (plan.id === 'enterprise') {
            window.location.href = 'mailto:support@dukyai.com?subject=Enterprise Package Inquiry';
            return;
        }

        setIsProcessing(true);

        try {
            // 1. Check if user is logged in
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            // DEV MODE: Allow testing without login
            const isDev = process.env.NODE_ENV === 'development';
            const testUserId = 'test-user-' + Date.now().toString().slice(-8);

            if (!session) {
                // toast.error('Vui lòng đăng nhập để mua credits');
                openLoginModal();
                setIsProcessing(false);
                return;
            }

            // Use real user ID if logged in, otherwise use test ID in dev mode
            const userId = session?.user.id || testUserId;
            const accessToken = session?.access_token || 'dev-token';

            console.log('[Payment] Creating payment for package:', plan.id);
            console.log('[Payment] User ID:', userId, isDev && !session ? '(DEV MODE - Test User)' : '');

            // 2. Call API to create payment
            const response = await fetch('/api/sepay/create-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    packageId: plan.id,
                    userId: userId
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                // Log detailed error to client console
                console.error('[Payment Client] Payment creation failed:', {
                    status: response.status,
                    error: data.error,
                    details: data.details,
                    timestamp: new Date().toISOString()
                });

                throw new Error(data.error || 'Failed to create payment');
            }

            console.log('[Payment] Response:', data);

            // Store VA payment data in sessionStorage
            sessionStorage.setItem('va_payment_data', JSON.stringify(data));

            // Navigate to VA payment page (using window.location for reliability)
            console.log('[Payment] Navigating to:', `/payment/va?order_id=${data.order_id}`);
            toast.success('Đã tạo thanh toán');

            // Use setTimeout to ensure sessionStorage is saved
            setTimeout(() => {
                window.location.href = `/payment/va?order_id=${data.order_id}`;
            }, 100);

        } catch (error) {
            console.error('[Payment] Error:', error);
            toast.error(error instanceof Error ? error.message : 'Không thể tạo thanh toán. Vui lòng thử lại.');
            setIsProcessing(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN').format(price);
    };

    const formatCredits = (credits: number) => {
        if (credits >= 999999) return 'Unlimited';
        return new Intl.NumberFormat('vi-VN').format(credits);
    };

    return (
        <div className={`relative flex flex-col h-full p-4 rounded-xl transition-all ${plan.popular
            ? 'bg-gradient-to-b from-orange-500/20 to-orange-600/10 border-2 border-orange-500/50'
            : 'bg-neutral-800/50 border border-neutral-700/50'
            }`}>
            {/* Popular Badge */}
            {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full text-white text-[10px] md:text-sm font-bold whitespace-nowrap">
                    Phổ biến
                </div>
            )}

            {/* Discount Badge */}
            {plan.discount && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded">
                    -{plan.discount}%
                </div>
            )}

            {/* Plan Name */}
            <h3 className={`text-sm md:text-base font-bold ${plan.popular ? 'text-orange-400' : 'text-white'}`}>
                {plan.name}
            </h3>

            {/* Target */}
            <p className="text-neutral-500 text-[10px] md:text-sm mb-2">{plan.target}</p>

            {/* Price */}
            <div className="mb-2">
                {plan.price === 0 ? (
                    plan.id === 'free' ? (
                        <span className="text-lg md:text-2xl font-bold text-white">Miễn phí</span>
                    ) : (
                        <span className="text-lg md:text-2xl font-bold text-white">Liên hệ</span>
                    )
                ) : (
                    <div>
                        <span className="text-lg md:text-2xl font-bold text-white">{formatPrice(plan.price)}</span>
                        <span className="text-neutral-400 text-[10px] md:text-sm"> đ</span>
                    </div>
                )}
            </div>

            {/* Credits */}
            <div className="text-[11px] text-neutral-400 md:text-sm mb-2">
                <span className="text-yellow-400">⚡</span> {formatCredits(plan.credits)} credits
                {plan.pricePerCredit > 0 && (
                    <span className="text-neutral-500 block">({plan.pricePerCredit}đ/credit)</span>
                )}
            </div>

            {/* Features */}
            <ul className="flex-1 space-y-1 md:text-sm mb-3">
                {plan.features?.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[10px] md:text-sm text-neutral-400">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            {/* CTA Button */}
            <button
                onClick={handlePurchase}
                disabled={isProcessing}
                className={`w-full py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${plan.popular
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:opacity-90'
                    : plan.id === 'free'
                        ? 'bg-orange-400 text-white hover:opacity-50'
                        : 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white border border-neutral-600 hover:opacity-90'
                    }`}
            >
                {isProcessing ? (
                    'Đang xử lý...'
                ) : (
                    plan.id === 'free'
                        ? 'Dùng thử'
                        : plan.id === 'enterprise'
                            ? 'Liên hệ'
                            : 'Mua ngay'
                )}
            </button>
        </div>
    );
};

export const Pricing: React.FC<PricingProps> = ({ onClose }) => {
    const { t, language } = useAppControls();

    return (
        <div className="w-full py-6 px-4">
            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-xl md:text-3xl font-bold text-white mb-1">
                    {language === 'vi' ? 'Bảng giá' : 'Pricing'}
                </h2>
                <p className="text-neutral-400 text-sm md:text-base">
                    {language === 'vi'
                        ? 'Chọn gói phù hợp với nhu cầu của bạn'
                        : 'Choose the plan that fits your needs'}
                </p>
            </div>

            {/* Pricing Grid - Mobile 2 cols, Desktop 3 cols */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
                {PRICING_PACKAGES.map((plan) => (
                    <PricingCard key={plan.id} plan={plan} />
                ))}
            </div>

            {/* Footer Note */}
            <p className="text-center text-neutral-500 text-xs mt-4">
                {language === 'vi'
                    ? 'Tất cả các gói đều bao gồm truy cập đầy đủ tính năng AI'
                    : 'All plans include full access to AI features'}
            </p>
        </div>
    );
};

export default Pricing;
