"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayIcon, ClockIcon, EyeIcon, FilterIcon } from "./icons";

const categories = [
  { id: "all", label: "Tất cả" },
  { id: "beginner", label: "Cơ bản" },
  { id: "portrait", label: "Chân dung" },
  { id: "product", label: "Sản phẩm" },
  { id: "marketing", label: "Marketing" },
  { id: "tips", label: "Mẹo hay" },
];

const videos = [
  {
    id: 1,
    title: "Hướng dẫn tạo chân dung doanh nhân",
    description: "Tạo ảnh chân dung chuyên nghiệp cho profile LinkedIn",
    duration: "3:45",
    views: "12.5K",
    category: "portrait",
    thumbnail: "https://res.cloudinary.com/dmxmzannb/image/upload/v1768560690/fcgaoihbxxoe4hbofdso.png",
    isNew: true,
  },
  {
    id: 2,
    title: "Tạo ảnh sản phẩm bằng AI",
    description: "Hướng dẫn chi tiết cách tạo ảnh sản phẩm đẹp mắt",
    duration: "5:20",
    views: "8.3K",
    category: "product",
    thumbnail: "https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768622719139-5ilv1h.png",
  },
  {
    id: 3,
    title: "Thiết kế poster marketing",
    description: "Tạo poster chuyên nghiệp cho chiến dịch marketing",
    duration: "4:15",
    views: "15.2K",
    category: "marketing",
    thumbnail: "https://res.cloudinary.com/dmxmzannb/image/upload/v1768562068/v0ybv26fss1eglne6zfu.png",
    isHot: true,
  },
  {
    id: 4,
    title: "Làm quen với giao diện Duky",
    description: "Tổng quan về các tính năng và công cụ",
    duration: "2:30",
    views: "20.1K",
    category: "beginner",
    thumbnail: "https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768206045/krxq16y49k91zevbw6os.webp",
  },
  {
    id: 5,
    title: "Mẹo viết prompt hiệu quả",
    description: "Cách viết mô tả để AI hiểu đúng ý bạn",
    duration: "6:00",
    views: "9.8K",
    category: "tips",
    thumbnail: "https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1769744496071-eiolbl.png",
  },
  {
    id: 6,
    title: "Tạo avatar chibi độc đáo",
    description: "Hướng dẫn tạo avatar phong cách chibi dễ thương",
    duration: "3:10",
    views: "11.4K",
    category: "portrait",
    thumbnail: "https://res.cloudinary.com/dmxmzannb/image/upload/v1765978950/pqotah7yias7jtpnwnca.jpg",
    isNew: true,
  },
  {
    id: 7,
    title: "Sử dụng Face Swap",
    description: "Cách đổi khuôn mặt trong ảnh đơn giản",
    duration: "2:45",
    views: "18.7K",
    category: "beginner",
    thumbnail: "https://res.cloudinary.com/dmxmzannb/image/upload/v1768560690/fcgaoihbxxoe4hbofdso.png",
  },
  {
    id: 8,
    title: "Tạo mockup sản phẩm",
    description: "Thiết kế mockup chuyên nghiệp cho sản phẩm",
    duration: "4:30",
    views: "7.2K",
    category: "product",
    thumbnail: "https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768622719139-5ilv1h.png",
  },
];

export const VideoTutorials = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const filteredVideos =
    activeCategory === "all"
      ? videos
      : videos.filter((v) => v.category === activeCategory);

  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Video hướng dẫn
            </h2>
            <p className="text-neutral-400">Học cách sử dụng qua video trực quan</p>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <FilterIcon className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`!px-5 !py-2 !min-w-30 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "bg-orange-500 text-white"
                    : "bg-white/5 text-neutral-400 hover:bg-white/10"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Video Grid - Masonry style for 9:16 videos */}
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredVideos.map((video, index) => (
              <motion.div
                key={video.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredId(video.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Video Card - 9:16 Aspect Ratio */}
                <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 hover:border-orange-500/50 transition-all">
                  {/* Thumbnail */}
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {video.isNew && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                        Mới
                      </span>
                    )}
                    {video.isHot && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        Hot
                      </span>
                    )}
                  </div>

                  {/* Duration */}
                  <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 text-white text-xs rounded-full flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    {video.duration}
                  </div>

                  {/* Play Button - Center */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: hoveredId === video.id ? 1 : 0,
                      scale: hoveredId === video.id ? 1 : 0.8,
                    }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
                      <PlayIcon className="w-6 h-6 text-white ml-1" />
                    </div>
                  </motion.div>

                  {/* Info - Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2 group-hover:text-orange-400 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-neutral-400 text-xs line-clamp-1 mb-2 hidden md:block">
                      {video.description}
                    </p>
                    <div className="flex items-center gap-3 text-neutral-500 text-xs">
                      <span className="flex items-center gap-1">
                        <EyeIcon className="w-3 h-3" />
                        {video.views}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Load More */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-10"
        >
          <button className="px-8 py-3 bg-white/5 text-white rounded-full hover:bg-white/10 transition-all border border-white/10">
            Xem thêm video
          </button>
        </motion.div>
      </div>
    </section>
  );
};
