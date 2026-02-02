'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Aperture } from 'lucide-react';
import Masonry from 'react-masonry-css';
import { useRouter } from 'next/navigation';

interface GalleryItem {
    id: string;
    url: string;
    prompt: string;
    tool: string;
    createdAt: string;
    user: {
        name: string;
        avatar: string;
    };
}

export default function CommunityGalleryPage() {
    const router = useRouter();
    const [images, setImages] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
    const observer = useRef<IntersectionObserver | null>(null);

    const lastImageElementRef = useCallback((node: HTMLDivElement) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    useEffect(() => {
        const fetchGallery = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/community/gallery?page=${page}&limit=20`);
                const data = await res.json();
                if (data.success) {
                    setImages(prev => {
                        const newIds = new Set(data.data.map((d: GalleryItem) => d.id));
                        // Filter out duplicates just in case
                        return [...prev, ...data.data.filter((d: GalleryItem) => !prev.some(p => p.id === d.id))];
                    });
                    setHasMore(data.pagination.hasMore);
                }
            } catch (error) {
                console.error('Failed to fetch community gallery:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchGallery();
    }, [page]);

    // Format relative time
    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " năm trước";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " tháng trước";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " ngày trước";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " giờ trước";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " phút trước";
        return Math.floor(seconds) + " giây trước";
    };

    return (
        <div className="w-full min-h-screen p-4 md:p-8">
            <h1 className="text-3xl md:text-5xl font-bold text-center mb-12 text-orange-500">
                Thư viện Cộng đồng
            </h1>

            <Masonry
                breakpointCols={{
                    default: 5,
                    1280: 4,
                    1024: 3,
                    768: 2
                }}
                className="flex -ml-4 w-auto"
                columnClassName="pl-4 bg-clip-padding"
            >
                {images.map((img, index) => {
                    if (images.length === index + 1) {
                        return (
                            <div ref={lastImageElementRef} className="mb-4" key={`${img.id}-${index}`}>
                                {/* Image Card Code */}
                                <ImageCard img={img} onClick={() => setSelectedImage(img)} />
                            </div>
                        );
                    } else {
                        return (
                            <div className="mb-4" key={`${img.id}-${index}`}>
                                <ImageCard img={img} onClick={() => setSelectedImage(img)} />
                            </div>
                        );
                    }
                })}
            </Masonry>

            {loading && (
                <div className="flex justify-center py-10">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {!hasMore && !loading && (
                <p className="text-center text-gray-500 py-10">Đã hết ảnh để hiển thị.</p>
            )}

            {/* Lightbox Code Here (Copied) */}
            <AnimatePresence>
                {selectedImage && (
                    <Lightbox selectedImage={selectedImage} setSelectedImage={setSelectedImage} timeAgo={timeAgo} />
                )}
            </AnimatePresence>

        </div>
    );
}

// Subcomponents for cleaner code
const ImageCard = ({ img, onClick }: { img: GalleryItem, onClick: () => void }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative group cursor-pointer overflow-hidden rounded-lg"
        onClick={onClick}
    >
        <img
            src={img.url}
            alt={img.prompt || "AI Generated Image"}
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden border border-white/50">
                    <img src={img.user.avatar} alt={img.user.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-white text-xs font-medium truncate max-w-[100px]">{img.user.name}</span>
            </div>
        </div>
    </motion.div>
);

const Lightbox = ({ selectedImage, setSelectedImage, timeAgo }: any) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
        onClick={() => setSelectedImage(null)}
    >
        {/* Close Button */}
        <button
            className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors"
            onClick={() => setSelectedImage(null)}
        >
            <X size={32} />
        </button>

        <div
            className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Main Image */}
            <img
                src={selectedImage.url}
                alt={selectedImage.prompt}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />

            {/* Overlays Info */}

            {/* Top Left: User Info */}
            <div className="absolute top-4 left-4 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-orange-500">
                    <img src={selectedImage.user.avatar} alt={selectedImage.user.name} className="w-full h-full object-cover" />
                </div>
                <div>
                    <p className="text-white text-sm font-bold">{selectedImage.user.name}</p>
                </div>
            </div>

            {/* Top Right: Time */}
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <Clock size={14} className="text-orange-400" />
                <span className="text-white/80 text-xs">{timeAgo(selectedImage.createdAt)}</span>
            </div>

            {/* Bottom: Tool Used & Prompt */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-col items-center gap-3">

                {/* Prompt Container */}
                <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 w-full max-w-2xl">
                    <p className="text-white/90 text-sm line-clamp-3 mb-2">{selectedImage.prompt}</p>
                    <button
                        className="text-xs flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(selectedImage.prompt);
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        Copy Prompt
                    </button>
                </div>

                {/* Tool Badge */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        const toolId = selectedImage.tool || 'free-generation';
                        const url = toolId === 'studio' ? '/studio' : `/tool/${toolId}`;
                        window.location.href = url; // Force navigation or use router
                    }}
                    className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all cursor-pointer"
                >
                    <Aperture size={16} className="text-orange-400" />
                    <span className="text-white text-sm font-medium capitalize">
                        {(selectedImage.tool || 'unknown-tool').replace(/-/g, ' ')}
                    </span>
                </button>
            </div>

        </div>
    </motion.div>
);
