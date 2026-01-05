/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useCallback } from 'react';
import { useAppControls } from './uiContexts';
// FIX: Changed startVideoGenerationFromImage to startVideoGeneration and imported parseDataUrl.
import { startVideoGeneration, pollVideoOperation, parseDataUrl } from '../services/geminiService';
import { type VideoTask } from './uiTypes';

/**
 * Custom hook to track media query status.
 * @param query The media query string (e.g., '(max-width: 768px)').
 * @returns boolean indicating if the query matches.
 */
export const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [matches, query]);
    return matches;
};

/**
 * Custom hook to manage the state and actions for the Lightbox component.
 * @returns An object with the lightbox's current index and functions to control it.
 */
export const useLightbox = () => {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const openLightbox = useCallback((index: number) => {
        setLightboxIndex(index);
    }, []);

    const closeLightbox = useCallback(() => {
        setLightboxIndex(null);
    }, []);

    const navigateLightbox = useCallback((newIndex: number) => {
        setLightboxIndex(newIndex);
    }, []);

    return {
        lightboxIndex,
        openLightbox,
        closeLightbox,
        navigateLightbox,
    };
};

// --- NEW: Debounce Hook ---
/**
 * Custom hook to debounce a value.
 * @param value The value to debounce.
 * @param delay The delay in milliseconds.
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}


// --- NEW: Video Generation Hook ---

export const useVideoGeneration = () => {
    const { addImagesToGallery } = useAppControls();
    const [videoTasks, setVideoTasks] = useState<Record<string, VideoTask>>({});

    const generateVideo = useCallback(async (sourceUrl: string, prompt: string) => {
        const finalPrompt = prompt.trim() || "Animate this image, bringing it to life with subtle, cinematic motion.";
        console.log('[generateVideo] Starting video generation with prompt:', finalPrompt);
        console.log('[generateVideo] Source URL:', sourceUrl);

        setVideoTasks(prev => ({ ...prev, [sourceUrl]: { status: 'pending' } }));

        try {
            let image: { mimeType: string; data: string };

            // Check if sourceUrl is a data URL or HTTP URL
            if (sourceUrl.startsWith('data:')) {
                console.log('[generateVideo] Processing data URL');
                image = parseDataUrl(sourceUrl);
            } else if (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://')) {
                console.log('[generateVideo] Processing HTTP URL - fetching image');
                // Fetch the image and convert to base64
                const response = await fetch(sourceUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch image: ${response.statusText}`);
                }
                const blob = await response.blob();
                const mimeType = blob.type || 'image/jpeg';

                // Convert blob to base64
                const base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const result = reader.result as string;
                        // Extract base64 data from data URL
                        const base64 = result.split(',')[1];
                        resolve(base64);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });

                image = { mimeType, data: base64Data };
                console.log('[generateVideo] Image converted to base64, mimeType:', mimeType);
            } else {
                throw new Error('Invalid image URL format. Expected data URL or HTTP(S) URL.');
            }

            console.log('[generateVideo] Calling startVideoGeneration');
            const op = await startVideoGeneration(finalPrompt, image);
            console.log('[generateVideo] Video generation started successfully');
            setVideoTasks(prev => ({ ...prev, [sourceUrl]: { status: 'pending', operation: op } }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            console.error('[generateVideo] Error:', errorMessage);

            // Import toast dynamically to show error to user
            import('react-hot-toast').then(({ default: toast }) => {
                toast.error(`Lỗi tạo video: ${errorMessage}`, {
                    duration: 5000,
                    position: 'bottom-right'
                });
            });

            setVideoTasks(prev => ({ ...prev, [sourceUrl]: { status: 'error', error: errorMessage } }));
        }
    }, [addImagesToGallery]);

    useEffect(() => {
        const tasksToPoll = Object.entries(videoTasks).filter(([, task]) => (task as VideoTask).status === 'pending' && (task as VideoTask).operation);
        if (tasksToPoll.length === 0) return;

        let isCancelled = false;

        const poll = async () => {
            if (isCancelled) return;

            const newTasks = { ...videoTasks };
            let tasksUpdated = false;

            await Promise.all(tasksToPoll.map(async ([sourceUrl, task]) => {
                const typedTask = task as VideoTask;
                if (!typedTask.operation) return;
                try {
                    const updatedOp = await pollVideoOperation(typedTask.operation);
                    if (isCancelled) return;

                    if (updatedOp.done) {
                        if (updatedOp.response?.generatedVideos?.[0]?.video?.uri) {
                            const downloadLink = updatedOp.response.generatedVideos[0].video.uri;
                            const response = await fetch(`${downloadLink}&key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`);
                            if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
                            const blob = await response.blob();
                            const blobUrl = URL.createObjectURL(blob);
                            newTasks[sourceUrl] = { status: 'done', resultUrl: blobUrl };
                            addImagesToGallery([blobUrl]);
                        } else {
                            throw new Error(updatedOp.error?.message || "Video generation finished but no URI was found.");
                        }
                    } else {
                        // FIX: Replaced spread operator with Object.assign for type safety, as `typedTask` could potentially not be an object, causing a runtime error.
                        newTasks[sourceUrl] = Object.assign({}, typedTask, { operation: updatedOp });
                    }
                    tasksUpdated = true;
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                    newTasks[sourceUrl] = { status: 'error', error: errorMessage };
                    tasksUpdated = true;
                }
            }));

            if (!isCancelled && tasksUpdated) {
                setVideoTasks(newTasks);
            }

            const stillPending = Object.values(newTasks).some(t => (t as VideoTask).status === 'pending');
            if (!isCancelled && stillPending) {
                setTimeout(poll, 10000);
            }
        };

        const timeoutId = setTimeout(poll, 5000);

        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [videoTasks, addImagesToGallery]);

    return { videoTasks, generateVideo };
};