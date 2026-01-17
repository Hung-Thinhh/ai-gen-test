"use client";

import { useEffect } from 'react';
import { PromptLibrary } from '@/components/PromptLibrary';
import { useAppControls } from '@/components/uiContexts';
import { useRouter } from 'next/navigation';

export default function PromptLibraryPage() {
    const { setActivePage } = useAppControls();
    const router = useRouter();

    useEffect(() => {
        setActivePage('prompt-library' as any);
    }, [setActivePage]);

    return <PromptLibrary onClose={() => router.push('/')} />;
}
