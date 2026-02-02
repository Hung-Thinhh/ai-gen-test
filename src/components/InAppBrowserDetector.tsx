'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/**
 * Detect and handle in-app browsers (Zalo, Messenger)
 * Shows a banner instructing users to open in external browser
 */
export default function InAppBrowserDetector() {
    const [isInAppBrowser, setIsInAppBrowser] = useState(false);
    const [browserType, setBrowserType] = useState<'zalo' | 'messenger' | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        const isZalo = userAgent.includes('zalo');
        const isMessenger = userAgent.includes('messenger') || userAgent.includes('fban') || userAgent.includes('fbav');

        if (isZalo) {
            setIsInAppBrowser(true);
            setBrowserType('zalo');
        } else if (isMessenger) {
            setIsInAppBrowser(true);
            setBrowserType('messenger');
        }

        // Check if user previously dismissed
        const wasDismissed = localStorage.getItem('inapp-browser-banner-dismissed');
        if (wasDismissed === 'true') {
            setDismissed(true);
        }
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem('inapp-browser-banner-dismissed', 'true');
    };

    const handleOpenExternal = () => {
        // Copy current URL to clipboard
        navigator.clipboard.writeText(window.location.href);
        alert('Đã sao chép link! Vui lòng dán vào trình duyệt (Chrome, Safari, v.v.)');
    };

    if (!isInAppBrowser || dismissed) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
            <div className="flex items-center justify-between p-3 md:p-4 max-w-4xl mx-auto">
                <div className="flex-1 pr-4">
                    <p className="font-bold text-sm md:text-base mb-1">
                        {browserType === 'zalo' ? '🔔 Bạn đang mở từ Zalo' : '🔔 Bạn đang mở từ Messenger'}
                    </p>
                    <p className="text-xs md:text-sm opacity-90">
                        Để trải nghiệm tốt nhất, vui lòng mở link trong trình duyệt (Chrome, Safari)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleOpenExternal}
                        className="bg-white text-orange-600 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold hover:bg-orange-50 transition-colors whitespace-nowrap"
                    >
                        Sao chép link
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                        aria-label="Đóng"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
