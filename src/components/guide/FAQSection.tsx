"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircleIcon, ChevronDownIcon, MessageCircleIcon, ArrowRightIcon } from "./icons";
import { ZaloCTA } from "../ZaloCTA";

const faqs = [
  {
    question: "Duky AI là gì và hoạt động như thế nào?",
    answer:
      "Duky AI là nền tảng tạo ảnh AI thông minh, cho phép bạn tạo ảnh chất lượng cao từ mô tả văn bản. Chúng tôi sử dụng các mô hình AI tiên tiến nhất để biến ý tưởng của bạn thành hiện thực chỉ trong vài giây.",
  },
  {
    question: "Tôi cần tốn bao nhiêu credit để tạo ảnh?",
    answer:
      "Mỗi công cụ có mức giá credit khác nhau. Công cụ Free Generation hoàn toàn miễn phí, trong khi các công cụ nâng cao như Face Swap, Avatar Creator thường tốn 1-2 credits mỗi lần sử dụng. Bạn có thể xem chi tiết giá tại trang Pricing.",
  },
  {
    question: "Làm thế nào để viết prompt hiệu quả?",
    answer:
      "Để viết prompt hiệu quả, hãy mô tả chi tiết về: chủ thể chính, phong cách nghệ thuật, màu sắc, ánh sáng, bối cảnh và tâm trạng. Càng chi tiết, AI càng hiểu đúng ý bạn. Xem video 'Mẹo viết prompt hiệu quả' để học thêm kỹ thuật nâng cao.",
  },
  {
    question: "Tôi có thể sử dụng ảnh tạo ra cho mục đích thương mại không?",
    answer:
      "Có! Tất cả ảnh tạo ra từ Duky AI đều thuộc quyền sở hữu của bạn. Bạn có thể sử dụng cho mục đích cá nhân hoặc thương mại mà không cần lo lắng về bản quyền.",
  },
  {
    question: "Làm thế nào để nạp thêm credit?",
    answer:
      "Bạn có thể nạp credit bằng cách vào trang 'Gói credit', chọn gói phù hợp và thanh toán qua nhiều phương thức như chuyển khoản ngân hàng, ví điện tử, hoặc thẻ tín dụng. Credit sẽ được cộng vào tài khoản ngay sau khi thanh toán thành công.",
  },
  {
    question: "Face Swap có an toàn và bảo mật không?",
    answer:
      "Tuyệt đối an toàn! Ảnh gốc của bạn chỉ được sử dụng trong quá trình xử lý và không được lưu trữ lâu dài trên hệ thống. Chúng tôi tuân thủ nghiêm ngặt các quy định về bảo vệ dữ liệu cá nhân.",
  },
  {
    question: "Tôi có thể chỉnh sửa ảnh sau khi tạo không?",
    answer:
      "Hiện tại, bạn có thể tải ảnh về và chỉnh sửa bằng các công cụ bên ngoài. Chúng tôi đang phát triển tính năng chỉnh sửa trực tiếp trên nền tảng, dự kiến ra mắt trong thờii gian tới.",
  },
  {
    question: "Hỗ trợ khách hàng hoạt động như thế nào?",
    answer:
      "Chúng tôi cung cấp hỗ trợ 24/7 qua chat trực tuyến và email. Đội ngũ hỗ trợ luôn sẵn sàng giải đáp thắc mắc và hỗ trợ kỹ thuật. Thờii gian phản hồi trung bình là dưới 2 giờ.",
  },
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 bg-neutral-950">
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
            <span>FAQ</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Câu hỏi thường gặp
          </h2>
          <p className="text-neutral-400">
            Giải đáp những thắc mắc phổ biến nhất của ngườii dùng
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div
                className={`border rounded-xl overflow-hidden transition-all ${
                  openIndex === index
                    ? "bg-white/5 border-orange-500/30"
                    : "bg-neutral-900/50 border-white/10 hover:border-white/20"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-white font-medium pr-4">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDownIcon className="w-5 h-5 text-neutral-400" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-5 text-neutral-400 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <ZaloCTA />
        </motion.div>
        
      </div>
    </section>
  );
};
