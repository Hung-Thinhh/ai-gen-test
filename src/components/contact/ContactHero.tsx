"use client";

import { motion } from "framer-motion";
import { MessageSquareIcon } from "./icons";

export const ContactHero = () => {
  return (
    <section className="relative py-20 md:py-28 bg-black overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
         <div className="absolute top-0 left-1/6 w-220 h-96 bg-orange-600/60 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/6 w-220 h-96 bg-yellow-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 text-sm mb-6">
            <MessageSquareIcon className="w-4 h-4" />
            <span>Liên hệ với chúng tôi</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.2]">
            Chúng tôi luôn sẵn sàng
            <span className="block leading-[1.2] bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              hỗ trợ bạn
            </span>
          </h1>

          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Có câu hỏi hoặc cần hỗ trợ? Đội ngũ của chúng tôi luôn sẵn sàng giúp đỡ.
            Gửi tin nhắn cho chúng tôi và chúng tôi sẽ phản hồi trong vòng 24 giờ.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
