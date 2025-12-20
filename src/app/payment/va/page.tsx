'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

function VAPaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');

    const [bankInfo, setBankInfo] = useState<any>(null);
    const [qrUrl, setQrUrl] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        // Get payment info from sessionStorage first
        const paymentData = sessionStorage.getItem('va_payment_data');
        if (paymentData) {
            const data = JSON.parse(paymentData);
            setBankInfo(data.bank_info);
            setQrUrl(data.qr_url);
            console.log('[VA Page] Loaded from sessionStorage');
        } else if (orderId) {
            // Fallback: Fetch from API if sessionStorage is empty
            console.log('[VA Page] sessionStorage empty, fetching from API...');
            fetch(`/api/sepay/check-payment?order_id=${orderId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        // Reconstruct payment data from transaction
                        const reconstructed = {
                            bank: 'TPBank',
                            account: '02627122301',
                            name: 'TRAN THANH NGAN',
                            amount: data.amount,
                            content: `TKP102 ${orderId}`
                        };
                        setBankInfo(reconstructed);

                        // Reconstruct QR URL
                        const qrLink = `https://qr.sepay.vn/img?acc=02627122301&bank=970423&amount=${data.amount}&des=${encodeURIComponent(`TKP102 ${orderId}`)}`;
                        setQrUrl(qrLink);
                        console.log('[VA Page] Reconstructed from API');
                    } else {
                        toast.error('Không tìm thấy giao dịch');
                    }
                })
                .catch(error => {
                    console.error('[VA Page] Fetch error:', error);
                    toast.error('Không thể tải thông tin thanh toán');
                });
        } else {
            // No orderId at all
            toast.error('Thiếu mã đơn hàng');
            router.push('/');
        }
    }, [orderId, router]);

    // Countdown timer  
    useEffect(() => {
        if (timeLeft <= 0) {
            console.log('[VA Page] Timer expired');
            toast.error('Hết thời gian thanh toán');
            router.push(`/payment/cancel?order_id=${orderId}`);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, orderId, router]);

    // Auto-check payment status
    useEffect(() => {
        if (!orderId) return;

        const checkInterval = setInterval(async () => {
            setChecking(true);
            try {
                const response = await fetch(`/api/sepay/check-payment?order_id=${orderId}`);
                const data = await response.json();

                if (data.status === 'completed') {
                    console.log('[VA Page] Payment completed!');
                    toast.success('Thanh toán thành công!');
                    router.push(`/payment/success?order_id=${orderId}`);
                }
            } catch (error) {
                console.error('[VA Payment] Check error:', error);
            } finally {
                setChecking(false);
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(checkInterval);
    }, [orderId, router]);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Đã copy ${label}!`);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!bankInfo) {
        return (
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-neutral-800 rounded-2xl p-8 border border-neutral-700">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-white mb-2">Quét mã QR để thanh toán</h1>
                    <p className="text-neutral-400 text-sm">
                        Mở app ngân hàng và quét mã QR bên dưới
                    </p>
                </div>

                {/* QR Code */}
                <div className="bg-white rounded-xl p-6 mb-6 flex justify-center">
                    <img
                        src={qrUrl}
                        alt="VietQR Payment"
                        className="w-64 h-64 object-contain"
                    />
                </div>

                {/* Bank Info */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
                        <div>
                            <p className="text-xs text-neutral-400">Ngân hàng</p>
                            <p className="text-white font-semibold">{bankInfo.bank}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
                        <div className="flex-1">
                            <p className="text-xs text-neutral-400">Số tài khoản</p>
                            <p className="text-white font-semibold">{bankInfo.account}</p>
                        </div>
                        <button
                            onClick={() => copyToClipboard(bankInfo.account, 'số tài khoản')}
                            className="ml-2 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition-colors"
                        >
                            📋 Copy
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
                        <div>
                            <p className="text-xs text-neutral-400">Chủ tài khoản</p>
                            <p className="text-white font-semibold">{bankInfo.name}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
                        <div className="flex-1">
                            <p className="text-xs text-neutral-400">Số tiền</p>
                            <p className="text-white font-semibold">{bankInfo.amount.toLocaleString('vi-VN')}đ</p>
                        </div>
                        <button
                            onClick={() => copyToClipboard(bankInfo.amount.toString(), 'số tiền')}
                            className="ml-2 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition-colors"
                        >
                            📋 Copy
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500 rounded-lg">
                        <div className="flex-1">
                            <p className="text-xs text-orange-400">Nội dung chuyển khoản</p>
                            <p className="text-orange-300 font-bold">{bankInfo.content}</p>
                        </div>
                        <button
                            onClick={() => copyToClipboard(bankInfo.content, 'nội dung')}
                            className="ml-2 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition-colors"
                        >
                            📋 Copy
                        </button>
                    </div>
                </div>

                {/* Warning */}
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6">
                    <p className="text-yellow-400 text-sm text-center">
                        ⚠️ <strong>Quan trọng:</strong> Vui lòng nhập ĐÚNG nội dung chuyển khoản để hệ thống tự động xác nhận thanh toán
                    </p>
                </div>

                {/* Status */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-neutral-400">⏱️ Thời gian còn lại:</span>
                        <span className={`font-bold ${timeLeft < 60 ? 'text-red-400' : 'text-white'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    {checking && (
                        <div className="flex items-center justify-center gap-2 text-orange-400">
                            <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm">Đang kiểm tra thanh toán...</span>
                        </div>
                    )}
                </div>

                {/* Cancel Button */}
                <button
                    onClick={() => router.push('/')}
                    className="mt-6 w-full px-4 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
                >
                    Hủy và quay lại
                </button>

                {/* Order ID */}
                {orderId && (
                    <p className="mt-4 text-xs text-neutral-600 text-center">
                        Mã đơn hàng: {orderId}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function VAPayment() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <VAPaymentContent />
        </Suspense>
    );
}
