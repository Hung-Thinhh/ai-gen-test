/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadImage, useAppControls } from './uiUtils';
import { DownloadIcon, ShareIcon, CloseIcon, ChevronRightIcon } from './icons';
import Link from 'next/link';
import toast from 'react-hot-toast';

export interface LightboxItem {
    src: string;
    type?: 'video' | 'image';
    prompt?: string;
    createdAt?: string; // ISO string
    toolKey?: string;
    model?: string;
}

interface LightboxProps {
    images: (string | LightboxItem)[];
    selectedIndex: number | null;
    onClose: () => void;
    onNavigate: (newIndex: number) => void;
    prompts?: (string | null)[]; // Legacy support
}

const Lightbox: React.FC<LightboxProps> = ({ images, selectedIndex, onClose, onNavigate, prompts }) => {
    const { settings, t } = useAppControls();
    const [scale, setScale] = React.useState(1);
    const [copied, setCopied] = React.useState(false);

    // Reset zoom when image changes
    useEffect(() => {
        setScale(1);
    }, [selectedIndex]);

    const currentItem = useMemo(() => {
        if (selectedIndex === null) return null;
        const item = images[selectedIndex];
        if (typeof item === 'string') {
            return {
                src: item,
                type: (item.endsWith('.mp4') || item.endsWith('.webm')) ? 'video' : 'image',
                prompt: prompts?.[selectedIndex] || undefined
            } as LightboxItem;
        }
        return {
            ...item,
            prompt: item.prompt || prompts?.[selectedIndex] || undefined,
            type: item.type || ((item.src.endsWith('.mp4') || item.src.endsWith('.webm')) ? 'video' : 'image')
        } as LightboxItem;
    }, [images, selectedIndex, prompts]);

    const toolInfo = useMemo(() => {
        if (!currentItem?.toolKey || !settings) return null;
        const app = settings.apps.find((a: any) => a.id === currentItem.toolKey);
        // Fallback for known tools if key doesn't match id exactly or for specific legacy keys
        // Assuming toolKey maps to app.id for now. 
        if (!app) return { name: currentItem.toolKey, url: `/tool/${currentItem.toolKey}` };
        return { name: t(app.titleKey), url: `/tool/${app.id}` };
    }, [currentItem?.toolKey, settings, t]);

    const formattedDate = useMemo(() => {
        if (!currentItem?.createdAt) return null;
        try {
            return new Date(currentItem.createdAt).toLocaleString('vi-VN', {
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) { return null; }
    }, [currentItem?.createdAt]);

    const handleCopyPrompt = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentItem?.prompt) {
            navigator.clipboard.writeText(currentItem.prompt).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                toast.success('Đã sao chép prompt!');
            });
        }
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentItem?.src) return;

        try {
            const response = await fetch('/api/gallery/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: currentItem.src })
            });

            if (response.ok) {
                await navigator.clipboard.writeText(currentItem.src);
                toast.success('Đã công khai & sao chép link ảnh!');
            } else {
                throw new Error('Share failed');
            }
        } catch (err) {
            console.error(err);
            toast.error('Lỗi chia sẻ ảnh.');
        }
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (selectedIndex === null) return;
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'ArrowRight' && images.length > 1) {
            onNavigate((selectedIndex + 1) % images.length);
        } else if (e.key === 'ArrowLeft' && images.length > 1) {
            onNavigate((selectedIndex - 1 + images.length) % images.length);
        }
    }, [selectedIndex, images.length, onClose, onNavigate]);

    useEffect(() => {
        if (selectedIndex !== null) {
            window.addEventListener('keydown', handleKeyDown);
        } else {
            window.removeEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedIndex, handleKeyDown]);

    const handleDownloadCurrent = (e?: React.MouseEvent) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (!currentItem) return;

        const randomId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        downloadImage(currentItem.src, `Duky-AI-${randomId}`);
    };

    const handleZoomIn = (e: React.MouseEvent) => { e.stopPropagation(); setScale(prev => Math.min(prev + 0.5, 3)); };
    const handleZoomOut = (e: React.MouseEvent) => { e.stopPropagation(); setScale(prev => Math.max(prev - 0.5, 0.5)); };

    const renderContent = () => {
        if (!currentItem) return null;

        if (currentItem.type === 'video') {
            return (
                <video
                    src={currentItem.src}
                    controls
                    autoPlay
                    loop
                    className="max-w-full max-h-full object-contain shadow-2xl"
                    style={{ transform: `scale(${scale})`, transition: 'transform 0.2s ease-out' }}
                />
            );
        }

        return (
            <img
                src={currentItem.src}
                alt="Generated content"
                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                style={{ transform: `scale(${scale})`, transition: 'transform 0.2s ease-out' }}
            />
        );
    };

    return (
        <AnimatePresence>
            {selectedIndex !== null && currentItem && (
                <motion.div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden relative">

                        {/* Close Button - Global (Desktop Only) */}
                        <button
                            type="button"
                            className="hidden md:block absolute top-4 left-4 z-[70] p-2 text-white/50 hover:text-white bg-black/20 hover:bg-white/10 rounded-full transition-all"
                            onClick={onClose}
                            title="Đóng (Esc)"
                        >
                            <CloseIcon className="w-8 h-8" strokeWidth={1.5} />
                        </button>

                        {/* --- LEFT: Info Panel (Desktop) --- */}
                        <div className="hidden md:flex w-[350px] flex-col bg-[#141414] border-r border-white/10 h-full overflow-y-auto shrink-0 z-50">
                            <div className="p-6 flex flex-col gap-6 pt-20">

                                {/* Header Info */}
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">Chi tiết ảnh</h2>
                                    {formattedDate && (
                                        <p className="text-sm text-neutral-400">{formattedDate}</p>
                                    )}
                                </div>

                                {/* Tool & Model */}
                                <div className="flex flex-col gap-3">
                                    {toolInfo && (
                                        <div className="p-3 bg-neutral-800/50 rounded-lg border border-white/5">
                                            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Công cụ</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-orange-400 font-medium">{toolInfo.name}</span>
                                                <Link href={toolInfo.url} className="text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition-colors" onClick={onClose}>
                                                    Mở tool <ChevronRightIcon className="w-3 h-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    {currentItem.model && (
                                        <div className="p-3 bg-neutral-800/50 rounded-lg border border-white/5">
                                            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Model AI</p>
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                {currentItem.model}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Prompt Section */}
                                {currentItem.prompt && (
                                    <div className="flex-1 min-h-[200px] flex flex-col">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs text-neutral-500 uppercase tracking-wider">Prompt</p>
                                            <button
                                                onClick={handleCopyPrompt}
                                                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
                                            >
                                                {copied ? 'Đã copy' : 'Sao chép'}
                                            </button>
                                        </div>
                                        <div className="p-4 bg-black/30 rounded-lg border border-white/5 text-sm text-neutral-300 leading-relaxed overflow-y-auto max-h-[400px] custom-scrollbar">
                                            {currentItem.prompt}
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* --- RIGHT: Image Viewer --- */}
                        <div className="flex-1 relative h-full bg-black/50 flex flex-col" onClick={onClose}>

                            {/* Toolbar Overlay (Top Right) - Desktop */}
                            <div className="hidden md:flex absolute top-4 right-4 z-[70] items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <button className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/10 transition-all" onClick={handleShare} title="Chia sẻ">
                                    <ShareIcon className="w-5 h-5" />
                                </button>
                                <button className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/10 transition-all" onClick={handleZoomOut} title="Thu nhỏ">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13 10H7" /></svg>
                                </button>
                                <button className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/10 transition-all" onClick={handleZoomIn} title="Phóng to">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10 7v6m3-3H7" /></svg>
                                </button>
                                <button className="p-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 transition-all" onClick={handleDownloadCurrent} title="Tải xuống">
                                    <DownloadIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Mobile Top Overlay (Date, Tool, Share, Close) */}
                            <div className="md:hidden absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent p-4 pt-14 pb-12 z-[70] flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col">
                                        {formattedDate && <p className="text-xs text-neutral-400">{formattedDate}</p>}
                                        <div className="flex items-center gap-2 mt-1">
                                            {toolInfo && (
                                                <span className="text-orange-400 font-medium text-sm">{toolInfo.name}</span>
                                            )}
                                            {currentItem.model && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                    {currentItem.model}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 rounded-full bg-black/30 text-white/80 hover:text-white" onClick={handleShare}>
                                            <ShareIcon className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 rounded-full bg-black/30 text-white/50 hover:text-white" onClick={onClose}>
                                            <CloseIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 w-full h-full flex items-center justify-center p-4 md:p-10">
                                <motion.div
                                    key={selectedIndex}
                                    className="relative flex items-center justify-center max-w-full max-h-full"
                                    onClick={(e) => e.stopPropagation()}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {renderContent()}
                                </motion.div>
                            </div>

                            {/* Mobile Info Overlay (Bottom) - Only visible on mobile/tablet */}
                            <div className="md:hidden absolute bottom-20 left-0 right-0 bg-gradient-to-t from-black/90 via-black/80 to-transparent p-4 pt-12 z-[60]" onClick={(e) => e.stopPropagation()}>
                                {currentItem.prompt && (
                                    <>
                                        <div className="max-h-[80px] overflow-y-auto mb-3 custom-scrollbar">
                                            <p className="text-white/90 text-sm font-medium leading-relaxed">{currentItem.prompt}</p>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <button onClick={handleCopyPrompt} className="text-xs bg-white/10 active:bg-white/20 px-3 py-2 rounded-full text-white flex items-center gap-1">
                                                {copied ? 'Đã copy' : 'Sao chép Prompt'}
                                            </button>
                                            {toolInfo && (
                                                <Link href={toolInfo.url} className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-2 rounded-full" onClick={onClose}>
                                                    Mở tool
                                                </Link>
                                            )}
                                            <button onClick={(e) => handleDownloadCurrent(e)} className="ml-auto p-2 bg-white/10 active:bg-white/20 rounded-full text-white">
                                                <DownloadIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Navigation Arrows */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 !w-10 !h-10 !p-2 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/50 text-white/70 hover:text-white transition-all z-[65]"
                                        onClick={(e) => { e.stopPropagation(); onNavigate((selectedIndex - 1 + images.length) % images.length); }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                                    </button>
                                    <button
                                        className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 !w-10 !h-10 !p-2 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/50 text-white/70 hover:text-white transition-all z-[65]"
                                        onClick={(e) => { e.stopPropagation(); onNavigate((selectedIndex + 1) % images.length); }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                                    </button>
                                </>
                            )}

                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Lightbox;