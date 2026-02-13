"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[GlobalError]", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="text-6xl">⚠️</div>
                <h2 className="text-2xl font-bold text-white">
                    Đã xảy ra lỗi
                </h2>
                <p className="text-neutral-400 text-sm">
                    Một lỗi không mong muốn đã xảy ra. Vui lòng thử lại hoặc tải lại trang.
                </p>
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
