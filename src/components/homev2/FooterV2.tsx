"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const footerLinks = {
  "Sản phẩm": [
    { label: "Tạo ảnh AI", href: "/tool/free-generation" },
    { label: "Face Swap", href: "/tool/face-swap" },
    { label: "Avatar Creator", href: "/tool/avatar-creator" },
    { label: "Product Photo", href: "/tool/product-photo" },
    { label: "Poster Creator", href: "/tool/poster-creator" },
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
};

const socialLinks = [
  { icon: "📘", label: "Facebook", href: "#" },
  { icon: "📸", label: "Instagram", href: "#" },
  { icon: "🎵", label: "TikTok", href: "#" },
  { icon: "💬", label: "Zalo", href: "#" },
];

export const FooterV2 = () => {
  return (
    <footer className="bg-neutral-950 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-lg">
                D
              </div>
              <span className="text-xl font-bold text-white">Duky AI</span>
            </Link>
            <p className="text-neutral-400 text-sm mb-4 max-w-xs">
              Nền tảng tạo ảnh AI hàng đầu Việt Nam. 30+ công cụ chuyên nghiệp cho doanh nghiệp và cá nhân.
            </p>
            {/* Social Links */}
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg hover:bg-white/10 transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-neutral-400 text-sm hover:text-orange-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-neutral-500 text-sm">
            © 2025 Duky AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-neutral-500 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Hệ thống hoạt động bình thường
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
