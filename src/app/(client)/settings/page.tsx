"use client";

import { useEffect } from 'react';
import Settings from '@/components/Settings';
import { useAppControls } from '@/components/uiContexts';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { setActivePage } = useAppControls();
    const router = useRouter();

    useEffect(() => {
        setActivePage('settings' as any);
    }, [setActivePage]);

    return <Settings onBack={() => router.push('/profile')} />;
}
