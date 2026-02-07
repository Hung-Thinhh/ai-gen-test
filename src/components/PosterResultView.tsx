/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';
import Lightbox from './Lightbox';
import { downloadImage } from './uiUtils';
import { uploadImageToGommo, createVideo, checkVideoStatus } from '@/services/videoService';

interface VideoGenerationItem {
    id: string;
    imageUrl: string;
    status: 'UPLOADING' | 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
    startTime: number;
    elapsedTime: number;
    processId?: string;
    downloadUrl?: string;
    thumbnailUrl?: string;
    error?: string;
}

interface PosterResultViewProps {
    images: string[];
    allGeneratedImages?: string[]; // All images ever generated in this session
    totalCount: number;
    isGenerating: boolean;
    onBack: () => void;
    onDownload?: (url: string, format: string, quality: string) => void;
    posterTitle?: string;
    selectedIndex?: number;
    onSelectImage?: (index: number) => void;
}

export const PosterResultView: React.FC<PosterResultViewProps> = ({
    images,
    allGeneratedImages,
    totalCount,
    isGenerating,
    onBack,
    onDownload,
    posterTitle = "Milk Tea Poster",
    selectedIndex = 0,
    onSelectImage
}) => {
    const [format, setFormat] = useState('PNG');
    const [quality, setQuality] = useState('high');
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [generatingVideos, setGeneratingVideos] = useState<VideoGenerationItem[]>([]);
    const pollIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const MAX_CONCURRENT_VIDEOS = 4;

    // Use allGeneratedImages for the variations list, fallback to images
    const variationsList = allGeneratedImages || images;

    // Determine which image to show
    const activeImageIndex = Math.min(selectedIndex, images.length - 1);
    const hasImages = images.length > 0;
    const activeImageUrl = hasImages ? images[activeImageIndex < 0 ? 0 : activeImageIndex] : null;

    const handleDownload = () => {
        if (!activeImageUrl) return;

        if (onDownload) {
            onDownload(activeImageUrl, format, quality);
        } else {
            // Use downloadImage from uiUtils (same as Lightbox)
            const randomId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            downloadImage(activeImageUrl, `Duky-AI-${randomId}`);
        }
    };

    const handleCopyLink = async () => {
        if (!activeImageUrl) return;

        try {
            await navigator.clipboard.writeText(activeImageUrl);
            toast.success('Đã copy link ảnh vào clipboard!');
        } catch (error) {
            console.error('Failed to copy link:', error);
            toast.error('Không thể copy link. Vui lòng thử lại.');
        }
    };

    // Timer update for all generating videos
    useEffect(() => {
        const timer = setInterval(() => {
            setGeneratingVideos(prev =>
                prev.map(video => ({
                    ...video,
                    elapsedTime: Date.now() - video.startTime,
                }))
            );
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Cleanup intervals on unmount
    useEffect(() => {
        return () => {
            pollIntervalsRef.current.forEach(interval => clearInterval(interval));
            pollIntervalsRef.current.clear();
        };
    }, []);

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const updateVideoStatus = (videoId: string, updates: Partial<VideoGenerationItem>) => {
        setGeneratingVideos(prev =>
            prev.map(v => v.id === videoId ? { ...v, ...updates } : v)
        );
    };

    const pollVideoStatus = async (videoId: string, processId: string) => {
        const interval = setInterval(async () => {
            try {
                const statusRes = await checkVideoStatus(processId);
                const status = statusRes.status;

                if (status === 'MEDIA_GENERATION_STATUS_SUCCESSFUL' || status === 'SUCCESS') {
                    if (statusRes.output?.download_url) {
                        updateVideoStatus(videoId, {
                            status: 'SUCCESS',
                            downloadUrl: statusRes.output.download_url,
                            thumbnailUrl: statusRes.output.thumbnail_url,
                        });
                        const interval = pollIntervalsRef.current.get(videoId);
                        if (interval) {
                            clearInterval(interval);
                            pollIntervalsRef.current.delete(videoId);
                        }
                    } else {
                        updateVideoStatus(videoId, { status: 'PROCESSING' });
                    }
                } else if (status === 'MEDIA_GENERATION_STATUS_FAILED' || status === 'FAILED' || status === 'ERROR') {
                    updateVideoStatus(videoId, {
                        status: 'FAILED',
                        error: statusRes.error || 'Video generation failed',
                    });
                    const interval = pollIntervalsRef.current.get(videoId);
                    if (interval) {
                        clearInterval(interval);
                        pollIntervalsRef.current.delete(videoId);
                    }
                } else if (status === 'MEDIA_GENERATION_STATUS_PROCESSING' || status === 'PROCESSING') {
                    updateVideoStatus(videoId, { status: 'PROCESSING' });
                } else {
                    updateVideoStatus(videoId, { status: 'PENDING' });
                }
            } catch (err) {
                console.error('Poll error:', err);
            }
        }, 3000);

        pollIntervalsRef.current.set(videoId, interval);
    };

    const handleCreateVideo = async () => {
        if (!activeImageUrl) {
            toast.error('Không có ảnh để tạo video');
            return;
        }

        if (generatingVideos.length >= MAX_CONCURRENT_VIDEOS) {
            toast.error(`Chỉ có thể tạo tối đa ${MAX_CONCURRENT_VIDEOS} video cùng lúc`);
            return;
        }

        const videoId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newVideo: VideoGenerationItem = {
            id: videoId,
            imageUrl: activeImageUrl,
            status: 'UPLOADING',
            startTime: Date.now(),
            elapsedTime: 0,
        };

        setGeneratingVideos(prev => [...prev, newVideo]);
        toast.success('Bắt đầu tạo video...');

        try {
            // 1. Upload image to get ID (Client fetches Blob -> Proxy Uploads)
            updateVideoStatus(videoId, { status: 'UPLOADING' });

            // Fetch blob from URL via Proxy (Avoids CORS)
            const proxyUrl = `/api/proxy/image-download?url=${encodeURIComponent(activeImageUrl)}`;
            const imageBlob = await fetch(proxyUrl).then(r => {
                if (!r.ok) throw new Error('Failed to fetch image blob via proxy');
                return r.blob();
            });

            // 1a. Compress/Resize Image to avoid timeout (Target < 1MB)
            const compressedBlob = await compressImage(imageBlob);

            // Prepare FormData
            const formData = new FormData();
            formData.append('image', compressedBlob, 'poster.jpg');

            console.log(`Uploading compressed image size: ${compressedBlob.size} bytes`);

            // Upload to Proxy
            const uploadRes = await fetch('/api/proxy/image/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) {
                const errData = await uploadRes.json().catch(() => ({}));
                throw new Error(errData.message || 'Upload image failed');
            }

            const uploadData = await uploadRes.json();
            // Gommo returns { imageInfo: { id_base: "..." } } or just { id_base: "..." }
            const imageId = uploadData.imageInfo?.id_base || uploadData.id_base;

            if (!imageId) {
                throw new Error('No image ID returned from upload');
            }






            // 2. Create video with veo3
            updateVideoStatus(videoId, { status: 'PENDING' });
            const processId = await createVideo({
                model: 'veo_3_1', // Correct model name for VEO 3.1 - HOT
                prompt: '', // Prompt is optional for image-to-video if using image
                ratio: '9:16',
                resolution: '720p',
                duration: '5s',
                mode: 'fast', // Mode for veo_3_1
                privacy: 'PRIVATE',
                image_start: imageId, // Use image_start (string) instead of images (array)
                quantity: 1,
            });

            updateVideoStatus(videoId, { processId, status: 'PROCESSING' });

            // 3. Start polling
            pollVideoStatus(videoId, processId);
        } catch (error: any) {
            console.error('Video generation failed:', error);
            updateVideoStatus(videoId, {
                status: 'FAILED',
                error: error.message || 'Không thể tạo video',
            });
            toast.error(`Lỗi: ${error.message || 'Không thể tạo video'}`);
        }
    };

    const handleDownloadVideo = (url: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `Duky-Video-${Date.now()}.mp4`;
        link.click();
        toast.success('Đang tải video...');
    };

    const handleRemoveVideo = (videoId: string) => {
        const interval = pollIntervalsRef.current.get(videoId);
        if (interval) {
            clearInterval(interval);
            pollIntervalsRef.current.delete(videoId);
        }
        setGeneratingVideos(prev => prev.filter(v => v.id !== videoId));
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#181411] text-white font-sans overflow-x-hidden min-h-screen flex flex-col">
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Noto+Sans:wght@300..800&display=swap" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            <style jsx global>{`
                .font-display { font-family: 'Manrope', 'Noto Sans', sans-serif; }

                /* Custom scrollbar for dark theme */
                ::-webkit-scrollbar { width: 8px; height: 8px; }
                ::-webkit-scrollbar-track { background: #181411; }
                ::-webkit-scrollbar-thumb { background: #393028; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #ec7f13; }

                @keyframes pulse-dark {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
                .animate-pulse-dark {
                    animation: pulse-dark 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>

            {/* Top Navigation */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#393028] px-4 md:px-10 py-3 bg-[#181411] z-50 sticky top-0">
                <div className="flex items-center gap-4 text-white">
                    <div
                        className="size-8 text-[#ec7f13] cursor-pointer"
                        onClick={onBack}
                    >
                        {/* Logo SVG */}
                        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <g clipPath="url(#clip0_6_543)">
                                <path d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z" fill="currentColor"></path>
                                <path clipRule="evenodd" d="M7.24189 26.4066C7.31369 26.4411 7.64204 26.5637 8.52504 26.3738C9.59462 26.1438 11.0343 25.5311 12.7183 24.4963C14.7583 23.2426 17.0256 21.4503 19.238 19.238C21.4503 17.0256 23.2426 14.7583 24.4963 12.7183C25.5311 11.0343 26.1438 9.59463 26.3738 8.52504C26.5637 7.64204 26.4411 7.31369 26.4066 7.24189C26.345 7.21246 26.143 7.14535 25.6664 7.1918C24.9745 7.25925 23.9954 7.5498 22.7699 8.14278C20.3369 9.32007 17.3369 11.4915 14.4142 14.4142C11.4915 17.3369 9.32007 20.3369 8.14278 22.7699C7.5498 23.9954 7.25925 24.9745 7.1918 25.6664C7.14534 26.143 7.21246 26.345 7.24189 26.4066ZM29.9001 10.7285C29.4519 12.0322 28.7617 13.4172 27.9042 14.8126C26.465 17.1544 24.4686 19.6641 22.0664 22.0664C19.6641 24.4686 17.1544 26.465 14.8126 27.9042C13.4172 28.7617 12.0322 29.4519 10.7285 29.9001L21.5754 40.747C21.6001 40.7606 21.8995 40.931 22.8729 40.7217C23.9424 40.4916 25.3821 39.879 27.0661 38.8441C29.1062 37.5904 31.3734 35.7982 33.5858 33.5858C35.7982 31.3734 37.5904 29.1062 38.8441 27.0661C39.879 25.3821 40.4916 23.9425 40.7216 22.8729C40.931 21.8995 40.7606 21.6001 40.747 21.5754L29.9001 10.7285ZM29.2403 4.41187L43.5881 18.7597C44.9757 20.1473 44.9743 22.1235 44.6322 23.7139C44.2714 25.3919 43.4158 27.2666 42.252 29.1604C40.8128 31.5022 38.8165 34.012 36.4142 36.4142C34.012 38.8165 31.5022 40.8128 29.1604 42.252C27.2666 43.4158 25.3919 44.2714 23.7139 44.6322C22.1235 44.9743 20.1473 44.9757 18.7597 43.5881L4.41187 29.2403C3.29027 28.1187 3.08209 26.5973 3.21067 25.2783C3.34099 23.9415 3.8369 22.4852 4.54214 21.0277C5.96129 18.0948 8.43335 14.7382 11.5858 11.5858C14.7382 8.43335 18.0948 5.9613 21.0277 4.54214C22.4852 3.8369 23.9415 3.34099 25.2783 3.21067C26.5973 3.08209 28.1187 3.29028 29.2403 4.41187Z" fill="currentColor" fillRule="evenodd"></path>
                            </g>
                            <defs>
                                <clipPath id="clip0_6_543"><rect fill="white" height="48" width="48"></rect></clipPath>
                            </defs>
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">PosterCreator</h2>
                </div>

                <div className="hidden md:flex flex-1 justify-end gap-8">
                    <div className="flex items-center gap-9">
                        <a className="text-white text-sm font-medium leading-normal hover:text-[#ec7f13] transition-colors" href="#">Dashboard</a>
                        <a className="text-white text-sm font-medium leading-normal hover:text-[#ec7f13] transition-colors" href="#">Templates</a>
                        <a className="text-white text-sm font-medium leading-normal hover:text-[#ec7f13] transition-colors" href="#">My Projects</a>
                    </div>
                    <button
                        onClick={onBack}
                        className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#ec7f13] hover:bg-orange-600 transition-colors text-white text-sm font-bold leading-normal tracking-[0.015em] shadow-lg shadow-orange-900/20"
                    >
                        <span className="truncate">New Project</span>
                    </button>
                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-[#393028]" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDtWWfoG36rqcbEb2thY04FVRPmKqj7SJQKgV3H-gO_v8hZMwipadz3DbYKQfxvBC23hVhKRkUl4Pdzu632B6jhCxZ-FYt0zXPPdMzB5Tgma5-5ArP7ypa9tOVHfcKyW1InkwZ7jwMSQrLCSEeWcBq4fkrtU0d3qjcQJ-qEt4YCqi1RXDwH_HVthLfmLARoqB5eGTtFhZdbZW_1qAZLSvq5-wNhBzF434xOz9-wgS_BtjbeRJhuf4HXGVwFClpgTRw-HoMeSQJLKsqY")' }}></div>
                </div>
                <div className="md:hidden text-white" onClick={onBack}>
                    <span className="material-symbols-outlined">menu</span>
                </div>
            </header>

            <div className="flex-1 flex justify-center w-full px-4 md:px-10 py-6 md:py-10">
                <div className="w-full max-w-[1440px] flex flex-col gap-6">
                    {/* Breadcrumbs */}
                    {/* <nav className="flex items-center gap-2 text-sm text-[#b9ab9d]">
                        <a className="hover:text-[#ec7f13] transition-colors flex items-center gap-1" href="#" onClick={onBack}>
                            <span className="material-symbols-outlined text-[18px]">home</span>
                            Trang chủ
                        </a>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        <a className="hover:text-[#ec7f13] transition-colors" href="/poster/cosmetic-poster">Poster</a>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        <span className="text-white font-medium">{posterTitle}</span>
                    </nav> */}

                    {/* Main Content Layout */}
                    <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[600px]">
                        {/* Left: Poster Preview Area */}
                        <div className="flex-1 bg-[#1f1a16] rounded-xl flex flex-col items-center justify-center p-8 relative group overflow-hidden border border-[#393028]">

                            {/* Main Canvas Area */}
                            <div className="relative shadow-2xl shadow-black/50 transform transition-transform duration-300 hover:scale-[1.01]">
                                {activeImageUrl ? (
                                    <img
                                        alt="Generated poster preview"
                                        className="max-h-[60vh] lg:max-h-[60vh] w-auto object-contain rounded-sm cursor-pointer"
                                        src={activeImageUrl}
                                        onClick={() => setLightboxIndex(activeImageIndex)}
                                        title="Click to view in lightbox"
                                    />
                                ) : (
                                    /* Loading State for Main Image */
                                    <div className="w-[400px] h-[600px] max-h-[60vh] lg:max-h-[75vh] bg-[#2e231b] animate-pulse-dark flex flex-col items-center justify-center rounded-sm">
                                        <div className="w-16 h-16 border-4 border-[#ec7f13] border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <p className="text-[#8a7a6e] font-medium">Creating masterpiece...</p>
                                    </div>
                                )}
                            </div>

                            {activeImageUrl && (
                                <>
                                    <div className="mt-6 text-[#8a7a6e] text-xs flex gap-4">
                                        <span>Just now</span>
                                        <span>•</span>
                                        <span>Generated via Duky AI</span>
                                    </div>
                                </>
                            )}

                            {/* Video Generation List */}
                            {generatingVideos.length > 0 && (
                                <div className="w-full mt-8">
                                    <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-purple-500">videocam</span>
                                        Video đang tạo ({generatingVideos.length}/{MAX_CONCURRENT_VIDEOS})
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {generatingVideos.map(video => (
                                            <div
                                                key={video.id}
                                                className="bg-[#2e231b] rounded-lg overflow-hidden border border-[#393028] relative"
                                            >
                                                {/* Video Preview / Loading */}
                                                <div className="aspect-[9/16] bg-[#1f1a16] relative flex items-center justify-center">
                                                    {video.status === 'SUCCESS' && video.downloadUrl ? (
                                                        <video
                                                            src={video.downloadUrl}
                                                            className="w-full h-full object-cover"
                                                            controls
                                                            muted
                                                        />
                                                    ) : (
                                                        <>
                                                            <img
                                                                src={video.imageUrl}
                                                                alt="Source"
                                                                className="w-full h-full object-cover opacity-30"
                                                            />
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                                {video.status === 'FAILED' ? (
                                                                    <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
                                                                ) : (
                                                                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Status Badge */}
                                                <div className="absolute top-2 left-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${video.status === 'SUCCESS' ? 'bg-green-500 text-white' :
                                                        video.status === 'FAILED' ? 'bg-red-500 text-white' :
                                                            video.status === 'UPLOADING' ? 'bg-yellow-500 text-black' :
                                                                'bg-purple-500 text-white'
                                                        }`}>
                                                        {video.status === 'UPLOADING' ? 'Đang tải...' :
                                                            video.status === 'PENDING' ? 'Chờ xử lý' :
                                                                video.status === 'PROCESSING' ? 'Đang tạo' :
                                                                    video.status === 'SUCCESS' ? 'Hoàn thành' :
                                                                        'Lỗi'}
                                                    </span>
                                                </div>

                                                {/* Timer */}
                                                <div className="absolute top-2 right-2">
                                                    <span className="px-2 py-1 rounded bg-black/70 text-white text-xs font-mono">
                                                        {formatTime(video.elapsedTime)}
                                                    </span>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="p-2 flex gap-2">
                                                    {video.status === 'SUCCESS' && video.downloadUrl && (
                                                        <button
                                                            onClick={() => handleDownloadVideo(video.downloadUrl!)}
                                                            className="flex-1 py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium flex items-center justify-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">download</span>
                                                            Tải về
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemoveVideo(video.id)}
                                                        className="py-1.5 px-3 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-xs font-medium flex items-center justify-center gap-1"
                                                        title="Xóa"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                    </button>
                                                </div>

                                                {/* Error Message */}
                                                {video.status === 'FAILED' && video.error && (
                                                    <div className="px-2 pb-2">
                                                        <p className="text-xs text-red-400">{video.error}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Variations on Mobile - Swiper Slider */}
                            <div className="lg:hidden w-full mt-8">
                                <h4 className="text-white font-bold mb-4">Các phiên bản khác</h4>
                                <Swiper
                                    modules={[Pagination, Navigation, FreeMode]}
                                    spaceBetween={16}
                                    slidesPerView={2.2}
                                    freeMode={true}
                                    pagination={{
                                        clickable: true,
                                        dynamicBullets: true,
                                    }}
                                    className="variations-swiper pb-12"
                                >
                                    {/* Render Generated Images */}
                                    {variationsList.map((img, idx) => (
                                        <SwiperSlide key={idx}>
                                            <div
                                                className={`group rounded-lg cursor-pointer ${activeImageIndex === idx ? 'ring-3 ring-[#ec7f13]' : ''}`}
                                                onClick={() => onSelectImage && onSelectImage(idx)}
                                            >
                                                <div className="aspect-[2/3] bg-[#2e231b] rounded-lg overflow-hidden relative">
                                                    <img src={img} alt={`Variation ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-white">visibility</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                    ))}

                                    {/* Render Loading Skeletons for Pending Images (only if generating) */}
                                    {isGenerating && Array.from({ length: Math.max(0, totalCount - images.length) }).map((_, idx) => (
                                        <SwiperSlide key={`loading-${idx}`}>
                                            <div className="group">
                                                <div className="aspect-[2/3] bg-[#2e231b] rounded-lg overflow-hidden relative animate-pulse-dark flex items-center justify-center">
                                                    <div className="w-8 h-8 border-2 border-[#ec7f13] border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                        </div>

                        {/* Right: Action Sidebar */}
                        <div className="w-full lg:w-[360px] flex flex-col gap-6">
                            {/* File Name & Edit */}
                            <div className="bg-[#2e231b] p-6 rounded-xl border border-[#393028]">
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <div>
                                        <h1 className="text-xl font-bold text-white mb-1">{posterTitle}</h1>
                                        <p className="text-sm text-[#b9ab9d]">{isGenerating ? 'Đang tạo...' : 'Sẵn sàng tải về'}</p>
                                    </div>
                                    <button className="text-[#ec7f13] hover:text-orange-400 p-1 rounded hover:bg-white/5 transition-colors" title="Edit Name">
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                </div>
                                <button
                                    onClick={onBack}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-[#393028] rounded-lg text-sm bg-white/20 font-medium text-white hover:bg-[#3a2d23] transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">design_services</span>
                                    Quay lại chỉnh sửa
                                </button>
                            </div>

                            {/* Export Options */}
                            <div className="bg-[#2e231b] p-6 rounded-xl border border-[#393028] flex-1 flex flex-col">
                                <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#ec7f13]">download</span>
                                    Lựa chọn tải xuống
                                </h3>

                                {/* Format Selection */}
                                {/* <div className="mb-6">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#b9ab9d] mb-3">Định dạng file</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['PNG', 'JPG', 'PDF'].map(fmt => (
                                            <label key={fmt} className="cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="format"
                                                    className="peer sr-only"
                                                    checked={format === fmt}
                                                    onChange={() => setFormat(fmt)}
                                                />
                                                <div className="h-10 flex items-center justify-center rounded-lg border border-[#393028] bg-transparent text-sm font-medium peer-checked:bg-[#ec7f13]/20 peer-checked:border-[#ec7f13] peer-checked:text-[#ec7f13] transition-all text-white">
                                                    {fmt}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div> */}

                                {/* Quality/Size Selection */}
                                <div className="mb-8">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#b9ab9d] mb-3">Chất lượng & Kích thước</label>
                                    <div className="space-y-2">
                                        <label className="flex items-center justify-between p-3 rounded-lg border border-[#393028] cursor-pointer hover:border-[#ec7f13]/50 transition-colors group has-[:checked]:border-[#ec7f13] has-[:checked]:bg-[#ec7f13]/10">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="quality"
                                                    className="text-[#ec7f13] focus:ring-[#ec7f13] bg-transparent border-[#8a7a6e]"
                                                    checked={quality === 'high'}
                                                    onChange={() => setQuality('high')}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-white text-justify">Chất lượng cao (Web)</span>
                                                    <span className="text-xs text-[#8a7a6e] text-justify">1080 x 1920px • ~1.2MB</span>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-[#8a7a6e] group-has-[:checked]:text-[#ec7f13]">image</span>
                                        </label>
                                        {/* <label className="flex items-center justify-between p-3 rounded-lg border border-[#393028] cursor-pointer hover:border-[#ec7f13]/50 transition-colors group has-[:checked]:border-[#ec7f13] has-[:checked]:bg-[#ec7f13]/10">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="quality"
                                                    className="text-[#ec7f13] focus:ring-[#ec7f13] bg-transparent border-[#8a7a6e]"
                                                    checked={quality === 'print'}
                                                    onChange={() => setQuality('print')}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-white text-justify">In ấn</span>
                                                    <span className="text-xs text-[#8a7a6e] text-justify">2160 x 3840px • 300 DPI</span>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-[#8a7a6e] group-has-[:checked]:text-[#ec7f13]">print</span>
                                        </label> */}
                                    </div>
                                </div>

                                {/* Main Action */}
                                <div className="mt-auto flex flex-col gap-4">
                                    <button
                                        onClick={handleDownload}
                                        disabled={!activeImageUrl}
                                        className="w-full py-3.5 px-6 rounded-lg bg-[#ec7f13] hover:bg-orange-600 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-bold text-base shadow-lg shadow-orange-900/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">download</span>
                                        Tải về ảnh
                                    </button>
                                    <button
                                        onClick={handleCreateVideo}
                                        disabled={!activeImageUrl || generatingVideos.length >= MAX_CONCURRENT_VIDEOS}
                                        className="w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-bold text-base shadow-lg shadow-purple-900/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">videocam</span>
                                        Tạo Video {generatingVideos.length > 0 && `(${generatingVideos.length}/${MAX_CONCURRENT_VIDEOS})`}
                                    </button>
                                    {/* Share actions skipped for now, just buttons */}
                                    <div className="flex items-center gap-3">
                                        <button className="flex-1 py-2.5 px-4 rounded-lg border border-[#393028] text-white text-sm font-medium hover:bg-[#3a2d23] transition-colors flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">share</span>
                                            Chia sẻ
                                        </button>
                                        <button
                                            onClick={handleCopyLink}
                                            disabled={!activeImageUrl}
                                            className="flex-1 py-2.5 px-4 rounded-lg border border-[#393028] text-white text-sm font-medium hover:bg-[#3a2d23] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">link</span>
                                            Copy Link
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer / Generated Variations List - Desktop Only */}
            <div className="w-full hidden lg:flex justify-center border-t border-[#393028] pt-8 pb-4">
                <div className="w-full max-w-[1440px] px-4 md:px-10">
                    <h4 className="text-white font-bold mb-4">Các phiên bản khác</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">

                        {/* Render Generated Images */}
                        {variationsList.map((img, idx) => (
                            <div
                                key={idx}
                                className={`group  rounded-lg cursor-pointer ${activeImageIndex === idx ? 'ring-3 ring-[#ec7f13]' : ''}`}
                                onClick={() => onSelectImage && onSelectImage(idx)}
                            >
                                <div className="aspect-[2/3] bg-[#2e231b] rounded-lg overflow-hidden relative">
                                    <img src={img} alt={`Variation ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white">visibility</span>
                                    </div>
                                </div>
                                {/* <p className="text-xs font-medium text-[#181411] dark:text-white truncate">Variation {idx + 1}</p> */}
                            </div>
                        ))}

                        {/* Render Loading Skeletons for Pending Images (only if generating) */}
                        {isGenerating && Array.from({ length: Math.max(0, totalCount - images.length) }).map((_, idx) => (
                            <div key={`loading-${idx}`} className="group">
                                <div className="aspect-[2/3] bg-[#2e231b] rounded-lg overflow-hidden relative mb-2 animate-pulse-dark flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-[#ec7f13] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                <p className="text-xs font-medium text-[#8a7a6e] truncate">Generating...</p>
                            </div>
                        ))}

                    </div>
                </div>
            </div>

            {/* Lightbox for viewing images */}
            <Lightbox
                images={variationsList}
                selectedIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
                onNavigate={(newIndex) => setLightboxIndex(newIndex)}
            />
        </div>
    );
};

export default PosterResultView;

// Helper to compress/resize image client-side to avoid timeout
// Resize to max 1024px and compress quality to 0.8
async function compressImage(blob: Blob, maxWidth = 1024, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.src = url;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions (max 1024px)
            if (width > maxWidth || height > maxWidth) {
                if (width > height) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                } else {
                    width = Math.round((width * maxWidth) / height);
                    height = maxWidth;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(url);
                reject(new Error('Canvas context failed'));
                return;
            }

            // Draw image on canvas
            ctx.drawImage(img, 0, 0, width, height);

            // Export to Blob (JPEG)
            canvas.toBlob((newBlob) => {
                URL.revokeObjectURL(url); // Cleanup memory

                if (newBlob) {
                    console.log(`Original: ${blob.size}, Compressed: ${newBlob.size}`);
                    resolve(newBlob);
                } else {
                    reject(new Error('Canvas toBlob failed'));
                }
            }, 'image/jpeg', quality);
        };

        img.onerror = (e) => {
            URL.revokeObjectURL(url);
            reject(e);
        };
    });
}
