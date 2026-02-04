"use client";

import { motion } from "framer-motion";
import { PlayIcon, BookOpenIcon, ClockIcon } from "./icons";

export const GuideHero = () => {
  const stats = [
    { icon: BookOpenIcon, value: "20+", label: "Bài hướng dẫn" },
    { icon: PlayIcon, value: "50+", label: "Video tutorial" },
    { icon: ClockIcon, value: "5 phút", label: "Thờii gian trung bình" },
  ];

  return (
    <section className="relative py-20 bg-black overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-400 text-sm mb-6">
            <BookOpenIcon className="w-4 h-4" />
            <span>Trung tâm hỗ trợ</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Hướng dẫn sử dụng
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-8">
            Khám phá cách sử dụng Duky AI hiệu quả với video hướng dẫn chi tiết từ cơ bản đến nâng cao
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10"
              >
                <stat.icon className="w-5 h-5 text-orange-500" />
                <div className="text-left">
                  <div className="text-white font-bold">{stat.value}</div>
                  <div className="text-neutral-500 text-xs">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
