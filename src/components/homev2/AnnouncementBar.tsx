"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FireIcon, XIcon } from "./icons";

interface AnnouncementBarProps {
  message?: string;
  link?: string;
  linkText?: string;
  storageKey?: string;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  message = "🔥 Flash Sale: Giảm 80% gói Pro - Chỉ còn 2 giờ!",
  link = "/pricing",
  linkText = "Mua ngay →",
  storageKey = "announcement-closed",
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const closed = localStorage.getItem(storageKey);
    if (closed) {
      const closedTime = parseInt(closed);
      // Reset after 24 hours
      if (Date.now() - closedTime > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(storageKey);
      } else {
        setIsVisible(false);
      }
    }
  }, [storageKey]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(storageKey, Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative hidden z-50 h-10 bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 md:flex items-center justify-center text-white text-sm font-medium overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Animated background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: isHovered ? "100%" : ["-100%", "100%"],
            }}
            transition={{
              duration: isHovered ? 0.5 : 2,
              repeat: isHovered ? 0 : Infinity,
              ease: "linear",
            }}
          />

          {/* Content */}
          <div className="relative flex items-center gap-2 px-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {/* <FireIcon className="w-4 h-4" /> */}
            </motion.div>
            <span>{message}</span>
            <a
              href={link}
              className="underline hover:text-yellow-200 transition-colors font-semibold"
            >
              {linkText}
            </a>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close announcement"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
