import { Metadata } from "next";
import { HelpContent } from "@/components/help/HelpContent";

export const metadata: Metadata = {
  title: "Trung tâm hỗ trợ | Duky AI",
  description: "Trung tâm trợ giúp và hỗ trợ ngườii dùng Duky AI",
};

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-black">
      <section className="py-12 md:py-16 bg-black border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trung tâm hỗ trợ
          </h1>
          <p className="text-neutral-400">
            Tìm câu trả lờii cho câu hỏi của bạn
          </p>
        </div>
      </section>

      <HelpContent />
    </main>
  );
}
