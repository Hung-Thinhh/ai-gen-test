"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircleIcon } from "./icons";

const subjects = [
  { value: "", label: "Chọn lý do liên hệ" },
  { value: "general", label: "Yêu cầu chung" },
  { value: "technical", label: "Hỗ trợ kỹ thuật" },
  { value: "billing", label: "Vấn đề thanh toán" },
  { value: "enterprise", label: "Doanh nghiệp" },
  { value: "partnership", label: "Hợp tác" },
  { value: "feedback", label: "Góp ý" },
];

// Sample AI-generated images for the left side grid
const sampleImages = [
  {
    id: 1,
    src: "/img/home_images/home_image_1.webp",
    alt: "AI Art 1",
  },
  {
    id: 2,
    src: "/img/home_images/home_image_2.webp",
    alt: "AI Art 2",
  },
  {
    id: 3,
    src: "/img/home_images/home_image_3.webp",
    alt: "AI Art 3",
  },
  {
    id: 4,
    src: "/img/home_images/home_image_4.webp",
    alt: "AI Art 4",
  },
  {
    id: 5,
    src: "/img/home_images/home_image_5.webp",
    alt: "AI Art 5",
  },
  {
    id: 6,
    src: "/img/home_images/home_image_6.webp",
    alt: "AI Art 6",
  },
];

