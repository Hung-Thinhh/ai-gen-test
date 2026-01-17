"use client";

import { useEffect } from 'react';
import { GalleryInline } from '@/components/GalleryInline';
import { useAppControls } from '@/components/uiContexts';
import { useRouter } from 'next/navigation';

export default function GalleryPage() {
    const { setActivePage, imageGallery } = useAppControls();
    const router = useRouter();

    useEffect(() => {
        setActivePage('gallery' as any);
    }, [setActivePage]);

    return <GalleryInline images={imageGallery} onClose={() => router.push('/')} />;
}
