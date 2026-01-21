'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, SettingsIcon, UploadIcon, ClockIcon, PaletteIcon, RulerIcon } from '@/components/icons/PosterIcons';
import { useAuth } from '@/contexts/AuthContext';
import { uploadImageToGommo, createVideo, checkVideoStatus, listVideoModels, type VideoStatusResponse } from '@/services/videoService';
import toast from 'react-hot-toast';

// --- Types ---
interface VideoModelOption {
    name: string;
    type: string;
}

interface VideoModelMode {
    type: string;
    name: string;
    description?: string;
    price: number;
}

interface VideoModel {
    id: string; // Internal ID
    id_base?: string; // API ID
    name: string;
    description?: string;
    server: string;
    model: string; // API model param
    ratios: VideoModelOption[];
    resolutions: VideoModelOption[];
    durations: VideoModelOption[];
    modes: VideoModelMode[];
    price: number;
    startText: boolean;
    startImage: boolean;
    startImageAndEnd: boolean;
    withReference: boolean;
    extendVideo: boolean;
    withLipsync: boolean;
    withMotion: boolean;
    isHot?: boolean;
}

export default function VideoGenerator() {
    const { isLoggedIn, loginGoogle } = useAuth();
    const [models, setModels] = useState<VideoModel[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(true);
    const [selectedModelId, setSelectedModelId] = useState<string>('');
    const [prompt, setPrompt] = useState('');
    const [settings, setSettings] = useState({
        ratio: '',
        resolution: '',
        duration: '',
        mode: '',
        privacy: 'PRIVATE',
        copies: 1
    });
    const [showAdvanced, setShowAdvanced] = useState(true);

    // Image Upload State
    const [startImage, setStartImage] = useState<File | string | null>(null);
    const [startImagePreview, setStartImagePreview] = useState<string | null>(null);

    const [endImage, setEndImage] = useState<File | string | null>(null);
    const [endImagePreview, setEndImagePreview] = useState<string | null>(null);

    const [refImage, setRefImage] = useState<File | string | null>(null);
    const [refImagePreview, setRefImagePreview] = useState<string | null>(null);

    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStatus, setGenerationStatus] = useState<string>(''); // PENDING, PROCESSING...
    const [resultVideo, setResultVideo] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const activeModel = models.find(m => m.id === selectedModelId) || models[0];
    const fileInputRefStart = useRef<HTMLInputElement>(null);
    const fileInputRefEnd = useRef<HTMLInputElement>(null);
    const fileInputRefRef = useRef<HTMLInputElement>(null);

    // Fetch Models on Mount
    useEffect(() => {
        const fetchModels = async () => {
            try {
                // Initial fallback data to show while loading or if API fails
                // But we want to prefer API data.

                const apiModels = await listVideoModels();
                console.log('Fetched Models:', apiModels);

                if (apiModels && apiModels.length > 0) {
                    // Map API response to Component Model
                    const mappedModels: VideoModel[] = apiModels.map((m: any) => ({
                        id: m.model || m.id_base, // Use model code as ID
                        id_base: m.id_base,
                        name: m.name,
                        description: m.description,
                        server: m.server,
                        model: m.model,
                        ratios: m.ratios || [],
                        resolutions: m.resolutions || [],
                        durations: m.durations || [],
                        modes: m.mode || [], // API returns 'mode' array
                        price: m.price,
                        startText: m.startText,
                        startImage: m.startImage,
                        startImageAndEnd: m.startImageAndEnd,
                        withReference: m.withReference,
                        extendVideo: m.extendVideo,
                        withLipsync: m.withLipsync,
                        withMotion: m.withMotion,
                        isHot: m.name.toUpperCase().includes('HOT')
                    }));
                    setModels(mappedModels);
                    setSelectedModelId(mappedModels[0].id);
                } else {
                    toast.error("Không tìm thấy model nào từ hệ thống.");
                }

            } catch (error) {
                console.error('Error fetching models:', error);
                toast.error('Không thể tải danh sách model.');
            } finally {
                setIsLoadingModels(false);
            }
        };

        if (isLoggedIn) {
            fetchModels();
        } else {
            fetchModels();
        }
    }, [isLoggedIn]);

    // Initialize/Reset settings when model changes
    useEffect(() => {
        if (activeModel) {
            setSettings(prev => ({
                ...prev,
                ratio: activeModel.ratios?.[0]?.type || '',
                resolution: activeModel.resolutions?.[0]?.type || '',
                duration: activeModel.durations?.[0]?.type || '',
                mode: activeModel.modes?.[0]?.type || '',
            }));
            // Clear images if model doesn't support
            if (!activeModel.startImage) { setStartImage(null); setStartImagePreview(null); }
            if (!activeModel.startImageAndEnd) { setEndImage(null); setEndImagePreview(null); }
            if (!activeModel.withReference) { setRefImage(null); setRefImagePreview(null); }
        }
    }, [activeModel?.id]);

    const handleSettingChange = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end' | 'ref') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        if (type === 'start') { setStartImage(file); setStartImagePreview(url); }
        else if (type === 'end') { setEndImage(file); setEndImagePreview(url); }
        else { setRefImage(file); setRefImagePreview(url); }
    };

    const handleGenerate = async () => {
        if (!isLoggedIn) {
            toast.error("Vui lòng đăng nhập để tạo video!");
            loginGoogle();
            return;
        }

        if (!prompt && !startImage && !refImage) {
            toast.error("Vui lòng nhập mô tả hoặc tải lên ảnh!");
            return;
        }

        if (!activeModel) return;

        setIsGenerating(true);
        setGenerationStatus('UPLOADING');
        setResultVideo(null);
        setProgress(10);

        // Start Timer
        const startTimestamp = Date.now();

        try {
            let startImageId, endImageId, refImageId;

            // Helper to get elapsed time string
            const getElapsed = () => `(${((Date.now() - startTimestamp) / 1000).toFixed(0)}s)`;

            // 1. Upload Images (Credentials injected server-side)
            if (startImage) {
                setGenerationStatus(`UPLOADING START IMAGE... ${getElapsed()}`);
                startImageId = await uploadImageToGommo(startImage);
                console.log("Start Image ID:", startImageId);
            }
            if (endImage) {
                setGenerationStatus(`UPLOADING END IMAGE... ${getElapsed()}`);
                endImageId = await uploadImageToGommo(endImage);
                console.log("End Image ID:", endImageId);
            }
            if (refImage) {
                setGenerationStatus(`UPLOADING REF IMAGE... ${getElapsed()}`);
                refImageId = await uploadImageToGommo(refImage);
                console.log("Ref Image ID:", refImageId);
            }

            setProgress(30);
            setGenerationStatus(`STARTING GENERATION... ${getElapsed()}`);

            // 2. Create Video (Credentials injected server-side)
            const processId = await createVideo({
                model: activeModel.model,
                prompt: prompt,
                ratio: settings.ratio,
                resolution: settings.resolution,
                duration: settings.duration,
                mode: settings.mode,
                privacy: settings.privacy,
                image_start: startImageId,
                image_end: endImageId,
                image_ref: refImageId,
                quantity: settings.copies
            });

            if (!processId) throw new Error("No process ID returned");

            setProgress(40);
            setGenerationStatus(`PROCESSING... ${getElapsed()}`);

            // 3. Poll Status
            let successRetryCount = 0;
            const MAX_SUCCESS_RETRIES = 10; // retry up to 10 times (30s) if URL missing after success

            const pollInterval = setInterval(async () => {
                const currentElapsed = getElapsed();
                try {
                    const statusRes = await checkVideoStatus(processId);
                    console.log('Poll Status:', statusRes);

                    const status = statusRes.status;

                    if (status === 'MEDIA_GENERATION_STATUS_SUCCESSFUL' || status === 'SUCCESS') {
                        // Check for download URL
                        if (statusRes.output?.download_url) {
                            clearInterval(pollInterval);
                            const totalTime = ((Date.now() - startTimestamp) / 1000).toFixed(1);

                            setProgress(100);
                            setGenerationStatus(`HOÀN THÀNH (${totalTime}s)`);

                            setResultVideo(statusRes.output.download_url);
                            toast.success(`Tạo thành công trong ${totalTime}s!`);
                            console.log(`Video generation finished in ${totalTime}s`);

                            setIsGenerating(false);
                        } else {
                            // If Success but no URL, wait more
                            successRetryCount++;
                            if (successRetryCount >= MAX_SUCCESS_RETRIES) {
                                clearInterval(pollInterval);
                                setGenerationStatus('HOÀN THÀNH (LỖI URL)');
                                toast.error("Video đã tạo xong nhưng không lấy được link. Vui lòng thử lại sau.");
                                setIsGenerating(false);
                            } else {
                                setGenerationStatus(`ĐANG LẤY LINK VIDEO (${successRetryCount}/${MAX_SUCCESS_RETRIES})... ${currentElapsed}`);
                                setProgress(99);
                                console.log(`Success but no URL, retrying ${successRetryCount}...`);
                            }
                        }
                    } else if (status === 'MEDIA_GENERATION_STATUS_FAILED' || status === 'FAILED' || status === 'ERROR') {
                        clearInterval(pollInterval);
                        setIsGenerating(false);
                        setGenerationStatus('THẤT BẠI');
                        const errMsg = statusRes.error || (statusRes as any).message || 'Lỗi không xác định';
                        toast.error(`Tạo thất bại: ${errMsg}`);
                    } else if (status === 'MEDIA_GENERATION_STATUS_PENDING' || status === 'PENDING') {
                        setGenerationStatus(`ĐANG CHỜ XỬ LÝ (PENDING)... ${currentElapsed}`);
                        setProgress(prev => (prev < 30 ? prev + 5 : 30));
                        successRetryCount = 0;
                    } else if (status === 'MEDIA_GENERATION_STATUS_ACTIVE' || status === 'ACTIVE') {
                        setGenerationStatus(`ĐANG KÍCH HOẠT (ACTIVE)... ${currentElapsed}`);
                        setProgress(prev => (prev < 50 ? prev + 2 : 50));
                        successRetryCount = 0;
                    } else if (status === 'MEDIA_GENERATION_STATUS_PROCESSING' || status === 'PROCESSING') {
                        setGenerationStatus(`ĐANG XỬ LÝ (PROCESSING)... ${currentElapsed}`);
                        // Slowly increase up to 95%
                        setProgress(prev => (prev < 95 ? prev + 1 : 95));
                        successRetryCount = 0;
                    } else {
                        // Unknown status
                        setGenerationStatus(`ĐANG TẠO (${status})... ${currentElapsed}`);
                        setProgress(prev => (prev < 90 ? prev + 1 : 90));
                        successRetryCount = 0;
                    }
                } catch (err) {
                    console.error("Poll error:", err);
                    // Don't clear interval immediately on network error
                }
            }, 3000); // Check every 3s

        } catch (error: any) {
            console.error("Generation failed:", error);
            toast.error(error.message || "Có lỗi xảy ra khi tạo video.");
            setIsGenerating(false);
        }
    };

    if (isLoadingModels) {
        return (
            <div className="flex w-full min-h-screen bg-[#09090b] text-white items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-[#38BDF8] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-sm">Đang tải danh sách model...</p>
                </div>
            </div>
        );
    }

    // Safety check if no models loaded
    if (!models || models.length === 0) return (
        <div className="flex w-full min-h-screen bg-[#09090b] text-white items-center justify-center p-6">
            <div className="text-center">
                <p className="text-xl font-bold mb-2">Không tải được model</p>
                <p className="text-gray-400">Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.</p>
            </div>
        </div>
    );

    if (!activeModel) return null;

    const renderUploadButton = (
        preview: string | null,
        onClick: () => void,
        label: string
    ) => (
        <div className="relative group">
            <button
                onClick={onClick}
                className="w-24 h-24 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-gray-500 hover:bg-gray-800 transition-all group overflow-hidden relative"
            >
                {preview ? (
                    <img src={preview} alt={label} className="w-full h-full object-cover" />
                ) : (
                    <>
                        <div className="w-8 h-8 rounded-full bg-gray-800 group-hover:bg-gray-700 flex items-center justify-center mb-1">
                            <span className="text-xl leading-none">+</span>
                        </div>
                        <span className="text-[10px] font-medium uppercase">{label}</span>
                    </>
                )}
            </button>
        </div>
    );

    return (
        <div className="flex flex-col w-full min-h-screen bg-[#09090b] text-white p-4 mt-20 md:mt-0 md:p-6 font-sans">
            {/* Header / Model Selector */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1F3746] rounded-full text-[#38BDF8] text-sm font-bold border border-[#38BDF8]/30">
                    <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse"></span>
                    VIDEO
                </div>

                <div className="relative group">
                    <select
                        value={selectedModelId}
                        onChange={(e) => setSelectedModelId(e.target.value)}
                        className="appearance-none bg-[#2A2A35] text-white pl-4 pr-10 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 focus:outline-none focus:border-[#FF6B2C] text-sm font-medium transition-colors cursor-pointer"
                    >
                        {models.map(model => (
                            <option key={model.id} value={model.id}>
                                {model.name} {model.isHot ? '🔥' : ''}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>

                {/* Quick Settings Bar */}
                {activeModel.ratios && activeModel.ratios.length > 0 && (
                    <div className="flex items-center gap-2 bg-[#18181B] px-3 py-1.5 rounded-lg border border-gray-800">
                        <RulerIcon className="w-4 h-4 text-gray-400" />
                        <select
                            value={settings.ratio}
                            onChange={(e) => handleSettingChange('ratio', e.target.value)}
                            className="bg-transparent text-sm text-gray-200 outline-none w-24 cursor-pointer"
                        >
                            {activeModel.ratios.map(r => (
                                <option key={r.type} value={r.type}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {activeModel.resolutions && activeModel.resolutions.length > 0 && (
                    <div className="flex items-center gap-2 bg-[#18181B] px-3 py-1.5 rounded-lg border border-gray-800">
                        <span className="text-xs text-gray-500 font-bold">HD</span>
                        <select
                            value={settings.resolution}
                            onChange={(e) => handleSettingChange('resolution', e.target.value)}
                            className="bg-transparent text-sm text-gray-200 outline-none w-20 cursor-pointer"
                        >
                            {activeModel.resolutions.map(r => (
                                <option key={r.type} value={r.type}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                {activeModel.durations && activeModel.durations.length > 0 && (
                    <div className="flex items-center gap-2 bg-[#18181B] px-3 py-1.5 rounded-lg border border-gray-800">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <select
                            value={settings.duration}
                            onChange={(e) => handleSettingChange('duration', e.target.value)}
                            className="bg-transparent text-sm text-gray-200 outline-none w-16 cursor-pointer"
                        >
                            {activeModel.durations.map(d => (
                                <option key={d.type} value={d.type}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                {activeModel.modes && activeModel.modes.length > 0 && (
                    <div className="flex items-center gap-2 bg-[#18181B] px-3 py-1.5 rounded-lg border border-gray-800">
                        <SettingsIcon className="w-4 h-4 text-gray-400" />
                        <select
                            value={settings.mode}
                            onChange={(e) => handleSettingChange('mode', e.target.value)}
                            className="bg-transparent text-sm text-gray-200 outline-none w-24 cursor-pointer"
                        >
                            {activeModel.modes.map(m => (
                                <option key={m.type} value={m.type}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex items-center gap-2 bg-[#18181B] px-3 py-1.5 rounded-lg border border-gray-800 ml-auto">
                    <span className="text-xs text-gray-400">Qty:</span>
                    <select
                        value={settings.copies}
                        onChange={(e) => handleSettingChange('copies', Number(e.target.value))}
                        className="bg-transparent text-sm text-gray-200 outline-none w-10 cursor-pointer"
                    >
                        <option value={1}>1</option>
                    </select>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Left: Inputs */}
                <div className="flex-1 flex flex-col gap-4">

                    {/* Image Upload Area */}
                    <div className="bg-[#18181B]/50 border border-gray-800 rounded-xl p-4">
                        <div className="flex gap-4">
                            {/* Start/End Frames Group */}
                            {(activeModel.startImage || activeModel.startImageAndEnd) && (
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                        Khung hình
                                    </span>
                                    <div className="flex gap-3">
                                        {activeModel.startImage && (
                                            <>
                                                <input type="file" ref={fileInputRefStart} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'start')} />
                                                {renderUploadButton(
                                                    startImagePreview,
                                                    () => fileInputRefStart.current?.click(),
                                                    'Start'
                                                )}
                                            </>
                                        )}
                                        {activeModel.startImageAndEnd && (
                                            <>
                                                <input type="file" ref={fileInputRefEnd} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'end')} />
                                                {renderUploadButton(
                                                    endImagePreview,
                                                    () => fileInputRefEnd.current?.click(),
                                                    'End'
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Reference Images Group */}
                            {activeModel.withReference && (
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                        Tham chiếu
                                    </span>
                                    <div className="flex gap-3">
                                        <input type="file" ref={fileInputRefRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'ref')} />
                                        {renderUploadButton(
                                            refImagePreview,
                                            () => fileInputRefRef.current?.click(),
                                            'Ref'
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Advanced Settings Toggle */}
                    <div className="bg-[#18181B]/50 border border-gray-800 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full flex items-center justify-between p-4 bg-[#1F1F23] hover:bg-[#27272E] transition-colors"
                        >
                            <div className="flex items-center gap-2 text-[#38BDF8] font-semibold text-sm">
                                <SettingsIcon className="w-4 h-4" />
                                Cài đặt nâng cao
                            </div>
                            <svg
                                className={`w-4 h-4 text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            >
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </button>

                        <AnimatePresence>
                            {showAdvanced && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-gray-800 "
                                >
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Số lượng</label>
                                            <div className="flex items-center bg-black rounded-lg border border-gray-800 h-[34px]">
                                                <button className="w-10 h-full flex items-center justify-center text-gray-400 hover:text-white active:bg-gray-800 rounded-l-lg" onClick={() => handleSettingChange('copies', Math.max(1, settings.copies - 1))}>-</button>
                                                <div className="flex-1 flex items-center justify-center font-bold text-sm">{settings.copies}</div>
                                                <button className="w-10 h-full flex items-center justify-center text-gray-400 hover:text-white active:bg-gray-800 rounded-r-lg" onClick={() => handleSettingChange('copies', settings.copies + 1)}>+</button>
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-1 italic">Số bản sao tạo cùng lúc</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Prompt Input */}
                    <div className="relative bg-[#18181B]/80 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3 focus-within:border-[#FF6B2C] focus-within:ring-1 focus-within:ring-[#FF6B2C]/50 transition-all shadow-xl">
                        {/* URL Input */}
                        <div className="flex items-center gap-2 bg-[#27272E] px-3 py-2 rounded-lg border border-gray-700/50">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Dán URL video từ TikTok, YouTube, Instagram..."
                                className="bg-transparent text-sm w-full outline-none text-gray-300 placeholder-gray-500"
                            />
                        </div>
                        <p className="text-[10px] text-yellow-500/80 flex items-center gap-1.5 px-1">
                            <span className="text-yellow-400">💡</span>
                            Remix là tạo nội dung mới dựa trên video có sẵn, không phải copy hoàn toàn.
                        </p>

                        {/* TextArea */}
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Mô tả video bạn muốn tạo..."
                            className="w-full h-32 bg-transparent text-lg text-white placeholder-gray-600 outline-none resize-none pt-2"
                        ></textarea>

                        {/* Action Bar */}
                        <div className="flex items-center justify-between border-t border-gray-800/50 pt-3 mt-2">
                            <div className="flex items-center gap-3">
                                <button className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                                    <SparklesIcon className="w-5 h-5" />
                                </button>
                                <button className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                                    <SettingsIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F1F23] rounded-full border border-orange-500/20 text-orange-400 text-xs font-bold">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>
                                    {activeModel.price}
                                </div>
                                <button className="p-2.5 rounded-full bg-[#27272E] text-white hover:bg-gray-700 transition-colors">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className={`w-10 h-10 !p-2 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 ${isGenerating ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#38BDF8] text-black shadow-[#38BDF8]/25 hover:bg-[#0EA5E9]'}`}
                                >
                                    {isGenerating ? (
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Preview / Result */}
                <div className="block w-full md:w-[350px] bg-[#18181B]/30 border border-gray-800 rounded-xl p-4 flex items-center justify-center text-gray-600 relative overflow-hidden">
                    {isGenerating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 gap-4">
                            <div className="w-16 h-16 border-4 border-[#38BDF8] border-t-transparent rounded-full animate-spin"></div>
                            <div className="text-[#38BDF8] font-bold text-center">
                                <p className="text-lg">{generationStatus}</p>
                                <p className="text-sm text-gray-400">{progress}%</p>
                            </div>
                        </div>
                    )}

                    {resultVideo ? (
                        <div className="w-full h-full flex flex-col gap-2">
                            <video controls className="w-full h-auto rounded-lg shadow-lg" src={resultVideo} />
                            <a
                                href={resultVideo}
                                download
                                target="_blank"
                                className="w-full py-2 bg-[#FF6B2C] text-white font-bold rounded-lg text-center hover:bg-[#ff8f5e] transition-colors"
                            >
                                Tải Video
                            </a>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-800 mb-4 mx-auto flex items-center justify-center text-gray-600">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                            </div>
                            <p className="text-sm">Kết quả sẽ hiển thị ở đây</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
