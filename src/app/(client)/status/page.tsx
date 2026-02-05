import { Metadata } from "next";
import { StatusContent } from "@/components/status/StatusContent";

export const metadata: Metadata = {
  title: "Trạng thái hệ thống | Duky AI",
  description: "Theo dõi trạng thái hoạt động của các dịch vụ Duky AI",
};

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-black">
      <section className="py-12 md:py-16 bg-black border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trạng thái hệ thống
          </h1>
          <p className="text-neutral-400">
            Theo dõi uptime và trạng thái dịch vụ
          </p>
        </div>
      </section>

      <StatusContent />
    </main>
  );
}
