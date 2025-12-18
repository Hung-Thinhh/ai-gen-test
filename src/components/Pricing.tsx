/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Pricing Component - Display subscription packages
 */
import React from 'react';
import { useAppControls } from './uiUtils';
import { SparklesIcon } from './icons';

interface PricingPlan {
    id: string;
    name: string;
    credits: string;
    price: string;
    pricePerCredit: string;
    discount?: string;
    target: string;
    popular?: boolean;
    features?: string[];
}

const pricingPlans: PricingPlan[] = [
    {
        id: 'free',
        name: 'Free',
        credits: '50/tháng',
        price: '0',
        pricePerCredit: '-',
        target: 'Trial',
        features: ['Reset monthly', '50 credits miễn phí']
    },
    {
        id: 'starter',
        name: 'Starter',
        credits: '500',
        price: '__,___',
        pricePerCredit: '98đ',
        target: 'Cá nhân',
        features: ['500 credits', 'Hỗ trợ cơ bản']
    },
    {
        id: 'creator',
        name: 'Creator',
        credits: '1,500',
        price: '___,000',
        pricePerCredit: '79đ',
        discount: '-20%',
        target: 'Freelancer',
        popular: true,
        features: ['1,500 credits', 'Ưu tiên xử lý', 'Hỗ trợ nhanh']
    },
    {
        id: 'pro',
        name: 'Pro',
        credits: '5,000',
        price: '___,000',
        pricePerCredit: '60đ',
        discount: '-40%',
        target: 'Agency nhỏ',
        features: ['5,000 credits', 'Ưu tiên cao', 'Hỗ trợ 24/7']
    },
    {
        id: 'business',
        name: 'Business',
        credits: '20,000',
        price: '___,000',
        pricePerCredit: '45đ',
        discount: '-55%',
        target: 'Doanh nghiệp',
        features: ['20,000 credits', 'Team access', 'Báo cáo chi tiết']
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        credits: 'Unlimited',
        price: 'Liên hệ',
        pricePerCredit: 'Custom',
        target: 'Studio lớn',
        features: ['Unlimited credits', 'API access', 'Dedicated support']
    }
];

interface PricingProps {
    onClose?: () => void;
}

export const PricingCard: React.FC<{ plan: PricingPlan }> = ({ plan }) => {
    const { language } = useAppControls();

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
                    {plan.discount}
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
                {plan.price === 'Liên hệ' ? (
                    <span className="text-lg md:text-2xl font-bold text-white">Liên hệ</span>
                ) : plan.price === '0' ? (
                    <span className="text-lg md:text-2xl font-bold text-white">Miễn phí</span>
                ) : (
                    <div>
                        <span className="text-lg md:text-2xl font-bold text-white">{plan.price}</span>
                        <span className="text-neutral-400 text-[10px] md:text-sm"> đ/tháng</span>
                    </div>
                )}
            </div>

            {/* Credits */}
            <div className="text-[11px] text-neutral-400 md:text-sm mb-2">
                <span className="text-yellow-400">⚡</span> {plan.credits} credits
                {plan.pricePerCredit !== '-' && plan.pricePerCredit !== 'Custom' && (
                    <span className="text-neutral-500 block">({plan.pricePerCredit}/credit)</span>
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
            <button className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${plan.popular
                ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:opacity-90'
                : plan.id === 'free'
                    ? 'bg-orange-400 text-white hover:opacity-50'
                    : 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white border border-neutral-600 hover:opacity-90'
                }`}>
                {plan.id === 'free'
                    ? 'Dùng thử'
                    : plan.id === 'enterprise'
                        ? 'Liên hệ'
                        : 'Mua ngay'
                }
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
                {pricingPlans.map((plan) => (
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
