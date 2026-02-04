"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircleIcon, ChevronDownIcon, MessageCircleIcon, ArrowRightIcon } from "./icons";

const faqs = [
  {
    category: "Bắt đầu",
    items: [
      {
        question: "Duky AI là gì?",
        answer: "Duky AI là nền tảng tạo ảnh AI chuyên nghiệp cho doanh nghiệp và cá nhân. Với 30+ công cụ AI, bạn có thể tạo chân dung, ảnh sản phẩm, poster marketing, avatar và nhiều hơn nữa chỉ trong vài giây.",
      },
      {
        question: "Tôi cần kỹ năng thiết kế để sử dụng không?",
        answer: "Không cần! Duky AI được thiết kế cho mọi ngườii, kể cả ngườii không có kinh nghiệm thiết kế. Chỉ cần mô tả bằng văn bản hoặc chọn từ các template có sẵn, AI sẽ tạo ảnh đẹp mắt cho bạn.",
      },
      {
        question: "Có miễn phí không?",
        answer: "Có! Gói Miễn phí cho phép bạn tạo 100 ảnh mỗi ngày với 30+ công cụ cơ bản. Nếu cần nhiều hơn, bạn có thể nâng cấp lên gói Starter hoặc Pro với giá chỉ từ 49,000đ/tháng.",
      },
    ],
  },
  {
    category: "Credits & Thanh toán",
    items: [
      {
        question: "Credit là gì?",
        answer: "Credit là đơn vị tiền tệ trong Duky AI để sử dụng các công cụ trả phí. Mỗi công cụ có giá khác nhau (thường 1-2 credits). Gói Miễn phí nhận 100 credits/ngày, gói trả phí nhận nhiều hơn.",
      },
      {
        question: "Credits có hết hạn không?",
        answer: "Credits trong gói Miễn phí reset mỗi ngày. Credits trong gói trả phí (Starter/Pro) có hiệu lực trong 30 ngày hoặc 365 ngày tùy gói bạn chọn.",
      },
      {
        question: "Tôi có thể thanh toán bằng phương thức nào?",
        answer: "Chúng tôi hỗ trợ thanh toán qua SePay, Momo, ZaloPay, và chuyển khoản ngân hàng. Tất cả giao dịch đều được bảo mật 100%.",
      },
    ],
  },
  {
    category: "Tính năng",
    items: [
      {
        question: "Chất lượng ảnh như thế nào?",
        answer: "Gói Miễn phí: Standard (1024x1024). Gói Starter: HD (2048x2048). Gói Pro: 4K (4096x4096). Tất cả ảnh đều không giới hạn số lần tải về.",
      },
      {
        question: "Tôi có thể dùng ảnh cho mục đích thương mại không?",
        answer: "Có! Tất cả ảnh tạo từ Duky AI đều có bản quyền thuộc về bạn. Bạn có thể dùng cho cá nhân, doanh nghiệp, bán hàng, marketing - không giới hạn.",
      },
      {
        question: "Có watermark không?",
        answer: "Gói Miễn phí có watermark nhỏ ở góc. Gói Starter và Pro không có watermark. Bạn cũng có thể dùng công cụ Remove Watermark nếu cần.",
      },
    ],
  },
  {
    category: "Hỗ trợ",
    items: [
      {
        question: "Làm sao để liên hệ hỗ trợ?",
        answer: "Gói Miễn phí: Hỗ trợ qua cộng đồng Facebook/Zalo. Gói Starter: Email hỗ trợ (24h). Gói Pro: Chat trực tiếp 24/7 và tư vấn 1-1.",
      },
      {
        question: "Tôi không hài lòng có được hoàn tiền không?",
        answer: "Có! Chính sách hoàn tiền 100% trong 7 ngày nếu bạn không hài lòng với dịch vụ. Không cần lý do, không rườm rà.",
      },
    ],
  },
];

export const FAQ = () => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState("Bắt đầu");

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeFaqs = faqs.find((f) => f.category === activeCategory);

  return (
    <section className="py-20 bg-black">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-400 text-sm mb-4">
            <HelpCircleIcon className="w-4 h-4" />
            <span>Câu hỏi thường gặp</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Mọi thắc mắc đều có câu trả lờii
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto">
            Tìm hiểu thêm về Duky AI
          </p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {faqs.map((category) => (
            <button
              key={category.category}
              onClick={() => setActiveCategory(category.category)}
              className={`px-4 py-2 rounded-full text-sm transition-all cursor-pointer ${
                activeCategory === category.category
                  ? "bg-orange-500 text-white"
                  : "bg-white/5 text-neutral-400 hover:bg-white/10"
              }`}
            >
              {category.category}
            </button>
          ))}
        </motion.div>

        {/* FAQ Items */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          <AnimatePresence mode="wait">
            {activeFaqs?.items.map((item, index) => {
              const key = `${activeCategory}-${index}`;
              const isOpen = openItems[key];

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="bg-neutral-900 rounded-xl border border-white/10 overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(key)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <span className="text-white font-medium pr-4">{item.question}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-orange-500 flex-shrink-0"
                    >
                      <ChevronDownIcon className="w-5 h-5" />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-4 pb-4">
                          <p className="text-neutral-400 leading-relaxed">{item.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-10 p-6 rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageCircleIcon className="w-5 h-5 text-orange-400" />
            <p className="text-white">Vẫn còn thắc mắc?</p>
          </div>
          <p className="text-neutral-400 text-sm mb-4">
            Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ
          </p>
          <button className="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors flex items-center gap-2 mx-auto cursor-pointer">
            Liên hệ hỗ trợ
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
