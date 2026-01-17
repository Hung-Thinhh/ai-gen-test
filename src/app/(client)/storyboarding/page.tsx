"use client";

import { useEffect } from 'react';
import { StoryboardingInline } from '@/components/StoryboardingInline';
import { useAppControls } from '@/components/uiContexts';
import { useRouter } from 'next/navigation';

export default function StoryboardingPage() {
    const { setActivePage } = useAppControls();
    const router = useRouter();

    useEffect(() => {
        setActivePage('storyboarding' as any);
    }, [setActivePage]);

    return <StoryboardingInline onClose={() => router.push('/')} />;
}
