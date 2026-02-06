"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { motion } from 'framer-motion';
import { useRouter } from "next/navigation";
import { ZapIcon, PlusIcon, ImagePlusIcon, XIcon } from "./icons";

// Particle Network Component - Optimized
const ParticleNetwork = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameSkipRef = useRef(0);

  useEffect(() => {
    // Skip on mobile or if user prefers reduced motion
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isMobile || prefersReducedMotion) return;

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
      // Reduced from 50 to 25 particles
      const count = Math.min(25, Math.floor((canvas.width * canvas.height) / 40000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 1.5 + 0.5,
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      // Frame skipping: render every 2nd frame (30fps instead of 60fps)
      frameSkipRef.current++;
      if (frameSkipRef.current % 2 !== 0) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Batch draw particles
      ctx.fillStyle = "rgba(255, 107, 0, 0.5)";
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        const dx = mx - particle.x;
        const dy = my - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          particle.x -= dx * 0.005;
          particle.y -= dy * 0.005;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Reduced connection distance and batch stroke operations
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          // Use squared distance to avoid sqrt, reduced from 150 to 100
          if (distSq < 10000) {
            const dist = Math.sqrt(distSq);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 107, 0, ${0.15 * (1 - dist / 100)})`;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    resize();
    createParticles();
    animate();

    const handleResize = () => {
      resize();
      createParticles();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none hidden md:block"
      style={{ opacity: 0.5 }}
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

// Floating Image - Optimized with CSS Animation
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
    <div
      className={`absolute rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 float-animation ${className}`}
      style={{
        willChange: "transform",
        animationDelay: `${delay}s`,
        animationDuration: `${4 + delay}s`
      }}
    >
      <img src={src} alt="AI Generated" className="w-full h-full object-cover" loading="lazy" decoding="async" />
    </div>
  );
};

// Image Marquee with Framer Motion - Seamless Loop
const ImageMarquee = () => {
  const images = [
    "https://res.cloudinary.com/dmxmzannb/image/upload/v1768560690/fcgaoihbxxoe4hbofdso.png",
    "https://res.cloudinary.com/dmxmzannb/image/upload/v1768562068/v0ybv26fss1eglne6zfu.png",
    "https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768206045/krxq16y49k91zevbw6os.webp",
    "https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1769744496071-eiolbl.png",
    "https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768622719139-5ilv1h.png",
  ];

  // Triple duplicate for seamless infinite loop
  const allImages = [...images, ...images, ...images];
  
  // Calculate offset: each item is ~140px (112px + 16px gap on mobile, ~208px + gap on desktop)
  // We animate through ONE set of original images, then loop resets seamlessly
  const offset = images.length * 140;

  return (
    <div className="relative w-full overflow-hidden py-0 md:py-4">
      <motion.div
        className="flex gap-4"
        initial={{ x: 0 }}
        animate={{ x: -offset }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 0,
        }}
      >
        {allImages.map((src, i) => (
          <div
            key={i}
            className="flex-shrink-0 !p-0 w-28 h-40 md:w-48 md:h-62 rounded-xl overflow-hidden md:border border-0 border-white/10 hover:scale-105 hover:-translate-y-1 transition-transform duration-300"
          >
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
      </motion.div>
      <div className="absolute inset-y-0 top-0 md:top-4 left-0 w-20 md:w-32 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 top-0 md:top-4 right-0 w-20 md:w-32 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />
    </div>
  );
};

// Simple file upload handler
const handleFileUpload = (
  e: ChangeEvent<HTMLInputElement>,
  callback: (result: string) => void
) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    const MAX_SIZE_MB = 15;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`File quá lớn. Vui lòng upload ảnh dưới ${MAX_SIZE_MB}MB.`);
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }
};

export const HeroV2 = () => {
  const router = useRouter();
  const [demoInput, setDemoInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = () => {
    if (!demoInput.trim()) {
      return;
    }

    // Save prompt and uploaded image to sessionStorage for FreeGeneration page
    sessionStorage.setItem('heroPrompt', demoInput);
    if (uploadedImage) {
      sessionStorage.setItem('heroUploadedImage', uploadedImage);
    }

    // Navigate to free generation page
    router.push('/tool/free-generation');
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, (imageData) => {
      setUploadedImage(imageData);
    });
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const quickPrompts = [
    "Chân dung doanh nhân",
    "Poster trà sữa",
    "Avatar chibi",
  ];
  return (
    <section className="relative min-h-200 md:min-h-screen bg-black overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://res.cloudinary.com/dmxmzannb/image/upload/v1767599662/UX-Duky-AI_1_zufq7x.jpg"
          onError={(e) => {
            // Fallback to img_base if bg_banner is missing
            e.currentTarget.src = "/img/img_base.webp";
          }}
          alt="Banner Background"
          className="w-full h-full object-cover"
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
{/* Floating Images - CSS Animation Optimized */}
            {/* Top Left */}
            <div
                className="absolute origin-bottom top-10 md:top-30 left-10 md:left-[15%] z-10 float-animation"
                style={{ transform: 'rotate(-16deg)', animationDelay: '0s', animationDuration: '4s' }}
            >
                <div className="w-32 h-40 md:w-48 md:h-60 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 -rotate-12">
                    <img
                        src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1769744496071-eiolbl.png"
                        alt="AI Generated Portrait"
                        className="w-full h-full object-cover rounded-xl"
                        loading="lazy"
                        decoding="async"
                    />
                </div>
            </div>

            {/* Bottom Left */}
            <div
                className="absolute bottom-140 md:bottom-70 left-10 md:left-[10%] z-[99] float-animation rotate-8"
                style={{ transform: 'rotate(8deg)', animationDelay: '0.5s', animationDuration: '5s' }}
            >
                <div className="w-20 h-24 md:w-52 md:h-64 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 -rotate-2 hidden md:block">
                    <img
                        src="https://res.cloudinary.com/dmxmzannb/image/upload/v1768560690/fcgaoihbxxoe4hbofdso.png"
                        alt="AI Generated Art"
                        className="w-full h-full object-cover rounded-xl"
                        loading="lazy"
                        decoding="async"
                    />
                </div>
            </div>

            {/* Top Right */}
            <div
                className="absolute origin-center top-8 md:top-30 right-10 md:right-[15%] z-10 float-animation rotate-12"
                style={{ transform: 'rotate(12deg)', animationDelay: '1s', animationDuration: '4.5s' }}
            >
                <div className="w-20 h-38 md:w-56 md:h-72 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                    <img
                        src="https://res.cloudinary.com/dmxmzannb/image/upload/v1768562068/v0ybv26fss1eglne6zfu.png"
                        alt="AI Portrait"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                    />
                </div>
            </div>

            {/* Bottom Right */}
            <div
                className="absolute origin-center bottom-120 md:bottom-85 right-5 md:right-[10%] z-[99] float-animation -rotate-8 hidden md:block"
                style={{ transform: 'rotate(-8deg)', animationDelay: '1.5s', animationDuration: '5.5s' }}
            >
                <div className="w-32 h-40 md:w-44 md:h-56 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                    <img
                        src="https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768206045/krxq16y49k91zevbw6os.webp"
                        alt="AI Generated"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                    />
                </div>
            </div>
      

      <div className="relative z-999 flex flex-col items-center justify-center min-h-200 md:min-h-screen pt-20 pb-0 md:pb-10">
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
          className="w-full max-w-2xl mb-6 px-2"
        >
          <div
            className={`relative flex items-center gap-2 p-2 rounded-2xl bg-white/10 md:bg-white/5 backdrop-blur-xl border transition-all duration-300 ${isFocused
                ? "border-orange-500 shadow-[0_0_30px_rgba(255,107,0,0.3)]"
                : "border-white/20"
              }`}
          >
            {/* Image Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 rounded-xl transition-all duration-300 ml-1 ${uploadedImage
                  ? "bg-orange-500/20 text-orange-400"
                  : "text-neutral-300 hover:text-white hover:bg-white/10"
                }`}
              title={uploadedImage ? "Đã chọn ảnh" : "Tải ảnh lên"}
            >
              {uploadedImage ? (
                <ImagePlusIcon className="w-5 h-5" />
              ) : (
                <PlusIcon className="w-5 h-5" />
              )}
            </button>

            {/* Uploaded Image Preview */}
            {uploadedImage && (
              <div className="relative flex-shrink-0">
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="w-10 h-10 rounded-lg object-cover border border-white/20"
                />
                <button
                  onClick={clearUploadedImage}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            )}

            <input
              type="text"
              value={demoInput}
              onChange={(e) => setDemoInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={uploadedImage ? "Mô tả thay đổi cho ảnh..." : "Mô tả ảnh bạn muốn tạo..."}
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

          <div className="hidden md:flex flex-wrap items-center justify-center gap-2 mt-3 text-sm">
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
              <div className="text-sm text-neutral-3s00">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.7 }}
          className="w-[100vw] md:w-full"
        >
          <ImageMarquee />
        </motion.div>
      </div>
    </section>
  );
};
