"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { PencilIcon, SettingsIcon, SparklesIcon, CheckIcon, ArrowRightIcon } from "./icons";

const steps = [
  {
    number: "01",
    icon: PencilIcon,
    title: "Mô tả ý tưởng",
    description: "Nhập mô tả về ảnh bạn muốn tạo. Càng chi tiết, AI càng hiểu rõ ý tưởng của bạn.",
    example: "Chân dung doanh nhân nam, vest đen, nền studio chuyên nghiệp, ánh sáng mềm",
    color: "from-orange-500 to-red-500",
  },
  {
    number: "02",
    icon: SettingsIcon,
    title: "Chọn công cụ & Tùy chỉnh",
    description: "Chọn từ 30+ công cụ chuyên biệt. Điều chỉnh tỷ lệ, phong cách, và các thông số khác.",
    features: ["30+ AI Tools", "Tùy chỉnh tỷ lệ", "Chọn phong cách"],
    color: "from-blue-500 to-purple-500",
  },
  {
    number: "03",
    icon: SparklesIcon,
    title: "Nhận kết quả",
    description: "Chờ 5-30 giây để AI tạo ảnh. Tải về hoặc chỉnh sửa thêm nếu cần.",
    stats: { time: "5-30s", quality: "4K", download: "PNG/JPG" },
    color: "from-green-500 to-teal-500",
  },
];

export const HowItWorks = () => {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <section className="py-20 bg-black relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-400 text-sm mb-4">
            <SparklesIcon className="w-4 h-4" />
            <span>Quy trình đơn giản</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            3 Bước để tạo ảnh
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto">
            Quy trình đơn giản, kết quả chuyên nghiệp. Không cần kỹ năng thiết kế.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500/30 via-purple-500/30 to-green-500/30 -translate-y-1/2" />

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative"
                  onMouseEnter={() => setHoveredStep(index)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  {/* Step Card */}
                  <motion.div
                    whileHover={{ y: -10 }}
                    className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10 h-full"
                  >
                    {/* Number Badge */}
                    <div className={`absolute -top-4 left-6 px-3 py-1 rounded-full bg-gradient-to-r ${step.color} text-white text-sm font-bold`}>
                      {step.number}
                    </div>

                    {/* Icon */}
                    <motion.div
                      animate={{
                        scale: hoveredStep === index ? 1.1 : 1,
                        rotate: hoveredStep === index ? 5 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                      className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 mt-2"
                    >
                      <IconComponent className="w-8 h-8 text-orange-500" />
                    </motion.div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed mb-4">
                      {step.description}
                    </p>

                    {/* Step-specific content */}
                    {step.example && (
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-xs text-neutral-500 mb-1">Ví dụ:</p>
                        <p className="text-sm text-neutral-300 italic">&ldquo;{step.example}&rdquo;</p>
                      </div>
                    )}

                    {step.features && (
                      <div className="flex flex-wrap gap-2">
                        {step.features.map((feature) => (
                          <span
                            key={feature}
                            className="px-2 py-1 text-xs rounded-full bg-white/10 text-neutral-300 flex items-center gap-1"
                          >
                            <CheckIcon className="w-3 h-3 text-green-500" />
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}

                    {step.stats && (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-white/5">
                          <p className="text-orange-400 font-bold text-sm">{step.stats.time}</p>
                          <p className="text-neutral-500 text-xs">Thờii gian</p>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5">
                          <p className="text-orange-400 font-bold text-sm">{step.stats.quality}</p>
                          <p className="text-neutral-500 text-xs">Chất lượng</p>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5">
                          <p className="text-orange-400 font-bold text-sm">{step.stats.download}</p>
                          <p className="text-neutral-500 text-xs">Định dạng</p>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Arrow - Desktop */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-neutral-600"
                      >
                        <ArrowRightIcon className="w-6 h-6" />
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-neutral-400 mb-4">Sẵn sàng tạo ảnh đầu tiên?</p>
          <button className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2 mx-auto cursor-pointer">
            Bắt đầu miễn phí
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
