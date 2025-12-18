/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface InlineCanvasEditorProps {
    imageUrl: string;
    onMaskSave: (maskedImageUrl: string) => void;
}

type Tool = 'brush' | 'eraser';

export const InlineCanvasEditor: React.FC<InlineCanvasEditorProps> = ({ imageUrl, onMaskSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [tool, setTool] = useState<Tool>('brush');
    const [brushSize, setBrushSize] = useState(20);
    const [isDrawing, setIsDrawing] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const imageRef = useRef<HTMLImageElement | null>(null);

    // Load image onto canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw image
            ctx.drawImage(img, 0, 0);
            imageRef.current = img;
            setImageLoaded(true);
        };
        img.src = imageUrl;
    }, [imageUrl]);

    const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }, []);

    const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const point = getCanvasPoint(e);
        if (!point) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
    }, [getCanvasPoint]);

    const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const point = getCanvasPoint(e);
        if (!point) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (tool === 'brush') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)'; // Red with transparency
        } else {
            ctx.globalCompositeOperation = 'destination-out'; // Erase mode
        }

        ctx.lineTo(point.x, point.y);
        ctx.stroke();
    }, [isDrawing, tool, brushSize, getCanvasPoint]);

    const stopDrawing = useCallback(() => {
        setIsDrawing(false);

        // Auto-save on stop drawing
        const canvas = canvasRef.current;
        if (!canvas) return;

        const maskedImageUrl = canvas.toDataURL('image/png');
        onMaskSave(maskedImageUrl);
    }, [onMaskSave]);

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const img = imageRef.current;

        if (!ctx || !canvas || !img) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Save cleared state
        const maskedImageUrl = canvas.toDataURL('image/png');
        onMaskSave(maskedImageUrl);
    }, [onMaskSave]);

    return (
        <motion.div
            className="w-full max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Canvas */}
            <div className="relative mb-4 rounded-lg overflow-hidden border-2 border-neutral-700">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full h-auto cursor-crosshair bg-neutral-900"
                    style={{ display: imageLoaded ? 'block' : 'none' }}
                />
                {!imageLoaded && (
                    <div className="w-full h-64 flex items-center justify-center bg-neutral-900">
                        <p className="text-neutral-500">Đang tải ảnh...</p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-black/20 p-4 rounded-lg border border-white/10 space-y-4">
                <p className="text-neutral-300 text-sm text-center mb-3">
                    Sử dụng cọ vẽ để tô đỏ đối tượng bạn muốn xóa
                </p>

                {/* Tool Buttons */}
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => setTool('brush')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${tool === 'brush'
                                ? 'bg-yellow-400 text-black'
                                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                            }`}
                    >
                        🖌️ Cọ vẽ
                    </button>
                    <button
                        onClick={() => setTool('eraser')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${tool === 'eraser'
                                ? 'bg-yellow-400 text-black'
                                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                            }`}
                    >
                        🧹 Cục tẩy
                    </button>
                </div>

                {/* Brush Size Slider */}
                <div>
                    <label className="block text-neutral-300 text-sm mb-2">
                        Kích thước cọ: <span className="text-yellow-400 font-semibold">{brushSize}px</span>
                    </label>
                    <input
                        type="range"
                        min="5"
                        max="50"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                    />
                </div>

                {/* Clear Button */}
                <div className="flex justify-center pt-2">
                    <button
                        onClick={clearCanvas}
                        className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all font-medium"
                    >
                        🗑️ Xóa tất cả
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default InlineCanvasEditor;
