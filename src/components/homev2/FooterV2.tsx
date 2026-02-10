"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

const footerLinks = {
  "Sản phẩm": [
    { label: "Tạo ảnh tự do", href: "/tool/free-generation" },
    { label: "Tạo poster sản phẩm", href: "/tool/poster-creator" },
    { label: "Tạo chân dung", href: "/tool/portrait-generator" },
    { label: "Tạo ảnh baby", href: "/tool/baby-photo-creator" },
    { label: "Studio chuyên nghiệp", href: "/studio" },
  ],
  "Công ty": [
    { label: "Về chúng tôi", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Tuyển dụng", href: "/careers" },
    { label: "Liên hệ", href: "/contact" },
  ],
  "Hỗ trợ": [
    { label: "Trung tâm hỗ trợ", href: "/help" },
    { label: "Hướng dẫn sử dụng", href: "/guide" },
    { label: "API Documentation", href: "/api-docs" },
    { label: "Trạng thái hệ thống", href: "/status" },
  ],
  "Pháp lý": [
    { label: "Điều khoản sử dụng", href: "/terms" },
    { label: "Chính sách bảo mật", href: "/privacy" },
    { label: "Chính sách hoàn tiền", href: "/refund" },
  ],
} as const; // Add type assertion

// Define valid keys for footerLinks
type FooterSection = keyof typeof footerLinks;

export const FooterV2 = () => {
  // State for mobile accordion
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="bg-black/80 backdrop-blur-xl border-t border-orange-500/20 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
      <div className="absolute -top-[200px] -left-[100px] w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-[200px] -right-[100px] w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 mb-16">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-4 lg:col-span-4 space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 p-0.5 shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center overflow-hidden">
                  <img src="/img/logo_site.webp" alt="DUKY.AI" className="w-full h-full object-cover" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400 font-display">
                  Duky AI
                </h2>
                <p className="text-[10px] text-orange-500 font-mono tracking-widest uppercase">
                  Creative Intelligence
                </p>
              </div>
            </Link>

            <p className="text-neutral-400 text-sm leading-relaxed max-w-sm">
              Nền tảng tạo ảnh AI hàng đầu Việt Nam. Khám phá 30+ công cụ sáng tạo chuyên nghiệp dành cho doanh nghiệp và cá nhân.
            </p>

            {/* Social Links - Modern Style */}
            <div>
              <h3 className="text-white font-bold mb-4 text-xs uppercase tracking-wider text-orange-500/80">Kết nối với chúng tôi</h3>
              <div className="flex flex-wrap gap-3">
                {[
                  {
                    icon: (
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                    ), href: "#", color: "hover:bg-black hover:text-[#00f2ea] hover:shadow-[0_0_20px_rgba(0,242,234,0.3)]"
                  },
                  {
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460.1 436.6" className="w-5 h-5 fill-current"><path d="M82.6 380.9c-1.8-.8-3.1-1.7-1-3.5 1.3-1 2.7-1.9 4.1-2.8 13.1-8.5 25.4-17.8 33.5-31.5 6.8-11.4 5.7-18.1-2.8-26.5C69 269.2 48.2 212.5 58.6 145.5 64.5 107.7 81.8 75 107 46.6c15.2-17.2 33.3-31.1 53.1-42.7 1.2-.7 2.9-.9 3.1-2.7-.4-1-1.1-.7-1.7-.7-33.7 0-67.4-.7-101 .2C28.3 1.7.5 26.6.6 62.3c.2 104.3 0 208.6 0 313 0 32.4 24.7 59.5 57 60.7 27.3 1.1 54.6.2 82 .1 2 .1 4 .2 6 .2H290c36 0 72 .2 108 0 33.4 0 60.5-27 60.5-60.3v-.6-58.5c0-1.4.5-2.9-.4-4.4-1.8.1-2.5 1.6-3.5 2.6-19.4 19.5-42.3 35.2-67.4 46.3-61.5 27.1-124.1 29-187.6 7.2-5.5-2-11.5-2.2-17.2-.8-8.4 2.1-16.7 4.6-25 7.1-24.4 7.6-49.3 11-74.8 6zm72.5-168.5c1.7-2.2 2.6-3.5 3.6-4.8 13.1-16.6 26.2-33.2 39.3-49.9 3.8-4.8 7.6-9.7 10-15.5 2.8-6.6-.2-12.8-7-15.2-3-.9-6.2-1.3-9.4-1.1-17.8-.1-35.7-.1-53.5 0-2.5 0-5 .3-7.4.9-5.6 1.4-9 7.1-7.6 12.8 1 3.8 4 6.8 7.8 7.7 2.4.6 4.9.9 7.4.8 10.8.1 21.7 0 32.5.1 1.2 0 2.7-.8 3.6 1-.9 1.2-1.8 2.4-2.7 3.5-15.5 19.6-30.9 39.3-46.4 58.9-3.8 4.9-5.8 10.3-3 16.3s8.5 7.1 14.3 7.5c4.6.3 9.3.1 14 .1 16.2 0 32.3.1 48.5-.1 8.6-.1 13.2-5.3 12.3-13.3-.7-6.3-5-9.6-13-9.7-14.1-.1-28.2 0-43.3 0zm116-52.6c-12.5-10.9-26.3-11.6-39.8-3.6-16.4 9.6-22.4 25.3-20.4 43.5 1.9 17 9.3 30.9 27.1 36.6 11.1 3.6 21.4 2.3 30.5-5.1 2.4-1.9 3.1-1.5 4.8.6 3.3 4.2 9 5.8 14 3.9 5-1.5 8.3-6.1 8.3-11.3.1-20 .2-40 0-60-.1-8-7.6-13.1-15.4-11.5-4.3.9-6.7 3.8-9.1 6.9zm69.3 37.1c-.4 25 20.3 43.9 46.3 41.3 23.9-2.4 39.4-20.3 38.6-45.6-.8-25-19.4-42.1-44.9-41.3-23.9.7-40.8 19.9-40 45.6zm-8.8-19.9c0-15.7.1-31.3 0-47 0-8-5.1-13-12.7-12.9-7.4.1-12.3 5.1-12.4 12.8-.1 4.7 0 9.3 0 14v79.5c0 6.2 3.8 11.6 8.8 12.9 6.9 1.9 14-2.2 15.8-9.1.3-1.2.5-2.4.4-3.7.2-15.5.1-31 .1-46.5z" /></svg>
                    ), href: "#", color: "hover:bg-[#0068FF] hover:text-white hover:shadow-[0_0_20px_rgba(0,104,255,0.4)]"
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    ), href: "#", color: "hover:bg-[#1877F2] hover:text-white hover:shadow-[0_0_20px_rgba(24,119,242,0.4)]"
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                    ), href: "#", color: "hover:bg-[#FF0000] hover:text-white hover:shadow-[0_0_20px_rgba(255,0,0,0.4)]"
                  },
                ].map((social, idx) => (
                  <a
                    key={idx}
                    href={social.href}
                    className={cn(
                      "w-9 h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/70 transition-all duration-300",
                      social.color
                    )}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Links - Responsive Accordion on Mobile, Grid on Desktop */}
          <div className="col-span-1 md:col-span-8 grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-8">
            {(Object.keys(footerLinks) as FooterSection[]).map((category) => (
              <div key={category} className="border-b border-white/5 md:border-none pb-4 md:pb-0">
                {/* Desktop Header */}
                <h4 className="hidden md:block text-white font-bold mb-6 text-sm uppercase tracking-wider">
                  {category}
                </h4>

                {/* Mobile Header (Accordion Trigger) */}
                <button
                  onClick={() => toggleSection(category)}
                  className="md:hidden w-full flex items-center justify-between text-white font-bold py-2 text-sm uppercase tracking-wider"
                >
                  {category}
                  <svg
                    className={cn("w-4 h-4 transition-transform duration-300 transform", openSection === category ? "rotate-180" : "rotate-0")}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Links List (Collapsible on Mobile, Visible on Desktop) */}
                <div className={cn(
                  "space-y-3 overflow-hidden transition-all duration-300 ease-in-out md:block",
                  openSection === category ? "max-h-96 mt-4 opacity-100" : "max-h-0 md:max-h-none opacity-0 md:opacity-100"
                )}>
                  <ul className="space-y-3">
                    {footerLinks[category].map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-neutral-400 text-sm hover:text-orange-400 transition-colors flex items-center gap-2 group/link"
                        >
                          <span className="w-0 group-hover/link:w-2 h-[1px] bg-orange-500 transition-all duration-300"></span>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-neutral-500 text-xs font-medium">
            © 2026 Duky AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2.5 text-neutral-400 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              All Systems Normal
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
