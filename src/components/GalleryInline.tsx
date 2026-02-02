/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Masonry from 'react-masonry-css';
import toast from 'react-hot-toast';
import { downloadAllImagesAsZip, downloadImage, ImageForZip, useLightbox, useAppControls, useImageEditor, combineImages } from './uiUtils';
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
    share?: boolean;
    [key: string]: any; // Allow other properties
}

interface GalleryInlineProps {
    onClose: () => void;
    images: GalleryItem[] | string[];
    onShareToggle?: (index: number, newState: boolean) => void;
    onImagesChanged?: (deletedIndices: number[]) => void; // Callback với deleted indices
}

export const GalleryInline: React.FC<GalleryInlineProps> = ({ onClose, images: rawImages, onShareToggle, onImagesChanged }) => {
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
                share: false
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

    // Pagination is now handled by parent component (page.tsx) via API
    // GalleryInline just displays whatever images it receives
    const displayedImages = images;


    const handleDownloadAll = async () => {
        // If in selection mode, download only selected images, otherwise all images
        const imagesToDownload = isSelectionMode
            ? selectedIndices.map(index => images[index]).filter(Boolean)
            : images;

        // Download each image individually
        const toastId = toast.loading(`Đang tải ${imagesToDownload.length} ảnh...`);

        let successCount = 0;
        for (let i = 0; i < imagesToDownload.length; i++) {
            const item = imagesToDownload[i];
            if (!item?.output_images?.[0]) continue;

            try {
                await downloadImage(item.output_images[0], `Duky-gallery-${i + 1}`);
                successCount++;
                // Small delay between downloads
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
                console.error('Failed to download image:', error);
            }
        }

        toast.success(`Đã tải ${successCount} ảnh!`, { id: toastId });
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

            // Notify parent with deleted index for optimistic update
            if (onImagesChanged) {
                onImagesChanged([indexToDelete]);
            }
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

    const handleDeleteSelected = async () => {
        if (selectedIndices.length === 0) return;

        // Show confirmation dialog
        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa ${selectedIndices.length} ảnh vĩnh viễn?\n\nẢnh sẽ bị xóa khỏi database và Cloudinary storage, không thể khôi phục.`
        );

        if (!confirmed) return;

        const toastId = toast.loading(`Đang xóa ${selectedIndices.length} ảnh...`);

        try {
            // Delete all selected images via API
            const deletePromises = selectedIndices.map(async (index) => {
                const imageUrl = images[index]?.output_images?.[0];
                if (!imageUrl) return;

                const response = await fetch('/api/gallery/deleteImage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageUrl }),
                });

                const data = await response.json();
                if (!data.success) {
                    throw new Error(data.message || 'Xóa ảnh thất bại');
                }
            });

            await Promise.all(deletePromises);

            // Remove from local state (sort descending to avoid index shift)
            const sortedIndices = [...selectedIndices].sort((a, b) => b - a);
            sortedIndices.forEach(index => {
                removeImageFromGallery(index);
            });

            setSelectedIndices([]);
            setIsSelectionMode(false);
            toast.success(`Đã xóa ${selectedIndices.length} ảnh thành công!`, { id: toastId });

            // Notify parent with deleted indices for optimistic update
            if (onImagesChanged) {
                onImagesChanged(selectedIndices);
            }
        } catch (error: any) {
            console.error('Bulk delete failed:', error);
            toast.error(`Lỗi xóa ảnh: ${error.message}`, { id: toastId });
        }
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

    // Note: GalleryInline receives images as prop, but also processes them into GalleryItems.
    // However, since 'images' prop comes from parent (page.tsx), we can't easily update it directly if it's just passed down.
    // BUT, wait. 'images' in GalleryInline is a memoized value derived from rawImages.
    // If rawImages change, 'images' changes.
    // But page.tsx manages the state.
    // We ideally need an onUpdate prop to notify parent, OR we implement local state overriding.

    // For now, since GalleryInline is used as a full page component often, 
    // and 'page.tsx' fetches data once, relying on parent re-fetch on every toggle is expensive.

    // Actually, GalleryInline seems to be effectively a controlled component via 'images' prop.
    // But 'refreshGallery' in useEffect (line 83) suggests it might be fetching context data too?
    // No, line 81 runs refreshGallery() which updates context, but GalleryInline uses 'images' prop passed from parent (page.tsx).

    // Let's check page.tsx again. It manages 'galleryItems'.
    // We need to notify page.tsx to update its state.
    // However, page.tsx doesn't pass a setter.

    // Actually, GalleryInline converts rawImages to 'images' via useMemo.
    // We can't mutate 'images' as it's a computed constant.

    // Wait, let's look at GalleryModal again. It uses local state 'galleryImages'.
    // GalleryInline is used by 'page.tsx' which has 'galleryItems' state.
    // So if we want to update the UI instantly, likely we need to accept an 'onUpdate' callback prop from parent,
    // OR change GalleryInline to maintain its own state initialized from props?

    // Easier fix: Modify page.tsx to pass a setGalleryItems or similar? 
    // OR better: GalleryInline is generic. 
    // Let's make GalleryInline maintain a local version of images if needed, or better, 
    // assume 'images' prop will be updated if we call a callback.

    // But wait, GalleryModal has local state 'galleryImages'. 
    // GalleryInline receives props.

    // Let's modify GalleryInline to accept `onShareToggle` prop which bubbles up.
    // Or if GalleryInline is the end-user component, it should stick to the pattern.

    // Actually, simply passing onShareToggle to props is cleaner.
    // Let's add onShareToggle to GalleryInlineProps.



    return (
        <div className="w-full h-[75vh] md:h-[86vh] flex flex-col themed-bg" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
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
                                // No pagination in GalleryInline anymore, so index is the actual index
                                const actualIndex = index;
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
                                        isShared={img.share}
                                        onShareToggle={(index, newState) => {
                                            // onShareToggle from prop requires index in original array
                                            // The index passed here is 'actualIndex' (startIndex + index) which relates to 'images' array in GalleryInline
                                            // which IS the original array (or at least the full filtered one if we ignore pagination for a sec)

                                            // Wait, 'images' in GalleryInline IS the list. 
                                            // 'actualIndex' is the index in that list.
                                            // So we just pass it up.
                                            if (onShareToggle) {
                                                onShareToggle(actualIndex, newState);
                                            }
                                        }}
                                    />
                                );
                            })}
                        </Masonry>
                    </div>
                    {/* Pagination is now handled by parent component (gallery/page.tsx) */}
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
                    model: item.model,
                    share: item.share
                }))}
                selectedIndex={selectedImageIndex}
                onClose={closeLightbox}
                onNavigate={navigateLightbox}
                onShareToggle={(index, newState) => {
                    // We need to find the correct index in the original 'images' array.
                    // The lightbox receives filtered images.
                    const validItems = images.filter(item => item?.output_images?.[0]);
                    const targetItem = validItems[index]; // The item in lightbox
                    if (targetItem && onShareToggle) {
                        // Find index in original 'images'
                        const originalIndex = images.indexOf(targetItem);
                        if (originalIndex !== -1) {
                            onShareToggle(originalIndex, newState);
                        }
                    }
                }}
            />
        </div>
    );
};
