"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircleIcon } from "./icons";
import { cn } from "@/lib/utils";

const subjects = [
  { value: "", label: "Chọn lý do liên hệ" },
  { value: "general", label: "Yêu cầu chung" },
  { value: "technical", label: "Hỗ trợ kỹ thuật" },
  { value: "billing", label: "Vấn đề thanh toán" },
  { value: "enterprise", label: "Doanh nghiệp" },
  { value: "partnership", label: "Hợp tác" },
  { value: "feedback", label: "Góp ý" },
];

// Image data for each column
const col1Images = [
  "https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768569626305-nhblt.png",
  "https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768466804739-65stxr.png",
  "https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768466804739-65stxr.png",
];
const col2Images = [
  "https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768470105777-ky5i1.png",
  "https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768466804739-65stxr.png",
  "https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768301559/z455qfebzkh6htmk9nce.webp",
];
const col3Images = [
  "https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768470105777-ky5i1.png",
  "https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768466804739-65stxr.png",
  "https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768301559/z455qfebzkh6htmk9nce.webp",
];

// Reusable scroll column component using pure CSS keyframes
const ScrollColumn = ({ images, direction = "up", duration = 30 }: { images: string[]; direction?: "up" | "down"; duration?: number }) => {
  // We render the images twice (2x) so that when the first set scrolls out,
  // the second set is right behind it — creating a seamless infinite loop.
  const allImages = [...images, ...images];
  const animationName = direction === "up" ? "scrollUp" : "scrollDown";

  return (
    <div className="h-full overflow-hidden relative">
      <div
        className="flex flex-col gap-4"
        style={{
          animation: `${animationName} ${duration}s linear infinite`,
        }}
      >
        {allImages.map((src, i) => (
          <img
            key={i}
            src={src}
            className="w-full h-[160px] object-cover rounded-xl shadow-lg border border-white/10 flex-shrink-0"
            alt=""
          />
        ))}
      </div>
    </div>
  );
};

export const ContactForm = () => {
  const [formData, setFormData] = useState({
    reason: "",
    username: "",
    email: "",
    details: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-8 border border-orange-500/30 text-center max-w-md mx-auto bg-black/60 backdrop-blur-xl shadow-2xl shadow-orange-500/10"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/30 animate-pulse">
          <CheckCircleIcon className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Đã gửi thành công!</h3>
        <p className="text-neutral-400">
          Cảm ơn bạn đã liên hệ. Đội ngũ Duky AI sẽ phản hồi trong vòng 24 giờ.
        </p>
      </motion.div>
    );
  }

  return (
    <>
      {/* CSS Keyframes for infinite vertical scroll */}
      <style jsx global>{`
        @keyframes scrollUp {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes scrollDown {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
      `}</style>

      <div className="flex flex-col md:flex-row gap-0 items-stretch rounded-3xl overflow-hidden bg-neutral-900/50 border border-white/5 backdrop-blur-sm">

        {/* Visual Side - Hidden on Mobile */}
        <div className="hidden md:block w-5/12 relative overflow-hidden bg-black/50 min-h-[680px]">
          {/* Ambient glow */}
          <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
          </div>

          {/* 3-Column Image Grid with Infinite Scroll */}
          <div className="absolute inset-0 z-[1] flex items-center justify-center overflow-hidden p-4">
            <div className="w-full h-full max-w-[500px] -rotate-6 scale-110">
              <div className="grid grid-cols-3 gap-3 h-full">
                <ScrollColumn images={col1Images} direction="up" duration={25} />
                <ScrollColumn images={col2Images} direction="down" duration={30} />
                <ScrollColumn images={col3Images} direction="up" duration={28} />
              </div>
            </div>
          </div>

          {/* Gradient overlay on top for fade effect */}
          <div className="absolute inset-0 z-[2] pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black/60" />
        </div>

        {/* Form Side */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 p-6 md:p-10 lg:p-12 bg-black/40"
        >
          <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400 mb-2">
            Gửi tin nhắn
          </h2>
          <p className="text-neutral-400 mb-8 text-sm">
            Điền thông tin bên dưới, chúng tôi sẽ phản hồi sớm nhất
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Reason For Contact */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Lý do liên hệ <span className="text-orange-500">*</span>
              </label>
              <div className={cn(
                "relative rounded-xl border transition-all duration-300 overflow-hidden",
                focusedField === 'reason'
                  ? "border-orange-500 ring-2 ring-orange-500/20 bg-neutral-900"
                  : "border-white/10 bg-neutral-900/50 hover:border-white/20"
              )}>
                <select
                  id="reason"
                  required
                  value={formData.reason}
                  onFocus={() => setFocusedField('reason')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-3.5 bg-transparent text-white border-none focus:ring-0 appearance-none cursor-pointer text-sm"
                >
                  {subjects.map((subject) => (
                    <option key={subject.value} value={subject.value} className="bg-neutral-900 text-neutral-200 py-2">
                      {subject.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Tên người dùng <span className="text-orange-500">*</span>
                </label>
                <div className={cn(
                  "rounded-xl border transition-all duration-300",
                  focusedField === 'username'
                    ? "border-orange-500 ring-2 ring-orange-500/20 bg-neutral-900"
                    : "border-white/10 bg-neutral-900/50 hover:border-white/20"
                )}>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3.5 bg-transparent text-white placeholder-neutral-500 border-none focus:ring-0 text-sm rounded-xl"
                    placeholder="Nhập tên của bạn"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Email liên hệ <span className="text-orange-500">*</span>
                </label>
                <div className={cn(
                  "rounded-xl border transition-all duration-300",
                  focusedField === 'email'
                    ? "border-orange-500 ring-2 ring-orange-500/20 bg-neutral-900"
                    : "border-white/10 bg-neutral-900/50 hover:border-white/20"
                )}>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3.5 bg-transparent text-white placeholder-neutral-500 border-none focus:ring-0 text-sm rounded-xl"
                    placeholder="example@email.com"
                  />
                </div>
              </div>
            </div>

            {/* Details */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Nội dung chi tiết <span className="text-orange-500">*</span>
              </label>
              <div className={cn(
                "rounded-xl border transition-all duration-300",
                focusedField === 'details'
                  ? "border-orange-500 ring-2 ring-orange-500/20 bg-neutral-900"
                  : "border-white/10 bg-neutral-900/50 hover:border-white/20"
              )}>
                <textarea
                  required
                  rows={5}
                  value={formData.details}
                  onFocus={() => setFocusedField('details')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className="w-full px-4 py-3.5 bg-transparent text-white placeholder-neutral-500 border-none focus:ring-0 resize-none text-sm rounded-xl"
                  placeholder="Mô tả chi tiết vấn đề bạn cần hỗ trợ..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 p-[1px] focus:outline-none focus:ring-2 focus:ring-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="relative bg-gradient-to-r from-orange-600 to-amber-600 w-full h-full rounded-[10px] px-2 md:px-6 py-1 md:py-4 transition-all duration-300 group-hover:bg-opacity-90 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="font-bold text-white">Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-white">Gửi tin nhắn</span>
                    <svg className="w-5 h-5 text-white transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </div>
            </button>
          </form>
        </motion.div>
      </div>
    </>
  );
};
