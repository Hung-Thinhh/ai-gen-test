import { Metadata } from "next";
import { PrivacyContent } from "@/components/legal/PrivacyContent";

export const metadata: Metadata = {
  title: "Chính sách bảo mật | Duky AI",
  description: "Chính sách bảo mật và bảo vệ dữ liệu ngườii dùng Duky AI",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Hero */}
      <section className="py-12 md:py-16 bg-black border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Chính sách bảo mật
          </h1>
          <p className="text-neutral-400">
            Cam kết bảo vệ quyền riêng tư và dữ liệu của bạn
          </p>
        </div>
      </section>

      <PrivacyContent />
    </main>
  );
}
