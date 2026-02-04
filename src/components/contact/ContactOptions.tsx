"use client";

import { motion } from "framer-motion";
import { HelpCircleIcon, FileTextIcon, ZapIcon, ArrowRightIcon } from "./icons";

const options = [
  {
    icon: HelpCircleIcon,
    title: "Trung tâm hỗ trợ",
    description: "Tìm câu trả lờii cho các câu hỏi thường gặp",
    href: "/guide",
    color: "blue",
  },
  {
    icon: FileTextIcon,
    title: "Tài liệu API",
    description: "Tài liệu kỹ thuật cho nhà phát triển",
    href: "#",
    color: "purple",
  },
  {
    icon: ZapIcon,
    title: "Báo cáo lỗi",
    description: "Báo cáo vấn đề kỹ thuật hoặc bug",
    href: "#",
    color: "orange",
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400" },
};

export const ContactOptions = () => {
  return (
    <section className="py-16 bg-neutral-950">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl font-bold text-white mb-2">Các cách khác để nhận hỗ trợ</h2>
          <p className="text-neutral-400">Khám phá các tài nguyên hỗ trợ khác của chúng tôi</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {options.map((option, index) => {
            const colors = colorClasses[option.color];
            return (
              <motion.a
                key={option.title}
                href={option.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`group p-6 rounded-2xl bg-neutral-900 border ${colors.border} hover:border-opacity-50 transition-all`}
              >
                <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
                  <option.icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{option.title}</h3>
                <p className="text-neutral-400 text-sm mb-4">{option.description}</p>
                <div className="flex items-center gap-2 text-sm text-neutral-500 group-hover:text-white transition-colors">
                  <span>Tìm hiểu thêm</span>
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
};
