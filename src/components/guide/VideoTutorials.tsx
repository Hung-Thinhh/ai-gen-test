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
    title: "Hướng dẫn tạo chân Khmer Nữ",
    description: "Tạo ảnh theo concept Khmer đầy mới lạ",
    duration: "3:45",
    views: "12.5K",
    category: "portrait",
    youtubeId: "X4WODRYThv4", // TODO: Replace with actual YouTube video ID
    isNew: true,
  },
  {
    id: 2,
    title: "Tạo ảnh bằng thư viện prompt",
    description: "Hướng dẫn chi tiết cách tạo ảnh trong thư viện prompt",
    duration: "5:20",
    views: "8.3K",
    category: "product",
    youtubeId: "iHhLcqaB_kY", // TODO: Replace with actual YouTube video ID
  },
  {
    id: 3,
    title: "Tạo ảnh sản phẩm tết",
    description: "Tạo poster chuyên nghiệp cho sản phẩm tết",
    duration: "4:15",
    views: "15.2K",
    category: "marketing",
    youtubeId: "cZzyYZqAB84", // TODO: Replace with actual YouTube video ID
    isHot: true,
  },
  {
    id: 4,
    title: "Tạo ảnh sản phẩm F&B",
    description: "Tạo poster chuyên nghiệp cho sản phẩm tết",
    duration: "2:30",
    views: "20.1K",
    category: "beginner",
    youtubeId: "QosdqTtq0Ko", // TODO: Replace with actual YouTube video ID
  },
  {
    id: 5,
    title: "Tạo ản tết cho nữ",
    description: "Tạo ảnh sống ảo đăng chơi tết",
    duration: "6:00",
    views: "9.8K",
    category: "tips",
    youtubeId: "EWp1vH_4vsw", // TODO: Replace with actual YouTube video ID
  },
  {
    id: 6,
    title: "Tạo ảnh cho em bé cưng",
    description: "Hướng dẫn tạo ảnh cho em bé của bạn",
    duration: "3:10",
    views: "11.4K",
    category: "portrait",
    youtubeId: "EAOZZZC75i8", // TODO: Replace with actual YouTube video ID
    isNew: true,
  },
  {
    id: 7,
    title: "Tạo ảnh thẻ",
    description: "Tạo ảnh thẻ chuyên nghiệp",
    duration: "2:45",
    views: "18.7K",
    category: "beginner",
    youtubeId: "h7QaFRIU5qs", // TODO: Replace with actual YouTube video ID
  },
  {
    id: 8,
    title: "Tạo ảnh sản phẩm",
    description: "Thiết kế ảnh chuyên nghiệp cho sản phẩm",
    duration: "4:30",
    views: "7.2K",
    category: "product",
    youtubeId: "UO75nraLCmo", // TODO: Replace with actual YouTube video ID
  },
];

export const VideoTutorials = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);

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
                className={`!px-5 !py-2 !min-w-30 rounded-full text-sm whitespace-nowrap transition-all ${activeCategory === cat.id
                  ? "bg-orange-500 text-white"
                  : "bg-white/5 text-neutral-400 hover:bg-white/10"
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Video Grid - 16:9 layout for YouTube */}
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
                className="group"
              >
                {/* Video Card */}
                <div
                  className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 hover:border-orange-500/50 transition-all"
                  onMouseEnter={() => setHoveredId(video.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* 9:16 Video Container */}
                  <div className="relative aspect-[9/16]">
                    {playingId === video.id ? (
                      /* YouTube Iframe Embed */
                      <>
                        <iframe
                          src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
                          title={video.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                        />
                        {/* Close button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setPlayingId(null); }}
                          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-500 transition-colors text-sm"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      /* YouTube Thumbnail + Play overlay */
                      <>
                        <img
                          src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                          alt={video.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                          onClick={() => setPlayingId(video.id)}
                        />

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

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

                        {/* Duration badge */}
                        <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 text-white text-xs rounded-full flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {video.duration}
                        </div>

                        {/* Play Button - Center */}
                        <motion.div
                          initial={{ opacity: 0.7, scale: 0.9 }}
                          animate={{
                            opacity: hoveredId === video.id ? 1 : 0.7,
                            scale: hoveredId === video.id ? 1.1 : 0.9,
                          }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 flex items-center justify-center cursor-pointer"
                          onClick={() => setPlayingId(video.id)}
                        >
                          <div className="w-14 h-14 rounded-full bg-orange-500/90 flex items-center justify-center shadow-lg backdrop-blur-sm">
                            <PlayIcon className="w-5 h-5 text-white ml-0.5" />
                          </div>
                        </motion.div>
                      </>
                    )}
                  </div>

                  {/* Info - Below video */}
                  <div className="p-3 md:p-4">
                    <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2 group-hover:text-orange-400 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-neutral-400 text-xs line-clamp-1 mb-2">
                      {video.description}
                    </p>
                    <div className="flex items-center gap-3 text-neutral-500 text-xs">
                      <span className="flex items-center gap-1">
                        <EyeIcon className="w-3 h-3" />
                        {video.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {video.duration}
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
