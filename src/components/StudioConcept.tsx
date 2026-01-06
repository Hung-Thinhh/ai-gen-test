import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Concept {
    id: string;
    title: string;
    image: string;
    link: string;
}

const concepts: Concept[] = [
    {
        id: 'doanh-nhan',
        title: 'Doanh nhân',
        image: '/img/doanhnhan.webp',
        link: '/tool/entrepreneur-creator'
    },
    {
        id: 'tet-co-truyen',
        title: 'Tết cổ truyền',
        image: '/img/trungthu.webp', // Using existing image as placeholder/proxy
        link: '/tool/tet-creator'
    },
    {
        id: 'khmer',
        title: 'Khmer',
        image: '/img/beauty.webp', // Placeholder
        link: '/tool/khmer-photo-merge'
    },
    {
        id: 'cosplayer',
        title: 'Cosplayer',
        image: '/img/figure.webp',
        link: '/tool/cosplay-creator'
    }
];

export const StudioConcept = () => {
    return (
        <section className="py-20 bg-black text-white relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl max-h-[500px] bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="container mx-auto max-w-[1300px] text-center relative z-10">
                <h3 className="text-xl md:text-2xl text-start font-bold mb-6  bg-clip-text text-white">
                    Không gian sáng tạo hiện đại, kết hợp công nghệ & cảm xúc - nơi ý tưởng được kích hoạt.
                </h3>
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl leading-[1.1] md:text-8xl  font-magesta w-[50%] text-start mb-12 bg-gradient-to-r from-[#eb5a01] to-[#eb5a00] bg-clip-text text-transparent"
                >
                    Studio concept sáng tạo
                </motion.h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
                    {concepts.map((concept, index) => (
                        <motion.div
                            key={concept.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="group"
                        >
                            <Link href={concept.link} className="block">
                                <div className="space-y-4">
                                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 group-hover:border-orange-500/50 transition-colors duration-300">
                                        <img
                                            src={concept.image}
                                            alt={concept.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-300 group-hover:text-white transition-colors">
                                        {concept.title}
                                    </h3>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                >
                    <Link
                        href="/studio"
                        className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full text-white font-medium hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 hover:-translate-y-1"
                    >
                        Xem thêm
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};

export default StudioConcept;
