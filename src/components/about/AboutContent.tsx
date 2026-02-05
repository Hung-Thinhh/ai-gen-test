"use client";

import { motion } from "framer-motion";
import { Sparkles, Users, Globe, Award } from "lucide-react";

export const AboutContent = () => {
  const stats = [
    { icon: Users, value: "50,000+", label: "Ngườii dùng" },
    { icon: Sparkles, value: "2M+", label: "Ảnh đã tạo" },
    { icon: Globe, value: "30+", label: "Công cụ AI" },
    { icon: Award, value: "4.9", label: "Đánh giá" },
  ];

  const values = [
    {
      title: "Sáng tạo không giới hạn",
      description: "Chúng tôi tin rằng AI có thể trợ giúp con ngườii sáng tạo tốt hơn, không thay thế con ngườii."
    },
    {
      title: "Công nghệ tiên tiến",
      description: "Luôn cập nhật những mô hình AI mới nhất để mang đến trải nghiệm tốt nhất."
    },
    {
      title: "Dễ dàng sử dụng",
      description: "Giao diện trực quan, không cần kiến thức kỹ thuật, ai cũng có thể tạo ảnh đẹp."
    },
    {
      title: "Bảo mật dữ liệu",
      description: "Dữ liệu của bạn được bảo vệ nghiêm ngặt, không chia sẻ với bên thứ ba."
    }
  ];

  return (
    <section className="py-16 bg-black">
      <div className="max-w-6xl mx-auto px-4">
        {/* Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Câu chuyện của chúng tôi</h2>
          <p className="text-neutral-400 max-w-3xl mx-auto leading-relaxed">
            Duky AI được thành lập vào năm 2024 với sứ mệnh đưa công nghệ AI tạo ảnh đến gần hơn với
            ngườii dùng Việt Nam. Từ một nhóm nhỏ đam mê AI, chúng tôi đã phát triển thành nền tảng
            với hơn 30 công cụ AI, phục vụ hàng chục nghìn ngườii dùng từ cá nhân đến doanh nghiệp.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center"
            >
              <stat.icon className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-neutral-400 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-8">Giá trị cốt lõi</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="p-6 bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                <p className="text-neutral-400">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center p-8 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Tham gia đội ngũ</h2>
          <p className="text-neutral-300 mb-6">
            Chúng tôi luôn tìm kiếm những tài năng đam mê AI và sáng tạo.
          </p>
          <a
            href="/careers"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all"
          >
            Xem vị trí tuyển dụng
          </a>
        </motion.div>
      </div>
    </section>
  );
};
