import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { executeAppTask, pollUntilComplete, type VideoAppConfig } from '@/services/kieService';
import ActionablePolaroidCard from '../ActionablePolaroidCard';

interface DynamicAppDetailProps {
    app: VideoAppConfig;
    onBack: () => void;
}

export function DynamicAppDetail({ app, onBack }: DynamicAppDetailProps) {
    const [inputs, setInputs] = useState<Record<string, any>>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState('');
    const [progress, setProgress] = useState(0);
    const [resultVideo, setResultVideo] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setStatus('Preparing...');
        setProgress(10);
        setResultVideo(null);

        const startTime = Date.now();

        try {
            const processedInputs: Record<string, any> = { ...inputs };

            // Upload images to R2 if they are base64 data URLs
            for (const key in processedInputs) {
                const value = processedInputs[key];
                // Check if value is a base64 data URL
                if (typeof value === 'string' && value.startsWith('data:image/')) {
                    console.log(`[DynamicAppDetail] Uploading ${key} to R2...`);
                    setStatus(`Uploading image to R2...`);

                    try {
                        const uploadResponse = await fetch('/api/proxy/image/upload-base64', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ base64Data: value }),
                        });

                        if (!uploadResponse.ok) {
                            throw new Error(`Failed to upload ${key} to R2`);
                        }

                        const { url: r2Url } = await uploadResponse.json();
                        console.log(`[DynamicAppDetail] Uploaded ${key} to R2:`, r2Url);
                        processedInputs[key] = r2Url; // Replace base64 with R2 URL
                    } catch (uploadError) {
                        console.error(`[DynamicAppDetail] Error uploading ${key}:`, uploadError);
                        throw new Error(`Failed to upload image: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
                    }
                }
            }

            setStatus('Creating Task...');
            setProgress(30);

            const taskId = await executeAppTask(app, processedInputs);
            console.log('Task Created:', taskId);

            const videoUrl = await pollUntilComplete(
                taskId,
                (s) => {
                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
                    if (s.status === 'processing') {
                        setStatus(`Processing... (${elapsed}s)`);
                        setProgress(Math.min(95, 40 + parseInt(elapsed)));
                    } else {
                        setStatus(`Waiting... (${elapsed}s)`);
                    }
                }
            );

            setResultVideo(videoUrl);
            setStatus('Completed!');
            setProgress(100);
            toast.success('Video created successfully!');

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Generation failed');
            setStatus('Failed');
        } finally {
            setIsGenerating(false);
        }
    };

    const isFormValid = app.input_schema.every(field => {
        if (field.required && !inputs[field.id]) return false;
        return true;
    });

    return (
        <div className="w-full max-w-7xl mx-auto animate-fade-in">
            <div className="flex items-center gap-6 mb-8 pb-6 border-b border-zinc-800">
                <button
                    onClick={onBack}
                    className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-orange-500 rounded-xl transition-all group"
                >
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300">
                        {app.name}
                    </h2>
                    <p className="text-gray-400 mt-1">{app.description}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-orange-400 mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Input Details
                        </h3>

                        <div className="space-y-5">
                            {app.input_schema.map((field) => (
                                <div key={field.id}>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                                        {field.label} {field.required && <span className="text-orange-500">*</span>}
                                    </label>

                                    {field.type === 'textarea' && (
                                        <textarea
                                            className="w-full bg-black border border-zinc-700 focus:border-orange-500 rounded-xl p-4 text-white placeholder-gray-600 outline-none min-h-[120px] transition-colors"
                                            placeholder={field.placeholder}
                                            value={inputs[field.id] || ''}
                                            onChange={(e) => setInputs({ ...inputs, [field.id]: e.target.value })}
                                        />
                                    )}

                                    {field.type === 'text' && (
                                        <input
                                            type="text"
                                            className="w-full bg-black border border-zinc-700 focus:border-orange-500 rounded-xl p-4 text-white placeholder-gray-600 outline-none transition-colors"
                                            placeholder={field.placeholder}
                                            value={inputs[field.id] || ''}
                                            onChange={(e) => setInputs({ ...inputs, [field.id]: e.target.value })}
                                        />
                                    )}

                                    {field.type === 'image' && (
                                        <div className="border-2 border-dashed border-zinc-700 hover:border-orange-500 rounded-xl p-4 transition-colors">
                                            <ActionablePolaroidCard
                                                type="uploader"
                                                caption={field.label}
                                                status="done"
                                                mediaUrl={inputs[field.id] || undefined}
                                                placeholderType="magic"
                                                uploadLabel={field.label}
                                                onImageChange={(url) => {
                                                    if (url) {
                                                        setInputs({ ...inputs, [field.id]: url });
                                                    } else {
                                                        const newInputs = { ...inputs };
                                                        delete newInputs[field.id];
                                                        setInputs(newInputs);
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}

                                    {field.type === 'audio' && (
                                        <div className="border-2 border-dashed border-zinc-700 hover:border-orange-500 rounded-xl p-6 text-center transition-colors">
                                            {inputs[field.id] ? (
                                                <div>
                                                    <audio controls src={inputs[field.id]} className="w-full mb-3" />
                                                    <button
                                                        onClick={() => {
                                                            const newInputs = { ...inputs };
                                                            delete newInputs[field.id];
                                                            setInputs(newInputs);
                                                        }}
                                                        className="text-xs text-orange-400 hover:text-orange-300 font-semibold"
                                                    >
                                                        ❌ Remove Audio
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <input
                                                        type="file"
                                                        accept="audio/*"
                                                        className="hidden"
                                                        id={`audio-${field.id}`}
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;

                                                            const reader = new FileReader();
                                                            reader.onload = async () => {
                                                                const base64 = reader.result as string;
                                                                toast.loading('Uploading audio...');
                                                                const res = await fetch('/api/upload', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ image: base64, contentType: file.type }),
                                                                });
                                                                toast.dismiss();
                                                                if (res.ok) {
                                                                    const data = await res.json();
                                                                    setInputs({ ...inputs, [field.id]: data.url });
                                                                    toast.success('Audio uploaded!');
                                                                } else {
                                                                    toast.error('Upload failed');
                                                                }
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={`audio-${field.id}`}
                                                        className="cursor-pointer text-gray-400 hover:text-orange-400 transition-colors"
                                                    >
                                                        <span className="text-3xl block mb-2">🎵</span>
                                                        <span className="text-sm font-semibold">Click to Upload Audio</span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !isFormValid}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${isGenerating || !isFormValid
                            ? 'bg-zinc-800 text-gray-600 cursor-not-allowed border border-zinc-700'
                            : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30'
                            }`}
                    >
                        {isGenerating ? (
                            <span className="flex items-center justify-center gap-3">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating... {progress}%
                            </span>
                        ) : 'Generate Video'}
                    </button>

                    {status && (
                        <div className="text-center">
                            <p className="text-sm text-gray-400 bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-4">
                                {status}
                            </p>
                        </div>
                    )}
                </div>

                <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[600px]">
                    {isGenerating ? (
                        /* Loading State */
                        <div className="w-full space-y-6 flex flex-col items-center">
                            <h3 className="text-lg font-bold text-orange-400 mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Creating Your Video
                            </h3>

                            {/* Loading Spinner */}
                            <div className="relative">
                                <div className="w-24 h-24 border-4 border-orange-500/20 border-t-orange-500 border-r-orange-400 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Status Text */}
                            <div className="text-center space-y-2">
                                <div className="text-orange-400 font-bold text-xl">
                                    {status}
                                </div>
                                <div className="text-gray-400 text-sm max-w-md">
                                    Quá trình tạo video có thể mất 1-3 phút. Vui lòng giữ tab này mở.
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full max-w-md space-y-2">
                                <div className="bg-zinc-800 rounded-full h-3 overflow-hidden shadow-inner">
                                    <div
                                        className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 h-full transition-all duration-500 ease-out bg-[length:200%_100%] animate-[shimmer_2s_infinite]"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">{progress}% hoàn thành</span>
                                    <span className="text-orange-400 font-mono">{status.match(/\d+s/) || ''}</span>
                                </div>
                            </div>
                        </div>
                    ) : resultVideo ? (
                        <div className="w-full space-y-4">
                            <h3 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Your Video
                            </h3>
                            <video controls src={resultVideo} className="w-full rounded-xl shadow-2xl border border-zinc-700" autoPlay loop />
                            <a
                                href={resultVideo}
                                download
                                target="_blank"
                                className="block w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-center rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/20"
                            >
                                Download Video
                            </a>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-24 h-24 mx-auto mb-6 bg-zinc-800 rounded-2xl flex items-center justify-center">
                                <svg className="w-12 h-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-bold text-gray-500 mb-2">Preview Area</h4>
                            <p className="text-gray-600 text-sm">Your generated video will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
