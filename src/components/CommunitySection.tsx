import React from 'react';
import { motion } from 'framer-motion';
import { ZaloCTA } from './ZaloCTA';

const testimonials = [
    {
        id: 1,
        quote: "Duky AI phù hợp cho cả những người mới bắt đầu tìm hiểu về thế giới hình ảnh AI cũng như các chuyên gia, vì nó cung cấp cho họ một loạt các công cụ để làm việc.",
        author: "Anh Lâm",
        avatar: "https://ui-avatars.com/api/?name=L+I&background=random"
    },
    {
        id: 2,
        quote: "Trước đây, khi không có trí tuệ nhân tạo, tôi rất vất vả trong việc chụp và thiết kế hình cho quán mình, giờ đây chỉ cần 1 vài thao tác là đã có hình ưng ý.",
        author: "Chị Hương",
        avatar: "https://ui-avatars.com/api/?name=L+I&background=random"
    },
    {
        id: 3,
        quote: "Với các tính năng được tinh chỉnh kỹ lưỡng, Duky AI giúp việc tạo ra ảnh sản phẩm trở nên dễ dàng và tiết kiệm hơn. Tôi tiết kiệm khá nhiều tiền và thời gian nhờ Duky AI đấy.",
        author: "Anh Sơn",
        avatar: "https://ui-avatars.com/api/?name=L+I&background=random"
    }
];

const partners = [
    { name: 'Lambda', logo: '/img/lambda_logo.svg' }, // Placeholders
    { name: 'AWS', logo: '/img/aws_logo.svg' },
    { name: 'Dedium', logo: '/img/dedium_logo.svg' },
    { name: 'iQ', logo: '/img/iq_logo.svg' }
];

import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

export const CommunitySection = () => {
    return (
        <section className="pt-20 bg-black text-white relative font-sans  mb-30">
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

                {/* Testimonials Slider */}
                <div className="relative mb-20 px-4 md:px-0">
                    <Swiper
                        modules={[Pagination, Autoplay]}
                        spaceBetween={24}
                        slidesPerView={1}
                        loop={true}
                        autoplay={{
                            delay: 5000,
                            disableOnInteraction: false,
                        }}
                        pagination={{
                            clickable: true
                        }}
                        breakpoints={{
                            768: {
                                slidesPerView: 3,
                            }
                        }}
                        className="pb-24" // Space for pagination to sit lower
                    >
                        {[...testimonials, ...testimonials, ...testimonials].map((item, index) => (
                            <SwiperSlide key={`${item.id}-${index}`}>
                                <div className="px-3 h-full">
                                    <div className="flex flex-col items-center text-center space-y-6 h-full justify-between">
                                        <div className="relative">
                                            <p className="text-white/80 leading-relaxed min-h-[80px]">
                                                "{item.quote}"
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 mt-auto">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
                                                <div className="w-full h-full bg-white/20">
                                                    <img src={item.avatar} alt={item.author} className="w-full h-full object-cover opacity-80" />
                                                </div>
                                            </div>
                                            <span className="text-orange-500 font-medium">{item.author}</span>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

                {/* CTA Banner */}
                <ZaloCTA />

                {/* Partners Section */}
                <div className="text-center mt-30">
                    <h4 className="text-orange-500 text-3xl md:text-4xl font-bold uppercase tracking-widest mb-10">
                        Đối tác
                    </h4>
                    <div className="relative w-full overflow-hidden mask-linear-fade">
                        {/* Gradient Masks for smooth fade in/out edges */}
                        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black to-transparent z-10" />
                        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black to-transparent z-10" />

                        <motion.div
                            className="flex items-center gap-12 md:gap-20 w-max"
                            animate={{ x: ["0%", "-50%"] }}
                            transition={{
                                duration: 30,
                                ease: "linear",
                                repeat: Infinity
                            }}
                        >
                            {/* 
                                Seamless Loop Logic:
                                1. Create a base set large enough to fill screen (4x partners)
                                2. Duplicate that base set to enable the 0% -> -50% slide
                                Total: 8x partners
                            */}
                            {[...partners, ...partners, ...partners, ...partners, ...partners, ...partners, ...partners, ...partners].map((partner, index) => (
                                <div key={index} className="flex-shrink-0 opacity-70 grayscale hover:grayscale-0 transition-all duration-500 cursor-pointer">
                                    {partner.name === 'Lambda' && <div className="text-2xl font-bold font-mono">Lambda</div>}
                                    {partner.name === 'AWS' && <div className="text-2xl font-bold font-sans italic">aws</div>}
                                    {partner.name === 'Dedium' && <div className="text-2xl font-bold font-serif tracking-wider">DEDIUM</div>}
                                    {partner.name === 'iQ' && (
                                        <div className="text-2xl font-extrabold flex items-center gap-1">
                                            <span>i</span>
                                            <span className="border-2 border-white px-1">Q</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>


            </div>
            <div className="mt-32 w-full">
                {/* Final CTA Banner - Start Creating */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-32 relative rounded-[2.5rem]  border border-white/5 bg-[url('/img/bg_before_footer.png')]"
                >

                    <div className="flex flex-col md:flex-row items-center relative z-10 md:w-[1300px] w-full justify-center items-center mx-auto">
                        {/* Text Content */}
                        <div className="flex-1 p-10 md:p-16 text-left space-y-8">
                            <h2 className="text-3xl md:text-4xl font-bold leading-tight text-white">
                                Bắt đầu tạo ảnh của bạn<br />
                                <span className="text-orange-500 md:ml-10 ml-0">với sức mạnh của Duky AI</span>
                            </h2>
                            <button className="px-8 py-3 ml-20 bg-white text-orange-500 cursor-pointer font-semibold rounded-full hover:bg-gray-100 transition-colors transform hover:scale-105 duration-500">
                                Thử ngay
                            </button>
                        </div>

                        {/* Image Grid / Tablet Mockup */}
                        <div className="flex-1 w-full relative">
                            <div className="md:absolute right-0 top-1/2 md:-translate-y-1/2 w-full md:w-[120%] h-full md:h-[140%] flex items-center justify-center p-8 md:p-0">
                                <div className="relative w-full max-w-md md:max-w-none md:w-[600px] aspect-[4/3] border-white/20 bg-gradient-to-br from-white/10  to-white/20 backdrop-blur-xl rounded-2xl border border-white/50 p-2 shadow-2xl rotate-0 md:-rotate-6 md:translate-x-10 ">
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
            </div >
        </section >
    );
};

export default CommunitySection;
