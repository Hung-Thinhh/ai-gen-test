import { Metadata } from "next";
import { AboutContent } from "@/components/about/AboutContent";

export const metadata: Metadata = {
  title: "Về chúng tôi | Duky AI",
  description: "Tìm hiểu về Duky AI - Nền tảng tạo ảnh AI hàng đầu Việt Nam",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black">
      <section className="py-12 md:py-16 bg-black border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Về Duky AI
          </h1>
          <p className="text-neutral-400">
            Nền tảng tạo ảnh AI hàng đầu Việt Nam
          </p>
        </div>
      </section>

      <AboutContent />
    </main>
  );
}
