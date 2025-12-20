'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

function PaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');
    const [status, setStatus] = useState<'checking' | 'success' | 'pending' | 'error'>('checking');
    const [transactionData, setTransactionData] = useState<any>(null);
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 10; // Max 20 seconds (10 retries * 2s)

    useEffect(() => {
        if (!orderId) {
            setStatus('error');
            toast.error('Không tìm thấy mã đơn hàng');
            return;
        }

        let retryTimeout: NodeJS.Timeout;

        const checkPaymentStatus = async () => {
            try {
                console.log('[Payment Success] Checking status for order:', orderId, 'retry:', retryCount);

                // Query transaction status
                const { data: transaction, error } = await supabase
                    .from('payment_transactions')
                    .select('*')
                    .eq('order_id', orderId)
                    .single();

                if (error) {
                    console.error('[Payment Success] Query error:', error);
                    setStatus('error');
                    toast.error('Không thể kiểm tra trạng thái thanh toán');
                    return;
                }

                console.log('[Payment Success] Transaction status:', transaction?.status);
                setTransactionData(transaction);

                if (transaction?.status === 'completed') {
                    setStatus('success');
                    toast.success(`🎉 Đã cộng ${transaction.credits.toLocaleString('vi-VN')} credits vào tài khoản!`, {
                        duration: 5000,
                        icon: '✅'
                    });

                    // Redirect to home after 3 seconds
                    setTimeout(() => {
                        router.push('/');
                    }, 3000);

                } else if (transaction?.status === 'failed') {
                    setStatus('error');
                    toast.error('Thanh toán thất bại');

                } else if (transaction?.status === 'cancelled') {
                    setStatus('error');
                    toast.error('Thanh toán đã bị hủy');

                } else {
                    // Still pending, retry
                    if (retryCount < maxRetries) {
                        setStatus('pending');
                        setRetryCount(prev => prev + 1);
                        retryTimeout = setTimeout(checkPaymentStatus, 2000); // Retry after 2s
                    } else {
                        setStatus('pending');
                        toast('Thanh toán đang được xử lý. Vui lòng kiểm tra lại sau.', {
                            icon: '⏳'
                        });
                    }
                }

            } catch (error) {
                console.error('[Payment Success] Error:', error);
                setStatus('error');
                toast.error('Đã xảy ra lỗi khi kiểm tra thanh toán');
            }
        };

        checkPaymentStatus();

        return () => {
            if (retryTimeout) {
                clearTimeout(retryTimeout);
            }
        };
    }, [orderId, retryCount, router]);

    return (
        <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-neutral-800 rounded-2xl p-8 text-center border border-neutral-700">
                {status === 'checking' && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <h1 className="text-2xl font-bold text-white mb-2">Đang kiểm tra...</h1>
                        <p className="text-neutral-400">Vui lòng đợi trong giây lát</p>
                    </>
                )}

                {status === 'pending' && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                        <h1 className="text-2xl font-bold text-white mb-2">⏳ Đang xử lý thanh toán</h1>
                        <p className="text-neutral-400 mb-4">
                            Giao dịch đang được xử lý. Vui lòng đợi...
                        </p>
                        <p className="text-xs text-neutral-500">
                            Đang thử lần {retryCount}/{maxRetries}
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                            <span className="text-5xl">✅</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Thanh toán thành công!</h1>
                        <p className="text-neutral-400 mb-4">
                            Đã cộng <span className="text-green-400 font-bold">
                                {transactionData?.credits.toLocaleString('vi-VN')} credits
                            </span> vào tài khoản của bạn
                        </p>
                        <p className="text-sm text-neutral-500">
                            Đang chuyển về trang chủ trong 3 giây...
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="mt-4 px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Về trang chủ ngay
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                            <span className="text-5xl">❌</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Có lỗi xảy ra</h1>
                        <p className="text-neutral-400 mb-4">
                            {transactionData?.status === 'failed'
                                ? 'Thanh toán thất bại. Vui lòng thử lại.'
                                : transactionData?.status === 'cancelled'
                                    ? 'Bạn đã hủy thanh toán.'
                                    : 'Không thể kiểm tra trạng thái thanh toán.'}
                        </p>
                        <div className="space-y-2">
                            <button
                                onClick={() => router.push('/')}
                                className="w-full px-6 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                            >
                                Về trang chủ
                            </button>
                            {transactionData?.status === 'failed' && (
                                <button
                                    onClick={() => router.push('/#pricing')}
                                    className="w-full px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    Thử lại
                                </button>
                            )}
                        </div>
                    </>
                )}

                {orderId && (
                    <p className="mt-6 text-xs text-neutral-600">
                        Mã đơn hàng: {orderId}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function PaymentSuccess() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <PaymentSuccessContent />
        </Suspense>
    );
}
