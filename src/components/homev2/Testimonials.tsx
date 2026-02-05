"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QuoteIcon, StarIcon, ChevronLeftIcon, ChevronRightIcon, BadgeCheckIcon } from "./icons";

const testimonials = [
  {
    id: 1,
    name: "Nguyễn Minh Anh",
    role: "Chủ shop thờii trang",
    avatar: "MA",
    content: "Trước đây tôi phải thuê photographer 2 triệu/ buổi chụp sản phẩm. Giờ với Duky, tôi tự tạo ảnh đẹp chỉ trong 5 phút. Đã tiết kiệm được hàng chục triệu mỗi tháng!",
    rating: 5,
    tool: "Product Photo",
    verified: true,
  },
  {
    id: 2,
    name: "Trần Thu Hà",
    role: "Marketing Manager",
    avatar: "TH",
    content: "Poster trà sữa tạo bằng AI đẹp không kém thiết kế chuyên nghiệp. Team marketing chúng tôi dùng Duky cho mọi chiến dịch, giảm 70% thờii gian thiết kế.",
    rating: 5,
    tool: "Poster Creator",
    verified: true,
  },
  {
    id: 3,
    name: "Lê Đức Huy",
    role: "Content Creator",
    avatar: "DH",
    content: "Avatar chibi từ Duky giúp kênh TikTok của mình nổi bật. Followers tăng 300% sau 2 tháng dùng ảnh AI làm thumbnail. Quá đáng đồng tiền!",
    rating: 5,
    tool: "Avatar Creator",
    verified: true,
  },
  {
    id: 4,
    name: "Phạm Lan Khuê",
    role: "Freelance Designer",
    avatar: "LK",
    content: "Là designer, tôi khá kỹ tính về ảnh. Nhưng Duky thực sự ấn tượng - chất lượng ảnh 4K, chỉnh sửa được chi tiết. Giờ đây là công cụ không thể thiếu.",
    rating: 5,
    tool: "Free Generation",
    verified: true,
  },
  {
    id: 5,
    name: "Hoàng Quang Minh",
    role: "Startup Founder",
    avatar: "QM",
    content: "Bộ ảnh doanh nhân tôi tạo từ Duky đã được đăng trên báo. Không ai tin đó là AI tạo ra. Chuyên nghiệp đến mức ngạc nhiên!",
    rating: 5,
    tool: "Business Portrait",
    verified: true,
  },
];

const stats = [
  { value: "4.9", label: "Đánh giá trung bình", suffix: "/5" },
  { value: "50", label: "Nghìn ngườii dùng", suffix: "K+" },
  { value: "2", label: "Triệu ảnh đã tạo", suffix: "M+" },
  { value: "98", label: "Hài lòng", suffix: "%" },
];

export const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <section className="py-20 bg-neutral-950 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-400 text-sm mb-4">
            <QuoteIcon className="w-4 h-4" />
            <span>Khách hàng nói gì</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Được tin dùng bởi 50,000+ người dùng
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto">
            Tham gia cộng đồng ngườii dùng hài lòng
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="text-2xl md:text-3xl font-bold text-orange-400">
                {stat.value}
                <span className="text-lg">{stat.suffix}</span>
              </div>
              <div className="text-neutral-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Testimonial Carousel */}
        <div className="relative max-w-3xl mx-auto">
          {/* Navigation Buttons */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-10 h-10 !p-2 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10 cursor-pointer"
            aria-label="Previous testimonial"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 !w-10 !h-10 !p-2 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10 cursor-pointer"
            aria-label="Next testimonial"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>

          {/* Card Container */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="bg-neutral-900 rounded-2xl p-6 md:p-8 border border-white/10"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Avatar & Info */}
                  <div className="flex-shrink-0 text-center md:text-left">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xl font-bold mx-auto md:mx-0">
                      {testimonials[currentIndex].avatar}
                    </div>
                    <h4 className="text-white font-semibold mt-3">
                      {testimonials[currentIndex].name}
                    </h4>
                    <p className="text-neutral-500 text-sm">
                      {testimonials[currentIndex].role}
                    </p>
                    {testimonials[currentIndex].verified && (
                      <span className="inline-flex items-center gap-1 mt-2 text-xs text-green-400">
                        <BadgeCheckIcon className="w-3 h-3" />
                        Đã xác thực
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {/* Rating */}
                    <div className="flex gap-1 mb-3">
                      {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 text-yellow-500" />
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-neutral-300 text-lg leading-relaxed mb-4">
                      &ldquo;{testimonials[currentIndex].content}&rdquo;
                    </p>

                    {/* Tool Badge */}
                    <span className="inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm">
                      Dùng: {testimonials[currentIndex].tool}
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 !p-1 !min-w-2 !min-h-2 rounded-full transition-all cursor-pointer ${
                  index === currentIndex
                    ? "w-8 bg-orange-500"
                    : "bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
