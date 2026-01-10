import Link from 'next/link';
import React from 'react';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600 mb-2 relative z-10">
                404
            </h1>

            <h2 className="text-3xl font-bold mb-4 relative z-10">Oops! Trang không tìm thấy</h2>

            <p className="text-neutral-400 mb-8 max-w-md text-center relative z-10 text-lg">
                Có vẻ như trang bạn đang tìm kiếm không tồn tại, đã bị di chuyển hoặc link bị hỏng.
            </p>

            <Link href="/" className="relative z-10">
                <button className="px-8 py-3 rounded-full font-bold text-black bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 shadow-lg shadow-orange-500/20 transition-all transform hover:scale-105 active:scale-95 duration-200">
                    Về trang chủ
                </button>
            </Link>
        </div>
    );
}
