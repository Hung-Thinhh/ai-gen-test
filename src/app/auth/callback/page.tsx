'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get the session from the URL
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Auth callback error:', error);
                    router.push('/login?error=' + encodeURIComponent(error.message));
                    return;
                }

                if (session) {
                    console.log('[Auth] Login successful, redirecting to home');
                    router.push('/');
                } else {
                    console.warn('[Auth] No session found, redirecting to login');
                    router.push('/login');
                }
            } catch (error) {
                console.error('Unexpected error in auth callback:', error);
                router.push('/login');
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
            <div className="text-center">
                <div className="inline-block">
                    <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4" />
                </div>
                <p className="text-yellow-400 text-lg font-semibold">
                    Đang xử lý đăng nhập...
                </p>
                <p className="text-neutral-400 text-sm mt-2">
                    Vui lòng đợi trong giây lát
                </p>
            </div>
        </div>
    );
}
