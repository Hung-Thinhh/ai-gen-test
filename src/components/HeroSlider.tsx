import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppControls } from './uiUtils';
// import { ArrowRightIcon } from './icons'; // Removed

const ArrowRightIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
);

interface SlideData {
    id: number;
    title: string;
    description: string;
    tag: string;
    buttonText: string;
    bgClass: string; // Or image URL, but using classes/styles for now to match current hero
    targetApp: string;
    bgImage?: string;
}

// Helper component for Left Arrow
const ArrowLeftIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);

export const HeroSlider: React.FC = () => {
    const { handleSelectApp, language } = useAppControls();
    const [currentIndex, setCurrentIndex] = useState(0);

    const slides: SlideData[] = [
        {
            id: 1,
            title: "Tạo ảnh đón tết 2026",
            description: "Biến những bức ảnh của bạn thành ảnh đẹp ngày tết",
            tag: "NEW FEATURE",
            buttonText: "Try Now / Thử ngay",
            bgClass: "hero-banner-bg", // Using existing class for the first one
            targetApp: "swap-style"
        },
        {
            id: 2,
            title: "Doanh nhân thành đạt",
            description: "Tạo ảnh profile doanh nhân chuyên nghiệp chỉ trong vài giây",
            tag: "POPULAR",
            buttonText: "Create Profile",
            bgClass: "hero-banner-bg-2", // Will need to handle backgrounds dynamically
            targetApp: "entrepreneur-creator",
            bgImage: "/img/doanhnhan.webp"
        },
        {
            id: 3,
            title: "Ghép ảnh Khmer",
            description: "Trải nghiệm trang phục và văn hóa Khmer độc đáo",
            tag: "TRENDING",
            buttonText: "Discover",
            bgClass: "hero-banner-bg-3",
            targetApp: "khmer-photo-merge",
            bgImage: "/img/khmer-templates/template1.webp" // Placeholder, might need a real image
        }
    ];

    // Auto scroll - resets whenever index changes (including manual interaction)
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [currentIndex, slides.length]);

    const handleDotClick = (index: number) => {
        setCurrentIndex(index);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    };

    // Swipe logic
    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity;
    };

    return (
        <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden mb-8 group">
            <AnimatePresence initial={false} mode="popLayout" custom={currentIndex}>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }) => {
                        const swipe = swipePower(offset.x, velocity.x);

                        if (swipe < -swipeConfidenceThreshold) {
                            handleNext();
                        } else if (swipe > swipeConfidenceThreshold) {
                            handlePrev();
                        }
                    }}
                    className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
                >
                    {/* Background Layer */}
                    <div className="absolute inset-0 bg-neutral-900 pointer-events-none">
                        {slides[currentIndex].bgImage ? (
                            <>
                                <img
                                    src={slides[currentIndex].bgImage}
                                    alt="Background"
                                    className="w-full h-full object-cover opacity-60"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                            </>
                        ) : (
                            /* Fallback for the first slide which might rely on CSS class */
                            <div className={`w-full h-full ${slides[currentIndex].bgClass}`}></div>
                        )}
                    </div>

                    {/* Content Layer */}
                    <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 max-w-2xl z-10 pointer-events-none">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-block px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full w-fit mb-4"
                        >
                            {slides[currentIndex].tag}
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight"
                        >
                            {slides[currentIndex].title}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-neutral-300 text-base md:text-lg mb-8 max-w-lg"
                        >
                            {slides[currentIndex].description}
                        </motion.p>
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            onClick={() => handleSelectApp(slides[currentIndex].targetApp)}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-colors w-fit pointer-events-auto cursor-pointer"
                        >
                            {slides[currentIndex].buttonText}
                            <ArrowRightIcon className="w-4 h-4" />
                        </motion.button>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows (Visible on Hover/Touch) */}
            <button
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                onClick={handlePrev}
                aria-label="Previous slide"
            >
                <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <button
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                onClick={handleNext}
                aria-label="Next slide"
            >
                <ArrowRightIcon className="w-6 h-6" />
            </button>

            {/* Navigation Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => handleDotClick(index)}
                        className={`rounded-full transition-all ${index === currentIndex
                            ? 'bg-orange-500 w-3 h-1 md:w-8 md:h-2.5 p-1! min-w-3! min-h-3!'
                            : 'bg-white/30 hover:bg-white/50 w-1 h-1 md:w-2.5 md:h-2.5 p-1! min-w-3! min-h-3!'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};
