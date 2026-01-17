/**
 * Hook for managing result display with lightbox
 */
import { useLightbox } from '../components/uiUtils';
import { useCallback } from 'react';

export function useResultLightbox(allImages: (string | null)[]) {
    const { lightboxIndex, openLightbox, closeLightbox, navigateLightbox } = useLightbox();

    // Filter out null images and create valid lightbox array
    const lightboxImages = allImages.filter((img): img is string => !!img);

    // Open lightbox for specific image
    const handleImageClick = useCallback((imageUrl: string) => {
        const index = lightboxImages.indexOf(imageUrl);
        if (index !== -1) {
            openLightbox(index);
        }
    }, [lightboxImages, openLightbox]);

    // Open lightbox by result ID
    const handleResultClick = useCallback((id: string, imageUrl: string) => {
        handleImageClick(imageUrl);
    }, [handleImageClick]);

    return {
        lightboxImages,
        lightboxIndex,
        closeLightbox,
        navigateLightbox,
        handleImageClick,
        handleResultClick
    };
}
