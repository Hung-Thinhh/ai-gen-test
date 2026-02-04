"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { RocketIcon, ZapIcon, CheckIcon, MailIcon, ArrowRightIcon } from "./icons";

export const FinalCTA = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setEmail("");
  };

  return (
    <section className="py-20 bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-purple-600/20 to-orange-600/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 text-sm mb-6"
          >
            <RocketIcon className="w-4 h-4" />
            <span>Bắt đầu miễn phí ngay hôm nay</span>
          </motion.div>

          {/* Heading */}
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Sẵn sàng biến ý tưởng thành hiện thực?
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-8">
            Tham gia 50,000+ ngườii dùng đang tạo ảnh AI chuyên nghiệp.
            Miễn phí 100 credits mỗi ngày - không cần thẻ tín dụng.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/tool/free-generation")}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-full hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ZapIcon className="w-5 h-5" />
              <span>TẠO ẢNH MIỄN PHÍ NGAY</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/pricing")}
              className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              Xem bảng giá
              <ArrowRightIcon className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Email Signup */}
          {!isSubmitted ? (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onSubmit={handleSubmit}
              className="max-w-md mx-auto"
            >
              <p className="text-neutral-400 text-sm mb-3">
                Hoặc nhận tips & ưu đãi qua email
              </p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn..."
                    className="w-full pl-12 pr-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-neutral-500 outline-none focus:border-orange-500 transition-colors"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? "..." : "Đăng ký"}
                </button>
              </div>
              <p className="text-neutral-500 text-xs mt-3">
                Không spam. Hủy đăng ký bất cứ lúc nào.
              </p>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto p-6 rounded-2xl bg-green-500/20 border border-green-500/30"
            >
              <CheckIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h3 className="text-white font-semibold mb-1">Đăng ký thành công!</h3>
              <p className="text-neutral-400 text-sm">
                Cảm ơn bạn! Hãy kiểm tra email để xác nhận.
              </p>
            </motion.div>
          )}

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-neutral-500"
          >
            <span className="flex items-center gap-1">
              <CheckIcon className="w-4 h-4 text-green-500" /> Không cần thẻ tín dụng
            </span>
            <span className="flex items-center gap-1">
              <CheckIcon className="w-4 h-4 text-green-500" /> Hoàn tiền 7 ngày
            </span>
            <span className="flex items-center gap-1">
              <CheckIcon className="w-4 h-4 text-green-500" /> Hủy bất cứ lúc nào
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
