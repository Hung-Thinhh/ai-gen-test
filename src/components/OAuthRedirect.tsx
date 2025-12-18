'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function OAuthRedirect() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        // Only run on client after mount
        if (!mounted) return;

        // Check if we're on a page with OAuth hash tokens
        if (window.location.hash.includes('access_token')) {
            console.log('[OAuthRedirect] OAuth hash detected!');
            console.log('[OAuthRedirect] Current URL:', window.location.href);

            // Clean the hash from URL immediately
            const cleanUrl = window.location.pathname;
            console.log('[OAuthRedirect] Redirecting to:', cleanUrl);

            // Use Next.js router for navigation
            router.push('/');

            // Also clean the hash from browser history
            window.history.replaceState({}, document.title, '/');
        }
    }, [router, mounted]);

    return null;
}
