/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useCallback, useEffect, ChangeEvent, memo } from 'react';
import PolaroidCard from './PolaroidCard';
import {
    handleFileUpload,
    downloadImage,
    RegenerationModal,
    useImageEditor,
    useAppControls,
    GalleryPicker,
    WebcamCaptureModal,
} from './uiUtils';

// NEW: More descriptive card types to centralize logic
type CardType =
    | 'uploader'          // Generic uploader placeholder for any image type
    | 'photo-input'       // An input that is specifically a user's photograph (e.g., for an avatar)
    | 'sketch-input'      // An input that is a sketch or architectural drawing
    | 'clothing-input'    // An input for a clothing item
    | 'content-input'     // A generic content image for styling or transformation
    | 'style-input'       // An image used for its artistic style
    | 'multi-input'       // A flexible input used in free-form generation
    | 'output'            // A generated result from the AI
    | 'display';          // A read-only card with no actions

interface ActionablePolaroidCardProps {
    // Core PolaroidCard props
    mediaUrl?: string;
    caption: string;
    status: 'pending' | 'done' | 'error';
    error?: string;
    placeholderType?: 'person' | 'architecture' | 'clothing' | 'magic' | 'style' | 'photo' | 'art' | 'furniture';
    isMobile?: boolean;
    onClick?: () => void;

    // Role-based prop to determine which buttons to show
    type: CardType;

    // Callbacks for actions
    onImageChange?: (imageDataUrl: string | null) => void;
    onRegenerate?: (prompt: string) => void;
    onGenerateVideoFromPrompt?: (prompt: string) => void;

    // Props for modals
    regenerationTitle?: string;
    regenerationDescription?: string;
    regenerationPlaceholder?: string;
    type_box?: 'big' | 'small';
    uploadLabel?: string;
}


