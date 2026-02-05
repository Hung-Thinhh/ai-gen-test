"use client";

import { motion } from "framer-motion";

const posts = [
  {
    title: "Hướng dẫn tạo ảnh chân dung doanh nhân chuyên nghiệp",
    excerpt: "Tìm hiểu cách sử dụng AI để tạo ảnh chân dung doanh nhân với phong cách chuyên nghiệp...",
    date: "05/02/2026",
    category: "Hướng dẫn",
    readTime: "5 phút"
  },
  {
    title: "Top 10 mẫu prompt hiệu quả cho tạo ảnh sản phẩm",
    excerpt: "Khám phá những prompt tối ưu để tạo ảnh sản phẩm đẹp mắt và chuyên nghiệp...",
    date: "03/02/2026",
    category: "Tips",
    readTime: "8 phút"
  },
  {
    title: "AI tạo ảnh và tương lai của ngành thiết kế",
    excerpt: "Phân tích xu hướng AI trong thiết kế và cách các designer thích ứng với công nghệ mới...",
    date: "01/02/2026",
    category: "Xu hướng",
    readTime: "10 phút"
  },
  {
    title: "So sánh các mô hình AI tạo ảnh phổ biến",
    excerpt: "Đánh giá chi tiết Stable Diffusion, Midjourney, DALL-E và các mô hình khác...",
    date: "29/01/2026",
    category: "Kỹ thuật",
    readTime: "12 phút"
  },
  {
    title: "Cách tạo avatar Chibi đáng yêu với AI",
    excerpt: "Hướng dẫn từng bước để tạo avatar Chibi phong cách riêng của bạn...",
    date: "27/01/2026",
    category: "Hướng dẫn",
    readTime: "6 phút"
  },
  {
    title: "Case study: Doanh nghiệp tăng 300% conversion với ảnh AI",
    excerpt: "Câu chuyện thành công từ việc sử dụng ảnh AI trong marketing sản phẩm...",
    date: "25/01/2026",
    category: "Case study",
    readTime: "7 phút"
  }
];

export const BlogContent = () => {
  return (
    <section className="py-16 bg-black">
      <div className="max-w-6xl mx-auto px-4">
        {/* Featured Post */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="relative p-8 md:p-12 bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl overflow-hidden">
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-orange-500 text-white text-sm rounded-full mb-4">
                Nổi bật
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Tổng hợp tính năng mới tháng 2/2026
              </h2>
              <p className="text-neutral-300 mb-6 max-w-2xl">
                Khám phá những cập nhật mới nhất bao gồm: mô hình AI v3 với chất lượng 4K,
                công cụ tạo video từ ảnh, và nhiều template mới...
              </p>
              <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl">
                Đọc ngay
              </button>
            </div>
          </div>
        </motion.div>

        {/* Post Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, index) => (
            <motion.article
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-orange-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                  {post.category}
                </span>
                <span className="text-neutral-500 text-xs">{post.readTime}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-400 transition-colors">
                {post.title}
              </h3>
              <p className="text-neutral-400 text-sm mb-4">{post.excerpt}</p>
              <div className="text-neutral-500 text-sm">{post.date}</div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
