'use client';
import React, { useState, useEffect, useRef } from 'react';
import { LeonardoHeader } from '@/components/LeonardoHeader';
import MobileHeader from '@/components/MobileHeader';
import Link from 'next/link';
import Image from 'next/image';

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

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const { ref, isVisible } = useScrollAnimation(0.3);
    useEffect(() => {
        if (!isVisible) return;
        let s = 0; const inc = target / 125;
        const t = setInterval(() => { s += inc; if (s >= target) { setCount(target); clearInterval(t); } else setCount(Math.floor(s)); }, 16);
        return () => clearInterval(t);
    }, [isVisible, target]);
    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function AiStudioPage() {
    const hero = useScrollAnimation(0.1);
    const stats = useScrollAnimation();
    const feat = useScrollAnimation();
    const promo = useScrollAnimation();
    const proc = useScrollAnimation();
    const z1 = useScrollAnimation();
    const z2 = useScrollAnimation();
    const tools = useScrollAnimation();
    const ban = useScrollAnimation(0.1);
    const ent = useScrollAnimation();

    return (
        <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden">
            <LeonardoHeader /><MobileHeader title="AI Studio" />
            <style jsx global>{`
                @keyframes fadeUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
                @keyframes slideL{from{opacity:0;transform:translateX(-60px)}to{opacity:1;transform:translateX(0)}}
                @keyframes slideR{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}
                @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
                @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
                @keyframes glow{0%,100%{opacity:.4}50%{opacity:.8}}
                @keyframes pGlow{0%,100%{box-shadow:0 0 20px rgba(249,115,22,.2)}50%{box-shadow:0 0 40px rgba(249,115,22,.4)}}
                .aFU{animation:fadeUp .8s ease-out forwards}.aFU1{animation:fadeUp .8s ease-out .1s forwards;opacity:0}.aFU2{animation:fadeUp .8s ease-out .2s forwards;opacity:0}.aFU3{animation:fadeUp .8s ease-out .3s forwards;opacity:0}.aFU4{animation:fadeUp .8s ease-out .4s forwards;opacity:0}.aFU5{animation:fadeUp .8s ease-out .5s forwards;opacity:0}
                .aSL{animation:slideL .8s ease-out forwards}.aSR{animation:slideR .8s ease-out forwards}
                .aFloat{animation:float 6s ease-in-out infinite}.aFloatS{animation:float 8s ease-in-out infinite}
                .aGlow{animation:glow 3s ease-in-out infinite}.aPGlow{animation:pGlow 2s ease-in-out infinite}
                .gcP{background:rgba(255,255,255,.03);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.08);transition:all .5s}
                .gcP:hover{background:rgba(255,255,255,.06);border-color:rgba(249,115,22,.3);transform:translateY(-4px);box-shadow:0 20px 40px rgba(0,0,0,.3),0 0 30px rgba(249,115,22,.1)}
                .gtP{background:linear-gradient(135deg,#f97316,#fb923c,#f97316);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite}
                .dot{background-image:radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px);background-size:24px 24px}
            `}</style>

            {/* HERO */}
            <section className="relative pt-20 pb-12 sm:pt-24 sm:pb-16 md:pt-32 md:pb-24 px-4 sm:px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] md:w-[1000px] h-[400px] md:h-[500px] bg-gradient-to-b from-orange-500/15 via-red-500/8 to-transparent blur-3xl pointer-events-none"></div>
                <div className="absolute top-20 right-10 w-32 h-32 rounded-full bg-orange-500/10 blur-2xl aFloat pointer-events-none"></div>
                <div className="absolute top-40 left-10 w-24 h-24 rounded-full bg-red-500/10 blur-2xl aFloatS pointer-events-none"></div>
                <div className="absolute inset-0 dot opacity-30 pointer-events-none"></div>
                <div ref={hero.ref} className={`container mx-auto max-w-7xl relative z-10 transition-all duration-1000 ${hero.isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
                        <div className="space-y-5 sm:space-y-7 text-center lg:text-left">
                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 ${hero.isVisible ? 'aFU' : 'opacity-0'}`}><div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div><span className="text-orange-400 text-xs sm:text-sm font-medium">AI Photo Studio</span></div>
                            <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.15] ${hero.isVisible ? 'aFU1' : 'opacity-0'}`}>Chụp ảnh chân dung <span className="gtP">AI chuyên nghiệp</span> từ selfie</h1>
                            <p className={`text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl mx-auto lg:mx-0 ${hero.isVisible ? 'aFU2' : 'opacity-0'}`}>Chọn concept — upload 5-10 ảnh selfie — AI tạo bộ ảnh chân dung chuyên nghiệp với nhiều phong cách: business, creative, lifestyle.</p>
                            <div className={`flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2 justify-center lg:justify-start ${hero.isVisible ? 'aFU3' : 'opacity-0'}`}>
                                <Link href="/studio" className="group px-7 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all text-center aPGlow">Thử AI Studio<svg className="inline w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></Link>
                                <Link href="/pricing" className="px-7 sm:px-8 py-3.5 sm:py-4 border border-white/15 rounded-xl font-semibold hover:bg-white/5 transition-all text-center">Xem Bảng Giá →</Link>
                            </div>
                            <div className={`flex items-center gap-4 sm:gap-6 justify-center lg:justify-start ${hero.isVisible ? 'aFU4' : 'opacity-0'}`}>
                                {['Chỉ cần selfie', '50+ concept', 'Tiếng Việt'].map((t, i) => (<div key={i} className="flex items-center gap-1.5"><svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg><span className="text-xs sm:text-sm text-zinc-500">{t}</span></div>))}
                            </div>
                        </div>
                        <div className={`relative mt-4 lg:mt-0 ${hero.isVisible ? 'aSR' : 'opacity-0'}`}>
                            <div className="absolute -inset-6 bg-gradient-to-r from-orange-500/20 via-red-500/15 to-orange-500/20 rounded-3xl blur-3xl aGlow"></div>
                            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-orange-500/10">
                                <img src="https://res.cloudinary.com/dmxmzannb/image/upload/v1770954494/CH%E1%BB%A4P-%E1%BA%A2NH-CH%C3%82N-DUNG-AI-CHUY%C3%8AN-NGHI%E1%BB%86P_zud29x.webp" alt="AI Portrait Studio" className="w-full h-[260px] sm:h-[360px] md:h-[420px] lg:h-[520px] object-cover" />
                                <div className="absolute bottom-4 left-4 right-4 gcP rounded-xl p-3 sm:p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div><div><p className="text-sm font-semibold text-white">Bộ ảnh chân dung hoàn tất</p><p className="text-xs text-zinc-400">12 ảnh • Business concept</p></div></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TRUST */}
            <section className="py-5 sm:py-6 px-4 sm:px-6 border-y border-white/[0.06] bg-white/[0.01]">
                <div className="container mx-auto max-w-6xl"><div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
                    <p className="text-xs sm:text-sm text-zinc-500 text-center md:text-left">Studio ảnh chân dung AI hàng đầu Việt Nam</p>
                    <div className="flex items-center gap-8 sm:gap-16">
                        {[{ v: '50+', l: 'Concept phong cách' }, { v: '12', l: 'Ảnh/bộ' }, { v: 'HD', l: 'Chất lượng cao' }].map((s, i) => (<div key={i} className="text-center"><div className="text-lg sm:text-2xl font-bold text-orange-400">{s.v}</div><div className="text-[10px] sm:text-xs text-zinc-500">{s.l}</div></div>))}
                    </div>
                </div></div>
            </section>
            <div className="absolute z-0">
                <img
                    src="https://res.cloudinary.com/dmxmzannb/image/upload/v1767599662/UX-Duky-AI_1_zufq7x.jpg"
                    onError={(e) => {
                        // Fallback to img_base if bg_banner is missing
                        e.currentTarget.src = "/img/img_base.webp";
                    }}
                    alt="Banner Background"
                    className="w-full h-full object-contain"
                />
            </div>
            {/* STATS */}
            <section className="py-14 sm:py-24 px-4 sm:px-6 bg-[#09090b] relative overflow-hidden">
                <div className="absolute inset-0 dot opacity-20 pointer-events-none"></div>
                <div ref={stats.ref} className={`container mx-auto max-w-5xl relative z-10 transition-all duration-700 ${stats.isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <p className={`text-center text-zinc-300 text-base sm:text-lg mb-10 sm:mb-14 ${stats.isVisible ? 'aFU' : ''}`}>Hàng ngàn người đã có ảnh chân dung chuyên nghiệp nhờ AI</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
                        {[{ t: 100000, s: '+', l: 'Bộ ảnh đã tạo', sub: 'chân dung AI chuyên nghiệp', d: '1' }, { t: 50, s: '+', l: 'Concept sẵn có', sub: 'business, creative, lifestyle...', d: '2' }, { t: 95, s: '%', l: 'Hài lòng', sub: 'rating từ người dùng', d: '3' }].map((s, i) => (
                            <div key={i} className={`gcP rounded-2xl p-6 sm:p-8 text-center cursor-default ${stats.isVisible ? `aFU${s.d}` : 'opacity-0'}`}>
                                <div className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3"><span className="gtP"><AnimatedCounter target={s.t} suffix={s.s} /></span></div>
                                <p className="text-white font-medium text-sm sm:text-base">{s.l}</p><p className="text-zinc-500 text-xs sm:text-sm mt-1">{s.sub}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CONCEPTS */}
            <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#09090b]">
                <div ref={feat.ref} className="container mx-auto max-w-6xl">
                    <div className={`text-center mb-12 sm:mb-16 transition-all duration-700 ${feat.isVisible ? 'aFU' : 'opacity-0'}`}>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">Chọn concept — AI tạo <span className="gtP">bộ ảnh chuyên nghiệp</span></h2>
                        <p className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base">Mỗi concept được thiết kế bởi photographer chuyên nghiệp, tối ưu cho AI.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                        {CONCEPTS.map((c, i) => (<Link key={i} href="/studio" className={`group gcP rounded-2xl p-5 sm:p-6 ${feat.isVisible ? `aFU${Math.min(i + 1, 5)}` : 'opacity-0'}`}>
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 group-hover:from-orange-500/30 group-hover:to-red-500/30 transition-colors"><span className="text-2xl">{c.e}</span></div>
                            <h3 className="font-semibold text-white text-base sm:text-lg mb-2 group-hover:text-orange-300 transition-colors">{c.t}</h3>
                            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-3">{c.d}</p>
                            <span className="inline-flex items-center gap-1 text-xs text-orange-400/70 group-hover:text-orange-400 transition-colors">Thử concept này →</span>
                        </Link>))}
                    </div>
                </div>
            </section>

            {/* PROMO */}
            <section className="py-12 sm:py-16 px-4 sm:px-6 bg-black/50">
                <div ref={promo.ref} className="container mx-auto max-w-6xl">
                    <div className={`flex flex-wrap justify-center gap-6 sm:gap-14 mb-10 sm:mb-14 ${promo.isVisible ? 'aFU1' : 'opacity-0'}`}>
                        {['LINKEDIN', 'FACEBOOK', 'INSTAGRAM', 'WEBSITE', 'CV/RESUME'].map((p, i) => (<div key={i} className="text-sm sm:text-xl font-bold tracking-[0.2em] text-zinc-600 hover:text-orange-400/60 transition-colors cursor-default">{p}</div>))}
                    </div>
                    <div className={`relative rounded-2xl overflow-hidden ${promo.isVisible ? 'aFU2' : 'opacity-0'}`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#1a0e05] to-[#09090b]"></div>
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/8 to-transparent"></div>
                        <div className="relative z-10 p-7 sm:p-10 md:p-14 border border-white/[0.06] rounded-2xl">
                            <div className="max-w-xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 text-orange-400 text-xs sm:text-sm mb-4"><div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></div>Selfie → Ảnh chuyên nghiệp</div>
                                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">Upload selfie —<br /><span className="text-zinc-400">AI biến bạn thành người mẫu.</span></h3>
                                <p className="text-sm sm:text-base text-zinc-400 mb-6 leading-relaxed">Chỉ cần 5-10 ảnh selfie bình thường, AI học khuôn mặt bạn và tạo bộ ảnh chân dung studio-quality với concept bạn chọn.</p>
                                <Link href="/studio" className="group inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-medium">Thử AI Studio ngay<svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></Link>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-tr from-amber-500/5 to-transparent">
                            <Image src="https://res.cloudinary.com/dmxmzannb/image/upload/v1770954496/upload-selfie-ai-bi%E1%BA%BFn-b%E1%BA%A1n-th%C3%A0nh-ng%C6%B0%E1%BB%9Di-m%E1%BA%ABu_up2msw.webp" alt="Promo" width={500} height={500} />
                        </div>
                    </div>
                </div>
            </section>

            {/* PROCESS */}
            <section className="py-14 sm:py-24 px-4 sm:px-6 bg-[#09090b]">
                <div ref={proc.ref} className="container mx-auto max-w-5xl">
                    <div className={`text-center mb-12 sm:mb-16 ${proc.isVisible ? 'aFU' : 'opacity-0'}`}><span className="gtP text-lg sm:text-xl font-semibold">3 bước tạo bộ ảnh chân dung AI</span></div>
                    <div className="relative">
                        <div className="hidden sm:block absolute top-24 left-[16.67%] right-[16.67%] h-[2px] bg-gradient-to-r from-orange-500/30 via-red-500/30 to-orange-500/30"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
                            {STEPS.map((s, i) => (<div key={i} className={`flex flex-col items-center text-center ${proc.isVisible ? `aFU${i + 1}` : 'opacity-0'}`}>
                                <div className="relative mb-6"><div className="absolute -inset-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl blur-lg opacity-30 aGlow"></div><div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20"><span className="text-2xl sm:text-3xl font-bold text-white">{i + 1}</span></div></div>
                                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">{s.t}</h3><p className="text-sm text-zinc-400 leading-relaxed max-w-xs">{s.d}</p>
                            </div>))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ZIGZAG */}
            <section className="py-14 sm:py-24 px-4 sm:px-6 bg-[#09090b]">
                <div className="container mx-auto max-w-6xl">
                    <div ref={z1.ref} className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center mb-20 sm:mb-28">
                        <div className={`space-y-5 ${z1.isVisible ? 'aSL' : 'opacity-0'}`}>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20"><span className="text-orange-400 text-xs sm:text-sm font-medium">AI TRAINING</span></div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">AI học khuôn mặt bạn<br /><span className="text-zinc-400">chỉ từ vài selfie</span></h2>
                            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">Upload 5-10 ảnh selfie thường — AI phân tích đặc điểm khuôn mặt, tông da, biểu cảm và tạo model riêng cho bạn.</p>
                            <ul className="space-y-3">{['Chỉ cần 5-10 ảnh selfie bình thường', 'AI học trong 2-5 phút', 'Ảnh được bảo mật, xóa sau 24h'].map((it, i) => (<li key={i} className="flex items-center gap-3 text-sm sm:text-base text-zinc-300"><div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>{it}</li>))}</ul>
                            <Link href="/studio" className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-orange-500/25 transition-all">Thử ngay<svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></Link>
                        </div>
                        <div className={`relative ${z1.isVisible ? 'aSR' : 'opacity-0'}`}><div className="absolute -inset-4 bg-gradient-to-r from-orange-500/15 to-red-500/15 rounded-3xl blur-3xl"></div><div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl"><img src="https://res.cloudinary.com/dmxmzannb/image/upload/v1770954496/AI-H%E1%BB%8CC-G%C6%AF%C6%A0NG-M%E1%BA%B6T-B%E1%BA%A0N-T%E1%BB%AA-NH%E1%BB%AENG-T%E1%BA%A4M-SELFIE_zynnzv.webp" alt="AI Portrait Training" className="w-full h-[220px] sm:h-[300px] md:h-[380px] object-cover" /></div></div>
                    </div>
                    <div ref={z2.ref} className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
                        <div className={`relative order-2 lg:order-1 ${z2.isVisible ? 'aSL' : 'opacity-0'}`}><div className="absolute -inset-4 bg-gradient-to-r from-red-500/15 to-orange-500/15 rounded-3xl blur-3xl"></div><div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl"><img src="https://res.cloudinary.com/dmxmzannb/image/upload/v1770977084/50-CONCEFT-PHONG-C%C3%81CH_yr7f3d.webp" alt="Business Portrait" className="w-full h-[220px] sm:h-[300px] md:h-[380px] object-cover" /></div></div>
                        <div className={`space-y-5 order-1 lg:order-2 ${z2.isVisible ? 'aSR' : 'opacity-0'}`}>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20"><span className="text-orange-400 text-xs sm:text-sm font-medium">CONCEPTS</span></div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">50+ concept phong cách<br /><span className="text-zinc-400">do photographer thiết kế</span></h2>
                            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">Business formal, startup casual, creative artist, outdoor lifestyle — mỗi concept được thiết kế để tạo bộ ảnh đẹp nhất.</p>
                            <Link href="/studio" className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-orange-500/25 transition-all">Xem tất cả concept<svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* MORE TOOLS */}
            <section className="py-14 sm:py-24 px-4 sm:px-6 bg-[#09090b]">
                <div ref={tools.ref} className="container mx-auto max-w-6xl">
                    <div className={`text-center mb-10 sm:mb-14 ${tools.isVisible ? 'aFU' : 'opacity-0'}`}><h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Và <span className="gtP">nhiều công cụ</span> sáng tạo khác</h2></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        {MORE.map((t, i) => (<Link key={i} href={t.h} className={`group gcP rounded-xl p-4 sm:p-5 ${tools.isVisible ? `aFU${Math.min(i + 1, 5)}` : 'opacity-0'}`}><div className="text-orange-400/70 mb-3 group-hover:text-orange-400 transition-colors">{t.ic}</div><h4 className="font-semibold text-sm sm:text-base text-white mb-1 group-hover:text-orange-300 transition-colors">{t.t}</h4><p className="text-xs text-zinc-500">{t.d}</p></Link>))}
                    </div>
                    <div className={`text-center mt-8 sm:mt-10 ${tools.isVisible ? 'aFU5' : 'opacity-0'}`}><Link href="/tool" className="group inline-flex items-center gap-2 px-6 py-3 border border-white/10 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:border-orange-500/30 hover:bg-orange-500/5 transition-all">Xem tất cả công cụ →</Link></div>
                </div>
            </section>

            {/* BANNER */}
            <section ref={ban.ref} className="relative h-[300px] sm:h-[380px] md:h-[460px] lg:h-[520px] overflow-hidden">
                <img src="https://res.cloudinary.com/dmxmzannb/image/upload/v1770977085/%E1%BA%A3nh-ch%C3%A2n-dung-ai-chuy%C3%AAn-nghi%E1%BB%87p_rzv5yy.webp" alt="AI Studio" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/30"></div>
                <div className={`absolute inset-0 flex items-center transition-all duration-1000 ${ban.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="container mx-auto max-w-6xl px-4 sm:px-6"><div className="max-w-lg">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs sm:text-sm mb-4"><div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></div>AI Photo Studio</div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">Ảnh chân dung AI <span className="gtP">chuyên nghiệp</span></h2>
                        <p className="text-sm sm:text-base text-zinc-300 mb-6">Upload selfie ngay. Nhận bộ ảnh chuyên nghiệp trong vài phút.</p>
                        <Link href="/studio" className="group inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-orange-500/25 transition-all">Bắt đầu — Miễn phí<svg className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></Link>
                    </div></div>
                </div>
            </section>

            {/* ENTERPRISE */}
            <section className="py-14 sm:py-24 px-4 sm:px-6 bg-[#09090b]">
                <div ref={ent.ref} className="container mx-auto max-w-6xl"><div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
                    <div className={`transition-all duration-700 ${ent.isVisible ? 'aSL' : 'opacity-0'}`}>
                        <div className="gcP rounded-2xl p-7 sm:p-9 md:p-11 hover:transform-none">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 mb-5"><span className="text-orange-400 text-xs sm:text-sm font-medium">DOANH NGHIỆP</span></div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 leading-tight">AI Studio cho<br /><span className="text-zinc-400">team & doanh nghiệp</span></h2>
                            <p className="text-sm sm:text-base text-zinc-400 mb-6 leading-relaxed">Ảnh profile đồng bộ cho cả team, brand photography package, và tích hợp API cho platform của bạn.</p>
                            <ul className="space-y-3 mb-7">{['Chụp ảnh profile cho cả team cùng lúc', 'Custom concept theo brand guidelines', 'API tích hợp cho HR & recruitment platform'].map((it, i) => (<li key={i} className="flex items-center gap-3 text-sm text-zinc-300"><svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>{it}</li>))}</ul>
                            <Link href="/contact" className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-zinc-100 transition-colors">Liên hệ tư vấn →</Link>
                        </div>
                    </div>
                    <div className={`relative ${ent.isVisible ? 'aSR' : 'opacity-0'}`}><div className="absolute -inset-4 bg-gradient-to-r from-orange-500/15 to-red-500/15 rounded-3xl blur-3xl"></div><div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl"><img src="https://res.cloudinary.com/dmxmzannb/image/upload/v1770977102/AI-STUDIO-CHO-TEAM_kuenku.webp" alt="Team Photo" className="w-full h-[220px] sm:h-[320px] md:h-[400px] object-cover" /></div></div>
                </div></div>
            </section>
        </div>
    );
}

const CONCEPTS = [
    { e: '💼', t: 'Business Professional', d: 'Vest, studio lighting, nền trung tính — perfect cho LinkedIn & CV.', h: '/studio' },
    { e: '🎨', t: 'Creative Artist', d: 'Phong cách nghệ sĩ, ánh sáng tự nhiên, bối cảnh sáng tạo.', h: '/studio' },
    { e: '🌿', t: 'Outdoor Lifestyle', d: 'Ngoại cảnh tự nhiên, golden hour, vibe thoải mái tự tin.', h: '/studio' },
    { e: '✨', t: 'Glamour & Fashion', d: 'Ánh sáng studio, makeup style, high-fashion editorial.', h: '/studio' },
];
const STEPS = [
    { t: 'Chọn concept', d: 'Browse 50+ concept phong cách: business, creative, lifestyle, glamour...' },
    { t: 'Upload selfie', d: 'Upload 5-10 ảnh selfie bình thường, AI học khuôn mặt bạn trong 2-5 phút.' },
    { t: 'Nhận bộ ảnh', d: 'AI tạo 12+ ảnh chân dung chuyên nghiệp theo concept bạn chọn.' },
];
const ico = (d: string) => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
const MORE = [
    { ic: ico('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'), t: 'Concept Studio', d: 'Tạo concept design tự do', h: '/tool/concept-studio' },
    { ic: ico('M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42'), t: 'Typography', d: 'Typography nghệ thuật', h: '/tool/typographic-illustrator' },
    { ic: ico('M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18'), t: 'Swap Style', d: 'Chuyển phong cách ảnh', h: '/tool/swap-style' },
    { ic: ico('M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59'), t: 'Inpainter', d: 'Chỉnh sửa chi tiết ảnh', h: '/tool/inpainter' },
    { ic: ico('M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'), t: 'Free Generation', d: 'Tạo ảnh tự do từ prompt', h: '/tool/free-generation' },
    { ic: ico('M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'), t: 'Object Remover', d: 'Xóa vật thể thừa', h: '/tool/object-remover' },
];
