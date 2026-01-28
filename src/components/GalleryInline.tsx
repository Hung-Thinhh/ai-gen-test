/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Masonry from 'react-masonry-css';
import toast from 'react-hot-toast';
import { downloadAllImagesAsZip, ImageForZip, useLightbox, useAppControls, useImageEditor, combineImages } from './uiUtils';
import Lightbox from './Lightbox';
import { ImageThumbnail } from './ImageThumbnail';
import { GalleryToolbar } from './GalleryToolbar';
import { CloudUploadIcon } from './icons';
import { useIsMobile } from '../utils/mobileUtils';

// Masonry breakpoints: { screenWidth: columns }
const masonryBreakpoints = {
    default: 5,  // 5 columns by default (large screens)
    1280: 5,
    1024: 4,
    768: 3,
    640: 2,
    0: 2,        // 2 columns for smallest screens
};

interface GalleryItem {
    history_id: string;
    output_images: string[];
    input_prompt?: string;
    created_at?: string;
    tool_key?: string;
    model?: string;
    [key: string]: any; // Allow other properties
}

interface GalleryInlineProps {
    onClose: () => void;
    images: GalleryItem[] | string[];
}

export const GalleryInline: React.FC<GalleryInlineProps> = ({ onClose, images: rawImages }) => {
    // Normalize images to GalleryItem[] to support legacy string[] input
    const images: GalleryItem[] = React.useMemo(() => {
        if (!rawImages || rawImages.length === 0) return [];
        // Check if the first item is a string essentially checks the array type
        // (Assuming homogeneous array)
        if (typeof rawImages[0] === 'string') {
            return (rawImages as string[]).map((url, index) => ({
                history_id: `legacy-${index}-${typeof url === 'string' ? url.substring(url.length - 10) : index}`,
                output_images: [url],
                input_prompt: '',
            }));
        }
        return rawImages as GalleryItem[];
    }, [rawImages]);

    const {
        lightboxIndex: selectedImageIndex,
        openLightbox,
        closeLightbox,
        navigateLightbox
    } = useLightbox();

    const { t, addImagesToGallery, removeImageFromGallery, replaceImageInGallery, refreshGallery } = useAppControls();
    const { openImageEditor } = useImageEditor();
    const isMobile = useIsMobile();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [isCombining, setIsCombining] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Initial Fetch (Strictly from DB)
    useEffect(() => {
        setIsLoading(true);
        refreshGallery().finally(() => {
            // Add small delay for better UX
            setTimeout(() => setIsLoading(false), 300);
        });
    }, [refreshGallery]);

    // Pagination state (simpler than infinite scroll)
    const initialPage = searchParams ? Number(searchParams.get('page')) : 1;
    const [currentPage, setCurrentPage] = useState(initialPage > 0 ? initialPage : 1);

    const ITEMS_PER_PAGE = 15;
    const totalPages = Math.ceil(images.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const displayedImages = images.slice(startIndex, endIndex);

    // Update URL when page changes
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        const params = new URLSearchParams(searchParams as any);
        params.set('page', newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
        scrollContainerRef.current?.scrollTo(0, 0);
    };

    // Reset to page 1 when images change IF not already on valid page
    // Or simpler: just ensure current page is valid. 
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            handlePageChange(totalPages);
        }
    }, [images.length, totalPages]);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            handlePageChange(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            handlePageChange(currentPage - 1);
        }
    };

    const handleDownloadAll = () => {
        const imagesToZip: ImageForZip[] = images
            .filter(item => item?.output_images?.[0])  // Filter out invalid items
            .map((item, index) => ({
                url: item.output_images![0],
                filename: `Duky-gallery-image-${index + 1}`,
                folder: 'gallery',
                extension: item.output_images![0].startsWith('blob:') ? 'mp4' : undefined,
            }));
        downloadAllImagesAsZip(imagesToZip, 'Duky-gallery.zip');
    };

    const handleEditImage = (indexToEdit: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const itemToEdit = images[indexToEdit];
        const urlToEdit = itemToEdit?.output_images[0];
        if (!urlToEdit || urlToEdit.startsWith('blob:')) {
            alert(t('galleryModal_cannotEditVideo'));
            return;
        };

        openImageEditor(urlToEdit, (newUrl) => {
            replaceImageInGallery(indexToEdit, newUrl);
        });
    };

    const handleDeleteImage = async (indexToDelete: number, e: React.MouseEvent) => {
        e.stopPropagation();

        // Show confirmation dialog
        const confirmed = window.confirm(
            'Bạn có chắc muốn xóa ảnh này vĩnh viễn?\n\nẢnh sẽ bị xóa khỏi database và Cloudinary storage, không thể khôi phục.'
        );

        if (!confirmed) return;

        const imageUrl = images[indexToDelete]?.output_images?.[0];

        if (!imageUrl) {
            alert('Không tìm thấy URL ảnh để xóa.');
            return;
        }

        // Show loading toast
        const toastId = toast.loading('Đang xóa ảnh...');

        try {
            // Call API to delete from DB + Cloudinary
            const response = await fetch('/api/gallery/deleteImage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Xóa ảnh thất bại');
            }

            // Remove from local state
            removeImageFromGallery(indexToDelete);

            // Show success toast
            toast.success('Đã xóa ảnh thành công!', { id: toastId });
        } catch (error: any) {
            console.error('Delete failed:', error);
            toast.error(`Lỗi xóa ảnh: ${error.message}`, { id: toastId });
        }
    };

    const handleQuickView = (indexToView: number, e: React.MouseEvent) => {
        e.stopPropagation();
        openLightbox(indexToView);
    };

    const handleToggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedIndices([]);
    };

    const handleImageSelect = (index: number) => {
        if (isSelectionMode) {
            setSelectedIndices(prev =>
                prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
            );
        } else {
            openLightbox(index);
        }
    };

    const handleDeleteSelected = () => {
        if (selectedIndices.length === 0) return;

        const sortedIndices = [...selectedIndices].sort((a, b) => b - a);
        sortedIndices.forEach(index => {
            removeImageFromGallery(index);
        });

        setSelectedIndices([]);
        setIsSelectionMode(false);
    };

    const handleCombine = async (direction: 'horizontal' | 'vertical') => {
        if (selectedIndices.length < 2) return;
        setIsCombining(true);
        try {
            const itemsToCombine = selectedIndices
                .map(index => images[index])
                .filter(item => item?.output_images?.[0])  // Filter valid items
                .map(item => ({
                    url: item.output_images![0],
                    label: ''
                }));
            const resultUrl = await combineImages(itemsToCombine, {
                layout: direction,
                gap: 0,
                backgroundColor: '#FFFFFF',
                labels: { enabled: false }
            });
            addImagesToGallery([resultUrl]);
            setSelectedIndices([]);
            setIsSelectionMode(false);
        } catch (err) {
            console.error("Failed to combine images:", err);
            alert(t('galleryModal_combineError', err instanceof Error ? err.message : "Lỗi không xác định."));
        } finally {
            setIsCombining(false);
        }
    };

    const processFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) return;

        const readImageAsDataURL = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Failed to read file.'));
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        };

        try {
            const imageDataUrls = await Promise.all(imageFiles.map(readImageAsDataURL));
            addImagesToGallery(imageDataUrls);
        } catch (error) { console.error("Error reading files:", error); }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false);
    };
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false);
        await processFiles(e.dataTransfer.files);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        await processFiles(e.target.files);
        e.target.value = '';
    };

    return (
        <div className="w-full h-full flex flex-col themed-bg" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                multiple
                onChange={handleFileSelect}
            />
            <GalleryToolbar
                isSelectionMode={isSelectionMode}
                selectedCount={selectedIndices.length}
                imageCount={images.length}
                title={t('galleryModal_title')}
                isCombining={isCombining}
                onToggleSelectionMode={handleToggleSelectionMode}
                onDeleteSelected={handleDeleteSelected}
                onClose={onClose}
                onUploadClick={handleUploadClick}
                onDownloadAll={handleDownloadAll}
                onCombineHorizontal={() => handleCombine('horizontal')}
                onCombineVertical={() => handleCombine('vertical')}
            />
            {images.length > 0 ? (
                <>
                    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
                        <Masonry
                            breakpointCols={masonryBreakpoints}
                            className="gallery-masonry"
                            columnClassName="gallery-masonry-column"
                        >
                            {displayedImages.map((img, index) => {
                                const actualIndex = startIndex + index;
                                // Safety check: ensure output_images exists and has at least one element
                                const imageUrl = img?.output_images?.[0];
                                if (!imageUrl) {
                                    console.warn(`[GalleryInline] Item ${index} missing output_images:`, img);
                                    return null;
                                }
                                return (
                                    <ImageThumbnail
                                        key={`${img.history_id}-${actualIndex}`}
                                        index={actualIndex}
                                        imageUrl={imageUrl}
                                        isSelectionMode={isSelectionMode}
                                        isSelected={selectedIndices.includes(actualIndex)}
                                        hideActions={isMobile}
                                        onSelect={handleImageSelect}
                                        onEdit={handleEditImage}
                                        onDelete={handleDeleteImage}
                                        onQuickView={handleQuickView}
                                    />
                                );
                            })}
                        </Masonry>
                    </div>
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center px-4 py-4 border-t border-neutral-700 themed-bg">
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-neutral-400 text-sm">
                                    {startIndex + 1}-{Math.min(endIndex, images.length)} của {images.length} ảnh
                                </span>
                                <div className="flex gap-1">
                                    {/* Previous button */}
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                        className="cur w-10 h-10 flex items-center justify-center bg-neutral-800 text-neutral-300 rounded-full hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                    >
                                        ←
                                    </button>

                                    {/* Page numbers */}
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                                        // Show first page, last page, current page, and pages around current
                                        const showPage =
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            Math.abs(pageNum - currentPage) <= 1;

                                        // Show ellipsis
                                        const showEllipsisBefore = pageNum === currentPage - 2 && currentPage > 3;
                                        const showEllipsisAfter = pageNum === currentPage + 2 && currentPage < totalPages - 2;

                                        if (!showPage && !showEllipsisBefore && !showEllipsisAfter) {
                                            return null;
                                        }

                                        if (showEllipsisBefore || showEllipsisAfter) {
                                            return (
                                                <span key={`ellipsis-${pageNum}`} className="px-2 text-neutral-500">
                                                    ...
                                                </span>
                                            );
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors text-sm ${currentPage === pageNum
                                                    ? 'bg-orange-500 text-white font-semibold'
                                                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    {/* Next button */}
                                    <button
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                        className="w-10 h-10 flex items-center justify-center bg-neutral-800 text-neutral-300 rounded-full hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                    >
                                        →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : isLoading ? (
                <div className="flex-1 overflow-y-auto p-4">
                    <Masonry
                        breakpointCols={masonryBreakpoints}
                        className="gallery-masonry"
                        columnClassName="gallery-masonry-column"
                    >
                        {Array.from({ length: 15 }).map((_, i) => (
                            <div key={i} className="relative overflow-hidden bg-neutral-800 rounded-lg mb-4" style={{ aspectRatio: '1' }}>
                                <div className="absolute inset-0 bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 animate-shimmer bg-[length:200%_100%]" />
                            </div>
                        ))}
                    </Masonry>
                </div>
            ) : (
                <div className="text-center text-neutral-400 py-8 flex-1 flex items-center justify-center">
                    <p>{t('galleryModal_empty')}<br />{t('galleryModal_empty_dragDrop')}</p>
                </div>
            )}
            <AnimatePresence>
                {isDraggingOver && (
                    <motion.div className="absolute inset-0 z-10 bg-black/70 border-4 border-dashed border-yellow-400 rounded-lg flex flex-col items-center justify-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <CloudUploadIcon className="h-16 w-16 text-yellow-400 mb-4" strokeWidth={1} />
                        <p className="text-2xl font-bold text-yellow-400">{t('galleryModal_dropPrompt')}</p>
                    </motion.div>
                )}
            </AnimatePresence>
            <Lightbox
                images={images.filter(item => item?.output_images?.[0]).map(item => ({
                    src: item.output_images![0],
                    prompt: item.input_prompt,
                    createdAt: item.created_at,
                    toolKey: item.tool_key,
                    model: item.model
                }))}
                selectedIndex={selectedImageIndex}
                onClose={closeLightbox}
                onNavigate={navigateLightbox}
            />
        </div>
    );
};
