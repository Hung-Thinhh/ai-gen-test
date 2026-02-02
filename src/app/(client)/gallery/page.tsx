"use client";

import { useEffect, useState } from 'react';
import { GalleryInline } from '@/components/GalleryInline';
import { useAppControls } from '@/components/uiContexts';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GalleryPage() {
    const { setActivePage, imageGallery } = useAppControls();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [galleryItems, setGalleryItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState<any>(null);

    // Get current page from URL, default to 1
    const currentPage = parseInt(searchParams.get('page') || '1');

    useEffect(() => {
        setActivePage('gallery' as any);
    }, [setActivePage]);

    // Fetch full gallery data (images + prompts) from API with pagination
    const fetchGallery = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/gallery?page=${currentPage}&limit=30`);
            if (response.ok) {
                const data = await response.json();
                // Transform API response format to GalleryItem format
                if (data.images && data.prompts) {
                    const items = data.images.map((img: any, index: number) => ({
                        history_id: img.history_id || `item-${index}`,
                        output_images: [img.url],
                        input_prompt: data.prompts[index] || '',
                        created_at: img.created_at,
                        tool_key: img.tool_key,
                        model: img.model,
                        share: img.share
                    }));
                    setGalleryItems(items);
                    setPagination(data.pagination);
                    console.log('[Gallery Page] Pagination data:', data.pagination);
                    console.log('[Gallery Page] Loaded images:', items.length);
                }
            }
        } catch (error) {
            console.error("Failed to fetch gallery page data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGallery();
    }, [currentPage]); // Only refetch when page changes

    // Fallback to context if API fails, checking if context has content
    const displayImages = galleryItems.length > 0 ? galleryItems : (imageGallery || []);

    // Optimistic update: remove deleted images from local state immediately
    const handleImagesDeleted = (deletedIndices: number[]) => {
        setGalleryItems(prev => {
            const newItems = prev.filter((_, index) => !deletedIndices.includes(index));
            return newItems;
        });
    };

    const handleShareToggle = (index: number, newState: boolean) => {
        setGalleryItems(prev => {
            const newItems = [...prev];
            if (newItems[index]) {
                newItems[index] = { ...newItems[index], share: newState };
            }
            return newItems;
        });
    };

    // Skeleton loading UI
    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex flex-col top-20">
                {/* Header skeleton */}
                <div className="h-16 bg-neutral-900/50 border-b border-white/10 flex items-center px-4">
                    <div className="h-8 w-32 bg-neutral-800 rounded animate-pulse"></div>
                </div>

                {/* Gallery grid skeleton */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="aspect-square bg-neutral-800 rounded-lg animate-pulse"
                                    style={{
                                        animationDelay: `${i * 50}ms`
                                    }}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Pagination skeleton */}
                <div className="h-16 bg-neutral-900/50 border-t border-white/10 flex items-center justify-center gap-2">
                    <div className="h-10 w-24 bg-neutral-800 rounded animate-pulse"></div>
                    <div className="h-10 w-10 bg-neutral-800 rounded animate-pulse"></div>
                    <div className="h-10 w-24 bg-neutral-800 rounded animate-pulse"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col top-20">
            <GalleryInline
                images={displayImages}
                onClose={() => router.push('/')}
                onShareToggle={handleShareToggle}
                onImagesChanged={handleImagesDeleted}
            />

            {/* Server-side Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
                <div className="absolute bottom-0 left-0 right-0 bg-neutral-900/95 border-t border-white/10 flex items-center justify-center px-4 py-4">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-neutral-400 text-sm">
                            Trang {pagination.page} / {pagination.totalPages} ({pagination.totalImages} ảnh)
                        </span>
                        <div className="flex gap-1">
                            {/* Previous */}
                            <button
                                onClick={() => router.push(`/gallery?page=${currentPage - 1}`)}
                                disabled={currentPage === 1}
                                className="w-10 h-10 flex items-center justify-center bg-neutral-800 text-neutral-300 rounded-full hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                ←
                            </button>

                            {/* Page numbers */}
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => {
                                const showPage =
                                    pageNum === 1 ||
                                    pageNum === pagination.totalPages ||
                                    Math.abs(pageNum - currentPage) <= 1;

                                if (!showPage && pageNum !== currentPage - 2 && pageNum !== currentPage + 2) {
                                    return null;
                                }

                                if ((pageNum === currentPage - 2 && currentPage > 3) ||
                                    (pageNum === currentPage + 2 && currentPage < pagination.totalPages - 2)) {
                                    return <span key={`ellipsis-${pageNum}`} className="px-2 text-neutral-500">...</span>;
                                }

                                if (!showPage) return null;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => router.push(`/gallery?page=${pageNum}`)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${currentPage === pageNum
                                            ? 'bg-orange-500 text-white font-semibold'
                                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            {/* Next */}
                            <button
                                onClick={() => router.push(`/gallery?page=${currentPage + 1}`)}
                                disabled={currentPage >= pagination.totalPages}
                                className="w-10 h-10 flex items-center justify-center bg-neutral-800 text-neutral-300 rounded-full hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
