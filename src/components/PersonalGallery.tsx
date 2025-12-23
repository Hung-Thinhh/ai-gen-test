/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Added AnimatePresence
import { useAppControls, useLightbox } from './uiUtils';
import Lightbox from './Lightbox';
import { GalleryIcon } from './icons';

export const PersonalGallery: React.FC = () => {
    const { imageGallery, t, handleSelectApp, language } = useAppControls();

    // Custom lightbox hook for this component
    const {
        lightboxIndex,
        openLightbox,
        closeLightbox,
        navigateLightbox
    } = useLightbox();

    // Get latest 10 images (reversed to show newest first if imageGallery is chronological, 
    // assuming imageGallery appends new images at the end? Usually yes. 
    // Let's reverse it to show newest top-left)
    const displayImages = useMemo(() => {
        if (!imageGallery) return [];
        return [...imageGallery].reverse().slice(0, 10);
    }, [imageGallery]);

    const lightboxImages = displayImages; // Lightbox should cycle through these 10

    if (!displayImages || displayImages.length === 0) {
        return (
            <div className="w-full py-12 px-4 text-center">
                <div className="bg-neutral-800/50 rounded-2xl p-8 max-w-2xl mx-auto border border-neutral-700/50">
                    <div className="w-16 h-16 bg-neutral-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <GalleryIcon className="w-8 h-8 text-neutral-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                        {language === 'vi' ? 'Thư viện ảnh của bạn' : 'Your Personal Gallery'}
                    </h3>
                    <p className="text-neutral-400 mb-6">
                        {language === 'vi'
                            ? 'Bạn chưa có ảnh nào. Hãy thử tạo ảnh ngay!'
                            : 'You don\'t have any images yet. Try creating some!'}
                    </p>
                    <button
                        onClick={() => handleSelectApp('free-generation')}
                        className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-full hover:opacity-90 transition-opacity"
                    >
                        {language === 'vi' ? 'Tạo ảnh ngay' : 'Create Now'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full py-8 px-4">
            <div className="flex items-center justify-between mb-6 max-w-6xl mx-auto px-2">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <GalleryIcon className="w-6 h-6 text-yellow-400" />
                        {language === 'vi' ? 'Thư viện ảnh gần đây' : 'Recent Gallery'}
                    </h2>
                    <p className="text-neutral-400 text-sm mt-1">
                        {language === 'vi' ? '10 ảnh mới nhất của bạn' : 'Your latest 10 images'}
                    </p>
                </div>
                <button
                    onClick={() => handleSelectApp('gallery')}
                    className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
                >
                    {language === 'vi' ? 'Xem tất cả →' : 'View All →'}
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
                {displayImages.map((img, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        className="aspect-[3/4] rounded-xl overflow-hidden cursor-pointer relative group border border-neutral-800 bg-neutral-800"
                        onClick={() => openLightbox(index)}
                    >
                        <img
                            src={img}
                            alt={`Gallery image ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </motion.div>
                ))}
            </div>

            <Lightbox
                images={lightboxImages}
                selectedIndex={lightboxIndex}
                onClose={closeLightbox}
                onNavigate={navigateLightbox}
            />
        </div>
    );
};
