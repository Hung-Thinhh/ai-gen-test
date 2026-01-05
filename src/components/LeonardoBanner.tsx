'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';

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
    const y2 = useTransform(scrollY, [0, 500], [0, 100]);
    const y3 = useTransform(scrollY, [0, 500], [0, -80]);
    const y4 = useTransform(scrollY, [0, 500], [0, 120]);

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



            {/* Floating Images - Parallax Effect */}
            {/* Top Left */}
            <motion.div
                style={{ y: y1, rotate: -16 }}
                className="absolute origin-bottom top-20 left-10 md:left-[20%] w-32 h-40 md:w-48 md:h-60 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 z-10"
            >
                <img
                    src="/img/beauty.webp"
                    alt="AI Generated Portrait"
                    className="w-full h-full object-cover rounded-xl"
                />
            </motion.div>

            {/* Bottom Left */}
            <motion.div
                style={{ y: y2, rotate: -8 }}
                className="absolute origin-bottom bottom-70 left-10 md:left-[20%] w-36 h-44 md:w-52 md:h-64 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 z-99"
            >
                <img
                    src="/img/thoitrang.webp"
                    alt="AI Generated Art"
                    className="w-full h-full object-cover rounded-xl"
                />
            </motion.div>

            {/* Top Right */}
            <motion.div
                style={{ y: y3, rotate: 12 }}
                className="absolute origin-center top-32 right-10 md:right-[20%] w-40 h-48 md:w-56 md:h-72 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 z-10"
            >
                <img
                    src="/img/doanhnhan.webp"
                    alt="AI Portrait"
                    className="w-full h-full object-cover"
                />
            </motion.div>

            {/* Bottom Right */}
            <motion.div
                style={{ y: y4, rotate: 8 }}
                className="absolute origin-center bottom-85 right-10 md:right-[20%] w-32 h-40 md:w-44 md:h-56 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 z-99"
            >
                <img
                    src="/img/baby.webp"
                    alt="AI Generated"
                    className="w-full h-full object-cover"
                />
            </motion.div>

            {/* Center Content - Fixed */}
            <div className="relative z-20 w-full px-6 pb-40 text-center">
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
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-orange-500/10 to-orange-600/5 backdrop-blur-sm p-4">
                        {/* Mockup placeholder - replace with actual screenshot */}
                        <img
                            src="/img/trungthu.webp"
                            alt="AI Portrait"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </motion.div>


            </div>
            {/* Benefits Grid */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="benefit relative z-20 container max-w-[1300px] mx-auto px-6 mt-10 z-999"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1300px] mx-auto">
                    {/* Item 1 */}
                    <div className="group p-8 rounded-3xl bg-orange-400/30 backdrop-blur-md border border-white/10 hover:border-orange-500/30 transition-all duration-300 hover:transform hover:-translate-y-2">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all duration-300">
                            <svg className="w-10 h-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <p className="text-white text-lg font-medium leading-relaxed">
                            Tạo ảnh nhanh chóng,<br />số lượng lớn
                        </p>
                    </div>

                    {/* Item 2 */}
                    <div className="group p-8 rounded-3xl bg-orange-400/30 backdrop-blur-md border border-white/10 hover:border-orange-500/30 transition-all duration-300 hover:transform hover:-translate-y-2">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all duration-300">
                            <svg className="w-10 h-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-white text-lg font-medium leading-relaxed">
                            Tiết kiệm chi phí<br />& thời gian
                        </p>
                    </div>

                    {/* Item 3 */}
                    <div className="group p-8 rounded-3xl bg-orange-400/30 backdrop-blur-md border border-white/10 hover:border-orange-500/30 transition-all duration-300 hover:transform hover:-translate-y-2">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all duration-300">
                            <svg className="w-10 h-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <p className="text-white text-lg font-medium leading-relaxed">
                            Dễ dàng thay đổi concept,<br />không phụ thuộc đội ngũ
                        </p>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

export default LeonardoBanner;
