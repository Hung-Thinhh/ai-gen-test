import { Metadata } from "next";
import { VideoTutorials } from "@/components/guide/VideoTutorials";
import { GuideHero } from "@/components/guide/GuideHero";
import { QuickStart } from "@/components/guide/QuickStart";
import { FAQSection } from "@/components/guide/FAQSection";

export const metadata: Metadata = {
  title: "Hướng dẫn sử dụng | Duky AI",
  description: "Hướng dẫn chi tiết cách sử dụng Duky AI - Từ cơ bản đến nâng cao với video hướng dẫn trực quan",
};

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-black">
      <GuideHero />
      <QuickStart />
      <VideoTutorials />
      <FAQSection />
    </main>
  );
}
