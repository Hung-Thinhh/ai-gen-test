"use client";

import { motion } from "framer-motion";
import { ArrowRightIcon, PencilIcon, ImageIcon, DownloadIcon } from "./icons";

const steps = [
  {
    number: "01",
    icon: PencilIcon,
    title: "Nhập mô tả",
    description: "Mô tả chi tiết ý tưởng ảnh bạn muốn tạo bằng văn bản",
  },
  {
    number: "02",
    icon: ImageIcon,
    title: "Chọn công cụ",
    description: "Chọn công cụ AI phù hợp với nhu cầu của bạn",
  },
  {
    number: "03",
    icon: DownloadIcon,
    title: "Nhận ảnh",
    description: "Tải về ảnh đã tạo với chất lượng cao",
  },
];

export const QuickStart = () => {
  return (
    <section className="py-16 bg-neutral-950">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Bắt đầu nhanh
          </h2>
          <p className="text-neutral-400">Chỉ 3 bước để tạo ảnh AI đầu tiên</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="bg-neutral-900 rounded-2xl p-6 border border-white/10 hover:border-orange-500/50 transition-all h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-orange-500 text-sm font-bold mb-1">
                      Bước {step.number}
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">
                      {step.title}
                    </h3>
                    <p className="text-neutral-400 text-sm">{step.description}</p>
                  </div>
                </div>
              </div>

              {/* Arrow connector */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <ArrowRightIcon className="w-6 h-6 text-neutral-600" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
