/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Pricing Component - Display subscription packages
 */
import React, { useState, useEffect, useRef } from 'react';
import { useAppControls } from './uiUtils';
import { useSession } from "next-auth/react";
import toast from 'react-hot-toast';
import type { PricingPackage } from '@/types/payment';
import { getAllPackages } from '../services/storageService';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import TabletMacIcon from '@mui/icons-material/TabletMac';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import AppleIcon from '@mui/icons-material/Apple';
import AndroidIcon from '@mui/icons-material/Android';
import { motion, AnimatePresence } from 'framer-motion';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface PricingProps {
    onClose?: () => void;
}

// Helper to format currency
const formatVND = (amount: number) => {
    if (amount >= 1000) {
        return new Intl.NumberFormat('vi-VN').format(amount / 1000) + 'k';
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount).replace('₫', 'VND');
};

export const PricingCard: React.FC<{ plan: PricingPackage; billingCycle: 'monthly' | 'yearly' }> = ({ plan, billingCycle }) => {
    const { language, openLoginModal } = useAppControls();
    const { data: session } = useSession();
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePurchase = async () => {
        console.log("🚀 [Pricing] Clicked plan:", plan.id);
        setIsProcessing(true); // Uncommented to show loading state

        try {
            console.log("🔍 [Pricing] Checking session (via NextAuth)...");

            // 1. Check if user is logged in using NextAuth
            if (!session || !session.user) {
                console.log("👤 [Pricing] User not logged in, opening modal");
                openLoginModal();
                setIsProcessing(false);
                return;
            }

            // Cast session to access custom properties
            const sessionUser = session.user as any;

            // For Credentials login, accessToken is present. 
            // For Google/OAuth, it might be missing, but session is valid.
            // We provide a fallback to satisfy the API check.
            const accessToken = (session as any).accessToken || 'oauth_session_valid';

            if (!accessToken && !session) { // Double check session
                console.error("❌ [Pricing] No session found");
                toast.error("Vui lòng đăng nhập lại.");
                setIsProcessing(false);
                return;
            }

            console.log("👤 [Pricing] User logged in:", sessionUser.id);

            // Use real user ID if logged in
            const userId = sessionUser.id;
            // accessToken is already defined above

            console.log('[Payment] Creating payment for package:', plan.id);

            // 2. Call API to create payment
            const response = await fetch('/api/sepay/create-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    packageId: plan.id,
                    userId: userId,
                    billingCycle: billingCycle
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to create payment');
            }

            // Navigate to VA payment page
            window.location.href = `/payment/va?order_id=${data.order_id}`;
            toast.success('Đã tạo thanh toán');

        } catch (error) {
            console.error('[Payment] Error:', error);
            toast.error(error instanceof Error ? error.message : 'Không thể tạo thanh toán. Vui lòng thử lại.');
            setIsProcessing(false);
        }
    };

    const isPopular = plan.popular;

    return (
        <div className={`relative flex flex-col h-full rounded-2xl transition-all p-[1px] ${isPopular
            ? 'bg-gradient-to-b from-[#ff8500] to-[#f54c00]' // Orange gradient border for popular
            : 'bg-[#1e1e2d] border border-white/10 '
            }`}>
            {/* Header Tag for Best Offer */}
            {isPopular && (
                <div className="absolute -top-4 left-0 right-0 h-8 flex items-center justify-center">
                    <div className="bg-[#ff8500] text-white text-xs font-bold px-4 py-1 rounded-xl w-full text-center h-full flex items-center justify-center rounded-b-none">
                        Phổ biến
                    </div>
                </div>
            )}

            <div className={`flex flex-col h-full w-full rounded-2xl p-5 ${isPopular ? 'bg-[#131420] mt-[5px]' : 'bg-[#0f1019]'
                }`}>

                {/* Plan Name */}
                <h3 className={`text-center text-lg md:text-xl font-medium mb-4 ${isPopular ? 'text-[#ff8700]' : 'text-neutral-300'
                    } ${plan.id === 'teams' ? 'text-[#f54c00]' : ''}`}>
                    {plan.name}
                </h3>

                {/* Price */}
                <div className="text-center mb-1 h-14 flex items-center justify-center flex-col">
                    {plan.price === 0 && plan.id !== 'teams' ? (
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-white">0 VND</span>
                            <br />
                            <span className="text-sm text-neutral-400">/{billingCycle === 'yearly' ? 'năm' : 'tháng'}</span>
                        </div>
                    ) : plan.id === 'teams' ? (
                        <div className="text-3xl text-orange-500 items-center justify-center flex">
                            {/* Team Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-[#ff8700]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 5.472m0 0a9.09 9.09 0 00-3.26.986 3 3 0 014.593-2.72m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 justify-center">
                            <div className="flex items-baseline gap-1">
                                <span className={`text-3xl font-bold bg-gradient-to-r from-[#ff8500] to-[#f54c00] text-transparent bg-clip-text`}>
                                    {formatVND(plan.price)}
                                </span>
                                <span className="text-sm text-neutral-400">/{billingCycle === 'yearly' ? 'năm' : 'tháng'}</span>
                            </div>
                        </div>
                    )}

                    {/* ex. tax or simple subtitle */}
                    {/* {plan.description && plan.id !== 'teams' && (
                        <p className="text-[10px] text-neutral-500 mt-1">{plan.description}</p>
                    )} */}
                </div>

                {/* Button */}
                <div className="mt-4 mb-6">
                    <button
                        onClick={handlePurchase}
                        disabled={isProcessing}
                        className={`w-full py-2 rounded-full cursor-pointer text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${plan.id === 'teams'
                            ? 'border border-white text-white hover:bg-white/10'
                            : plan.buttonText === 'Subscribe' && !isPopular
                                ? 'border border-white/30 text-white hover:border-white hover:bg-gradient-to-r from-[#ff8500] to-[#f54c00]'
                                : isPopular
                                    ? 'bg-gradient-to-r from-orange-400 to-orange-700 text-white hover:opacity-90  border-none'
                                    : 'text-white hover:bg-white/5'
                            } ${plan.id === 'free' ? 'invisible h-0 py-0' : ''}`}
                    >
                        {isProcessing ? 'Processing...' : 'Mua ngay'}
                    </button>
                    {/* For Free plan, it shows "Forever" centered where button would be */}
                    {plan.id === 'free' && (
                        <div className="text-center text-neutral-400 py-2 text-sm">
                            Forever
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="w-full h-[1px] bg-white/10 mb-4"></div>

                {/* Target Audience */}
                <div className="text-center mb-4 min-h-[40px]">
                    <p className="text-[14px] text-[#ffad5c] font-medium">Phù hợp cho</p>
                    <p className="text-[14px] text-neutral-300 leading-tight mt-1 px-2">
                        {plan.target}
                    </p>
                </div>

                {/* Features */}
                <ul className="flex-1 space-y-3 mt-2 bg-white/5 backdrop-blur-xl rounded-xl p-3">
                    {plan.features?.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[11px] text-neutral-300 leading-tight">
                            <div className="mt-[2px] min-w-[14px]">
                                { /* Use simple check */}
                                <svg className={`w-3.5 h-3.5 ${isPopular ? "text-[#ff8700]" : "text-[#ff8700]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="text-white/90 text-[14px]">{feature}</span>
                        </li>
                    ))}
                </ul>

                {/* Bottom spacer */}
                <div className="mt-4"></div>
            </div>
        </div>
    );
};



const MobilePricingSlider: React.FC<{ packages: PricingPackage[], billingCycle: 'monthly' | 'yearly' }> = ({ packages, billingCycle }) => {
    const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // Sync active index
    const handleSlideChange = (swiper: SwiperType) => {
        setActiveIndex(swiper.realIndex);
    };

    const handleNext = () => {
        swiperInstance?.slideNext();
    };

    const handlePrev = () => {
        swiperInstance?.slidePrev();
    };

    const handleDotClick = (index: number) => {
        swiperInstance?.slideToLoop(index);
    };

    return (
        <div className="w-full py-8">
            {/* Top Navigation Row: Arrow Left - Dots - Arrow Right */}
            <div className="flex items-center justify-center gap-6 mb-8 px-4">
                <button
                    onClick={handlePrev}
                    className="p-2 rounded-full text-white hover:bg-white/10 transition-all active:scale-95"
                >
                    <ChevronLeftIcon sx={{ fontSize: 32 }} />
                </button>

                {/* Dots */}
                <div className="flex justify-center gap-3">
                    {packages.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleDotClick(idx)}
                            className={`transition-all duration-300 rounded-full ${activeIndex === idx
                                ? 'bg-orange-500 w-3 h-3 !p-1 !w-3 !h-2 !min-w-3 !min-h-2'
                                : 'bg-white/20 !p-1 !w-2 !h-2 !min-w-2 !min-h-2 hover:bg-white/40'
                                }`}
                        />
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    className="p-2 rounded-full text-white hover:bg-white/10 transition-all active:scale-95"
                >
                    <ChevronRightIcon sx={{ fontSize: 32 }} />
                </button>
            </div>

            {/* Swiper Slider */}
            <div className="w-full">
                <Swiper
                    modules={[Pagination, Navigation]}
                    spaceBetween={16}
                    slidesPerView={'auto'}
                    centeredSlides={true}
                    loop={true}
                    onSwiper={setSwiperInstance}
                    onSlideChange={handleSlideChange}
                    className="w-full !overflow-visible" // Allow shadows/scale to overflow container if needed
                    speed={500}
                >
                    {packages.map((pkg) => (
                        <SwiperSlide
                            key={pkg.id}
                            style={{ width: '85%' }} // Explicit width for centeredSlides + slidesPerView='auto'
                            className="transition-all duration-300"
                        >
                            {/* Inner wrapper for scale/opacity effect using purely CSS based on parent class */}
                            {/* Swiper adds 'swiper-slide-active' to the active slide */}
                            {({ isActive }) => (
                                <div
                                    className={`relative transition-all duration-500 ease-out ${isActive ? 'scale-100 opacity-100 z-10' : 'scale-90 opacity-50 z-0'
                                        }`}
                                >
                                    <PricingCard plan={pkg} billingCycle={billingCycle} />
                                </div>
                            )}
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
};

export const Pricing: React.FC<PricingProps> = ({ onClose }) => {
    const { language } = useAppControls();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly'); // Default to monthly
    const [packages, setPackages] = useState<PricingPackage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPackages = async () => {
            console.log("🚀 [Pricing] useEffect started"); // Added debug log
            setLoading(true);
            try {
                console.log("🚀 [Pricing] Calling getAllPackages...");
                const data = await getAllPackages();
                console.log("✅ [Pricing] Data received:", data);


                const mappedPackages: PricingPackage[] = data
                    .filter((pkg: any) => pkg.is_active !== false)
                    .map((pkg: any) => {
                        let name = pkg.display_name;
                        if (typeof name === 'object' && name !== null) {
                            name = name[language === 'vi' ? 'vi' : 'en'] || name.en || 'Package';
                        }

                        let description = pkg.description;
                        if (typeof description === 'object' && description !== null) {
                            description = description[language === 'vi' ? 'vi' : 'en'] || description.en || '';
                        }

                        // Use category from DB or default to 'month'
                        const category = pkg.category || 'month';

                        // Try to find the price column. If user renamed it to price_monthly_vnd or kept price_vnd
                        const price = Number(pkg.price_vnd || pkg.price_vnd || 0);

                        return {
                            id: pkg.package_key || pkg.package_id?.toString() || 'unknown',
                            name: name || 'Unnamed Package',
                            credits: pkg.credits_included || 0,
                            price: price,
                            priceMonthly: price,
                            priceYearlyMonthlyEquivalent: price,
                            pricePerCredit: 0,
                            target: description || 'Users',
                            popular: pkg.is_popular === true,
                            features: Array.isArray(pkg.features) ? pkg.features : [],
                            buttonText: (pkg.package_key === 'free') ? 'Forever' : 'Subscribe',
                            description: 'ex. tax',
                            category: category
                        };
                    });

                setPackages(mappedPackages);
            } catch (error) {
                console.error("Failed to fetch packages", error);
                toast.error("Không thể tải bảng giá");
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, [language]);

    // Filter packages based on billing cycle
    const displayedPackages = packages.filter(pkg => {
        if (pkg.id === 'teams') return true;
        if (pkg.id === 'free') return true; // Free package usually visible or filtered? Assuming visible. 
        // Or if free has category 'month', it might show only in month.
        // Let's rely on category if present.

        const targetCategory = billingCycle === 'yearly' ? 'year' : 'month';
        // If package has no category, default to 'month', so it hides on yearly toggle? 
        return pkg.category === targetCategory || (!pkg.category && targetCategory === 'month');
    });

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-black text-white py-10 px-4 flex flex-col items-center justify-center border border-orange-400/35 rounded-2xl">
                <div className="text-orange-500">Loading pricing...</div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-black text-white py-10 px-4 flex flex-col items-center border border-orange-400/35 rounded-2xl">
            {/* Header */}
            <div className="text-center mb-10 max-w-3xl mx-auto">
                <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-white">
                    Tận hưởng tính năng <span className="bg-gradient-to-r from-[#ff8700] to-[#f54c00] bg-clip-text text-transparent">Duky.Ai</span>
                </h1>

                <div className="flex items-center justify-center gap-2 text-neutral-400 text-sm md:text-base mb-8">
                    <span>One subscription, all platforms</span>
                    <div className="flex items-center gap-1 ml-2">
                        <DesktopWindowsIcon sx={{ fontSize: 20 }} />
                        <TabletMacIcon sx={{ fontSize: 18 }} />
                        <AndroidIcon sx={{ fontSize: 18 }} />
                        <AppleIcon sx={{ fontSize: 18 }} />
                    </div>
                </div>

                {/* Toggle Switch */}
                <div className="flex items-center justify-center gap-4 bg-[#1e1e2d]/50 p-1.5 rounded-full border border-white/5 inline-flex mx-auto">
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`cursor-pointer relative px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${billingCycle === 'yearly'
                            ? 'bg-gradient-to-r from-[#ff8500] to-[#f54c00] text-white shadow-lg shadow-orange-500/40'
                            : 'text-neutral-400 hover:text-white'
                            }`}
                    >
                        Gói năm
                        <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-xl ml-1 flex items-center gap-0.5">
                            Giảm 20% <span>🔥</span>
                        </span>
                    </button>
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`cursor-pointer px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${billingCycle === 'monthly'
                            ? 'bg-gradient-to-r from-[#ff8500] to-[#f54c00] shadow-orange-500/40  text-white'
                            : 'text-neutral-400 hover:text-white'
                            }`}
                    >
                        Gói tháng
                    </button>
                </div>
            </div>

            {/* Pricing Grid - Desktop */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 md:gap-4 gap-8 max-w-[1400px] w-full mx-auto px-4">
                {displayedPackages.length > 0 ? displayedPackages.map((plan) => (
                    <div key={plan.id} className="min-w-[220px]">
                        <PricingCard plan={plan} billingCycle={billingCycle} />
                    </div>
                )) : (
                    <div className="col-span-full text-center text-neutral-400 py-10">
                        {billingCycle === 'yearly' ? 'Chưa có gói năm. Vui lòng chọn gói tháng.' : 'No packages found.'}
                    </div>
                )}
            </div>

            {/* Pricing Slider - Mobile */}
            <div className="md:hidden w-full">
                {displayedPackages.length > 0 ? (
                    <MobilePricingSlider
                        key={`${billingCycle}-${displayedPackages.length}`} // Force reset on change
                        packages={displayedPackages}
                        billingCycle={billingCycle}
                    />
                ) : (
                    <div className="text-center text-neutral-400 py-10">
                        {billingCycle === 'yearly' ? 'Chưa có gói năm. Vui lòng chọn gói tháng.' : 'No packages found.'}
                    </div>
                )}
            </div>
            {/* Footer Note */}
            <div className="mt-12 text-center text-neutral-500 text-xs max-w-2xl mx-auto">
                <p>* Số lượng token được phép sử dụng sẽ được đặt lại hàng tháng. Các token chưa sử dụng sẽ được chuyển sang kỳ tiếp theo cho đến khi đạt giới hạn được quy định trong gói cước của bạn.</p>
            </div>
        </div>
    );
};

export default Pricing;
