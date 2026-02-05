import { Metadata } from "next";
import { ApiDocsContent } from "@/components/apidocs/ApiDocsContent";

export const metadata: Metadata = {
  title: "API Documentation | Duky AI",
  description: "Tài liệu API cho nhà phát triển - Tích hợp Duky AI vào ứng dụng của bạn",
};

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-black">
      <section className="py-12 md:py-16 bg-black border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            API Documentation
          </h1>
          <p className="text-neutral-400">
            Tích hợp Duky AI vào ứng dụng của bạn
          </p>
        </div>
      </section>

      <ApiDocsContent />
    </main>
  );
}
