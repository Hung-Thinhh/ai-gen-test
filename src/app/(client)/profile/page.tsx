"use client";

import { useEffect } from 'react';
import UserProfile from '@/components/UserProfile';
import { useAppControls } from '@/components/uiContexts';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { setActivePage } = useAppControls();
    const router = useRouter();

    useEffect(() => {
        setActivePage('profile' as any);
    }, [setActivePage]);

    return (
        <UserProfile
            onClose={() => router.push('/')}
            onOpenSettings={() => router.push('/settings')}
        />
    );
}
