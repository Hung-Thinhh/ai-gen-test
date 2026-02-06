"use client";

import { motion } from "framer-motion";

const logos = [
  { name: "TechCompany", initial: "TC" },
  { name: "StartupVN", initial: "SV" },
  { name: "EcommercePlus", initial: "EP" },
  { name: "DigitalAgency", initial: "DA" },
  { name: "BrandStudio", initial: "BS" },
  { name: "MediaGroup", initial: "MG" },
];

const badges = [
  { icon: <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>, text: "Bảo mật 100%" },
  { icon: <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>, text: "Hoàn tiền 7 ngày" },
  { icon: <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>, text: "Hỗ trợ 24/7" },
];
const partners = [
  { name: 'Lambda', logo: '/img/lambda_logo.svg' }, // Placeholders
  { name: 'AWS', logo: '/img/aws_logo.svg' },
  { name: 'Dedium', logo: '/img/dedium_logo.svg' },
  { name: 'iQ', logo: '/img/iq_logo.svg' }
];
export const TrustBadges = () => {
  return (
    <section className="relative py-12 bg-black border-y border-white/5 z-99999999999">
      {/* Gradient divider top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4">
        {/* Trusted by text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center text-neutral-500 text-md mb-6"
        >
          Được tin dùng bởi <span className="text-orange-500 font-semibold">500+ doanh nghiệp</span> và <span className="text-orange-500 font-semibold">50,000+ ngườii dùng</span>
        </motion.p>

        {/* Logo carousel */}
      
        <div className="relative w-full overflow-hidden mask-linear-fade mb-10">
          {/* Gradient Masks for smooth fade in/out edges */}
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black to-transparent z-10" />

            <motion.div
            className="flex items-center gap-12 md:gap-20 w-max"
            animate={{ x: ["-50%", "0%"] }}
            transition={{
              duration: 30,
              ease: "linear",
              repeat: Infinity
            }}
            >
            {/* 
                      Seamless Loop Logic:
                      1. Create a base set large enough to fill screen (4x partners)
                      2. Duplicate that base set to enable the -50% -> 0% slide
                      Total: 8x partners
                    */}
            {[...partners, ...partners, ...partners, ...partners, ...partners, ...partners, ...partners, ...partners].map((partner, index) => (
              <div key={index} className="flex-shrink-0 opacity-70 grayscale hover:grayscale-0 transition-all duration-500 cursor-pointer">
              {partner.name === 'Lambda' && <div className="text-2xl font-bold font-mono">Lambda</div>}
              {partner.name === 'AWS' && <div className="text-2xl font-bold font-sans italic">aws</div>}
              {partner.name === 'Dedium' && <div className="text-2xl font-bold font-serif tracking-wider">DEDIUM</div>}
              {partner.name === 'iQ' && (
                <div className="text-2xl font-extrabold flex items-center gap-1">
                <span>i</span>
                <span className="border-2 border-white px-1">Q</span>
                </div>
              )}
              </div>
            ))}
            </motion.div>
        </div>
        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-6 md:gap-12"
        >
          {badges.map((badge, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            >
              <span className="text-xl">{badge.icon}</span>
              <span className="text-neutral-400 text-sm">{badge.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Gradient divider bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
    </section>
  );
};
