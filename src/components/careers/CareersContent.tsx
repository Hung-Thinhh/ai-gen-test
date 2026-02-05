"use client";

import { motion } from "framer-motion";
import { MapPin, Briefcase, DollarSign } from "lucide-react";

const jobs = [
  {
    title: "Senior AI Engineer",
    department: "Engineering",
    location: "Hà Nội / Remote",
    type: "Full-time",
    salary: "$2,000 - $4,000",
    description: "Phát triển và tối ưu hóa các mô hình AI tạo ảnh, nghiên cứu công nghệ mới."
  },
  {
    title: "UI/UX Designer",
    department: "Design",
    location: "Hồ Chí Minh",
    type: "Full-time",
    salary: "$1,000 - $2,000",
    description: "Thiết kế giao diện ngườii dùng, tạo trải nghiệm mượt mà cho nền tảng AI."
  },
  {
    title: "Content Marketing Specialist",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
    salary: "$800 - $1,500",
    description: "Xây dựng nội dung, chiến lược marketing cho sản phẩm AI tạo ảnh."
  },
  {
    title: "Customer Success Manager",
    department: "Support",
    location: "Hà Nội",
    type: "Full-time",
    salary: "$700 - $1,200",
    description: "Hỗ trợ khách hàng doanh nghiệp, đảm bảo họ thành công với sản phẩm."
  }
];

const benefits = [
  "Lương thưởng cạnh tranh",
  "Làm việc linh hoạt (remote)",
  "Bảo hiểm sức khỏe",
  "Macbook Pro cho nhân viên",
  "Học phí đào tạo AI",
  "Team building hàng tháng",
  "Ngày nghỉ phép linh hoạt",
  "Stock options"
];

export const CareersContent = () => {
  return (
    <section className="py-16 bg-black">
      <div className="max-w-6xl mx-auto px-4">
        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-8">Phúc lợi</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-white/5 border border-white/10 rounded-xl text-center"
              >
                <p className="text-neutral-300">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Job Listings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-white text-center mb-8">Vị trí đang tuyển</h2>
          <div className="space-y-4">
            {jobs.map((job, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-orange-500/50 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{job.title}</h3>
                    <p className="text-neutral-400 mb-3">{job.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center gap-1 text-neutral-400">
                        <Briefcase className="w-4 h-4" /> {job.department}
                      </span>
                      <span className="flex items-center gap-1 text-neutral-400">
                        <MapPin className="w-4 h-4" /> {job.location}
                      </span>
                      <span className="flex items-center gap-1 text-neutral-400">
                        <DollarSign className="w-4 h-4" /> {job.salary}
                      </span>
                    </div>
                  </div>
                  <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl whitespace-nowrap">
                    Ứng tuyển
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center p-8 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl"
        >
          <h3 className="text-xl font-bold text-white mb-2">Không thấy vị trí phù hợp?</h3>
          <p className="text-neutral-300 mb-4">Gửi CV của bạn, chúng tôi sẽ liên hệ khi có cơ hội.</p>
          <a
            href="mailto:careers@duky.ai"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
          >
            Gửi CV ngẫu nhiên
          </a>
        </motion.div>
      </div>
    </section>
  );
};
