import { Metadata } from "next";
import { CareersContent } from "@/components/careers/CareersContent";

export const metadata: Metadata = {
  title: "Tuyển dụng | Duky AI",
  description: "Tham gia đội ngũ Duky AI - Cơ hội nghề nghiệp trong lĩnh vực AI",
};

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-black">
      <section className="py-12 md:py-16 bg-black border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Tuyển dụng
          </h1>
          <p className="text-neutral-400">
            Tham gia đội ngũ xây dựng tương lai của AI
          </p>
        </div>
      </section>

      <CareersContent />
    </main>
  );
}
