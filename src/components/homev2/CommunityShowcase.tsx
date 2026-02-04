"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { PaletteIcon, HeartIcon, SearchIcon, ArrowRightIcon } from "./icons";

const showcaseImages = [
  {
    id: 1,
    url: "https://res.cloudinary.com/dmxmzannb/image/upload/v1768560690/fcgaoihbxxoe4hbofdso.png",
    prompt: "Chân dung doanh nhân nam, vest đen, nền studio chuyên nghiệp",
    author: { name: "Minh Anh", avatar: "MA" },
    likes: 234,
    height: "tall",
  },
  {
    id: 2,
    url: "https://res.cloudinary.com/dmxmzannb/image/upload/v1768562068/v0ybv26fss1eglne6zfu.png",
    prompt: "Poster trà sữa matcha, phong cách Nhật Bản",
    author: { name: "Thu Hà", avatar: "TH" },
    likes: 189,
    height: "normal",
  },
  {
    id: 3,
    url: "https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1769744496071-eiolbl.png",
    prompt: "Avatar chibi dễ thương, tóc hồng, kính tròn",
    author: { name: "Đức Huy", avatar: "DH" },
    likes: 456,
    height: "normal",
  },
  {
    id: 4,
    url: "https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768622719139-5ilv1h.png",
    prompt: "Sản phẩm mỹ phẩm, nền pastel, ánh sáng mềm",
    author: { name: "Lan Khuê", avatar: "LK" },
    likes: 312,
    height: "tall",
  },
  {
    id: 5,
    url: "https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768206045/krxq16y49k91zevbw6os.webp",
    prompt: "Bìa sách khoa học viễn tưởng, tương lai",
    author: { name: "Quang Minh", avatar: "QM" },
    likes: 278,
    height: "normal",
  },
  {
    id: 6,
    url: "https://res.cloudinary.com/dmxmzannb/image/upload/v1765978950/pqotah7yias7jtpnwnca.jpg",
    prompt: "Logo startup công nghệ, hiện đại, đơn giản",
    author: { name: "Hoàng Nam", avatar: "HN" },
    likes: 156,
    height: "normal",
  },
];

const filters = [
  { id: "all", label: "Tất cả" },
  { id: "portrait", label: "Chân dung" },
  { id: "product", label: "Sản phẩm" },
  { id: "poster", label: "Poster" },
];

export const CommunityShowcase = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const router = useRouter();

  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-400 text-sm mb-4">
            <PaletteIcon className="w-4 h-4" />
            <span>Thư viện cộng đồng</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ảnh từ cộng đồng
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto">
            Khám phá những tác phẩm tuyệt vừoi từ 50K+ ngườii dùng Duky
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex justify-center gap-2 mb-8"
        >
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm transition-all cursor-pointer ${
                activeFilter === filter.id
                  ? "bg-orange-500 text-white"
                  : "bg-white/5 text-neutral-400 hover:bg-white/10"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </motion.div>

        {/* Masonry Grid */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {showcaseImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative break-inside-avoid rounded-xl overflow-hidden cursor-pointer ${
                image.height === "tall" ? "row-span-2" : ""
              }`}
              onMouseEnter={() => setHoveredId(image.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => router.push("/community-gallery")}
            >
              <img
                src={image.url}
                alt={image.prompt}
                className="w-full h-auto object-cover"
              />

              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: hoveredId === image.id ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end p-4"
              >
                {/* Prompt */}
                <p className="text-white text-sm mb-3 line-clamp-2">
                  &ldquo;{image.prompt}&rdquo;
                </p>

                {/* Author & Likes */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                      {image.author.avatar}
                    </div>
                    <span className="text-white text-sm">{image.author.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-white">
                    <HeartIcon className="w-4 h-4 text-red-500" />
                    <span className="text-sm">{image.likes}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors cursor-pointer">
                    Dùng prompt
                  </button>
                  <button className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
                    <SearchIcon className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* View All */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-10"
        >
          <button
            onClick={() => router.push("/community-gallery")}
            className="px-8 py-3 bg-white/5 text-white rounded-full hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2 mx-auto cursor-pointer"
          >
            Khám phá thư viện ảnh
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
