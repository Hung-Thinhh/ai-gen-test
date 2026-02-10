"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { HelpCircleIcon, FileTextIcon, ZapIcon, ArrowRightIcon } from "./icons";

const options = [
  {
    icon: HelpCircleIcon,
    title: "Trung tâm hỗ trợ",
    description: "Tìm câu trả lời cho các câu hỏi thường gặp",
    href: "/guide",
  },
  {
    icon: FileTextIcon,
    title: "Tài liệu API",
    description: "Tài liệu kỹ thuật cho nhà phát triển",
    href: "/api-docs",
  },
  {
    icon: ZapIcon,
    title: "Báo cáo lỗi",
    description: "Báo cáo vấn đề kỹ thuật hoặc bug",
    href: "/contact",
  },
];

export const ContactOptions = () => {
  return (
    <section className="py-16 md:py-24 bg-transparent relative">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Các cách khác để nhận hỗ trợ</h2>
          <p className="text-neutral-400 max-w-lg mx-auto">
            Khám phá các tài nguyên hỗ trợ khác của chúng tôi để tìm giải pháp nhanh chóng nhất
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {options.map((option, index) => {
            return (
              <Link href={option.href} key={option.title} className="block group">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="h-full p-6 md:p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-orange-500/30 group-hover:bg-white/5 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-orange-500/30 transition-all duration-300 shadow-lg">
                    {/* Render Icon component directly */}
                    <option.icon className="w-7 h-7 text-neutral-400 group-hover:text-orange-400 transition-colors" />
                  </div>

                  <h3 className="text-white font-bold text-lg mb-3 group-hover:text-orange-400 transition-colors">
                    {option.title}
                  </h3>
                  <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
                    {option.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-neutral-500 group-hover:text-orange-400 font-medium transition-colors mt-auto">
                    <span>Truy cập ngay</span>
                    <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