export const ContactForm = () => {
  const [formData, setFormData] = useState({
    reason: "",
    username: "",
    email: "",
    details: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-8 border border-orange-500 text-center max-w-md mx-auto bg-gradient-to-br from-orange-900/60 via-amber-900/40 to-yellow-900/30"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
          <CheckCircleIcon className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Đã gửi thành công!</h3>
        <p className="text-amber-200/70">
          Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong vòng 24 giờ.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="flex gap-2 items-start rounded-2xl">
      <div className="flex-1 w-full overflow-hidden min-h-[680px]">
        <div className="w-full flex items-center justify-center p-8 md:p-0 h-full max-h-[680px] overflow-hidden">
          <div className="relative w-full max-w-md md:max-w-none md:w-[600px] rounded-2xl p-2 rotate-6 md:translate-x-10">
            <div className="grid grid-cols-3 gap-5 h-full">
              {/* Using a mix of placeholder images to simulate the gallery with scroll animation */}
              {/* Column 1 - Scroll Up */}
              <div className="col-span-1 overflow-hidden h-full">
                <motion.div
                  className="space-y-3"
                  animate={{ y: ["0%", "-50%"] }}
                  transition={{
                    y: {
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    },
                  }}
                >
                  {/* First set */}
                  <img src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768569626305-nhblt.png" className="w-full h-[150px] object-cover rounded-lg" alt="" />
                  <img src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768466804739-65stxr.png" className="w-full h-[150px] object-cover rounded-lg" alt="" />
                  <img src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768466804739-65stxr.png" className="w-full h-[150px] object-cover rounded-lg" alt="" />
                  {/* Duplicate set for seamless loop */}
                  <img src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768569626305-nhblt.png" className="w-full h-[150px] object-cover rounded-lg" alt="" />
                  <img src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768466804739-65stxr.png" className="w-full h-[150px] object-cover rounded-lg" alt="" />
                  <img src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768466804739-65stxr.png" className="w-full h-[150px] object-cover rounded-lg" alt="" />
                </motion.div>
              </div>
              {/* Column 2 - Scroll Down */}
              <div className="col-span-1 overflow-hidden h-full">
                <motion.div
                  className="space-y-3"
                  initial={{ y: "-50%" }}
                  animate={{ y: ["-50%", "0%"] }}
                  transition={{
                    y: {
                      duration: 25,
                      repeat: Infinity,
                      ease: "linear",
                    },
                  }}
                >
                  {/* First set */}
                  <img src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768470105777-ky5i1.png" className="w-full h-[150px] object-cover rounded-lg" alt="" />
                  <img src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768466804739-65stxr.png" className="w-full h-[150px] object-cover rounded-lg" alt="" />
                  <img src="https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768301559/z455qfebzkh6htmk9nce.webp" className="w-full h-[150px] object-cover rounded-lg" alt="" />
                  {/* Duplicate set for seamless loop */}
                  <img src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768470105777-ky5i1.png" className="w-full h-[150px] object-cover rounded-lg" alt="" />
                  <img src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768466804739-65stxr.png" className="w-full h-[150px] object-cover rounded-lg" alt="" />
                  <img src="https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768301559/z455qfebzkh6htmk9nce.webp" className="w-full h-[150px] object-cover rounded-lg" alt="" />
                </motion.div>
              </div>
              {/* Column 3 - Scroll Up (slower) */}
              <div className="col-span-1 overflow-hidden h-full">
                <motion.div
                  className="space-y-3"
                  animate={{ y: ["0%", "-50%"] }}
                  transition={{
                    y: {
                      duration: 22,
                      repeat: Infinity,
                      ease: "linear",
                    },
                  }}
                >
                  {/* First set */}
                  <img src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768470105777-ky5i1.png" className="w-full h-[150px] object-cover rounded-lg" alt="" />
                  <img src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768466804739-65stxr.png" className="w-full h-[150px] object-cover rounded-lg" alt="" />
                  <img src="https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768301559/z455qfebzkh6htmk9nce.webp" className="w-full h-[150px] object-cover rounded-lg" alt="" />
                  {/* Duplicate set for seamless loop */}
                  <img src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768470105777-ky5i1.png" className="w-full h-[150px] object-cover rounded-lg" alt="" />
                  <img src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768466804739-65stxr.png" className="w-full h-[150px] object-cover rounded-lg" alt="" />
                  <img src="https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768301559/z455qfebzkh6htmk9nce.webp" className="w-full h-[150px] object-cover rounded-lg" alt="" />
                </motion.div>
              </div>
              {/* <div className="col-span-1 space-y-2">
                <img src="https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768199833/dxbmcqbui1vsguds5leb.webp" className="w-full h-1/2 object-cover rounded-lg" alt="" />
                <img src="https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768281828/xw6xdjfojdcdskwzsqtz.webp" className="w-full h-1/2 object-cover rounded-lg" alt="" />
              </div>
              <div className="col-span-1 space-y-2 mt-4">
                <img src="/img/trungthu.webp" className="w-full h-1/2 object-cover rounded-lg" alt="" />
                <img src="/img/yeunuoc.webp" className="w-full h-1/2 object-cover rounded-lg" alt="" />
              </div> */}
            </div>

            {/* Glass reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-2xl" />
          </div>
        </div>
      </div>


      {/* Right Side - Form */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-1 rounded-2xl p-6 md:p-8 bg-gradient-to-br from-orange-600/30 via-orange-400/30 to-yellow-900/30 "
      >
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Liên hệ với chúng tôi
        </h2>
        <p className="text-amber-200/70 mb-8 text-sm">
          Điền thông tin bên dưới, chúng tôi sẽ phản hồi sớm nhất
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reason For Contact */}
          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-amber-100 mb-2"
            >
              Lý do liên hệ <span className="text-amber-500">*</span>
            </label>
            <select
              id="reason"
              required
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              className="w-full px-4 py-3.5 bg-amber-950/30 border border-orange-500 rounded-lg text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-amber-400/50 transition-all appearance-none cursor-pointer text-sm"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m19 9-7 7-7-7'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                backgroundSize: "16px",
              }}
            >
              {subjects.map((subject) => (
                <option key={subject.value} value={subject.value}>
                  {subject.label}
                </option>
              ))}
            </select>
          </div>

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-amber-100 mb-2"
            >
              Tên ngườii dùng <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              id="username"
              required
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full px-4 py-3.5 bg-amber-950/30 border border-orange-500 rounded-lg text-white placeholder-amber-200/30 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-amber-100 mb-2"
            >
              Địa chỉ email <span className="text-amber-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3.5 bg-amber-950/30 border border-orange-500 rounded-lg text-white placeholder-amber-200/30 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all text-sm"
            />
          </div>

          {/* Details */}
          <div>
            <label
              htmlFor="details"
              className="block text-sm font-medium text-amber-100 mb-2"
            >
              Chi tiết <span className="text-amber-500">*</span>
            </label>
            <textarea
              id="details"
              required
              rows={5}
              value={formData.details}
              onChange={(e) =>
                setFormData({ ...formData, details: e.target.value })
              }
              className="w-full px-4 py-3.5 bg-amber-950/30 border border-orange-500 rounded-lg text-white placeholder-amber-200/30 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all resize-none text-sm"
              placeholder="Mô tả chi tiết vấn đề hoặc nội dung bạn cần hỗ trợ..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-400 hover:via-amber-400 hover:to-yellow-400 disabled:opacity-50 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang gửi...</span>
              </>
            ) : (
              <span>Gửi tin nhắn</span>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
