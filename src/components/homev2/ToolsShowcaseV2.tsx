"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { FireIcon, SettingsIcon, ArrowRightIcon, StarIcon } from "./icons";

const categories = [
  { id: "all", label: "Tất cả" },
  { id: "portrait", label: "Chân dung" },
  { id: "product", label: "Sản phẩm" },
  { id: "marketing", label: "Marketing" },
  { id: "fun", label: "Giải trí" },
];

const tools = [
  {
    id: "free-generation",
    name: "Free Generation",
    description: "Tạo ảnh từ mô tả văn bản",
    category: "all",
    cost: "Miễn phí",
    usage: 15000,
    badge: "Hot",
    image: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTczYWJlYnBlc3V1dHBxMnJidmVvcWlqd293dWQ1Ymt3Z2N3bjl3MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Rh0btaKsTkIIrls5yT/giphy.gif",
    isHot: true,
  },
  {
    id: "face-swap",
    name: "Face Swap",
    description: "Đổi khuôn mặt trong ảnh",
    category: "fun",
    cost: "1 credit",
    usage: 12000,
    badge: "Phổ biến",
    image: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTczYWJlYnBlc3V1dHBxMnJidmVvcWlqd293dWQ1Ymt3Z2N3bjl3MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Rh0btaKsTkIIrls5yT/giphy.gif",
    isHot: true,
  },
  {
    id: "avatar-creator",
    name: "Avatar Creator",
    description: "Tạo avatar chuyên nghiệp",
    category: "portrait",
    cost: "2 credits",
    usage: 8000,
    badge: "Mới",
    image: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTczYWJlYnBlc3V1dHBxMnJidmVvcWlqd293dWQ1Ymt3Z2N3bjl3MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Rh0btaKsTkIIrls5yT/giphy.gif",
    isNew: true,
  },
  {
    id: "product-photo",
    name: "Product Photo",
    description: "Chụp ảnh sản phẩm đẹp",
    category: "product",
    cost: "2 credits",
    usage: 6000,
    image: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTczYWJlYnBlc3V1dHBxMnJidmVvcWlqd293dWQ1Ymt3Z2N3bjl3MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Rh0btaKsTkIIrls5yT/giphy.gif",
  },
  {
    id: "poster-creator",
    name: "Poster Creator",
    description: "Tạo poster chuyên nghiệp",
    category: "marketing",
    cost: "1 credit",
    usage: 5000,
    image: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTczYWJlYnBlc3V1dHBxMnJidmVvcWlqd293dWQ1Ymt3Z2N3bjl3MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Rh0btaKsTkIIrls5yT/giphy.gif",
  },
  {
    id: "photo-booth",
    name: "Photo Booth",
    description: "Booth ảnh vui nhộn",
    category: "fun",
    cost: "Miễn phí",
    usage: 10000,
    badge: "Free",
    image: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTczYWJlYnBlc3V1dHBxMnJidmVvcWlqd293dWQ1Ymt3Z2N3bjl3MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Rh0btaKsTkIIrls5yT/giphy.gif",
  },
  {
    id: "beauty-creator",
    name: "Beauty Creator",
    description: "Làm đẹp ảnh chân dung",
    category: "portrait",
    cost: "1 credit",
    usage: 7000,
    image: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTczYWJlYnBlc3V1dHBxMnJidmVvcWlqd293dWQ1Ymt3Z2N3bjl3MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Rh0btaKsTkIIrls5yT/giphy.gif",
  },
  {
    id: "milk-tea-poster",
    name: "Milk Tea Poster",
    description: "Poster trà sữa đẹp mắt",
    category: "marketing",
    cost: "2 credits",
    usage: 4000,
    image: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTczYWJlYnBlc3V1dHBxMnJidmVvcWlqd293dWQ1Ymt3Z2N3bjl3MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Rh0btaKsTkIIrls5yT/giphy.gif",
    isNew: true,
  },
];

const formatNumber = (num: number) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

export const ToolsShowcaseV2 = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const router = useRouter();

  const filteredTools =
    activeCategory === "all"
      ? tools
      : tools.filter((tool) => tool.category === activeCategory || tool.category === "all");

  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-400 text-sm mb-4">
            <SettingsIcon className="w-4 h-4" />
            <span>30+ Công cụ AI</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text leading-[1.2] text-transparent">
            Đa dạng công cụ cho mọi nhu cầu
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Từ chân dung, sản phẩm đến marketing - tất cả trong một nền tảng
          </p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? "text-white bg-orange-500"
                  : "text-neutral-400 bg-white/5 hover:bg-white/10"
              }`}
            >
              {cat.label}
              {activeCategory === cat.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-orange-500 rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* Tools Grid */}
        <motion.div
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredTools.map((tool, index) => (
                <motion.div
                key={tool.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                // whileHover={{ y: -10, scale: 1.02 }}
                onClick={() => router.push(`/tool/${tool.id}`)}
                className="group cursor-pointer bg-neutral-900 rounded-2xl overflow-hidden border border-white/10 hover:border-orange-500/50 transition-all"
                >
                {/* Image - 9:16 Aspect Ratio */}
                <div className="relative aspect-[9/16] overflow-hidden">
                  <img
                  src={tool.image.replace(/\.(jpg|jpeg|png)$/i, '.gif')}
                  alt={tool.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Badge */}
                  {(tool.isNew || tool.isHot) && (
                  <div
                    className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    tool.isNew
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                    }`}
                  >
                    {tool.isNew ? (
                    <>
                      <SettingsIcon className="w-3 h-3" />
                      <span>Mới</span>
                    </>
                    ) : (
                    <>
                      <FireIcon className="w-3 h-3" />
                      <span>Hot</span>
                    </>
                    )}
                  </div>
                  )}

                  {/* Info - appears on hover */}
                  <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <h3 className="text-white font-semibold mb-1">
                    {tool.name}
                  </h3>
                  <p className="text-neutral-300 text-sm mb-3 line-clamp-2">
                    {tool.description}
                  </p>
                  <button className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-full flex items-center gap-1 w-fit">
                    Thử ngay
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                  </div>
                </div>
                </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-10"
        >
          <button
            onClick={() => router.push("/generators")}
            className="px-6 py-3 bg-white/5 text-white rounded-full hover:bg-white/10 transition-all border border-white/10 hover:border-orange-500/50 flex items-center gap-2 mx-auto cursor-pointer"
          >
            Xem tất cả công cụ
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
