'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to home after 1 second
        const timer = setTimeout(() => {
            router.push('/');
        }, 1000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-orange-500 mb-4">404</h1>
                <p className="text-xl text-gray-300 mb-8">Trang không tồn tại</p>
                <div className="flex items-center justify-center gap-2 text-gray-400">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                    <p>Đang chuyển về trang chủ...</p>
                </div>
            </div>
        </div>
    );
}
