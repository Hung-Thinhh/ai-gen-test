import { Metadata } from "next";
import { BlogContent } from "@/components/blog/BlogContent";

export const metadata: Metadata = {
  title: "Blog | Duky AI",
  description: "Tin tức, hướng dẫn và xu hướng về AI tạo ảnh",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-black">
      <section className="py-12 md:py-16 bg-black border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Blog
          </h1>
          <p className="text-neutral-400">
            Tin tức, hướng dẫn và xu hướng AI
          </p>
        </div>
      </section>

      <BlogContent />
    </main>
  );
}
