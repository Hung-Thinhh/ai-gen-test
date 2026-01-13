'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import { supabase } from '@/lib/supabase/client'; // REMOVED

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        // NextAuth handles callbacks automatically at /api/auth/callback/...
        // This page might be legacy or for manual handling. Redirecting to home.
        router.push('/');
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
