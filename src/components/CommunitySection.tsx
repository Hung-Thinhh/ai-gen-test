import React from 'react';
import { motion } from 'framer-motion';
import { ZaloCTA } from './ZaloCTA';

const testimonials = [
    {
        id: 1,
        quote: "Duky AI phù hợp cho cả những người mới bắt đầu tìm hiểu về thế giới hình ảnh AI cũng như các chuyên gia, vì nó cung cấp cho họ một loạt các công cụ để làm việc.",
        author: "Lorem Ipsum",
        avatar: "https://ui-avatars.com/api/?name=L+I&background=random"
    },
    {
        id: 2,
        quote: "Trước đây, khi không có trí tuệ nhân tạo, tôi rất vất vả trong việc chụp và thiết kế hình cho quán mình, giờ đây chỉ cần 1 vài thao tác là đã có hình ưng ý.",
        author: "Lorem Ipsum",
        avatar: "https://ui-avatars.com/api/?name=L+I&background=random"
    },
    {
        id: 3,
        quote: "Với các tính năng được tinh chỉnh kỹ lưỡng, Duky AI giúp việc tạo ra ảnh sản phẩm trở nên dễ dàng và tiết kiệm hơn. Tôi tiết kiệm khá nhiều tiền và thời gian nhờ Duky AI đấy.",
        author: "Lorem Ipsum",
        avatar: "https://ui-avatars.com/api/?name=L+I&background=random"
    }
];

const partners = [
    { name: 'Lambda', logo: '/img/lambda_logo.svg' }, // Placeholders
    { name: 'AWS', logo: '/img/aws_logo.svg' },
    { name: 'Dedium', logo: '/img/dedium_logo.svg' },
    { name: 'iQ', logo: '/img/iq_logo.svg' }
];

export const CommunitySection = () => {
    return (
        <section className="pt-20 bg-black text-white relative font-sans">
            <div className="container mx-auto max-w-[1300px] px-6">

                {/* Header */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl font-bold text-center mb-16 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"
                >
                    Gia nhập cộng đồng với chúng tôi
                </motion.h2>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {testimonials.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className="flex flex-col items-center text-center space-y-6"
                        >
                            <div className="relative">
                                {/* Vertical separators for visual effect (only on desktop between items) */}
                                {index !== 0 && (
                                    <div className="hidden md:block absolute -left-4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" style={{ left: '-1rem' }} />
                                )}
                                <p className="text-gray-400 leading-relaxed min-h-[80px]">
                                    "{item.quote}"
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
                                    <div className="w-full h-full bg-white/20" /> {/* Placeholder for avatar */}
                                </div>
                                <span className="text-orange-500 font-medium">{item.author}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA Banner */}
                <ZaloCTA />

                {/* Partners Section */}
                <div className="text-center mt-30">
                    <h4 className="text-orange-500 text-3xl md:text-4xl font-bold uppercase tracking-widest mb-10">
                        Đối tác
                    </h4>
                    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* 
                            Using text placeholders styled to look like logos 
                            since verify step confirmed no SVGs. 
                            Replace with <img> tags when files are available.
                        */}
                        <div className="text-2xl font-bold font-mono">Lambda</div>
                        <div className="text-2xl font-bold font-sans italic">aws</div>
                        <div className="text-2xl font-bold font-serif tracking-wider">DEDIUM</div>
                        <div className="text-2xl font-extrabold flex items-center gap-1">
                            <span>i</span>
                            <span className="border-2 border-white px-1">Q</span>
                        </div>
                    </div>
                </div>


            </div>
            <div className="mt-32 w-full">
                {/* Final CTA Banner - Start Creating */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-32 relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-orange-450 via-orange-500/40 to-orange-700 border border-white/5"
                >
                    {/* Background glow effects */}
                    <div className="absolute top-0 left-0 w-2/3 h-full bg-orange-600/10 blur-[100px] pointer-events-none" />

                    <div className="flex flex-col md:flex-row items-center relative z-10">
                        {/* Text Content */}
                        <div className="flex-1 p-10 md:p-16 text-left space-y-8">
                            <h2 className="text-3xl md:text-5xl font-bold leading-tight text-white">
                                Bắt đầu tạo ảnh của bạn<br />
                                <span className="text-orange-500">với sức mạnh của Duky AI</span>
                            </h2>
                            <button className="px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-colors transform hover:scale-105 duration-200">
                                Thử ngay
                            </button>
                        </div>

                        {/* Image Grid / Tablet Mockup */}
                        <div className="flex-1 w-full relative">
                            <div className="md:absolute right-0 top-1/2 md:-translate-y-1/2 w-full md:w-[120%] h-full md:h-[140%] flex items-center justify-center p-8 md:p-0">
                                <div className="relative w-full max-w-md md:max-w-none md:w-[600px] aspect-[4/3] bg-neutral-900/90 rounded-2xl border border-white/10 p-2 shadow-2xl rotate-0 md:-rotate-6 md:translate-x-10 overflow-hidden backdrop-blur-sm">
                                    <div className="grid grid-cols-4 gap-2 h-full">
                                        {/* Using a mix of placeholder images to simulate the gallery */}
                                        <div className="col-span-1 space-y-2">
                                            <img src="/img/baby.webp" className="w-full h-1/2 object-cover rounded-lg" alt="" />
                                            <img src="/img/beauty.webp" className="w-full h-1/2 object-cover rounded-lg" alt="" />
                                        </div>
                                        <div className="col-span-1 space-y-2 mt-4">
                                            <img src="/img/doanhnhan.webp" className="w-full h-1/2 object-cover rounded-lg" alt="" />
                                            <img src="/img/figure.webp" className="w-full h-1/2 object-cover rounded-lg" alt="" />
                                        </div>
                                        <div className="col-span-1 space-y-2">
                                            <img src="/img/kientruc.webp" className="w-full h-1/2 object-cover rounded-lg" alt="" />
                                            <img src="/img/thoitrang.webp" className="w-full h-1/2 object-cover rounded-lg" alt="" />
                                        </div>
                                        <div className="col-span-1 space-y-2 mt-4">
                                            <img src="/img/trungthu.webp" className="w-full h-1/2 object-cover rounded-lg" alt="" />
                                            <img src="/img/yeunuoc.webp" className="w-full h-1/2 object-cover rounded-lg" alt="" />
                                        </div>
                                    </div>

                                    {/* Glass reflection effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-2xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default CommunitySection;
