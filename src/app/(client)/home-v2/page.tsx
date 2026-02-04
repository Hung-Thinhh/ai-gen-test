import { HomeV2 } from "@/components/homev2";

export const metadata = {
  title: "Duky AI - Tạo Ảnh AI Chuyên Nghiệp | 30+ Công Cụ AI",
  description:
    "Nền tảng tạo ảnh AI hàng đầu Việt Nam. 30+ công cụ từ chân dung, sản phẩm đến marketing. Miễn phí 100 credits mỗi ngày. Không cần kỹ năng thiết kế.",
  keywords: [
    "tạo ảnh AI",
    "AI Việt Nam",
    "chân dung AI",
    "ảnh sản phẩm AI",
    "poster AI",
    "avatar AI",
    "face swap",
  ],
  openGraph: {
    title: "Duky AI - Tạo Ảnh AI Chuyên Nghiệp",
    description: "30+ công cụ AI cho doanh nghiệp và cá nhân. Miễn phí 100 credits/ngày.",
    type: "website",
  },
};

export default function HomeV2Page() {
  return <HomeV2 />;
}
