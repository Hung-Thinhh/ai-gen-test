'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LeonardoHeader } from '@/components/LeonardoHeader';
import MobileHeader from '@/components/MobileHeader';
import Link from 'next/link';

/* ─────────── Custom Hook: Scroll Animation ─────────── */
function useScrollAnimation(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(entry.target); } },
            { threshold }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [threshold]);
    return { ref, isVisible };
}

/* ─────────── Animated Counter ─────────── */
function AnimatedCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
    const [count, setCount] = useState(0);
    const { ref, isVisible } = useScrollAnimation(0.3);
    useEffect(() => {
        if (!isVisible) return;
        let start = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else { setCount(Math.floor(start)); }
        }, 16);
        return () => clearInterval(timer);
    }, [isVisible, target, duration]);
    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function GraphicDesignPage() {
    const hero = useScrollAnimation(0.1);
    const stats = useScrollAnimation();
    const features = useScrollAnimation();
    const promo = useScrollAnimation();
    const process = useScrollAnimation();
    const zigzag1 = useScrollAnimation();
    const zigzag2 = useScrollAnimation();
    const tools = useScrollAnimation();
    const banner = useScrollAnimation(0.1);
    const enterprise = useScrollAnimation();

    return (
        <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden">
            <LeonardoHeader />
            <MobileHeader title="Graphic Design" />

            <style jsx global>{`
                @keyframes fadeUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideInLeft { from { opacity: 0; transform: translateX(-60px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes slideInRight { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
                @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
                @keyframes glow { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
                @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 20px rgba(249,115,22,0.2); } 50% { box-shadow: 0 0 40px rgba(249,115,22,0.4); } }
                .animate-fadeUp { animation: fadeUp 0.8s ease-out forwards; }
                .animate-fadeUp-d1 { animation: fadeUp 0.8s ease-out 0.1s forwards; opacity: 0; }
                .animate-fadeUp-d2 { animation: fadeUp 0.8s ease-out 0.2s forwards; opacity: 0; }
                .animate-fadeUp-d3 { animation: fadeUp 0.8s ease-out 0.3s forwards; opacity: 0; }
                .animate-fadeUp-d4 { animation: fadeUp 0.8s ease-out 0.4s forwards; opacity: 0; }
                .animate-fadeUp-d5 { animation: fadeUp 0.8s ease-out 0.5s forwards; opacity: 0; }
                .animate-slideLeft { animation: slideInLeft 0.8s ease-out forwards; }
                .animate-slideRight { animation: slideInRight 0.8s ease-out forwards; }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-float-slow { animation: float 8s ease-in-out infinite; }
                .animate-glow { animation: glow 3s ease-in-out infinite; }
                .animate-pulseGlow { animation: pulseGlow 2s ease-in-out infinite; }
                .glass-card-blue { background: rgba(255,255,255,0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); transition: all 0.5s; }
                .glass-card-blue:hover { background: rgba(255,255,255,0.06); border-color: rgba(249,115,22,0.3); transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 0 30px rgba(249,115,22,0.1); }
                .gradient-text-blue { background: linear-gradient(135deg, #f97316, #fb923c, #f97316); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 4s linear infinite; }
                .dot-pattern { background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 24px 24px; }
            `}</style>

            {/* ===== HERO ===== */}
            <section className="relative pt-20 pb-12 sm:pt-24 sm:pb-16 md:pt-32 md:pb-24 px-4 sm:px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] md:w-[1000px] h-[300px] sm:h-[400px] md:h-[500px] bg-gradient-to-b from-orange-500/15 via-red-500/8 to-transparent blur-3xl pointer-events-none"></div>
                <div className="absolute top-20 right-10 w-32 h-32 rounded-full bg-orange-500/10 blur-2xl animate-float pointer-events-none"></div>
                <div className="absolute top-40 left-10 w-24 h-24 rounded-full bg-red-500/10 blur-2xl animate-float-slow pointer-events-none"></div>
                <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none"></div>

                <div ref={hero.ref} className={`container mx-auto max-w-7xl relative z-10 transition-all duration-1000 ${hero.isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
                        <div className="space-y-5 sm:space-y-7 text-center lg:text-left">
                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 ${hero.isVisible ? 'animate-fadeUp' : 'opacity-0'}`}>
                                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                                <span className="text-orange-400 text-xs sm:text-sm font-medium">AI Graphic Design</span>
                            </div>
                            <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.15] ${hero.isVisible ? 'animate-fadeUp-d1' : 'opacity-0'}`}>
                                Thiết kế đồ họa{' '}
                                <span className="gradient-text-blue">chuyên nghiệp</span>{' '}
                                không cần designer
                            </h1>
                            <p className={`text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl mx-auto lg:mx-0 ${hero.isVisible ? 'animate-fadeUp-d2' : 'opacity-0'}`}>
                                Logo, illustration, typography, concept art — mô tả ý tưởng bằng tiếng Việt,
                                AI tạo ra thiết kế sẵn sàng sử dụng.
                            </p>
                            <div className={`flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2 justify-center lg:justify-start ${hero.isVisible ? 'animate-fadeUp-d3' : 'opacity-0'}`}>
                                <Link href="/tool/concept-studio" className="group px-7 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300 text-center animate-pulseGlow">
                                    Thử Concept Studio
                                    <svg className="inline w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </Link>
                                <Link href="/pricing" className="px-7 sm:px-8 py-3.5 sm:py-4 border border-white/15 rounded-xl font-semibold hover:bg-white/5 hover:border-white/25 transition-all duration-300 text-center">
                                    Xem Bảng Giá →
                                </Link>
                            </div>
                            <div className={`flex items-center gap-4 sm:gap-6 justify-center lg:justify-start ${hero.isVisible ? 'animate-fadeUp-d4' : 'opacity-0'}`}>
                                {['Miễn phí bắt đầu', '100% bản quyền', 'Tiếng Việt'].map((t, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        <span className="text-xs sm:text-sm text-zinc-500">{t}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className={`relative mt-4 lg:mt-0 ${hero.isVisible ? 'animate-slideRight' : 'opacity-0'}`}>
                            <div className="absolute -inset-6 bg-gradient-to-r from-orange-500/20 via-red-500/15 to-orange-500/20 rounded-3xl blur-3xl animate-glow"></div>
                            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-orange-500/10">
                                <img src="https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&h=700&fit=crop" alt="AI Graphic Design" className="w-full h-[260px] sm:h-[360px] md:h-[420px] lg:h-[520px] object-cover" />
                                <div className="absolute bottom-4 left-4 right-4 glass-card-blue rounded-xl p-3 sm:p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        </div>
                                        <div><p className="text-sm font-semibold text-white">Logo đã tạo xong</p><p className="text-xs text-zinc-400">5 phương án • 6 giây</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== TRUST BAR ===== */}
            <section className="py-5 sm:py-6 px-4 sm:px-6 border-y border-white/[0.06] bg-white/[0.01]">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
                        <p className="text-xs sm:text-sm text-zinc-500 text-center md:text-left">Công cụ thiết kế AI hàng đầu Việt Nam</p>
                        <div className="flex items-center gap-8 sm:gap-12 md:gap-16">
                            <div className="text-center"><div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-400">50+</div><div className="text-[10px] sm:text-xs text-zinc-500">Phong cách thiết kế</div></div>
                            <div className="text-center"><div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-400">10x</div><div className="text-[10px] sm:text-xs text-zinc-500">Nhanh hơn Photoshop</div></div>
                            <div className="text-center"><div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-400">4K</div><div className="text-[10px] sm:text-xs text-zinc-500">Chất lượng xuất ảnh</div></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== STATS ===== */}
            <section className="py-14 sm:py-18 md:py-24 px-4 sm:px-6 bg-[#09090b] relative overflow-hidden">
                <div className="absolute inset-0 dot-pattern opacity-20 pointer-events-none"></div>
                <div ref={stats.ref} className={`container mx-auto max-w-5xl relative z-10 transition-all duration-700 ${stats.isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <p className={`text-center text-zinc-300 text-base sm:text-lg mb-10 sm:mb-14 px-2 ${stats.isVisible ? 'animate-fadeUp' : ''}`}>
                        Hàng ngàn designer và agency tin dùng Duky AI
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
                        {[
                            { target: 500000, suffix: '+', label: 'Thiết kế được tạo', sub: 'mỗi tháng trên nền tảng', delay: 'd1' },
                            { target: 50, suffix: '+', label: 'Mô hình AI', sub: 'chuyên biệt cho design', delay: 'd2' },
                            { target: 4, suffix: 'K', label: 'Độ phân giải', sub: 'xuất ảnh tối đa', delay: 'd3' }
                        ].map((stat, i) => (
                            <div key={i} className={`glass-card-blue rounded-2xl p-6 sm:p-8 text-center cursor-default ${stats.isVisible ? `animate-fadeUp-${stat.delay}` : 'opacity-0'}`}>
                                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3">
                                    <span className="gradient-text-blue"><AnimatedCounter target={stat.target} suffix={stat.suffix} /></span>
                                </div>
                                <p className="text-white font-medium text-sm sm:text-base">{stat.label}</p>
                                <p className="text-zinc-500 text-xs sm:text-sm mt-1">{stat.sub}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FEATURE CARDS ===== */}
            <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-[#09090b]">
                <div ref={features.ref} className="container mx-auto max-w-6xl">
                    <div className={`text-center mb-12 sm:mb-16 transition-all duration-700 ${features.isVisible ? 'animate-fadeUp' : 'opacity-0'}`}>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-5 px-2">
                            Công cụ design AI <span className="gradient-text-blue">thực chiến</span>
                        </h2>
                        <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed text-sm sm:text-base px-2">
                            Từ logo đến illustration, từ concept art đến typography — công cụ bạn dùng hàng ngày.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                        {designTools.map((tool, index) => (
                            <Link key={index} href={tool.href} className={`group glass-card-blue rounded-2xl p-5 sm:p-6 cursor-pointer ${features.isVisible ? `animate-fadeUp-d${index + 1}` : 'opacity-0'}`}>
                                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 group-hover:from-orange-500/30 group-hover:to-red-500/30 transition-colors">
                                    <div className="text-orange-400">{tool.icon}</div>
                                </div>
                                <h3 className="font-semibold text-white text-base sm:text-lg mb-2 group-hover:text-orange-300 transition-colors">{tool.title}</h3>
                                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed mb-3">{tool.description}</p>
                                <span className="inline-flex items-center gap-1 text-xs text-orange-400/70 group-hover:text-orange-400 transition-colors">
                                    Thử ngay <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== PROMO ===== */}
            <section className="py-12 sm:py-16 px-4 sm:px-6 bg-black/50">
                <div ref={promo.ref} className="container mx-auto max-w-6xl">
                    <h2 className={`text-lg sm:text-xl text-zinc-500 mb-6 text-center ${promo.isVisible ? 'animate-fadeUp' : 'opacity-0'}`}>Phù hợp mọi ngành thiết kế</h2>
                    <div className={`flex flex-wrap justify-center items-center gap-6 sm:gap-10 md:gap-14 mb-10 sm:mb-14 ${promo.isVisible ? 'animate-fadeUp-d1' : 'opacity-0'}`}>
                        {['BRANDING', 'UI/UX', 'SOCIAL MEDIA', 'PACKAGING', 'ILLUSTRATION'].map((industry, i) => (
                            <div key={i} className="text-sm sm:text-lg md:text-xl font-bold tracking-[0.2em] text-zinc-600 hover:text-orange-400/60 transition-colors duration-300 cursor-default">{industry}</div>
                        ))}
                    </div>
                    <div className={`relative rounded-2xl overflow-hidden ${promo.isVisible ? 'animate-fadeUp-d2' : 'opacity-0'}`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#1a0e05] to-[#09090b]"></div>
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/8 to-transparent"></div>
                        <div className="relative z-10 p-7 sm:p-10 md:p-14 border border-white/[0.06] rounded-2xl">
                            <div className="max-w-xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 text-orange-400 text-xs sm:text-sm mb-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></div>
                                    Ý tưởng → Thiết kế chỉ trong vài giây
                                </div>
                                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                                    Bạn nghĩ — AI vẽ.<br />
                                    <span className="text-zinc-400">Nhanh. Đẹp. Chuyên nghiệp.</span>
                                </h3>
                                <p className="text-sm sm:text-base text-zinc-400 mb-6 leading-relaxed">
                                    Nhập "Logo quán cà phê vintage, tông nâu ấm" — AI tạo 5 phương án logo chuyên nghiệp ngay lập tức.
                                </p>
                                <Link href="/tool/concept-studio" className="group inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors text-sm sm:text-base font-medium">
                                    Thử Concept Studio ngay
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== PROCESS STEPS ===== */}
            <section className="py-14 sm:py-18 md:py-24 px-4 sm:px-6 bg-[#09090b]">
                <div ref={process.ref} className="container mx-auto max-w-5xl">
                    <div className={`text-center mb-12 sm:mb-16 ${process.isVisible ? 'animate-fadeUp' : 'opacity-0'}`}>
                        <span className="gradient-text-blue text-lg sm:text-xl font-semibold">3 bước tạo thiết kế đồ họa AI</span>
                    </div>
                    <div className="relative">
                        <div className="hidden sm:block absolute top-24 left-[16.67%] right-[16.67%] h-[2px] bg-gradient-to-r from-orange-500/30 via-red-500/30 to-orange-500/30"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
                            {processSteps.map((step, index) => (
                                <div key={index} className={`flex flex-col items-center text-center ${process.isVisible ? `animate-fadeUp-d${index + 1}` : 'opacity-0'}`}>
                                    <div className="relative mb-6">
                                        <div className="absolute -inset-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl blur-lg opacity-30 animate-glow"></div>
                                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                            <span className="text-2xl sm:text-3xl font-bold text-white">{index + 1}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">{step.title}</h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">{step.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== ZIGZAG ===== */}
            <section className="py-14 sm:py-18 md:py-24 px-4 sm:px-6 bg-[#09090b]">
                <div className="container mx-auto max-w-6xl">
                    <div ref={zigzag1.ref} className="grid lg:grid-cols-2 gap-10 sm:gap-12 md:gap-16 items-center mb-20 sm:mb-28">
                        <div className={`space-y-5 ${zigzag1.isVisible ? 'animate-slideLeft' : 'opacity-0'}`}>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20"><span className="text-orange-400 text-xs sm:text-sm font-medium">CONCEPT STUDIO</span></div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">Biến concept thành<br /><span className="text-zinc-400">thiết kế hoàn chỉnh</span></h2>
                            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">Upload sketch, wireframe hoặc mô tả ý tưởng — AI tạo thiết kế hoàn chỉnh với màu sắc, typography và bố cục chuyên nghiệp.</p>
                            <ul className="space-y-3">
                                {['Biến sketch phác thảo thành design hoàn chỉnh', 'Nhiều phong cách: flat, 3D, realistic, minimal', 'Xuất PNG/JPG chất lượng cao'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm sm:text-base text-zinc-300">
                                        <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/tool/concept-studio" className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-semibold text-sm sm:text-base text-white hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300">
                                Thử Concept Studio <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </Link>
                        </div>
                        <div className={`relative ${zigzag1.isVisible ? 'animate-slideRight' : 'opacity-0'}`}>
                            <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/15 to-red-500/15 rounded-3xl blur-3xl"></div>
                            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                <img src="https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&h=400&fit=crop" alt="Concept Studio AI" className="w-full h-[220px] sm:h-[300px] md:h-[380px] object-cover" />
                            </div>
                        </div>
                    </div>

                    <div ref={zigzag2.ref} className="grid lg:grid-cols-2 gap-10 sm:gap-12 md:gap-16 items-center">
                        <div className={`relative order-2 lg:order-1 ${zigzag2.isVisible ? 'animate-slideLeft' : 'opacity-0'}`}>
                            <div className="absolute -inset-4 bg-gradient-to-r from-red-500/15 to-orange-500/15 rounded-3xl blur-3xl"></div>
                            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&fit=crop" alt="Color Palette AI" className="w-full h-[220px] sm:h-[300px] md:h-[380px] object-cover" />
                            </div>
                        </div>
                        <div className={`space-y-5 order-1 lg:order-2 ${zigzag2.isVisible ? 'animate-slideRight' : 'opacity-0'}`}>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20"><span className="text-orange-400 text-xs sm:text-sm font-medium">COLOR PALETTE</span></div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">Đổi bảng màu<br /><span className="text-zinc-400">chỉ với một cú click</span></h2>
                            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">AI phân tích thiết kế và đề xuất bảng màu hài hòa. Thay đổi toàn bộ tông màu thiết kế tức thì, giữ nguyên bố cục.</p>
                            <Link href="/tool/color-palette-swap" className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-semibold text-sm sm:text-base text-white hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300">
                                Thử Color Palette Swap <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== MORE TOOLS ===== */}
            <section className="py-14 sm:py-18 md:py-24 px-4 sm:px-6 bg-[#09090b]">
                <div ref={tools.ref} className="container mx-auto max-w-6xl">
                    <div className={`text-center mb-10 sm:mb-14 ${tools.isVisible ? 'animate-fadeUp' : 'opacity-0'}`}>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Và <span className="gradient-text-blue">nhiều công cụ</span> design khác</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        {moreDesignTools.map((tool, index) => (
                            <Link key={index} href={tool.href} className={`group glass-card-blue rounded-xl p-4 sm:p-5 cursor-pointer ${tools.isVisible ? `animate-fadeUp-d${Math.min(index + 1, 5)}` : 'opacity-0'}`}>
                                <div className="text-orange-400/70 mb-3 group-hover:text-orange-400 transition-colors">{tool.icon}</div>
                                <h4 className="font-semibold text-sm sm:text-base text-white mb-1 group-hover:text-orange-300 transition-colors">{tool.title}</h4>
                                <p className="text-xs text-zinc-500 leading-relaxed">{tool.desc}</p>
                            </Link>
                        ))}
                    </div>
                    <div className={`text-center mt-8 sm:mt-10 ${tools.isVisible ? 'animate-fadeUp-d5' : 'opacity-0'}`}>
                        <Link href="/tool" className="group inline-flex items-center gap-2 px-6 py-3 border border-white/10 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:border-orange-500/30 hover:bg-orange-500/5 transition-all duration-300">
                            Xem tất cả công cụ <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ===== BANNER ===== */}
            <section ref={banner.ref} className="relative h-[300px] sm:h-[380px] md:h-[460px] lg:h-[520px] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1600&h=800&fit=crop" alt="Design Studio" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/30"></div>
                <div className={`absolute inset-0 flex items-center transition-all duration-1000 ${banner.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="container mx-auto max-w-6xl px-4 sm:px-6">
                        <div className="max-w-lg">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs sm:text-sm mb-4"><div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></div>Creative Tools</div>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">Giải phóng sức sáng tạo <span className="gradient-text-blue">miễn phí</span></h2>
                            <p className="text-sm sm:text-base text-zinc-300 mb-6">Đăng ký ngay để nhận credits miễn phí. Bắt đầu thiết kế ngay hôm nay.</p>
                            <Link href="/tool" className="group inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300">
                                Bắt đầu thiết kế — Miễn phí <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== ENTERPRISE ===== */}
            <section className="py-14 sm:py-18 md:py-24 px-4 sm:px-6 bg-[#09090b]">
                <div ref={enterprise.ref} className="container mx-auto max-w-6xl">
                    <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 md:gap-16 items-center">
                        <div className={`transition-all duration-700 ${enterprise.isVisible ? 'animate-slideLeft' : 'opacity-0'}`}>
                            <div className="glass-card-blue rounded-2xl p-7 sm:p-9 md:p-11 hover:transform-none">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 mb-5"><span className="text-orange-400 text-xs sm:text-sm font-medium">DOANH NGHIỆP</span></div>
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 leading-tight">Giải pháp design AI<br /><span className="text-zinc-400">cho team sáng tạo</span></h2>
                                <p className="text-sm sm:text-base text-zinc-400 mb-6 leading-relaxed">Brand guidelines, workspace chia sẻ, template library, và API tích hợp cho agency và in-house design team.</p>
                                <ul className="space-y-3 mb-7">
                                    {['Quản lý brand assets & style guide', 'API tạo thiết kế tự động', 'Hỗ trợ kỹ thuật ưu tiên 24/7'].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                                            <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <Link href="/contact" className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-semibold text-sm sm:text-base hover:bg-zinc-100 transition-colors">
                                    Liên hệ tư vấn <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </Link>
                            </div>
                        </div>
                        <div className={`relative ${enterprise.isVisible ? 'animate-slideRight' : 'opacity-0'}`}>
                            <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/15 to-red-500/15 rounded-3xl blur-3xl"></div>
                            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                <img src="https://images.unsplash.com/photo-1542744094-3a31f272c490?w=600&h=450&fit=crop" alt="Design Team" className="w-full h-[220px] sm:h-[320px] md:h-[400px] object-cover" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

/* ═══════════ DATA ═══════════ */
const designTools = [
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>, title: 'Concept Studio', description: 'Biến concept, sketch thành thiết kế hoàn chỉnh với nhiều phong cách.', href: '/tool/concept-studio' },
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>, title: 'Typographic Illustrator', description: 'Typography nghệ thuật cho logo và thương hiệu.', href: '/tool/typographic-illustrator' },
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>, title: 'Color Palette Swap', description: 'Đổi toàn bộ bảng màu thiết kế tức thì với AI.', href: '/tool/color-palette-swap' },
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, title: 'Free Generation', description: 'Tạo hình ảnh tự do từ prompt, không giới hạn style.', href: '/tool/free-generation' }
];

const processSteps = [
    { title: 'Mô tả ý tưởng', description: 'Nhập prompt bằng tiếng Việt: mô tả thiết kế, phong cách, màu sắc mong muốn.' },
    { title: 'AI tạo thiết kế', description: 'AI phân tích prompt và tạo nhiều phương án thiết kế trong vài giây.' },
    { title: 'Tinh chỉnh & xuất file', description: 'Chọn phương án tốt nhất, tải file chất lượng cao ngay lập tức.' }
];

const moreDesignTools = [
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>, title: 'Swap Style', desc: 'Chuyển phong cách ảnh bằng AI', href: '/tool/swap-style' },
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" /></svg>, title: 'Inpainter', desc: 'Xóa/thêm chi tiết trong thiết kế', href: '/tool/inpainter' },
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>, title: 'Object Remover', desc: 'Xóa vật thể thừa khỏi ảnh', href: '/tool/object-remover' },
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" /></svg>, title: 'Process Creator', desc: 'Infographic quy trình sản phẩm', href: '/tool/product-process-creator' },
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /></svg>, title: 'Product Mockup', desc: 'Mockup sản phẩm chuyên nghiệp', href: '/tool/product-mockup' },
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" /><path d="M3 9h18M9 3v18" strokeWidth="1.5" /></svg>, title: 'Poster Creator', desc: 'Tạo poster quảng cáo từ prompt', href: '/tool/poster-creator' }
];
