'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';
import Image from 'next/image'
export const LeonardoBanner = () => {
    const router = useRouter();
    const scrollY = useMotionValue(0);

    useEffect(() => {
        const container = document.getElementById('main-content-scroll');
        if (!container) return;

        const updateScroll = () => {
            scrollY.set(container.scrollTop);
        };

        // Set initial value
        updateScroll();

        container.addEventListener('scroll', updateScroll);
        return () => container.removeEventListener('scroll', updateScroll);
    }, [scrollY]);

    // Parallax transforms for floating images
    const y1 = useTransform(scrollY, [0, 500], [0, -100]);
    const x1 = useTransform(scrollY, [0, 500], [0, -100]); // Top-Left: Up & Left

    const y2 = useTransform(scrollY, [0, 500], [0, 100]);
    const x2 = useTransform(scrollY, [0, 500], [0, -100]); // Bottom-Left: Down & Left

    const y3 = useTransform(scrollY, [0, 500], [0, -80]);
    const x3 = useTransform(scrollY, [0, 500], [0, 80]);   // Top-Right: Up & Right

    const y4 = useTransform(scrollY, [0, 500], [0, 120]);
    const x4 = useTransform(scrollY, [0, 500], [0, 100]);  // Bottom-Right: Down & Right

    const rotate1 = useTransform(scrollY, [0, 500], [0, -10]);
    const rotate2 = useTransform(scrollY, [0, 500], [0, 10]);

    return (
        <section className="relative min-h-screen flex items-center flex-col justify-center overflow-hidden bg-black">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://res.cloudinary.com/dmxmzannb/image/upload/v1767599662/UX-Duky-AI_1_zufq7x.jpg"
                    onError={(e) => {
                        // Fallback to img_base if bg_banner is missing
                        e.currentTarget.src = "/img/img_base.webp";
                    }}
                    alt="Banner Background"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Gradient Background Overlays */}
            <div className="absolute inset-0 z-1">
                {/* Base gradient - darker at bottom */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />

                {/* Radial gradient overlay */}
                <div className="absolute inset-0 bg-gradient-radial from-orange-600/20 via-transparent to-transparent" />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `linear-gradient(rgba(249, 115, 22, 0.1) 1px, transparent 1px),
                                        linear-gradient(90deg, rgba(249, 115, 22, 0.1) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px'
                    }}
                />
            </div>



            {/* Floating Images - Parallax Effect + Idle Float */}
            {/* Top Left */}
            <motion.div
                style={{ y: y1, x: x1, rotate: -16 }}
                className="absolute origin-bottom top-60 md:top-30 left-10 md:left-[20%] z-10"
            >
                <motion.div
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-32 h-40 md:w-48 md:h-60 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20"
                >
                    <img
                        src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768468422339-m212a.png"
                        alt="AI Generated Portrait"
                        className="w-full h-full object-cover rounded-xl"
                    />
                </motion.div>
            </motion.div>

            {/* Bottom Left */}
            <motion.div
                style={{ y: y2, x: x2, rotate: 8 }}
                className="absolute  bottom-60 md:bottom-70 left-10 md:left-[20%] z-99"
            >
                <motion.div
                    animate={{ y: [-12, 12, -12] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="w-20 h-24 md:w-52 md:h-64 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20"
                >
                    <img
                        src="https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768216136/mmtmjsb4lpgpf4jtap0j.webp"
                        alt="AI Generated Art"
                        className="w-full h-full object-cover rounded-xl"
                    />
                </motion.div>
            </motion.div>

            {/* Top Right */}
            <motion.div
                style={{ y: y3, x: x3, rotate: 12 }}
                className="absolute origin-center top-70 md:top-30 right-10 md:right-[20%] z-10"
            >
                <motion.div
                    animate={{ y: [-8, 8, -8] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="w-20 h-38 md:w-56 md:h-72 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20"
                >
                    <img
                        src="https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768297111/h3iqw2os6titioiulq8l.webp"
                        alt="AI Portrait"
                        className="w-full h-full object-cover"
                    />
                </motion.div>
            </motion.div>

            {/* Bottom Right */}
            <motion.div
                style={{ y: y4, x: x4, rotate: -8 }}
                className="absolute origin-center bottom-50 md:bottom-85 right-5 md:right-[20%] z-99"
            >
                <motion.div
                    animate={{ y: [-15, 15, -15] }}
                    transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                    className="w-32 h-40 md:w-44 md:h-56 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20"
                >
                    <img
                        src="https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768206045/krxq16y49k91zevbw6os.webp"
                        alt="AI Generated"
                        className="w-full h-full object-cover"
                    />
                </motion.div>
            </motion.div>

            {/* Center Content - Fixed */}
            <div className="relative z-20 w-full px-6 pb-40 text-center top-[-50px] md:top-10">
                {/* Badge */}
                {/* <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-8 backdrop-blur-sm"
                >
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-orange-400 text-sm font-medium">AI-Powered Image Generation</span>
                </motion.div> */}

                {/* Main Heading */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-3xl md:text-4xl lg:text-5xl   leading-tight"
                >
                    <span className="text-white">AI tạo hình cho</span>
                    <br />
                    <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                        cá nhân và doanh nghiệp
                    </span>
                </motion.h1>

                {/* Subheading */}
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
                >
                    Chuẩn hoá hình ảnh doanh nghiệp bằng AI
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <button
                        onClick={() => router.push('/tool/free-generation')}
                        className="group cursor-pointer btn_main relative rounded-full px-10 py-3 text-white font-semibold shadow-lg shadow-orange-500/50 hover:shadow-xl hover:shadow-orange-500/60 transition-all duration-300 hover:scale-105"
                    >
                        <span className="flex items-center gap-2">
                            Thử ngay

                        </span>
                    </button>

                    <button
                        onClick={() => router.push('/tool')}
                        className="cursor-pointer px-10 py-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white font-semibold hover:bg-white/10 transition-all duration-300"
                    >
                        Công cụ
                    </button>
                </motion.div>

                {/* Center Mockup Image - Fixed Position */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="relative mt-16 mx-auto max-w-4xl"
                >
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-white/10  to-white/15 backdrop-blur-sm p-4">
                        {/* Mockup placeholder - replace with actual screenshot */}
                        <img
                            src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768622719139-5ilv1h.png"
                            alt="AI Portrait"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </motion.div>


            </div>

        </section>
    );
};

export default LeonardoBanner;
