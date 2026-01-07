'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
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
    const hasChecked = useRef(false);
    const toastIdRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        // Prevent multiple executions
        if (hasChecked.current) return;
        hasChecked.current = true;

        if (!orderId) {
            setStatus('error');
            toast.error('Không tìm thấy mã đơn hàng');
            return;
        }

        let retryTimeout: NodeJS.Timeout;
        let currentRetry = 0;
        const maxRetries = 10;

        const checkPaymentStatus = async () => {
            try {
                console.log('[Payment Success] Checking status for order:', orderId, 'retry:', currentRetry);

                // Use API instead of direct Supabase query (avoids RLS issues)
                const response = await fetch(`/api/sepay/check-payment?order_id=${orderId}`);
                const result = await response.json();

                if (!response.ok || !result.success) {
                    console.error('[Payment Success] API error:', result);
                    setStatus('error');
                    toast.error('Không thể kiểm tra trạng thái thanh toán');
                    return;
                }

                const transaction = {
                    status: result.status,
                    credits: result.credits,
                    amount: result.amount,
                    order_id: orderId
                };

                console.log('[Payment Success] Transaction status:', transaction.status);
                setTransactionData(transaction);


                if (transaction?.status === 'completed') {
                    setStatus('success');
                    if (toastIdRef.current) toast.dismiss(toastIdRef.current);

                    toast.success(`Đã cộng ${(transaction.credits || 0).toLocaleString('vi-VN')} credits vào tài khoản!`, {
                        duration: 5000,
                        style: {
                            background: '#333',
                            color: '#fff',
                            borderRadius: '10px',
                        }
                    });

                    // Force server components refresh
                    router.refresh();

                    // Force client context refresh (if listener exists)
                    window.dispatchEvent(new Event('refresh-user-data'));

                    setTimeout(() => {
                        router.push('/');
                    }, 3000);

                } else if (transaction?.status === 'failed') {
                    setStatus('error');
                    if (toastIdRef.current) toast.dismiss(toastIdRef.current);
                    toast.error('Thanh toán thất bại');

                } else if (transaction?.status === 'cancelled') {
                    setStatus('error');
                    if (toastIdRef.current) toast.dismiss(toastIdRef.current);
                    toast.error('Thanh toán đã bị hủy');

                } else {
                    // Still pending, retry
                    if (currentRetry < maxRetries) {
                        setStatus('pending');
                        currentRetry++;
                        setRetryCount(currentRetry);
                        retryTimeout = setTimeout(checkPaymentStatus, 2000);

                        // Show loading toast only if not already showing (or update it)
                        // Actually better to just show it once or let the UI handle the spinner
                        // If we want a toast, update it.
                        if (!toastIdRef.current) {
                            toastIdRef.current = toast.loading('Đang xử lý thanh toán...', {
                                style: {
                                    background: '#333',
                                    color: '#fff',
                                }
                            });
                        }
                    } else {
                        setStatus('pending');
                        if (toastIdRef.current) toast.dismiss(toastIdRef.current);
                        toast.error('Quá thời gian chờ. Vui lòng kiểm tra lại sau.');
                    }
                }

            } catch (error) {
                console.error('[Payment Success] Error:', error);
                setStatus('error');
                if (toastIdRef.current) toast.dismiss(toastIdRef.current);
                toast.error('Đã xảy ra lỗi khi kiểm tra thanh toán');
            }
        };

        checkPaymentStatus();

        return () => {
            if (retryTimeout) {
                clearTimeout(retryTimeout);
            }
        };
    }, [orderId, router]);

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
                        <h1 className="text-2xl font-bold text-white mb-2">Đang xử lý thanh toán</h1>
                        <p className="text-neutral-400 mb-4">
                            Giao dịch đang được xử lý. Vui lòng đợi...
                        </p>
                        <p className="text-xs text-neutral-500">
                            Đang thử lần {retryCount}/10
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-green-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
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
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-red-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
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
