/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Masonry from 'react-masonry-css';
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

interface GalleryInlineProps {
    onClose: () => void;
    images: string[];
}

export const GalleryInline: React.FC<GalleryInlineProps> = ({ onClose, images }) => {
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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Initial Fetch (Strictly from DB)
    useEffect(() => {
        refreshGallery();
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
        const imagesToZip: ImageForZip[] = images.map((url, index) => ({
            url,
            filename: `Duky-gallery-image-${index + 1}`,
            folder: 'gallery',
            extension: url.startsWith('blob:') ? 'mp4' : undefined,
        }));
        downloadAllImagesAsZip(imagesToZip, 'Duky-gallery.zip');
    };

    const handleEditImage = (indexToEdit: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const urlToEdit = images[indexToEdit];
        if (!urlToEdit || urlToEdit.startsWith('blob:')) {
            alert(t('galleryModal_cannotEditVideo'));
            return;
        };

        openImageEditor(urlToEdit, (newUrl) => {
            replaceImageInGallery(indexToEdit, newUrl);
        });
    };

    const handleDeleteImage = (indexToDelete: number, e: React.MouseEvent) => {
        e.stopPropagation();
        removeImageFromGallery(indexToDelete);
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
            const itemsToCombine = selectedIndices.map(index => ({
                url: images[index],
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
                                return (
                                    <ImageThumbnail
                                        key={`${img.slice(-20)}-${actualIndex}`}
                                        index={actualIndex}
                                        imageUrl={img}
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
                        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-700 themed-bg">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                ← Trang trước
                            </button>
                            <span className="text-neutral-300 text-sm">
                                Trang {currentPage} / {totalPages} ({startIndex + 1}-{Math.min(endIndex, images.length)} của {images.length} ảnh)
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Trang sau →
                            </button>
                        </div>
                    )}
                </>
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
            <Lightbox images={images} selectedIndex={selectedImageIndex} onClose={closeLightbox} onNavigate={navigateLightbox} />
        </div>
    );
};
