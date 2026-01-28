import React from 'react';
import { motion } from 'framer-motion';
import { ZaloCTA } from './ZaloCTA';
import { CommunityGallery } from './CommunityGallery';
import Image from 'next/image'

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
import Link from 'next/link';

export const CommunitySection = () => {
    return (
        <section className="pt-20 bg-black text-white relative font-sans  mb-30">
            {/* Benefits Grid */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="benefit relative z-20 container max-w-[1300px]  mx-auto px-6 mt-10 z-999 hidden md:block"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1300px] mx-auto">
                    {/* Item 1 */}
                    <div className="group p-8 rounded-3xl bg-black/70 backdrop-blur-md border border-orange-600/60 hover:border-orange-600/40 transition-all duration-300 hover:transform hover:-translate-y-2">
                        <div className="w-30 h-30 mx-auto mb-6 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all duration-300">
                            <Image
                                src="/img/icon_1.png"
                                width={500}
                                height={500}
                                alt="Picture of the author"
                                className="w-20 h-20 object-contain"
                            />
                        </div>
                        <p className="text-white text-lg font-medium leading-relaxed text-center">
                            Tạo ảnh nhanh chóng,<br />số lượng lớn
                        </p>
                    </div>

                    {/* Item 2 */}
                    <div className="group p-8 rounded-3xl bg-black/70 backdrop-blur-md border border-orange-600/60 hover:border-orange-600/40 transition-all duration-300 hover:transform hover:-translate-y-2">
                        <div className="w-30 h-30 mx-auto mb-6 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all duration-300">
                            <Image
                                src="/img/icon_2.png"
                                width={500}
                                height={500}
                                alt="Picture of the author"
                                className="w-20 h-20  object-contain"
                            />
                        </div>
                        <p className="text-white text-lg font-medium leading-relaxed text-center">
                            Tiết kiệm chi phí<br />& thời gian
                        </p>
                    </div>

                    {/* Item 3 */}
                    <div className="group p-8 rounded-3xl bg-black/70 backdrop-blur-md border border-orange-600/60 hover:border-orange-600/40 transition-all duration-300 hover:transform hover:-translate-y-2">
                        <div className="w-30 h-30 mx-auto mb-6 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all duration-300">
                            <Image
                                src="/img/icon_3.png"
                                width={500}
                                height={500}
                                alt="Picture of the author"
                                className="w-20 h-20  object-contain"
                            />
                        </div>
                        <p className="text-white text-lg font-medium leading-relaxed text-center">
                            Dễ dàng thay đổi concept,<br />không phụ thuộc đội ngũ
                        </p>
                    </div>
                </div>
            </motion.div>
            <div className=" mx-auto md:pt-30">

                {/* Header */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl max-w-[1300px] mx-auto leading-12 md:text-4xl font-bold text-center mb-16 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"
                >
                    Gia nhập cộng đồng với chúng tôi
                </motion.h2>

                {/* Testimonials Slider */}
                <div className="relative max-w-[1300px] mx-auto mb-20 px-4 md:px-0">
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

                {/* Community Gallery */}
                <div className="mt-20">
                    <CommunityGallery />
                </div>

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
                                Sẵn sàng tạo nên tuyệt tác?<br />
                                <span className="text-orange-400 md:ml-10 ml-0">Với sức mạnh của Duky AI </span>
                            </h2>
                            <Link href="/pricing" className="inline-block ml-20">
                                <button className="cta-button relative px-10 py-4 text-white font-black text-xl rounded-lg border-4 border-orange-500 transition-all duration-300 overflow-visible cursor-pointer bg-black hover:bg-black hover:text-orange-500 hover:shadow-[0_0_50px_#ea8b19]">
                                    <span className="box relative block">
                                        Nâng cấp ngay


                                    </span>
                                    {/* Star 1 */}
                                    <div className="star-1 absolute w-6 h-6 transition-all duration-1000 ease-[cubic-bezier(0.05,0.83,0.43,0.96)] z-[-5]" style={{ top: '-46%', left: '-15%' }}>
                                        <svg className="w-4 h-4 md:w-5 md:h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                        </svg>
                                    </div>

                                    {/* Star 2 */}
                                    <div className="star-2 absolute w-4 h-4 transition-all duration-1000 ease-[cubic-bezier(0,0.4,0,1.01)] z-[-5]" style={{ top: '56%', left: '7%' }}>
                                        <svg className="w-4 h-4 md:w-5 md:h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                        </svg>
                                    </div>

                                    {/* Star 3 */}
                                    <div className="star-3 absolute w-2 h-2 transition-all duration-1000 ease-[cubic-bezier(0,0.4,0,1.01)] z-[-5]" style={{ top: '1%', left: '11%' }}>
                                        <svg className="w-4 h-4 md:w-5 md:h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                        </svg>
                                    </div>

                                    {/* Star 4 */}
                                    <div className="star-4 absolute w-3 h-3 transition-all duration-800 ease-[cubic-bezier(0,0.4,0,1.01)] z-[-5]" style={{ top: '57%', left: '72%' }}>
                                        <svg className="w-4 h-4 md:w-5 md:h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                        </svg>
                                    </div>

                                    {/* Star 5 */}
                                    <div className="star-5 absolute w-4 h-4 transition-all duration-600 ease-[cubic-bezier(0,0.4,0,1.01)] z-[-5]" style={{ top: '56%', left: '106%' }}>
                                        <svg className="w-4 h-4 md:w-5 md:h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                        </svg>
                                    </div>

                                    {/* Star 6 */}
                                    <div className="star-6 absolute w-2 h-2 transition-all duration-800 ease-linear z-[-5]" style={{ top: '1%', left: '50%' }}>
                                        <svg className="w-4 h-4 md:w-5 md:h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <style jsx>{`
                                        .cta-button {
                                            background: linear-gradient(30deg, #e55500 35%, #e55500 73%);
                                        }
                                        
                                        .box {
                                            text-transform: uppercase;
                                            font-weight: 900;
                                            transition: .5s linear;
                                        }
                                        
                                        .box:before {
                                            position: absolute;
                                            content: '';
                                            left: -8px;
                                            bottom: -5px;
                                            height: 4px;
                                            width: 100%;
                                            border-bottom: 4px solid transparent;
                                            border-left: 4px solid transparent;
                                            box-sizing: border-box;
                                            transform: translateX(100%);
                                        }
                                        
                                        .box:after {
                                            position: absolute;
                                            content: '';
                                            top: -5px;
                                            left: 8px;
                                            width: 100%;
                                            height: 4px;
                                            border-top: 4px solid transparent;
                                            border-right: 4px solid transparent;
                                            box-sizing: border-box;
                                            transform: translateX(-100%);
                                        }
                                        
                                        .cta-button:hover .box {
                                            // box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
                                            color: white;
                                            background: #dd4f0dff;
                                        }
                                        
                                        .cta-button:hover .box:before {
                                            border-color: #fff;
                                            height: 100%;
                                            transform: translateX(0);
                                            transition: .3s transform linear, .3s height linear .3s;
                                        }
                                        
                                        .cta-button:hover .box:after {
                                            border-color: #ea8b19;
                                            height: 100%;
                                            transform: translateX(0);
                                            transition: .3s transform linear, .3s height linear .5s;
                                        }
                                        
                                        .cta-button:hover .star-1 {
                                            top: -110%;
                                            left: -60%;
                                            width: 30px;
                                            height: auto;
                                            filter: drop-shadow(0 0 10px #ea8b19);
                                            z-index: 2;
                                        }
                                        
                                        .cta-button:hover .star-2 {
                                            top: -45%;
                                            left: 0%;
                                            width: 20px;
                                            height: auto;
                                            filter: drop-shadow(0 0 10px #ea8b19);
                                            z-index: 2;
                                        }
                                        
                                        .cta-button:hover .star-3 {
                                            top: 55%;
                                            left: 15%;
                                            width: 11px;
                                            height: auto;
                                            filter: drop-shadow(0 0 10px #ea8b19);
                                            z-index: 2;
                                        }
                                        
                                        .cta-button:hover .star-4 {
                                            top: 45%;
                                            left: 85%;
                                            width: 15px;
                                            height: auto;
                                            filter: drop-shadow(0 0 10px #ea8b19);
                                            z-index: 2;
                                        }
                                        
                                        .cta-button:hover .star-5 {
                                            top: 25%;
                                            left: 140%;
                                            width: 25px;
                                            height: auto;
                                            filter: drop-shadow(0 0 10px #ea8b19);
                                            z-index: 2;
                                        }
                                        
                                        .cta-button:hover .star-6 {
                                            top: -5%;
                                            left: 60%;
                                            width: 15px;
                                            height: auto;
                                            filter: drop-shadow(0 0 10px #ea8b19);
                                            z-index: 2;
                                        }
                                    `}</style>
                                </button>
                            </Link>
                        </div>

                        {/* Image Grid / Tablet Mockup */}
                        <div className="flex-1 w-full relative">
                            <div className="md:absolute right-0 top-1/2 md:-translate-y-1/2 w-full md:w-[120%] h-full md:h-[140%] flex items-center justify-center p-8 md:p-0">
                                <div className="relative w-full max-w-md md:max-w-none md:w-[600px] aspect-[4/3] border-white/20 bg-gradient-to-br from-white/10  to-white/20 backdrop-blur-xl rounded-2xl border border-white/50 p-2 shadow-2xl -rotate-6 md:translate-x-10 ">
                                    <div className="grid grid-cols-4 gap-2 h-full overflow-hidden">
                                        {/* Using a mix of placeholder images to simulate the gallery */}
                                        <div className="col-span-1 space-y-2">
                                            <img src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768569626305-nhblt.png" className="w-full h-1/2 object-cover rounded-lg" alt="" />
                                            <img src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768466804739-65stxr.png" className="w-full h-1/2 object-cover rounded-lg" alt="" />
                                        </div>
                                        <div className="col-span-1 space-y-2 mt-4">
                                            <img src="https://pub-15159732d3b14718981f4ec71d2578eb.r2.dev/1768470105777-ky5i1.png" className="w-full h-1/2 object-cover rounded-lg" alt="" />
                                            <img src="https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768301559/z455qfebzkh6htmk9nce.webp" className="w-full h-1/2 object-cover rounded-lg" alt="" />
                                        </div>
                                        <div className="col-span-1 space-y-2">
                                            <img src="https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768199833/dxbmcqbui1vsguds5leb.webp" className="w-full h-1/2 object-cover rounded-lg" alt="" />
                                            <img src="https://res.cloudinary.com/dmxmzannb/image/upload/f_auto,q_auto/v1768281828/xw6xdjfojdcdskwzsqtz.webp" className="w-full h-1/2 object-cover rounded-lg" alt="" />
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
