"use client";

import { motion } from "framer-motion";
import { Search, Book, MessageCircle, Video, FileText, LifeBuoy } from "lucide-react";

const categories = [
  {
    icon: Book,
    title: "Bắt đầu",
    description: "Hướng dẫn cơ bản để sử dụng Duky AI",
    articles: ["Tạo tài khoản", "Nạp credits", "Tạo ảnh đầu tiên"]
  },
  {
    icon: Video,
    title: "Video hướng dẫn",
    description: "Xem video chi tiết về từng tính năng",
    articles: ["Tạo chân dung", "Tạo poster", "Sử dụng Studio"]
  },
  {
    icon: FileText,
    title: "Câu hỏi thường gặp",
    description: "Giải đáp các vấn đề phổ biến",
    articles: ["Lỗi thanh toán", "Chất lượng ảnh", "Xóa tài khoản"]
  },
  {
    icon: MessageCircle,
    title: "Liên hệ hỗ trợ",
    description: "Chat trực tiếp với đội ngũ hỗ trợ",
    articles: ["Chat Zalo", "Email support", "Hotline"]
  }
];

const popularArticles = [
  "Cách tạo ảnh chân dung doanh nhân chuyên nghiệp",
  "Hướng dẫn sử dụng công cụ tạo poster sản phẩm",
  "Mẹo viết prompt hiệu quả cho AI tạo ảnh",
  "Cách nâng cấp và quản lý gói dịch vụ",
  "Giải quyết lỗi không tạo được ảnh",
  "Chính sách hoàn tiền và bảo hành"
];

export const HelpContent = () => {
  return (
    <section className="py-16 bg-black">
      <div className="max-w-6xl mx-auto px-4">
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mb-16"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              placeholder="Tìm kiếm trợ giúp..."
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
            />
          </div>
        </motion.div>

        {/* Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-orange-500/50 transition-all cursor-pointer group"
            >
              <category.icon className="w-10 h-10 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{category.title}</h3>
              <p className="text-neutral-400 text-sm mb-4">{category.description}</p>
              <ul className="space-y-2">
                {category.articles.map((article, i) => (
                  <li key={i} className="text-sm text-neutral-500 hover:text-orange-400 cursor-pointer">
                    {article}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Popular Articles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-xl font-bold text-white mb-6">Bài viết phổ biến</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {popularArticles.map((article, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-orange-500/50 transition-all cursor-pointer flex items-center gap-3"
              >
                <FileText className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                <span className="text-neutral-300">{article}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Support CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-8 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl text-center"
        >
          <LifeBuoy className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Vẫn cần trợ giúp?</h2>
          <p className="text-neutral-300 mb-6">Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng 24/7</p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl"
          >
            Liên hệ hỗ trợ
          </a>
        </motion.div>
      </div>
    </section>
  );
};
