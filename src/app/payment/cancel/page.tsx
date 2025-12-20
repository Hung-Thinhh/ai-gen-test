'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import toast from 'react-hot-toast';

function PaymentCancelContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');

    useEffect(() => {
        toast.error('Thanh toán đã bị hủy', {
            duration: 3000
        });
    }, []);

    return (
        <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-neutral-800 rounded-2xl p-8 text-center border border-neutral-700">
                <div className="w-20 h-20 mx-auto mb-4 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <span className="text-5xl">⚠️</span>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">
                    Thanh toán đã bị hủy
                </h1>

                <p className="text-neutral-400 mb-6">
                    Bạn đã hủy quá trình thanh toán. Không có khoản phí nào được tính.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => router.push('/')}
                        className="w-full px-6 py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors font-medium"
                    >
                        Về trang chủ
                    </button>

                    <button
                        onClick={() => router.push('/#pricing')}
                        className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                    >
                        Xem lại bảng giá
                    </button>
                </div>

                {orderId && (
                    <p className="mt-6 text-xs text-neutral-600">
                        Mã đơn hàng: {orderId}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function PaymentCancel() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <PaymentCancelContent />
        </Suspense>
    );
}
