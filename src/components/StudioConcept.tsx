import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getAllStudios } from '../services/storageService';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface Studio {
    id: string;
    name: string;
    slug: string;
    description: string;
    preview_image_url: string;
}

export const StudioConcept = () => {
    const [studios, setStudios] = useState<Studio[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudios = async () => {
            try {
                const data = await getAllStudios();
                // Lấy 10 studios đầu tiên
                const topStudios = (data || []).slice(0, 10);
                setStudios(topStudios);
            } catch (error) {
                console.error('Error fetching studios:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudios();
    }, []);

    return (
        <section className="py-20 pt-0 bg-black text-white relative overflow-hidden">
            {/* Custom Swiper Navigation Styles */}
            <style jsx global>{`
                .studio-slider .swiper-button-prev,
                .studio-slider .swiper-button-next {
                    width: 40px;
                    height: 40px;
                    background: rgba(236, 236, 236, 0.47);
                    border-radius: 50%;
                    color: rgba(189, 80, 3, 0.9);
                    transition: all 0.3s ease;
                    padding: 10px;
                }
                
                .studio-slider .swiper-button-prev:after,
                .studio-slider .swiper-button-next:after {
                    font-size: 13px;
                    font-weight: bold;
                }
                
                // .studio-slider .swiper-button-prev {
                //     left: -60px;
                // }
                
                // .studio-slider .swiper-button-next {
                //     right: -60px;
                // }
                
                .studio-slider .swiper-button-prev:hover,
                .studio-slider .swiper-button-next:hover {
                    // background: rgba(249, 115, 22, 1);
                    transform: scale(1.1);
                    box-shadow: 0 4px 12px #fff;
                }
                
                .studio-slider .swiper-button-disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
                
                @media (max-width: 768px) {
                    .studio-slider .swiper-button-prev {
                        left: 0;
                    }
                    .studio-slider .swiper-button-next {
                        right: 0;
                    }
                }
            `}</style>

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl max-h-[500px] bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="container mx-auto max-w-[1300px] text-center relative z-10">
                <h3 className="text-sm md:text-2xl text-start font-bold mb-6 bg-clip-text text-white">
                    Không gian sáng tạo hiện đại, kết hợp công nghệ & cảm xúc - nơi ý tưởng được kích hoạt.
                </h3>
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="!text-4xl leading-[1.1] md:text-8xl font-magesta md:w-[50%] w-[70%] text-start mb-12 bg-gradient-to-r from-[#eb5a01] to-[#eb5a00] bg-clip-text text-transparent"
                >
                    Studio concept sáng tạo
                </motion.h2>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : studios.length > 0 ? (
                    <div className="relative mb-12 px-4 md:px-0">
                        <Swiper
                            modules={[Pagination, Autoplay, Navigation]}
                            spaceBetween={16}
                            slidesPerView={2}

                            navigation
                            pagination={{
                                clickable: true
                            }}
                            breakpoints={{
                                640: {
                                    slidesPerView: 3,
                                    spaceBetween: 20,
                                },
                                1024: {
                                    slidesPerView: 4,
                                    spaceBetween: 24,
                                }
                            }}
                            className="pb-16 studio-slider"
                        >
                            {studios.map((studio) => (
                                <SwiperSlide key={studio.id}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        className="group h-full"
                                    >
                                        <Link href={`/studio/${studio.slug}`} className="block">
                                            <div className="space-y-4 h-full">
                                                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 group-hover:border-orange-500/50 transition-colors duration-300">
                                                    <img
                                                        src={studio.preview_image_url || '/img/placeholder.webp'}
                                                        alt={studio.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-300 group-hover:text-white transition-colors truncate px-2">
                                                    {studio.name}
                                                </h3>
                                            </div>
                                        </Link>
                                    </motion.div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                ) : (
                    <div className="text-center text-gray-400 py-20">
                        Chưa có studio nào.
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                >
                    <Link
                        href="/studio"
                        className="inline-flex items-center justify-center px-8 py-3 text-sm md:text-base bg-gradient-to-r from-orange-500 to-orange-600 rounded-full text-white font-medium hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 hover:-translate-y-1"
                    >
                        Xem thêm
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};

export default StudioConcept;
