'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { VideoAppsList } from './video-platform/VideoAppsList';
import { DynamicAppDetail } from './video-platform/DynamicAppDetail';
import { getAppBySlug } from './video-platform/constants';
import toast from 'react-hot-toast';

export default function VideoGenerator() {
    return (
        <Suspense fallback={
            <div className="flex flex-col w-full min-h-screen bg-black text-white items-center justify-center">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <VideoGeneratorContent />
        </Suspense>
    );
}

function VideoGeneratorContent() {
    const { isLoggedIn, loginGoogle } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [selectedApp, setSelectedApp] = useState<any | null>(null);

    useEffect(() => {
        const appSlug = searchParams.get('app');
        if (appSlug) {
            const app = getAppBySlug(appSlug);
            if (app) {
                if (!isLoggedIn) {
                    toast.error("Vui lòng đăng nhập để sử dụng Apps!");
                    loginGoogle();
                    return;
                }
                setSelectedApp(app);
            } else {
                router.push('/video-generator');
            }
        } else {
            setSelectedApp(null);
        }
    }, [searchParams, isLoggedIn]);

    const handleBack = () => {
        setSelectedApp(null);
        router.push('/video-generator');
    };

    return (
        <div className="flex flex-col w-full min-h-screen bg-black text-white p-4 mt-20 md:mt-0 md:p-8 font-sans">
            {/* Premium Header */}
            <div className="flex flex-col items-center gap-4 mb-10">
                <div className="flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-zinc-900 to-black rounded-full border border-orange-500/30 shadow-lg shadow-orange-500/10">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-lg shadow-orange-500/50"></span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300 text-sm font-bold tracking-wide">
                        VIDEO APPS PLATFORM
                    </span>
                </div>

                {!selectedApp && (
                    <div className="text-center max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-orange-300">
                            Tạo Video TVC Chuyên Nghiệp
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Chọn phong cách phù hợp với sản phẩm của bạn
                        </p>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1">
                {selectedApp ? (
                    <DynamicAppDetail
                        app={selectedApp}
                        onBack={handleBack}
                    />
                ) : (
                    <VideoAppsList />
                )}
            </div>

            {/* Footer hint */}
            {!selectedApp && (
                <div className="mt-12 text-center text-gray-600 text-sm">
                    <p>Powered by Veo 3 & Kling AI • Premium Video Generation</p>
                </div>
            )}
        </div>
    );
}

