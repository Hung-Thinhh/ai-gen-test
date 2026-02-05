import { Metadata } from "next";
import { RefundContent } from "@/components/legal/RefundContent";

export const metadata: Metadata = {
  title: "Chính sách hoàn tiền | Duky AI",
  description: "Chính sách hoàn tiền 7 ngày của Duky AI",
};

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Hero */}
      <section className="py-12 md:py-16 bg-black border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Chính sách hoàn tiền
          </h1>
          <p className="text-neutral-400">
            Hoàn tiền 100% trong 7 ngày nếu không hài lòng
          </p>
        </div>
      </section>

      <RefundContent />
    </main>
  );
}
