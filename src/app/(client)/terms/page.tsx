import { Metadata } from "next";
import { TermsContent } from "@/components/legal/TermsContent";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng | Duky AI",
  description: "Điều khoản và điều kiện sử dụng dịch vụ Duky AI",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Hero */}
      <section className="py-12 md:py-16 bg-black border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Điều khoản sử dụng
          </h1>
          <p className="text-neutral-400">
            Vui lòng đọc kỹ các điều khoản trước khi sử dụng dịch vụ
          </p>
        </div>
      </section>

      <TermsContent />
    </main>
  );
}
