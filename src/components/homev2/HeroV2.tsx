"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';
import { useRouter } from "next/navigation";
import { PencilIcon, ZapIcon, StarIcon } from "./icons";

// Particle Network Component
const ParticleNetwork = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      const count = Math.min(50, Math.floor((canvas.width * canvas.height) / 20000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Draw particles
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        const dx = mx - particle.x;
        const dy = my - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          particle.x -= dx * 0.01;
          particle.y -= dy * 0.01;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 107, 0, 0.5)";
        ctx.fill();
      }

      // Draw connections with for loop (no slice)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 107, 0, ${0.2 * (1 - dist / 150)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    resize();
    createParticles();
    animate();

    window.addEventListener("resize", () => {
      resize();
      createParticles();
    });
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
};

// Animated Counter
const AnimatedCounter = ({ end, suffix = "" }: { end: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const increment = end / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, end]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

// Floating Image
const FloatingImage = ({
  src,
  className,
  delay = 0,
}: {
  src: string;
  className: string;
  delay?: number;
}) => {
  return (
    <motion.div
      className={`absolute rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -15, 0],
      }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay },
        y: {
          duration: 4 + delay,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
      whileHover={{ scale: 1.05, rotate: 2 }}
      style={{ willChange: "transform, opacity" }}
    >
      <img src={src} alt="AI Generated" className="w-full h-full object-cover" loading="lazy" />
    </motion.div>
  );
};

// Image Marquee with Framer Motion
const ImageMarquee = () => {
  const images = [
    "https://res.cloudinary.com/dmxmzannb/image/upload/v1768560690/fcgaoihbxxoe4hbofdso.png",
    "https://res.cloudinary.com/dmxmzannb/image/upload/v1768562068/v0ybv26fss1eglne6zfu.png",
    "https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768206045/krxq16y49k91zevbw6os.webp",
    "https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1769744496071-eiolbl.png",
    "https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768622719139-5ilv1h.png",
  ];

  return (
    <div className="relative w-full overflow-hidden py-8">
      <motion.div
        className="flex gap-4 w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 50,
          ease: "linear",
          repeat: Infinity,
        }}
        style={{ willChange: "transform" }}
      >
        {[...images, ...images, ...images, ...images, ...images, ...images, ...images, ...images].map((src, i) => (
          <motion.div
            key={i}
            className="flex-shrink-0 w-48 h-64 rounded-xl overflow-hidden md:border border-0 border-white/10"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration:30 }}
            style={{ willChange: "transform" }}
          >
            <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
          </motion.div>
        ))}
      </motion.div>
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />
    </div>
  );
};

export const HeroV2 = () => {
  const router = useRouter();
  const [demoInput, setDemoInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleGenerate = () => {
    if (demoInput.trim()) {
      router.push(`/tool/free-generation?prompt=${encodeURIComponent(demoInput)}`);
    } else {
      router.push("/tool/free-generation");
    }
  };

  const quickPrompts = [
    "Chân dung doanh nhân",
    "Poster trà sữa",
    "Avatar chibi",
  ];
  const scrollY = useMotionValue(0);
useEffect(() => {
        const container = document.getElementById('main-content-scroll');
        if (!container) return;

        let rafId: number;
        const updateScroll = () => {
            rafId = requestAnimationFrame(() => {
                scrollY.set(container.scrollTop);
            });
        };

        // Set initial value
        updateScroll();

        container.addEventListener('scroll', updateScroll, { passive: true });
        return () => {
            container.removeEventListener('scroll', updateScroll);
            cancelAnimationFrame(rafId);
        };
    }, [scrollY]);

    // Parallax transforms for floating images
    const y1 = useTransform(scrollY, [0, 500], [0, -100]);
    const x1 = useTransform(scrollY, [0, 500], [0, -100]); // Top-Left: Up & Left

    const y2 = useTransform(scrollY, [0, 500], [0, 100]);
    const x2 = useTransform(scrollY, [0, 500], [0, -100]); // Bottom-Left: Down & Left

    const y3 = useTransform(scrollY, [0, 500], [0, -80]);
    const x3 = useTransform(scrollY, [0, 500], [0, 80]);   // Top-Right: Up & Right

    const y4 = useTransform(scrollY, [0, 500], [0, 120]);
    const x4 = useTransform(scrollY, [0, 500], [0, 100]);  // Bottom-Right: Down & Right
  return (
    <section className="relative min-h-screen bg-black overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://res.cloudinary.com/dmxmzannb/image/upload/v1767599662/UX-Duky-AI_1_zufq7x.jpg"
          onError={(e) => {
            // Fallback to img_base if bg_banner is missing
            e.currentTarget.src = "/img/img_base.webp";
          }}
          alt="Banner Background"
          className="w-full h-full object-maintain"
        />
      </div>
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/40 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        <ParticleNetwork />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>
{/* Floating Images - Parallax Effect + Idle Float */}
            {/* Top Left */}
            <motion.div
                style={{ y: y1, x: x1, rotate: -16 }}
                className="absolute origin-bottom top-60 md:top-30 left-10 md:left-[15%] z-10"
            >
                <motion.div
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-32 h-40 md:w-48 md:h-60 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20"
                >
                    <img
                        src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1769744496071-eiolbl.png"
                        alt="AI Generated Portrait"
                        className="w-full h-full object-cover rounded-xl"
                    />
                </motion.div>
            </motion.div>

            {/* Bottom Left */}
            <motion.div
                style={{ y: y2, x: x2, rotate: 8 }}
                className="absolute  bottom-60 md:bottom-70 left-10 md:left-[10%] z-99"
            >
                <motion.div
                    animate={{ y: [-12, 12, -12] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="w-20 h-24 md:w-52 md:h-64 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20"
                >
                    <img
                        src="https://res.cloudinary.com/dmxmzannb/image/upload/v1768560690/fcgaoihbxxoe4hbofdso.png"
                        alt="AI Generated Art"
                        className="w-full h-full object-cover rounded-xl"
                    />
                </motion.div>
            </motion.div>

            {/* Top Right */}
            <motion.div
                style={{ y: y3, x: x3, rotate: 12 }}
                className="absolute origin-center top-70 md:top-30 right-10 md:right-[15%] z-10"
            >
                <motion.div
                    animate={{ y: [-8, 8, -8] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="w-20 h-38 md:w-56 md:h-72 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20"
                >
                    <img
                        src="https://res.cloudinary.com/dmxmzannb/image/upload/v1768562068/v0ybv26fss1eglne6zfu.png"
                        alt="AI Portrait"
                        className="w-full h-full object-cover"
                    />
                </motion.div>
            </motion.div>

            {/* Bottom Right */}
            <motion.div
                style={{ y: y4, x: x4, rotate: -8 }}
                className="absolute origin-center bottom-50 md:bottom-85 right-5 md:right-[10%] z-99"
            >
                <motion.div
                    animate={{ y: [-15, 15, -15] }}
                    transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                    className="w-32 h-40 md:w-44 md:h-56 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20"
                >
                    <img
                        src="https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768206045/krxq16y49k91zevbw6os.webp"
                        alt="AI Generated"
                        className="w-full h-full object-cover"
                    />
                </motion.div>
            </motion.div>
      

      <div className="relative z-999 flex flex-col items-center justify-center min-h-screen px-4 pt-20 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4">
            <span className="text-white">AI TẠO HÌNH</span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text leading-[1.2] text-transparent">
              CHO DOANH NGHIỆP
            </span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-200 max-w-2xl mx-auto">
            30+ công cụ AI tạo ảnh chuyên nghiệp - Từ chân dung đến sản phẩm, tất cả trong một nền tảng
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-2xl mb-6"
        >
          <div
            className={`relative flex items-center gap-2 p-2 rounded-2xl bg-white/5 backdrop-blur-xl border transition-all duration-300 ${isFocused
                ? "border-orange-500 shadow-[0_0_30px_rgba(255,107,0,0.3)]"
                : "border-white/20"
              }`}
          >
            <PencilIcon className="w-6 h-6 text-neutral-200 ml-3" />
            <input
              type="text"
              value={demoInput}
              onChange={(e) => setDemoInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Mô tả ảnh bạn muốn tạo..."
              className="flex-1 bg-transparent text-white placeholder-neutral-300 outline-none py-3 px-2"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 hover:scale-105 flex items-center gap-2 cursor-pointer"
            >
              <ZapIcon className="w-5 h-5" />
              <span className="hidden sm:inline">TẠO NGAY</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-sm">
            <span className="text-neutral-200">Thử:</span>
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setDemoInput(prompt)}
                className="px-3 py-1 rounded-full bg-orange-600/70 md:bg-white/10 text-neutral-300 hover:bg-orange-500/10 hover:text-orange-400 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mb-10"
        >
          {[
            { value: 50, suffix: "K+", label: "Người dùng" },
            { value: 2, suffix: "M+", label: "Ảnh đã tạo" },
            { value: 30, suffix: "+", label: "Công cụ" },
            { value: 4.9, suffix: "", label: "Đánh giá", icon: true },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-neutral-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="w-[100vw] md:w-full"
        >
          <ImageMarquee />
        </motion.div>
      </div>
    </section>
  );
};
