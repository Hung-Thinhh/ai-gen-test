import React from 'react';
import { motion } from 'framer-motion';
import { useAppControls } from './uiUtils';
import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';

export const ZaloCTA: React.FC = () => {
    const { language } = useAppControls();

    return (
        <div className="w-full mb-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-700 via-orange-500 to-orange-400 p-8 md:p-12 shadow-2xl shadow-orange-500/20 max-w-6xl mx-auto"
            >
                {/* Background Shapes */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                    <div className="flex-1">
                        <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                            {language === 'vi' ? 'Tham gia cộng đồng Duky AI' : 'Join Duky AI Community'}
                        </h2>
                        <p className="text-orange-50 text-base md:text-lg mb-0 max-w-xl">
                            {language === 'vi'
                                ? 'Nhận hỗ trợ trực tiếp, chia sẻ tác phẩm và cập nhật tính năng mới nhất cùng cộng đồng người dùng đam mê AI.'
                                : 'Get direct support, share your artworks and get latest updates with our passionate AI community.'}
                        </p>
                    </div>

                    <div className='flex flex-col items-center justify-center gap-4 '>
                        <button className="flex items-center gap-2 px-6 py-3 al bg-orange-500 text-white border border-white/80 rounded-full hover:bg-orange-600 transition-colors font-medium">
                            <Link href="/contact" className='w-full flex items-center gap-2'> 
                            Liên hệ hỗ trợ
                                <ArrowRightIcon className="w-4 h-4" />
                                </Link>
                        </button>
                        <span>Hoặc</span>
                        <motion.a
                            href="https://zalo.me/g/xgsabp123" // Replace with actual link
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-shrink-0 flex items-center gap-3 px-8 py-4 md:0 bg-white text-orange-600 font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
                        >
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/1200px-Icon_of_Zalo.svg.png"
                                alt="Zalo"
                                className="w-8 h-8 object-contain"
                            />
                            <span className="md:text-lg">
                                {language === 'vi' ? 'Tham gia Zalo Group' : 'Join Zalo Group'}
                            </span>
                        </motion.a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
