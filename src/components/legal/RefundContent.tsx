"use client";

import { motion } from "framer-motion";
import { CheckCircleIcon, XCircleIcon, ClockIcon } from "lucide-react";

export const RefundContent = () => {
  return (
    <section className="py-16 bg-black">
      <div className="max-w-4xl mx-auto px-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Chính sách hoàn tiền</h2>
          <p className="text-neutral-400">
            Cam kết hoàn tiền 100% trong 7 ngày nếu không hài lòng
          </p>
        </motion.div>

        {/* Eligible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
            Điều kiện được hoàn tiền
          </h3>
          <ul className="space-y-3 text-neutral-400">
            <li className="flex items-start gap-3">
              <span className="text-green-500">✓</span>
              <span>Yêu cầu trong vòng 7 ngày kể từ ngày thanh toán</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500">✓</span>
              <span>Sử dụng ít hơn 20% credits trong gói</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500">✓</span>
              <span>Lý do hợp lệ: chất lượng không đạt yêu cầu, lỗi kỹ thuật, thanh toán nhầm</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-500">✓</span>
              <span>Gói đầu tiên đăng ký (first-time purchase)</span>
            </li>
          </ul>
        </motion.div>

        {/* Not Eligible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <XCircleIcon className="w-5 h-5 text-red-500" />
            Không áp dụng hoàn tiền
          </h3>
          <ul className="space-y-3 text-neutral-400">
            <li className="flex items-start gap-3">
              <span className="text-red-500">✗</span>
              <span>Đã sử dụng quá 20% credits trong gói</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500">✗</span>
              <span>Yêu cầu sau 7 ngày từ ngày thanh toán</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500">✗</span>
              <span>Gói đã gia hạn tự động (renewal)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500">✗</span>
              <span>Vi phạm điều khoản sử dụng dẫn đến khóa tài khoản</span>
            </li>
          </ul>
        </motion.div>

        {/* Process */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-orange-500" />
            Quy trình hoàn tiền
          </h3>
          <div className="space-y-4">
            {[
              { step: 1, title: "Gửi yêu cầu", desc: "Gửi email đến support@duky.ai với tiêu đề [Hoàn tiền] kèm mã đơn hàng" },
              { step: 2, title: "Xem xét", desc: "Chúng tôi xem xét trong vòng 24-48 giờ làm việc" },
              { step: 3, title: "Phê duyệt", desc: "Nhận email xác nhận hoàn tiền nếu đủ điều kiện" },
              { step: 4, title: "Nhận tiền", desc: "Tiền được hoàn về phương thức thanh toán gốc trong 5-10 ngày làm việc" }
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 p-4 bg-white/5 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                  {item.step}
                </div>
                <div>
                  <h4 className="text-white font-medium">{item.title}</h4>
                  <p className="text-neutral-400 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl"
        >
          <h3 className="text-lg font-semibold text-white mb-2">Cần hỗ trợ?</h3>
          <p className="text-neutral-300 mb-4">
            Nếu bạn có câu hỏi về chính sách hoàn tiền, đừng ngần ngại liên hệ với chúng tôi.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all"
          >
            Liên hệ hỗ trợ
          </a>
        </motion.div>
      </div>
    </section>
  );
};
