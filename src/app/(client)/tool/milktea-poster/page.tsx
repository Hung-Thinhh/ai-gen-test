"use client";

import { useEffect } from 'react';
import MilkTeaPosterWrapper from '@/components/MilkTeaPosterWrapper';
import { useAppControls } from '@/components/uiContexts';

export default function MilkTeaPosterPage() {
    const { setActivePage } = useAppControls();

    // Sync state for header/nav highlights (lightweight - no MainApp import)
    useEffect(() => {
        setActivePage('milk-tea-poster' as any);
    }, [setActivePage]);

    return <MilkTeaPosterWrapper onGoBack={() => { }} />;
}
