/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadImage } from './uiUtils';
import { DownloadIcon } from './icons';

interface LightboxProps {
    images: (string | { src: string; type: 'video' | 'image' })[];
    selectedIndex: number | null;
    onClose: () => void;
    onNavigate: (newIndex: number) => void;
    prompts?: (string | null)[];  // Optional prompts array to display below image
}

const Lightbox: React.FC<LightboxProps> = ({ images, selectedIndex, onClose, onNavigate, prompts }) => {
    const [scale, setScale] = React.useState(1);
    const [copied, setCopied] = React.useState(false);

    // Reset zoom when image changes
    useEffect(() => {

        setScale(1);
    }, [selectedIndex]);

    const handleCopyPrompt = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIndex !== null && prompts && prompts[selectedIndex]) {
            navigator.clipboard.writeText(prompts[selectedIndex]!).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

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

    const currentItem = selectedIndex !== null ? images[selectedIndex] : null;

    const handleDownloadCurrent = (e?: React.MouseEvent) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (!currentItem) return;
        const url = typeof currentItem === 'string' ? currentItem : currentItem.src;
        // Generate random ID: timestamp + random number
        const randomId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        // If it's a video, we might want a different filename extension, but downloadImage handles it?
        // Let's assume downloadImage handles it or browser detects mime.
        downloadImage(url, `Duky-AI-${randomId}`);
    };

    const handleZoomIn = (e: React.MouseEvent) => {
        e.stopPropagation();
        setScale(prev => Math.min(prev + 0.5, 3));
    };

    const handleZoomOut = (e: React.MouseEvent) => {
        e.stopPropagation();
        setScale(prev => Math.max(prev - 0.5, 0.5));
    };

    const renderContent = () => {
        if (!currentItem) return null;

        const src = typeof currentItem === 'string' ? currentItem : currentItem.src;
        const isVideo = typeof currentItem === 'object'
            ? currentItem.type === 'video'
            : (src.endsWith('.mp4') || src.endsWith('.webm'));

        if (isVideo) {
            return (
                <video
                    src={src}
                    controls
                    autoPlay
                    className="gallery-lightbox-img"
                    style={{ transform: `scale(${scale})`, transition: 'transform 0.2s ease-out' }}
                />
            );
        }

        return (
            <img
                src={src}
                alt={`Generated content ${selectedIndex !== null ? selectedIndex + 1 : ''}`}
                className="gallery-lightbox-img"
                style={{ transform: `scale(${scale})`, transition: 'transform 0.2s ease-out' }}
            />
        );
    };

    return (
        <AnimatePresence>
            {selectedIndex !== null && (
                <motion.div className="gallery-lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div className="gallery-lightbox-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}></motion.div>

                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden" onClick={onClose}>
                        <button
                            type="button"
                            className="absolute top-20 left-4 z-[60] !p-2 w-12 h-12 flex items-center justify-center rounded-full bg-orange-500! text-white backdrop-blur-sm transition-all hover:bg-black/70 hover:scale-110 active:scale-95 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            title="Đóng (Esc)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 pointer-events-none" style={{ pointerEvents: 'none' }}>
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
                                {renderContent()}

                                {/* Prompt Display Section */}
                                {selectedIndex !== null && prompts && prompts[selectedIndex] && (
                                    <motion.div
                                        className="absolute md:bottom-4 bottom-[-20%] left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white max-h-32 overflow-y-auto z-50"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 text-sm">
                                                <p className="font-semibold mb-2 text-orange-400">Prompt:</p>
                                                <p className="!text-xs text-gray-300 line-clamp-3">{prompts[selectedIndex]}</p>
                                            </div>
                                            <button
                                                className="lightbox-action-btn bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded text-white !text-xs font-semibold whitespace-nowrap transition-all"
                                                onClick={handleCopyPrompt}
                                                title={copied ? "Đã copy!" : "Copy prompt"}
                                            >
                                                {copied ? '✓ Copied' : 'Copy'}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Image Actions */}
                                <div className="absolute md:top-4 md:top-[5%] top-[-15%] right-2 flex gap-4 z-50">
                                    <button
                                        type="button"
                                        className="w-12 h-12 !p-2 flex items-center justify-center rounded-full bg-black/50 border border-white/20 text-white backdrop-blur-sm transition-all hover:bg-black/70 hover:scale-110 active:scale-95 cursor-pointer z-50"
                                        onClick={handleZoomOut}
                                        title="Thu nhỏ"
                                    >
                                        <svg onClick={handleZoomOut} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 pointer-events-none" style={{ pointerEvents: 'none' }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13 10H7" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        className="w-12 h-12 !p-2 flex items-center justify-center rounded-full bg-black/50 border border-white/20 text-white backdrop-blur-sm transition-all hover:bg-black/70 hover:scale-110 active:scale-95 cursor-pointer z-50"
                                        onClick={handleZoomIn}
                                        title="Phóng to"
                                    >
                                        <svg onClick={handleZoomIn} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 pointer-events-none" style={{ pointerEvents: 'none' }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10 7v6m3-3H7" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        className="w-12 h-12 !p-2 flex items-center justify-center rounded-full bg-black/50 border border-white/20 text-white backdrop-blur-sm transition-all hover:bg-black/70 hover:scale-110 active:scale-95 cursor-pointer z-50"
                                        onClick={handleDownloadCurrent}
                                        title="Tải xuống"
                                    >
                                        <svg onClick={handleDownloadCurrent} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 pointer-events-none" style={{ pointerEvents: 'none' }}>
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