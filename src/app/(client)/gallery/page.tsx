"use client";

import { useEffect, useState } from 'react';
import { GalleryInline } from '@/components/GalleryInline';
import { useAppControls } from '@/components/uiContexts';
import { useRouter } from 'next/navigation';

export default function GalleryPage() {
    const { setActivePage, imageGallery } = useAppControls();
    const router = useRouter();
    const [galleryItems, setGalleryItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setActivePage('gallery' as any);
    }, [setActivePage]);

    // Fetch full gallery data (images + prompts) from API
    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const response = await fetch('/api/gallery');
                if (response.ok) {
                    const data = await response.json();
                    // Transform API response format to GalleryItem format
                    // API returns: { images: [{ url, ... }], prompts: [string] }
                    // We need to zip them
                    if (data.images && data.prompts) {
                        const items = data.images.map((img: any, index: number) => ({
                            history_id: img.history_id || `item-${index}`,
                            output_images: [img.url], // GalleryItem expects string[]
                            input_prompt: data.prompts[index] || '',
                            created_at: img.created_at,
                            tool_key: img.tool_key,
                            model: img.model
                        }));
                        setGalleryItems(items);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch gallery page data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGallery();
    }, [imageGallery]); // Refetch if context changes (e.g. new generation)

    // Fallback to context if API fails or loading, checking if context has content
    // But since API structure is needed for prompts, we prefer API data.
    // However, GalleryInline handles string[] fallback too.
    const displayImages = galleryItems.length > 0 ? galleryItems : (imageGallery || []);

    return <GalleryInline images={displayImages} onClose={() => router.push('/')} />;
}
