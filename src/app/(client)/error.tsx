"use client";

import { useEffect } from "react";

export default function ClientError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[ClientError]", error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="text-6xl">😵</div>
                <h2 className="text-2xl font-bold text-white">
                    Ôi! Có lỗi xảy ra
                </h2>
                <p className="text-neutral-400 text-sm">
                    Trang không thể tải được. Bạn có thể thử lại hoặc quay về trang chủ.
                </p>
                {process.env.NODE_ENV === 'development' && (
                    <pre className="text-left text-xs text-red-400 bg-red-950/30 p-3 rounded-lg overflow-auto max-h-40 border border-red-900/50">
                        {error.message}
                    </pre>
                )}
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Thử lại
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-medium transition-colors border border-neutral-700"
                    >
                        Về trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
}
