/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadImage } from './uiUtils';
import { DownloadIcon } from './icons';

interface LightboxProps {
    images: string[];
    selectedIndex: number | null;
    onClose: () => void;
    onNavigate: (newIndex: number) => void;
}

const Lightbox: React.FC<LightboxProps> = ({ images, selectedIndex, onClose, onNavigate }) => {
    const [scale, setScale] = React.useState(1);

    // Reset zoom when image changes
    useEffect(() => {
        setScale(1);
    }, [selectedIndex]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (selectedIndex === null) return;
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'ArrowRight' && images.length > 1) {
            onNavigate((selectedIndex + 1) % images.length);
        } else if (e.key === 'ArrowLeft' && images.length > 1) {
            onNavigate((selectedIndex - 1 + images.length) % images.length);
        }
    }, [selectedIndex, images.length, onClose, onNavigate]);

    useEffect(() => {
        if (selectedIndex !== null) {
            window.addEventListener('keydown', handleKeyDown);
        } else {
            window.removeEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedIndex, handleKeyDown]);

    const handleDownloadCurrent = () => {
        if (selectedIndex !== null && images[selectedIndex]) {
            const url = images[selectedIndex];
            // Generate random ID: timestamp + random number
            const randomId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            downloadImage(url, `Duky-AI-${randomId}`);
        }
    };

    const handleZoomIn = (e: React.MouseEvent) => {
        e.stopPropagation();
        setScale(prev => Math.min(prev + 0.5, 3));
    };

    const handleZoomOut = (e: React.MouseEvent) => {
        e.stopPropagation();
        setScale(prev => Math.max(prev - 0.5, 0.5));
    };

    return (
        <AnimatePresence>
            {selectedIndex !== null && (
                <motion.div className="gallery-lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div className="gallery-lightbox-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}></motion.div>

                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden" onClick={onClose}>
                        <button
                            className="lightbox-action-btn absolute top-20 left-4 z-[60] p-2 bg-orange-500! hover:bg-black/70 rounded-full text-white backdrop-blur-sm transition-all"
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            title="Đóng (Esc)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedIndex}
                                className="relative flex items-center justify-center"
                                onClick={(e) => e.stopPropagation()} // Prevent click on image from closing lightbox
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                            >
                                {images[selectedIndex] && (images[selectedIndex].endsWith('.mp4') || images[selectedIndex].endsWith('.webm')) ? (
                                    <video
                                        src={images[selectedIndex]}
                                        controls
                                        autoPlay
                                        className="gallery-lightbox-img"
                                        style={{ transform: `scale(${scale})`, transition: 'transform 0.2s ease-out' }}
                                    />
                                ) : (
                                    <img
                                        src={images[selectedIndex]}
                                        alt={`Generated image ${selectedIndex + 1}`}
                                        className="gallery-lightbox-img"
                                        style={{ transform: `scale(${scale})`, transition: 'transform 0.2s ease-out' }}
                                    />
                                )}

                                <div className="absolute md:top-4 top-[-30%] right-2 flex gap-4 z-50">
                                    <button
                                        className="lightbox-action-btn bg-black/50 hover:bg-black/70 p-2 rounded-full text-white backdrop-blur-sm transition-all"
                                        onClick={handleZoomOut}
                                        title="Thu nhỏ"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13 10H7" />
                                        </svg>
                                    </button>
                                    <button
                                        className="lightbox-action-btn bg-black/50 hover:bg-black/70 p-2 rounded-full text-white backdrop-blur-sm transition-all"
                                        onClick={handleZoomIn}
                                        title="Phóng to"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10 7v6m3-3H7" />
                                        </svg>
                                    </button>
                                    <button
                                        className="lightbox-action-btn bg-black/50 hover:bg-black/70 p-2 rounded-full text-white backdrop-blur-sm transition-all"
                                        onClick={handleDownloadCurrent}
                                        title="Tải xuống"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                        </svg>
                                    </button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Lightbox;