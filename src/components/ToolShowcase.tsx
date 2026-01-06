import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import React from 'react';

const ToolCard = ({
    title,
    big_title,
    description,
    image,
    btnText = "Thử ngay",
    reverse = false,
    onClick,
    index = 0
}: {
    title: string;
    big_title: string;
    description: string;
    image: string;
    btnText?: string;
    reverse?: boolean;
    onClick?: () => void;
    index?: number;
}) => {
    const rotateValue = index === 0 ? 0 : (index % 2 === 0 ? 1 : -1) * 1.5;

    return (
        <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 md:gap-16 items-center py-20 px-20 border border-white/20 hover:border-orange-400/70 transition-all duration-300 rounded-3xl bg-black/80 backdrop-blur-xl shadow-2xl mb-8`}
            style={{
                zIndex: index + 1,
                position: 'sticky',
                top: `calc(100px + ${index * 15}px)`,
                rotate: rotateValue,
                transformOrigin: 'top center'
            }}
        >
            {/* Context/Text Section */}
            <div className="flex-1 text-left">
                <h3 className="text-4xl leading-[1.5] md:text-8xl  font-magesta bg-gradient-to-r from-[#eb5a01] to-[#eb5a00] bg-clip-text text-transparent">
                    {big_title}
                </h3>
                <h3 className="text-3xl  mt-[-40px] mb-5  md:text-4xl  bg-clip-text text-white">
                    {title}
                </h3>
                <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
                    {description}
                </p>
                <button
                    onClick={onClick}
                    className="group cursor-pointer relative px-8 py-3 mt-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full text-white font-medium hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
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
        <section className="relative py-20 bg-black">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="container mx-auto max-w-[1300px] pb-20">
                {/* Card 1: Product Photography */}
                <ToolCard
                    index={1}
                    title="ảnh mỹ phẩm"
                    big_title="Studio"
                    description="Thử nghiệm các ý tưởng thiết kế giúp chuyển đổi concept chỉ bằng một cú nhấp chuột."
                    image="/img/img_base.webp"
                    onClick={() => router.push('/tool/poster-creator')}
                />

                {/* Card 2: Social Media Poster */}
                <ToolCard
                    index={2}
                    reverse
                    title="Social Media"
                    big_title="Poster"
                    description="Thiết kế poster sản phẩm đơn giản, không cần biết thiết kế."
                    image="/img/trungthu.webp"
                    btnText="Khám phá ngay"
                    onClick={() => router.push('/tool/poster-creator')}
                />

                {/* Card 3: Food Concept */}
                <ToolCard
                    index={3}
                    title="trong tầm tay"
                    big_title="Thời trang"
                    description="Ghép quần áo và trang sức của bạn lên các mô hình do Ai tạo ra, giữ nguyên hoạ tiết và logo."
                    image="/img/trungthu.webp"
                    btnText="Khám phá ngay"
                    onClick={() => router.push('/tool/poster-creator')}
                />

                {/* Card 4: Baby Photo */}
                <ToolCard
                    index={4}
                    reverse
                    title="ảnh cho bé"
                    big_title="Studio"
                    description="Tiết kiệm thời ghian và chi phí chụp ảnh cho bé"
                    image="/img/trungthu.webp"
                    btnText="Khám phá ngay"
                    onClick={() => router.push('/tool/baby-photo-creator')}
                />

                {/* Card 5: ID Photo */}
                <ToolCard
                    index={5}
                    title="dành cho người bận rộn"
                    big_title="Ảnh thẻ"
                    description="Phòng chụp ảnh thẻ nhanh gọn và xuất file in ấn tiện lợi"
                    image="/img/trungthu.webp"
                    btnText="Khám phá ngay"
                    onClick={() => router.push('/tool/id-photo-creator')}
                />
            </div>
        </section>
    );
};

export default ToolShowcase;
