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
        }, 3000); // Check every 3 seconds

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
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans text-white">
            <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#1e1e2d] rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">

                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -ml-20 -mb-20"></div>

                {/* Left Column: QR Code */}
                <div className="flex flex-col items-center justify-center relative z-10">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold mb-2">Quét mã QR</h2>
                        <p className="text-neutral-400 text-sm">Sử dụng ứng dụng ngân hàng để quét</p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl shadow-lg mb-6 transform transition-transform hover:scale-105 duration-300">
                        <img
                            src={qrUrl}
                            alt="VietQR Payment"
                            className="w-64 h-64 md:w-80 md:h-80 object-contain"
                        />
                    </div>

                    {/* Timer & Status */}
                    <div className="w-full max-w-xs bg-neutral-800/50 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-neutral-300 text-sm">Thời gian còn lại:</span>
                            <span className={`font-mono text-xl font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-white'}`}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>

                        {checking && (
                            <div className="flex items-center justify-center gap-2 text-orange-400 text-xs animate-pulse">
                                <div className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                                <span>Đang kiểm tra giao dịch...</span>
                            </div>
                        )}
                    </div>

                    {/* Support Button */}
                    <a
                        href="https://zalo.me/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 flex items-center justify-center gap-3 px-5 py-2.5 bg-[#0068FF]/10 hover:bg-[#0068FF]/20 text-[#0068FF] rounded-full transition-all group border border-[#0068FF]/20"
                    >
                        <div className="bg-white rounded-full p-0.5" >
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg"
                                alt="Zalo"
                                className="w-5 h-5"
                            />
                        </div>
                        <span className="font-medium">Hỗ trợ qua Zalo</span>
                    </a>
                </div>

                {/* Right Column: Payment Details */}
                <div className="flex flex-col justify-center relative z-10 space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-2">
                            Thông tin thanh toán
                        </h1>
                        <p className="text-neutral-400 text-sm">Vui lòng chuyển khoản đúng số tiền và nội dung</p>
                    </div>

                    <div className="space-y-4">
                        {/* Bank Name */}
                        <div className="bg-neutral-800/50 p-4 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors group">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="p-2 bg-blue-500/20 rounded-lg text-blue-400 group-hover:text-blue-300 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </span>
                                <span className="text-xs text-neutral-400 uppercase tracking-wider">Ngân hàng</span>
                            </div>
                            <div className="pl-11 text-lg font-semibold text-white">{bankInfo.bank}</div>
                        </div>

                        {/* Account Info */}
                        <div className="bg-neutral-800/50 p-4 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors flex items-center justify-between group">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="p-2 bg-green-500/20 rounded-lg text-green-400 group-hover:text-green-300 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </span>
                                    <span className="text-xs text-neutral-400 uppercase tracking-wider">Số tài khoản</span>
                                </div>
                                <div className="pl-11 text-xl font-mono font-bold text-white tracking-wide">{bankInfo.account}</div>
                                <div className="pl-11 text-sm text-neutral-400 mt-1">{bankInfo.name}</div>
                            </div>
                            <button
                                onClick={() => copyToClipboard(bankInfo.account, 'số tài khoản')}
                                className="p-2.5 bg-neutral-700 hover:bg-orange-500 text-neutral-300 hover:text-white rounded-xl transition-all active:scale-95"
                                title="Sao chép số tài khoản"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>

                        {/* Amount */}
                        <div className="bg-neutral-800/50 p-4 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors flex items-center justify-between group">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400 group-hover:text-yellow-300 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </span>
                                    <span className="text-xs text-neutral-400 uppercase tracking-wider">Số tiền</span>
                                </div>
                                <div className="pl-11 text-2xl font-bold text-orange-400">{bankInfo.amount.toLocaleString('vi-VN')} đ</div>
                            </div>
                            <button
                                onClick={() => copyToClipboard(bankInfo.amount.toString(), 'số tiền')}
                                className="p-2.5 bg-neutral-700 hover:bg-orange-500 text-neutral-300 hover:text-white rounded-xl transition-all active:scale-95"
                                title="Sao chép số tiền"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/30 flex items-center justify-between shadow-[0_0_15px_rgba(249,115,22,0.1)] group">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                        </svg>
                                    </span>
                                    <span className="text-xs text-orange-400/80 uppercase tracking-wider font-bold">Nội dung chuyển khoản</span>
                                </div>
                                <div className="pl-11 text-xl font-bold text-white tracking-wide">{bankInfo.content}</div>
                            </div>
                            <button
                                onClick={() => copyToClipboard(bankInfo.content, 'nội dung')}
                                className="p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                                title="Sao chép nội dung"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 flex flex-col gap-3">
                        <div className="text-center">
                            <p className="text-xs text-neutral-500 mb-4">
                                Giao dịch sẽ được xử lý tự động trong vài giây sau khi chuyển khoản thành công.
                            </p>
                            <button
                                onClick={() => router.push('/')}
                                className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-full text-sm transition-colors border border-white/5"
                            >
                                Hủy đơn hàng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VAPayment() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <VAPaymentContent />
        </Suspense>
    );
}