const ActionablePolaroidCard: React.FC<ActionablePolaroidCardProps> = ({
    uploadLabel,
    type_box,
    mediaUrl,
    caption,
    status,
    error,
    placeholderType,
    isMobile,
    onClick,
    type,
    onImageChange,
    onRegenerate,
    onGenerateVideoFromPrompt,
    regenerationTitle,
    regenerationDescription,
    regenerationPlaceholder,
}) => {
    const { openImageEditor } = useImageEditor();
    const { imageGallery, t, settings } = useAppControls();
    const [isRegenModalOpen, setIsRegenModalOpen] = useState(false);
    const [isGalleryPickerOpen, setGalleryPickerOpen] = useState(false);
    const [isWebcamModalOpen, setWebcamModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    // --- Determine button visibility based on the card's role (type) ---
    const isDownloadable = type === 'output';
    const isEditable = type !== 'uploader' && type !== 'display';
    const isClearable = type !== 'output' && type !== 'display' && !!mediaUrl && onImageChange;
    const isSwappable = type !== 'output' && type !== 'display';
    const isRegeneratable = type === 'output';
    const isGallerySelectable = type !== 'output' && type !== 'display';
    const isWebcamSelectable = settings?.enableWebcam && type !== 'output' && type !== 'display';

    const handleFileSelected = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        if (onImageChange) {
            const onUploadWrapper = (newUrl: string) => {
                onImageChange(newUrl);
            };
            handleFileUpload(e, onUploadWrapper);
        }
    }, [onImageChange]);

    const handleFile = useCallback((file: File) => {
        if (onImageChange && file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    onImageChange(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    }, [onImageChange]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

    // NEW: Handle paste from clipboard
    const handlePaste = useCallback((e: ClipboardEvent) => {
        // If the user is focusing an input or textarea, let the browser handle it normally
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
            return;
        }

        const items = e.clipboardData?.items;
        if (!items) return;

        let hasImage = false;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                hasImage = true;
                break;
            }
        }

        // Only prevent default if we have an image to process
        if (!hasImage) return;

        e.preventDefault();

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    handleFile(file);
                    // Show toast to indicate success
                    import('react-hot-toast').then(({ default: toast }) => {
                        toast.success('Ảnh đã được paste!', {
                            duration: 2000,
                            position: 'bottom-right'
                        });
                    });
                    break;
                }
            }
        }
    }, [handleFile]);

    // NEW: Add paste listener when component can receive uploads
    useEffect(() => {
        const canPaste = type !== 'output' && type !== 'display' && onImageChange;
        if (!canPaste) return;

        // Attach paste listener to window
        window.addEventListener('paste', handlePaste);
        return () => {
            window.removeEventListener('paste', handlePaste);
        };
    }, [handlePaste, type, onImageChange]);

    const handleSwapClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleEditClick = useCallback(() => {
        if (mediaUrl && onImageChange) {
            const onSaveWrapper = (newUrl: string) => {
                onImageChange(newUrl);
            };
            openImageEditor(mediaUrl, onSaveWrapper);
        }
    }, [mediaUrl, onImageChange, openImageEditor]);

    const handleClearClick = useCallback(() => {
        if (onImageChange) {
            onImageChange(null);
        }
    }, [onImageChange]);

    const handleRegenerateClick = useCallback(() => {
        setIsRegenModalOpen(true);
    }, []);

    const handleConfirmImage = useCallback((prompt: string) => {
        console.log('[ActionablePolaroidCard] handleConfirmImage called, prompt:', prompt);
        console.log('[ActionablePolaroidCard] onRegenerate exists:', !!onRegenerate);
        setIsRegenModalOpen(false);
        if (onRegenerate) {
            onRegenerate(prompt);
        } else {
            console.warn('[ActionablePolaroidCard] onRegenerate prop is missing! Please add it to enable "Tạo lại ảnh" functionality.');
            import('react-hot-toast').then(({ default: toast }) => {
                toast.error('Chức năng "Tạo lại ảnh" chưa được hỗ trợ cho tool này.', {
                    duration: 3000,
                    position: 'bottom-right'
                });
            });
        }
    }, [onRegenerate]);

    const handleConfirmVideo = useCallback((prompt: string) => {
        console.log('[ActionablePolaroidCard] handleConfirmVideo called, prompt:', prompt);
        console.log('[ActionablePolaroidCard] onGenerateVideoFromPrompt exists:', !!onGenerateVideoFromPrompt);
        setIsRegenModalOpen(false);
        if (onGenerateVideoFromPrompt) {
            onGenerateVideoFromPrompt(prompt);
        }
    }, [onGenerateVideoFromPrompt]);

    const handleDownloadClick = useCallback(() => {
        if (mediaUrl) {
            // Generate random ID: timestamp + random number
            const randomId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const filename = `Duky-AI-${randomId}`;
            downloadImage(mediaUrl, filename);
        }
    }, [mediaUrl]);

    const handleOpenGalleryPicker = useCallback(() => {
        setGalleryPickerOpen(true);
    }, []);

    const handleGalleryImageSelect = (selectedImageUrl: string) => {
        if (onImageChange) {
            onImageChange(selectedImageUrl);
        }
        setGalleryPickerOpen(false);
    };

    const handleOpenWebcam = useCallback(() => {
        setWebcamModalOpen(true);
    }, []);

    const handleWebcamCapture = (imageDataUrl: string) => {
        if (onImageChange) {
            onImageChange(imageDataUrl);
        }
        setWebcamModalOpen(false);
    };

    // Determine the primary click action for the card.
    // If it's an uploader, or has no media, its main job is to trigger the file input.
    // Otherwise, use the provided onClick handler (e.g., for opening a lightbox).
    const effectiveOnClick = !mediaUrl || type === 'uploader' ? handleSwapClick : onClick;

    const showButtons = status === 'done' && mediaUrl;
    const canDoSomething = isRegeneratable || !!onGenerateVideoFromPrompt;

    return (
        <>
            {(isSwappable || isGallerySelectable) && (
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileSelected}
                    // Reset value to allow re-uploading the same file
                    onClick={(e) => (e.currentTarget.value = '')}
                />
            )}
            <PolaroidCard
                uploadLabel={uploadLabel}
                type_box={type_box}
                mediaUrl={mediaUrl}
                caption={caption}
                status={status}
                error={error}
                placeholderType={placeholderType}
                isMobile={isMobile}
                onClick={effectiveOnClick}
                onDownload={showButtons && isDownloadable ? handleDownloadClick : undefined}
                onEdit={showButtons && isEditable ? handleEditClick : undefined}
                onClear={isClearable ? handleClearClick : undefined}
                onSwapImage={isSwappable ? handleSwapClick : undefined}
                onSelectFromGallery={isGallerySelectable ? handleOpenGalleryPicker : undefined}
                onCaptureFromWebcam={isWebcamSelectable ? handleOpenWebcam : undefined}
                onShake={showButtons && canDoSomething ? handleRegenerateClick : undefined}
                isDraggingOver={isDraggingOver}
                onDragOver={isSwappable ? handleDragOver : undefined}
                onDragLeave={isSwappable ? handleDragLeave : undefined}
                onDrop={isSwappable ? handleDrop : undefined}
            />
            {canDoSomething && (
                <RegenerationModal
                    isOpen={isRegenModalOpen}
                    onClose={() => setIsRegenModalOpen(false)}
                    onConfirmImage={handleConfirmImage}
                    onConfirmVideo={onGenerateVideoFromPrompt ? handleConfirmVideo : undefined}
                    itemToModify={caption}
                    title={regenerationTitle || t('regenerationModal_title')}
                    description={regenerationDescription || t('regenerationModal_description')}
                    placeholder={regenerationPlaceholder || t('regenerationModal_placeholder')}
                />
            )}
            <GalleryPicker
                isOpen={isGalleryPickerOpen}
                onClose={() => setGalleryPickerOpen(false)}
                onSelect={handleGalleryImageSelect}
                images={imageGallery}
            />
            <WebcamCaptureModal
                isOpen={isWebcamModalOpen}
                onClose={() => setWebcamModalOpen(false)}
                onCapture={handleWebcamCapture}
            />
        </>
    );
};

export default memo(ActionablePolaroidCard);