/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NotFound - 404 Error Page Component
 */
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppControls } from './uiUtils';

interface NotFoundProps {
    onClose?: () => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onClose }) => {
    const router = useRouter();
    const { t, handleSelectApp } = useAppControls();

    const handleGoHome = () => {
        if (onClose) {
            onClose();
        } else {
            handleSelectApp('overview');
            router.push('/'); // Changed from navigate('/') to router.push('/')
        }
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-orange-900/20">
            <div className="max-w-md w-full mx-4 text-center space-y-6">
                {/* 404 Number */}
                <div className="relative">
                    <h1 className="text-9xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                        404
                    </h1>
                    <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-orange-500 to-pink-500"></div>
                </div>

                {/* Error Message */}
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold themed-text">
                        {t('common_notFound') || 'Page Not Found'}
                    </h2>
                    <p className="themed-text-secondary">
                        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={handleGoHome}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
                    >
                        ← Về trang chủ
                    </button>
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 themed-card backdrop-blur-sm rounded-full font-semibold themed-text hover:opacity-80 transition-opacity"
                    >
                        Quay lại
                    </button>
                </div>

                {/* Decorative Elements */}
                <div className="mt-8 opacity-50">
                    <svg className="w-48 h-48 mx-auto themed-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
