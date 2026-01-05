import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import React from 'react';

const ToolCard = ({
    title,
    description,
    image,
    btnText = "Thử ngay",
    reverse = false,
    onClick
}: {
    title: string;
    description: string;
    image: string;
    btnText?: string;
    reverse?: boolean;
    onClick?: () => void;
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 md:gap-16 items-center py-20 px-10 border border-orange-300 rounded-2xl`}
        >
            {/* Context/Text Section */}
            <div className="flex-1 space-y-6 text-left">
                <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                    {title}
                </h3>
                <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
                    {description}
                </p>
                <button
                    onClick={onClick}
                    className="group relative px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full text-white font-medium hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        {btnText}
                        <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
            </div>

            {/* Image/Visual Section */}
            <div className="flex-1 w-full relative">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
                    {/* Glassmorphism Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 z-10 pointer-events-none" />

                    <img
                        src={image}
                        alt={title}
                        className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Interactive Cursor Mockup (Optional) */}
                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs text-white/80 border border-white/10 z-20">
                        AI Generated
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -inset-4 bg-orange-500/20 blur-3xl -z-10 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
            </div>
        </motion.div>
    );
};

export const ToolShowcase = () => {
    const router = useRouter();

    return (
        <section className="relative py-20 bg-black overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="container mx-auto max-w-[1300px] ">
                {/* Card 1: Product Photography */}
                <ToolCard
                    title="Studio ảnh mỹ phẩm"
                    description="Thử nghiệm các ý tưởng thiết kế, chuyển đổi concept sản phẩm chỉ bằng một cú nhấp chuột. Tối ưu hình ảnh thương mại điện tử chuyên nghiệp."
                    image="/img/img_base.webp"
                    onClick={() => router.push('/tool/product-photography')}
                />

                {/* Vertical Divider */}
                <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/10 to-transparent mx-auto my-2" />

                {/* Card 2: Social Media Poster */}
                <ToolCard
                    reverse
                    title="Poster Social Media"
                    description="Tự động hoá quy trình thiết kế Poster & Banner quảng cáo. Đa dạng phong cách từ Tết, Giáng Sinh đến sự kiện Doanh nghiệp."
                    image="/img/trungthu.webp"
                    btnText="Khám phá ngay"
                    onClick={() => router.push('/tool/poster-creator')}
                />
                {/* Vertical Divider */}
                <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/10 to-transparent mx-auto my-2" />

                {/* Card 2: Social Media Poster */}
                <ToolCard
                    reverse
                    title="Poster Social Media"
                    description="Tự động hoá quy trình thiết kế Poster & Banner quảng cáo. Đa dạng phong cách từ Tết, Giáng Sinh đến sự kiện Doanh nghiệp."
                    image="/img/trungthu.webp"
                    btnText="Khám phá ngay"
                    onClick={() => router.push('/tool/poster-creator')}
                />
                {/* Vertical Divider */}
                <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/10 to-transparent mx-auto my-2" />

                {/* Card 2: Social Media Poster */}
                <ToolCard
                    reverse
                    title="Poster Social Media"
                    description="Tự động hoá quy trình thiết kế Poster & Banner quảng cáo. Đa dạng phong cách từ Tết, Giáng Sinh đến sự kiện Doanh nghiệp."
                    image="/img/trungthu.webp"
                    btnText="Khám phá ngay"
                    onClick={() => router.push('/tool/poster-creator')}
                />
                {/* Vertical Divider */}
                <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/10 to-transparent mx-auto my-2" />

                {/* Card 2: Social Media Poster */}
                <ToolCard
                    reverse
                    title="Poster Social Media"
                    description="Tự động hoá quy trình thiết kế Poster & Banner quảng cáo. Đa dạng phong cách từ Tết, Giáng Sinh đến sự kiện Doanh nghiệp."
                    image="/img/trungthu.webp"
                    btnText="Khám phá ngay"
                    onClick={() => router.push('/tool/poster-creator')}
                />
                {/* Vertical Divider */}
                <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/10 to-transparent mx-auto my-2" />

                {/* Card 2: Social Media Poster */}
                <ToolCard
                    reverse
                    title="Poster Social Media"
                    description="Tự động hoá quy trình thiết kế Poster & Banner quảng cáo. Đa dạng phong cách từ Tết, Giáng Sinh đến sự kiện Doanh nghiệp."
                    image="/img/trungthu.webp"
                    btnText="Khám phá ngay"
                    onClick={() => router.push('/tool/poster-creator')}
                />
            </div>
        </section>
    );
};

export default ToolShowcase;
