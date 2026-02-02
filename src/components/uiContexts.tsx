/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
    type ImageToEdit, type ViewState, type AnyAppState, type Theme,
    type AppConfig, THEMES, getInitialStateForApp, type Settings,
    type GenerationHistoryEntry, type ModelVersion, type ImageResolution,
    type AppControlContextType
} from './uiTypes';
import * as db from '../lib/db';
import * as storageService from '../services/storageService';
import { createThumbnailDataUrl } from './uiFileUtilities';
import { useAuth } from '../contexts/AuthContext';

// --- Auth Context Removed (Moved to contexts/AuthContext.tsx) ---

// --- Image Editor Hook & Context ---
interface ImageEditorContextType {
    imageToEdit: ImageToEdit | null;
    openImageEditor: (url: string, onSave: (newUrl: string) => void) => void;
    openEmptyImageEditor: (onSave: (newUrl: string) => void) => void;
    closeImageEditor: () => void;
}

const ImageEditorContext = createContext<ImageEditorContextType | undefined>(undefined);

export const ImageEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [imageToEdit, setImageToEdit] = useState<ImageToEdit | null>(null);

    const openImageEditor = useCallback((url: string, onSave: (newUrl: string) => void) => {
        if (window.innerWidth < 768) {
            alert("Chức năng chỉnh sửa ảnh không khả dụng trên thiết bị di động.");
            return;
        }
        if (!url) {
            console.error("openImageEditor called with no URL.");
            return;
        }
        setImageToEdit({ url, onSave });
    }, []);

    const openEmptyImageEditor = useCallback((onSave: (newUrl: string) => void) => {
        if (window.innerWidth < 768) {
            alert("Chức năng chỉnh sửa ảnh không khả dụng trên thiết bị di động.");
            return;
        }
        setImageToEdit({ url: null, onSave });
    }, []);

    const closeImageEditor = useCallback(() => {
        setImageToEdit(null);
    }, []);

    const value = { imageToEdit, openImageEditor, openEmptyImageEditor, closeImageEditor };

    return (
        <ImageEditorContext.Provider value={value}>
            {children}
        </ImageEditorContext.Provider>
    );
};

export const useImageEditor = (): ImageEditorContextType => {
    const context = useContext(ImageEditorContext);
    if (context === undefined) {
        throw new Error('useImageEditor must be used within an ImageEditorProvider');
    }
    return context;
};

// --- App Control Context ---


export const AppControlContext = createContext<AppControlContextType | undefined>(undefined);

export const AppControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoggedIn, token, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [viewHistory, setViewHistory] = useState<ViewState[]>([{ viewId: 'overview', state: { stage: 'home' } }]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Initialize with defaults for SSR safety
    const [theme, setTheme] = useState<Theme>('minimalist-dark');
    const [language, setLanguage] = useState<'vi' | 'en'>('vi');

    // Hydrate theme and language on client mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('app-theme') as Theme;
            if (savedTheme && THEMES.includes(savedTheme)) {
                setTheme(savedTheme);
            }

            const savedLang = localStorage.getItem('app-language') as 'vi' | 'en';
            if (savedLang) {
                setLanguage(savedLang);
            }
        }
    }, []);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    const [isExtraToolsOpen, setIsExtraToolsOpen] = useState(false);
    const [isImageLayoutModalOpen, setIsImageLayoutModalOpen] = useState(false);
    const [isBeforeAfterModalOpen, setIsBeforeAfterModalOpen] = useState(false);
    const [isAppCoverCreatorModalOpen, setIsAppCoverCreatorModalOpen] = useState(false);
    const [isStoryboardingModalMounted, setIsStoryboardingModalMounted] = useState(false);
    const [isStoryboardingModalVisible, setIsStoryboardingModalVisible] = useState(false);
    const [isLayerComposerMounted, setIsLayerComposerMounted] = useState(false);
    const [isLayerComposerVisible, setIsLayerComposerVisible] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); // NEW
    const [isOutOfCreditsModalOpen, setIsOutOfCreditsModalOpen] = useState(false); // NEW
    const [imageGallery, setImageGallery] = useState<string[]>([]);
    const [generationHistory, setGenerationHistory] = useState<GenerationHistoryEntry[]>([]);
    const [isDbLoaded, setIsDbLoaded] = useState(false);

    // Old declaration removed

    const [translations, setTranslations] = useState<Record<string, any>>({});
    const [settings, setSettings] = useState<Settings | null>(null);

    const [modelVersion, setModelVersion] = useState<ModelVersion>('v2');
    const [imageResolution, setImageResolution] = useState<ImageResolution>('1K');

    // Usage tracking
    const [v2UsageCount, setV2UsageCount] = useState(0);
    const [v3UsageCount, setV3UsageCount] = useState(0);

    // Guest Identity
    const [guestId, setGuestId] = useState<string>('');
    const [guestCredits, setGuestCredits] = useState<number>(0); // Default to 0
    const [userCredits, setUserCredits] = useState<number>(0); // New user credits
    const [userIp, setUserIp] = useState<string>('');
    const [isIncognito, setIsIncognito] = useState<boolean>(false); // Detect incognito mode

    // Initialize Guest ID and IP
    useEffect(() => {
        // 0. Detect Incognito Mode using Storage Quota
        const detectIncognito = async () => {
            try {
                if ('storage' in navigator && 'estimate' in navigator.storage) {
                    const { quota } = await navigator.storage.estimate();
                    // Incognito mode typically has quota < 120MB
                    const isPrivate = quota !== undefined && quota < 120000000;
                    if (isPrivate) {
                        console.log('🕵️ Incognito mode detected! Quota:', quota);
                        setIsIncognito(true);
                        // Set credits = 0 for incognito users
                        setGuestCredits(0);
                    }
                }
            } catch (e) {
                console.log('Could not detect incognito mode');
            }
        };
        detectIncognito();

        // 1. Initialize stable Guest ID - PRIORITY: localStorage first, then FingerprintJS
        const initGuestId = async () => {
            // Check localStorage FIRST to maintain stability
            const existingGuestId = localStorage.getItem('guest_device_id');

            if (existingGuestId) {
                console.log('🆔 Using existing Guest ID from localStorage:', existingGuestId);
                setGuestId(existingGuestId);
                return; // Exit early - don't regenerate fingerprint
            }

            // Only generate new fingerprint if no existing ID
            try {
                // Dynamic import to avoid SSR issues and reduce initial bundle size
                const FingerprintJS = await import('@fingerprintjs/fingerprintjs');
                const fp = await FingerprintJS.load();
                const result = await fp.get();

                // Use visitorId as the core of our guestId
                const stableGuestId = `guest_${result.visitorId}`;
                console.log('🆔 New Fingerprint Generated:', stableGuestId);

                setGuestId(stableGuestId);
                localStorage.setItem('guest_device_id', stableGuestId);
            } catch (error) {
                console.warn('⚠️ Fingerprint failed, creating random ID:', error);

                // Fallback: Create new random ID
                const randomGuestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                localStorage.setItem('guest_device_id', randomGuestId);
                setGuestId(randomGuestId);
            }
        };

        initGuestId();

        // 2. Fetch IP (Fire and forget) - Keep for logs if needed, but not for credit checks
        fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => setUserIp(data.ip))
            .catch(err => console.warn('Failed to fetch IP', err));
    }, []);

    // DEBUG: Log Guest ID on change (Requested by User)
    useEffect(() => {
        if (!isLoggedIn && guestId) {
            console.log('👀 [DEBUG] Current Guest ID:000000000000000000000000000000000000000000000000000000000', guestId);
        }
    }, [isLoggedIn, guestId]);

    const refreshUsageCounts = useCallback(() => {
        import('../services/gemini/usageTracker').then(({ getUsageCount }) => {
            setV2UsageCount(getUsageCount('v2'));
            setV3UsageCount(getUsageCount('v3'));
        });
    }, []);

    const currentView = viewHistory[historyIndex];

    useEffect(() => {
        const fetchTranslations = async () => {
            const modules = [
                'common',
                'data',
                'home',
                'architectureIdeator',
                'avatarCreator',
                'babyPhotoCreator',
                'beautyCreator',
                'midAutumnCreator',
                'dressTheModel',
                'entrepreneurCreator',
                'freeGeneration',
                'imageInterpolation',
                'imageToReal',
                'mixStyle',
                'photoRestoration',
                'swapStyle',
                'toyModelCreator',
                'idPhotoCreator',
                'khmerPhotoMerge'
            ];
            try {
                const fetchPromises = modules.map(module =>
                    fetch(`/locales/${language}/${module}.json`)
                        .then(res => {
                            if (!res.ok) {
                                console.warn(`Could not fetch ${module}.json for ${language}`);
                                return {}; // Return empty object on failure to not break Promise.all
                            }
                            return res.json();
                        })
                );

                const loadedTranslations = await Promise.all(fetchPromises);

                const mergedTranslations = loadedTranslations.reduce(
                    (acc, current) => ({ ...acc, ...current }),
                    {}
                );
                setTranslations(mergedTranslations);
            } catch (error) {
                console.error(`Could not load translations for ${language}`, error);
            }
        };
        fetchTranslations();
    }, [language]);

    // Effect to initialize DB, migrate, and load data on app start
    useEffect(() => {
        async function loadData() {
            if (isLoggedIn && user) {
                try {
                    // Credits are already fetched by AuthContext and dispatched via 'user-credits-updated' event
                    // No need to call getUserCredits here - listen to the event instead
                    // [REMOVED] User Data is now handled by refreshGallery() exclusively
                    // console.log('[loadData] Skipping getUserCredits (handled by AuthContext)');
                    // const cloudGallery = await storageService.getUserCloudGallery(user.id);
                    // setImageGallery(cloudGallery);
                    const history = await db.getAllHistoryEntries();
                    // RAM OPTIMIZATION: Do not store full Base64 output_images in State
                    const lightHistory = history.map(h => ({ ...h, output_images: undefined }));
                    setGenerationHistory(lightHistory);
                } catch (err: any) {
                    console.error("Failed to load user data:", err);
                    // On error, try to load local data as fallback
                    // const gallery = await db.getAllGalleryImages();
                    // setImageGallery(gallery);
                    // Don't reset credits to 0 on error - keep existing value
                    toast.error('Không thể tải dữ liệu từ server. Sử dụng dữ liệu local.', {
                        duration: 3000,
                        position: 'bottom-right'
                    });
                }
            } else {
                await db.migrateFromLocalStorageToIdb();
                const [localGallery, history] = await Promise.all([
                    db.getAllGalleryImages(),
                    db.getAllHistoryEntries()
                ]);

                // [REMOVED] Guest Cloud Data is now handled by refreshGallery() exclusively
                // This prevents race conditions where guest data overwrites user data
                /*
                // Try to load Cloudinary gallery for guest
                let mergedGallery = localGallery;
                if (guestId) {
                    try {
                        // Check if incognito mode - skip credits for private browsing
                        let isPrivateBrowsing = false;
                        if ('storage' in navigator && 'estimate' in navigator.storage) {
                            const { quota } = await navigator.storage.estimate();
                            isPrivateBrowsing = quota !== undefined && quota < 120000000;
                        }

                        if (isPrivateBrowsing) {
                            console.log('🕵️ Private browsing detected - credits = 0');
                            setGuestCredits(0);
                        } else {
                            const { getGuestCredits } = await import('../services/storageService');
                            const credits = await getGuestCredits(guestId);
                            // DEBUG: Toast to verify
                            // import('react-hot-toast').then(t => t.default.success(`Guest: ${guestId.slice(0,6)}... Credits: ${credits}`));
                            setGuestCredits(credits);
                        }

                        const guestCloudImages = await storageService.getGuestCloudGallery(guestId);
                        if (guestCloudImages.length > 0) {
                            // Merge with local, preferring cloud order but keeping unique local
                            mergedGallery = [...guestCloudImages];
                            localGallery.forEach(url => {
                                if (!mergedGallery.includes(url)) mergedGallery.push(url);
                            });
                        }
                    } catch (e) {
                        console.warn('Failed to load guest cloud data:', e);
                        // Keep default (0) - server will provide correct value on next API call
                        // setGuestCredits(0); // Already initialized to 0
                    }
                }
                
                setImageGallery(mergedGallery);
                */
                // RAM OPTIMIZATION: Strip heavy Base64 data
                const lightHistory = history.map(h => ({ ...h, output_images: undefined }));
                setGenerationHistory(lightHistory);
            }
            setIsDbLoaded(true);
        }
        loadData();
    }, [isLoggedIn, user, guestId]);

    // Listen for logout event to refresh guest credits
    useEffect(() => {
        const handleLogout = async () => {
            console.log('[uiContexts] User logged out, refreshing guest credits...');
            if (guestId) {
                try {
                    const { getGuestCredits } = await import('../services/storageService');
                    const credits = await getGuestCredits(guestId);
                    console.log('[uiContexts] Guest credits refreshed after logout:', credits);
                    setGuestCredits(credits);
                } catch (e) {
                    console.error('[uiContexts] Failed to refresh guest credits after logout:', e);
                    // Don't set fallback - keep current value or 0
                    // Server will provide correct value on retry
                }
            }
        };

        window.addEventListener('user-logged-out', handleLogout);
        return () => window.removeEventListener('user-logged-out', handleLogout);
    }, [guestId]);

    // Listen for credit updates from AuthContext OR baseService (e.g. after payment or generation)
    useEffect(() => {
        const handleCreditsUpdate = (event: CustomEvent) => {
            if (event.detail && typeof event.detail.credits === 'number') {
                console.log('[uiContexts] Received external credit update:', event.detail.credits);
                if (isLoggedIn && user) {
                    setUserCredits(event.detail.credits);
                } else if (guestId) {
                    setGuestCredits(event.detail.credits);
                }
            }
        };

        window.addEventListener('user-credits-updated', handleCreditsUpdate as EventListener);
        return () => window.removeEventListener('user-credits-updated', handleCreditsUpdate as EventListener);
    }, [isLoggedIn, user, guestId]);


    const t = useCallback((key: string, ...args: any[]) => {
        const keys = key.split('.');
        let translation = keys.reduce((obj, keyPart) => {
            if (obj && typeof obj === 'object' && keyPart in obj) {
                return (obj as Record<string, any>)[keyPart];
            }
            return undefined;
        }, translations as any);

        if (translation === undefined) {
            console.warn(`Translation key not found: ${key}`);
            return key;
        }

        if (typeof translation === 'string' && args.length > 0) {
            let result = translation;
            args.forEach((arg, index) => {
                result = result.replace(`{${index}}`, String(arg));
            });
            return result;
        }

        return translation;
    }, [translations]);

    const checkCredits = useCallback(async (amount: number = 1) => {
        const currentCredits = isLoggedIn && user ? userCredits : guestCredits;

        console.log(`[Credit Check] Required: ${amount}, Available: ${currentCredits}`);

        if (currentCredits < amount) {
            console.warn(`[Credit Check] Insufficient credits. Need ${amount}, have ${currentCredits}`);
            toast.error('Số lượng credit không đủ để tạo thêm ảnh, hãy giảm số lượng ảnh hoặc mua thêm gói.');
            // Trigger "Out of Credits" modal if available
            setIsOutOfCreditsModalOpen(true);
            return false;
        }

        // Still check if user is authenticated or has guest ID (sanity check)
        if (!isLoggedIn && !guestId) {
            console.warn("No user or guest ID - cannot proceed");
            toast.error("Vui lòng tải lại trang để khởi tạo phiên.");
            return false;
        }

        return true;
    }, [isLoggedIn, guestId, user, userCredits, guestCredits]);



    const addGenerationToHistory = useCallback(async (entryData: Omit<GenerationHistoryEntry, 'id' | 'timestamp'>) => {
        const newEntry: GenerationHistoryEntry = {
            ...entryData,
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            timestamp: Date.now(),
        };
        await db.addHistoryEntry(newEntry);

        // Create a lightweight version for React State (remove heavy Base64 images)
        const lightEntry = { ...newEntry, output_images: undefined };

        setGenerationHistory(prev => {
            const updatedHistory = [lightEntry, ...prev];
            // Pruning can be done here if desired, but IndexedDB is large
            return updatedHistory;
        });

        // Log to Supabase if logged in OR if it's a guest
        console.log('[History] Attempting to log to Supabase. isLoggedIn:', isLoggedIn, 'user:', user?.id, 'guestId:', guestId);

        if (isLoggedIn && user) {
            console.log('[History] User logged in, calling logGenerationHistory for user:', user.id);
            // non-blocking log
            storageService.logGenerationHistory(user.id, newEntry, token || undefined)
                .then(() => console.log('[History] Successfully logged to Supabase for User'))
                .catch(err => console.error("[History] Failed to log generation to Supabase:", err));
        } else if (guestId) {
            console.log('[History] Guest User, calling logGenerationHistory for guest:', guestId);
            // non-blocking log for guest
            storageService.logGenerationHistory(null, newEntry, token || undefined, guestId)
                .then(() => console.log('[History] Successfully logged to Supabase for Guest'))
                .catch(err => console.error("[History] Failed to log generation to Supabase (Guest):", err));
        } else {
            console.warn('[History] Skipping Supabase log - user not logged in and no guestId found');
        }

    }, [isLoggedIn, user, token]);

    const getExportableState = useCallback((appState: any, appId: string): any => {
        const exportableState = JSON.parse(JSON.stringify(appState));

        const keysToRemove = [
            'generatedImage', 'generatedImages', 'historicalImages',
            'finalPrompt', 'error',
        ];

        if (appId !== 'image-interpolation') {
            keysToRemove.push('generatedPrompt', 'promptSuggestions');
        }

        const processState = (obj: any) => {
            if (typeof obj !== 'object' || obj === null) return;

            for (const key of keysToRemove) {
                if (key in obj) delete obj[key];
            }

            for (const key in obj) {
                if (typeof obj[key] === 'object') {
                    processState(obj[key]);
                }
            }

            if ('stage' in obj && (obj.stage === 'generating' || obj.stage === 'results' || obj.stage === 'prompting')) {
                obj.stage = 'configuring';
            }
        };

        processState(exportableState);
        return exportableState;
    }, []);

    const logGeneration = useCallback(async (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: {
        tool_id?: number;
        credits_used?: number;
        api_model_used?: string;
        generation_time_ms?: number;
        error_message?: string;
        output_images?: any;
        generation_count?: number;
        input_prompt?: string;
    }) => {
        if (!settings) return;

        const appConfig = settings.apps.find((app: AppConfig) => app.id === appId);
        const appName = appConfig ? t(appConfig.titleKey) : appId;

        const cleanedState = getExportableState(preGenState, appId);

        const smallThumbnailUrl = await createThumbnailDataUrl(thumbnailUrl, 128, 128);

        const entry: Omit<GenerationHistoryEntry, 'id' | 'timestamp'> = {
            appId,
            appName: appName.replace(/\n/g, ' '),
            thumbnailUrl: smallThumbnailUrl,
            settings: {
                viewId: appId,
                state: cleanedState,
            },
            ...extraDetails // Spread extra details into the entry
        };
        addGenerationToHistory(entry);
    }, [addGenerationToHistory, settings, t, getExportableState]);


    const handleLanguageChange = useCallback((lang: 'vi' | 'en') => {
        setLanguage(lang);
        localStorage.setItem('app-language', lang);
    }, []);

    const handleModelVersionChange = useCallback((version: ModelVersion) => {
        setModelVersion(version);
        // Sync with global config
        import('../services/gemini/baseService').then(({ setGlobalModelConfig }) => {
            setGlobalModelConfig({ modelVersion: version });
        });

        // Auto-set to 1K when switching to V3
        if (version === 'v3') {
            setImageResolution('1K');
            import('../services/gemini/baseService').then(({ setGlobalModelConfig }) => {
                setGlobalModelConfig({ imageResolution: '1K' });
            });
        }
    }, []);

    const handleResolutionChange = useCallback((resolution: ImageResolution) => {
        setImageResolution(resolution);
        import('../services/gemini/baseService').then(({ setGlobalModelConfig }) => {
            setGlobalModelConfig({ imageResolution: resolution });
        });
    }, []);

    const addImagesToGallery = useCallback(async (newImages: string[], persist: boolean = true) => {
        const uniqueNewImages = newImages.filter(img => img && !imageGallery.includes(img));

        if (uniqueNewImages.length === 0) {
            return;
        }

        if (isLoggedIn && user) {
            let uploadedUrls: string[] = [];

            if (persist) {
                // 1. Upload all new images to Cloudinary (Parallel)
                const uploadPromises = uniqueNewImages.map(async (img) => {
                    if (img.startsWith('data:image')) {
                        // Check if optimization should be skipped (e.g., for PNGs with metadata)
                        const skipOptimization = img.startsWith('data:image/png');
                        return await storageService.uploadImageToCloud(user.id, img, 'gallery', skipOptimization);
                    } else {
                        return img; // Already a URL
                    }
                });

                try {
                    uploadedUrls = await Promise.all(uploadPromises);

                    // 2. Save all URLs to Supabase DB (Batch)
                    await storageService.addMultipleImagesToCloudGallery(user.id, uploadedUrls, token || undefined);
                } catch (err) {
                    toast.error('Lỗi khi lưu ảnh vào Cloud.');
                    console.error(err);
                    // Fallback to local
                    await db.addMultipleGalleryImages(uniqueNewImages);
                    setImageGallery(prev => [...uniqueNewImages, ...prev]);
                    return uniqueNewImages;
                }
            } else {
                // If not persisting, assume images are already URLs or valid
                uploadedUrls = uniqueNewImages;
            }

            // Update UI State
            setImageGallery(prev => {
                const newUnique = uploadedUrls.filter(u => !prev.includes(u));
                return [...newUnique, ...prev];
            });
            return uploadedUrls;

        } else {
            // Guest Flow: Upload to Cloudinary then save URL to IndexedDB
            const activeGuestId = guestId || `guest_${Date.now()}`; // Fallback if context not ready

            const uploadPromises = uniqueNewImages.map(async (img) => {
                if (img.startsWith('data:image')) {
                    try {
                        // Check if optimization should be skipped (e.g., for PNGs with metadata)
                        const skipOptimization = img.startsWith('data:image/png');
                        const url = await storageService.uploadGuestImage(activeGuestId, img, skipOptimization);
                        // Also track session if possible, but here just persisting image
                        return url;
                    } catch (e) {
                        console.error("Guest upload failed:", e);
                        return img; // Fallback to local storage if network fails
                    }
                }
                return img; // Already a URL
            });

            const processedImages = await Promise.all(uploadPromises);

            // Save to Supabase (Guest Session) - Only save valid URLs not base64
            const validCloudUrls = processedImages.filter(url => url.startsWith('http'));
            if (validCloudUrls.length > 0) {
                await storageService.saveGuestSessionBatch(activeGuestId, userIp, validCloudUrls);
            }

            await db.addMultipleGalleryImages(processedImages);
            setImageGallery(prev => [...processedImages, ...prev]);
        }
    }, [imageGallery, isLoggedIn, user, token]);

    const removeImageFromGallery = useCallback(async (indexToRemove: number) => {
        const urlToDelete = imageGallery[indexToRemove];
        if (urlToDelete) {
            if (isLoggedIn && user) {
                await storageService.removeImageFromCloudGallery(user.id, urlToDelete, token || undefined);
            } else {
                await db.deleteGalleryImage(urlToDelete);
            }
            setImageGallery(prev => prev.filter((_, index) => index !== indexToRemove));
        }
    }, [imageGallery, isLoggedIn, user, token]);

    const replaceImageInGallery = useCallback(async (indexToReplace: number, newImageUrl: string) => {
        const oldUrl = imageGallery[indexToReplace];
        if (oldUrl) {
            await db.replaceGalleryImage(oldUrl, newImageUrl);
            setImageGallery(prev => {
                const newImages = [...prev];
                newImages[indexToReplace] = newImageUrl;
                return newImages;
            });
        }
    }, [imageGallery]);

    // NEW: Strict DB Fetch
    const refreshGallery = useCallback(async () => {
        try {
            // Wait for auth to initialize
            if (authLoading) {
                console.log("Waiting for auth to load...");
                return;
            }

            console.log("Refreshing gallery from DB...");
            let fetchedImages: string[] = [];

            if (isLoggedIn && user) {
                // User: Fetch directly from Supabase profiles bucket/table
                // Use fresh client = true to bypass cache
                fetchedImages = await storageService.getUserCloudGallery(user.id, true, token || undefined);

            } else if (guestId) {
                // Guest: Fetch directly from guest_sessions
                // Use fresh client = true to bypass cache
                fetchedImages = await storageService.getGuestCloudGallery(guestId, true);
            }

            // Replace local state purely with DB data
            setImageGallery(fetchedImages);
        } catch (error) {
            console.error("Failed to refresh gallery:", error);
            toast.error("Không thể tải thư viện ảnh.");
        }
    }, [isLoggedIn, user, guestId, token, authLoading]);

    // NEW: Refresh Credits Function
    const refreshCredits = useCallback(async () => {
        console.log('[refreshCredits] ⚡ Called! isLoggedIn:', isLoggedIn, 'user:', user?.id, 'guestId:', guestId);
        try {
            if (isLoggedIn && user) {
                console.log('[refreshCredits] Triggering AuthContext refresh...');
                // Trigger AuthContext to refresh user data (which will dispatch user-credits-updated event)
                window.dispatchEvent(new CustomEvent('refresh-user-data'));
            } else if (guestId) {
                console.log('[refreshCredits] Fetching guest credits...');
                const { getGuestCredits } = await import('../services/storageService');
                const credits = await getGuestCredits(guestId);
                console.log('[refreshCredits] ✅ Updated guest credits:', credits);
                setGuestCredits(credits);
            } else {
                console.warn('[refreshCredits] ⚠️ No user or guestId available');
            }
        } catch (error: any) {
            console.error('[refreshCredits] ❌ Failed to refresh credits:', error);
            // Don't update state on error - preserve existing values
            // Show subtle warning to user
            toast.error('Không thể cập nhật số dư credits. Vui lòng thử lại.', {
                duration: 3000,
                position: 'bottom-right'
            });
        }
    }, [isLoggedIn, user, guestId, token]);

    // Expose refreshCredits to window for baseService (must be AFTER refreshCredits is defined)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).__refreshCredits = refreshCredits;
        }
    }, [refreshCredits]);

    // ✅ AUTO REFRESH: Trigger data refresh when Auth State settles
    useEffect(() => {
        if (!authLoading) {
            console.log('[uiContexts] Auth settled. Refreshing Gallery & Credits...');
            refreshGallery();
            refreshCredits();
        }
    }, [authLoading, isLoggedIn, user, guestId, refreshGallery, refreshCredits]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/setting.json');
                if (!response.ok) {
                    console.warn('Could not load setting.json, using built-in settings.');
                    return;
                }
                const data = await response.json();
                setSettings(data);
            } catch (error) {
                console.error("Failed to fetch or parse setting.json:", error);
            }
        };
        fetchSettings();
    }, []);

    // Sync URL → State (for direct access and back/forward buttons)
    useEffect(() => {
        if (!settings) return; // Wait for settings to load
        // Skip payment, admin, and test pages (no routing sync needed)
        if (pathname?.startsWith('/payment')) return;
        if (pathname?.startsWith('/admin')) return;
        if (pathname?.startsWith('/poster')) return; // Skip all test pages
        if (pathname?.startsWith('/video-generator')) return; // Skip Video Generator page


        let targetView = 'overview';
        const path = pathname;

        // Parse URL
        if (path === '/') {
            targetView = 'overview';
        } else if (path === '/tool') {
            // /tool alone → redirect to generators
            targetView = 'generators';
        } else if (path.startsWith('/tool/')) {
            // Tool routes: /tool/free-generation
            targetView = path.slice(6); // Remove '/tool/'
        } else if (path.startsWith('/studio/')) {
            // Studio detail routes
            targetView = 'studio';
        } else {
            // System routes: /gallery, /history, etc.
            targetView = path.slice(1); // Remove leading '/'
        }

        // CRITICAL FIX: Skip if already on this view (prevent state reset on re-render)
        if (currentView.viewId === targetView) {
            return;
        }

        // System views
        // System views
        const systemViews = ['overview', 'home', 'generators', 'gallery', 'community-gallery', 'prompt-library', 'storyboarding', 'profile', 'settings', 'studio', 'pricing'];
        if (systemViews.includes(targetView)) {
            navigateTo(targetView);
            return;
        }

        // Regular apps (tools)
        const validAppIds = settings.apps.map((app: AppConfig) => app.id);

        if (validAppIds.includes(targetView)) {
            navigateTo(targetView);
        } else {
            navigateTo('overview');
            router.replace('/');
        }
    }, [pathname, settings, currentView.viewId]); // Added currentView.viewId to deps

    useEffect(() => {
        // Dynamically remove all possible theme classes to prevent conflicts
        THEMES.forEach(t => document.body.classList.remove(`theme-${t}`));

        // Add the current theme class
        document.body.classList.add(`theme-${theme}`);
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    const handleThemeChange = (newTheme: Theme) => {
        if (THEMES.includes(newTheme)) {
            setTheme(newTheme);
        } else {
            console.warn(`Invalid theme: ${newTheme}`);
        }
    };

    const restoreStateFromGallery = useCallback((stateToRestore: any, gallery: string[]): AnyAppState => {
        const restoredState = JSON.parse(JSON.stringify(stateToRestore));

        const restoreRefs = (obj: any) => {
            if (typeof obj !== 'object' || obj === null) return;

            for (const key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    if (obj[key].type === 'galleryRef' && typeof obj[key].index === 'number') {
                        const galleryIndex = obj[key].index;
                        if (gallery[galleryIndex]) {
                            obj[key] = gallery[galleryIndex];
                        } else {
                            console.warn(`Gallery reference with index ${galleryIndex} not found.`);
                            obj[key] = null;
                        }
                    } else {
                        restoreRefs(obj[key]);
                    }
                }
            }
        };

        restoreRefs(restoredState);
        return restoredState;
    }, []);

    const navigateTo = useCallback((viewId: string) => {
        const current = viewHistory[historyIndex];

        // CRITICAL FIX: If already on this view, don't create new state (prevents reset)
        if (current.viewId === viewId) {
            return;
        }

        const initialState = getInitialStateForApp(viewId);

        const newHistory = viewHistory.slice(0, historyIndex + 1);
        newHistory.push({ viewId, state: initialState } as ViewState);


        setViewHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [viewHistory, historyIndex]);

    const handleStateChange = useCallback((newAppState: AnyAppState) => {
        const current = viewHistory[historyIndex];

        if (JSON.stringify(current.state) === JSON.stringify(newAppState)) {
            return; // No change
        }

        const newHistory = viewHistory.slice(0, historyIndex + 1);
        newHistory.push({ viewId: current.viewId, state: newAppState } as ViewState);


        setViewHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [viewHistory, historyIndex]);

    const importSettingsAndNavigate = useCallback((settings: any) => {
        if (!settings || typeof settings.viewId !== 'string' || typeof settings.state !== 'object') {
            alert('Invalid settings file.');
            return;
        }

        const { viewId, state: importedState } = settings;

        const initialState = getInitialStateForApp(viewId);
        if (initialState.stage === 'home') {
            alert(`Unknown app in settings file: ${viewId}`);
            return;
        }

        const restoredState = restoreStateFromGallery(importedState, imageGallery);
        const mergedState = { ...initialState, ...restoredState };

        const newHistory = viewHistory.slice(0, historyIndex + 1);
        newHistory.push({ viewId, state: mergedState } as ViewState);

        setViewHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

    }, [viewHistory, historyIndex, imageGallery, restoreStateFromGallery]);

    const handleSelectApp = useCallback((appId: string) => {
        console.log('[handleSelectApp] Called with:', appId, new Error().stack);

        // Feature Gate: Reverted for "Limited Guest Access"
        // if (!isLoggedIn) {
        //     toast.error("Vui lòng đăng nhập để sử dụng tính năng này!");
        //     return;
        // }

        // Special system views that are not in settings.apps
        // Special system views that are not in settings.apps
        const systemViews = ['overview', 'home', 'generators', 'gallery', 'prompt-library', 'storyboarding', 'profile', 'settings', 'studio', 'pricing'];

        if (systemViews.includes(appId)) {
            // Update state
            navigateTo(appId);
            // Update URL (system views at root level)
            // Special case: 'generators' uses /tool URL, not /generators

            const url = appId === 'overview' ? '/' : `/${appId}`;
            console.log(`🟢 NAVIGATE ${appId} → ${url}`);
            router.push(url);

            return;
        }

        // Regular apps from settings (use /tool/ prefix)
        if (settings) {
            const validAppIds = settings.apps.map((app: AppConfig) => app.id);
            if (validAppIds.includes(appId)) {
                // Update state
                navigateTo(appId);
                // Update URL with /tool/ prefix
                console.log(`🟢 NAVIGATE tool ${appId} → /tool/${appId}`);
                router.push(`/tool/${appId}`);
            } else {
                console.log('🔴 NAVIGATE invalid → /');
                navigateTo('home');
                router.push('/');
            }
        } else {
            // Fallback: navigate anyway if settings not loaded
            console.log(`🟡 NAVIGATE fallback ${appId} → /tool/${appId}`);
            navigateTo(appId);
            router.push(`/tool/${appId}`);
        }
    }, [settings, navigateTo, router, isLoggedIn]);

    const handleGoHome = useCallback(() => {
        console.log('🏠 handleGoHome called', new Error().stack);
        navigateTo('overview');
        router.push('/');
    }, [navigateTo, router]);

    const handleGoBack = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
        }
    }, [historyIndex]);

    const handleGoForward = useCallback(() => {
        if (historyIndex < viewHistory.length - 1) {
            setHistoryIndex(prev => prev + 1);
        }
    }, [historyIndex, viewHistory.length]);

    const handleResetApp = useCallback(() => {
        const currentViewId = viewHistory[historyIndex].viewId;
        if (currentViewId !== 'home') {
            navigateTo(currentViewId);
        }
    }, [viewHistory, historyIndex, navigateTo]);

    const handleOpenSearch = useCallback(() => setIsSearchOpen(true), []);
    const handleCloseSearch = useCallback(() => setIsSearchOpen(false), []);
    const handleOpenGallery = useCallback(() => setIsGalleryOpen(true), []);
    const handleCloseGallery = useCallback(() => setIsGalleryOpen(false), []);
    const handleOpenInfo = useCallback(() => setIsInfoOpen(true), []);
    const handleCloseInfo = useCallback(() => setIsInfoOpen(false), []);

    const toggleExtraTools = useCallback(() => setIsExtraToolsOpen(prev => !prev), []);
    const openImageLayoutModal = useCallback(() => {
        setIsImageLayoutModalOpen(true);
        setIsExtraToolsOpen(false); // Close the tools menu when opening the modal
    }, []);
    const closeImageLayoutModal = useCallback(() => setIsImageLayoutModalOpen(false), []);
    const openBeforeAfterModal = useCallback(() => {
        setIsBeforeAfterModalOpen(true);
        setIsExtraToolsOpen(false);
    }, []);
    const closeBeforeAfterModal = useCallback(() => setIsBeforeAfterModalOpen(false), []);
    const openAppCoverCreatorModal = useCallback(() => {
        setIsAppCoverCreatorModalOpen(true);
        setIsExtraToolsOpen(false);
    }, []);
    const closeAppCoverCreatorModal = useCallback(() => setIsAppCoverCreatorModalOpen(false), []);

    const openStoryboardingModal = useCallback(() => {
        setIsStoryboardingModalMounted(true);
        setIsStoryboardingModalVisible(true);
        setIsExtraToolsOpen(false);
    }, []);

    const hideStoryboardingModal = useCallback(() => {
        setIsStoryboardingModalVisible(false);
    }, []);

    const closeStoryboardingModal = useCallback(() => {
        setIsStoryboardingModalMounted(false);
        setIsStoryboardingModalVisible(false);
    }, []);

    const toggleStoryboardingModal = useCallback(() => {
        if (isStoryboardingModalVisible) {
            hideStoryboardingModal();
        } else {
            openStoryboardingModal();
        }
    }, [isStoryboardingModalVisible, hideStoryboardingModal, openStoryboardingModal]);

    const openLayerComposer = useCallback(() => {
        setIsLayerComposerMounted(true);
        setIsLayerComposerVisible(true);
        setIsExtraToolsOpen(false);
    }, []);
    const closeLayerComposer = useCallback(() => {
        setIsLayerComposerMounted(false);
        setIsLayerComposerVisible(false);
    }, []);
    const hideLayerComposer = useCallback(() => {
        setIsLayerComposerVisible(false);
    }, []);

    const toggleLayerComposer = useCallback(() => {
        if (isLayerComposerVisible) {
            hideLayerComposer();
        } else {
            openLayerComposer();
        }
    }, [isLayerComposerVisible, hideLayerComposer, openLayerComposer]);

    const value = React.useMemo<AppControlContextType>(() => ({
        currentView,
        settings,
        theme,
        imageGallery,
        historyIndex,
        viewHistory,
        isSearchOpen,
        isGalleryOpen,
        isInfoOpen,

        isExtraToolsOpen,
        isImageLayoutModalOpen,
        isBeforeAfterModalOpen,
        isAppCoverCreatorModalOpen,
        isStoryboardingModalMounted,
        isStoryboardingModalVisible,
        isLayerComposerMounted,
        isLayerComposerVisible,
        isLoginModalOpen,
        isOutOfCreditsModalOpen, // NEW
        language,
        generationHistory,
        modelVersion,
        imageResolution,
        guestCredits,
        userCredits,
        v2UsageCount,
        v3UsageCount,
        refreshUsageCounts,
        checkCredits,
        refreshGallery, // NEW
        refreshCredits, // NEW
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
        openOutOfCreditsModal: () => setIsOutOfCreditsModalOpen(true),
        closeOutOfCreditsModal: () => setIsOutOfCreditsModalOpen(false),
        addGenerationToHistory,
        logGeneration, // NEW
        addImagesToGallery,
        removeImageFromGallery,
        replaceImageInGallery,
        handleThemeChange,
        handleLanguageChange,
        handleModelVersionChange,
        handleResolutionChange,
        navigateTo,
        setActivePage: navigateTo,
        handleStateChange,
        handleSelectApp,
        handleGoHome,
        handleGoBack,
        handleGoForward,
        handleResetApp,
        handleOpenSearch,
        handleCloseSearch,
        handleOpenGallery,
        handleCloseGallery,
        handleOpenInfo,
        handleCloseInfo,

        toggleExtraTools,
        openImageLayoutModal,
        closeImageLayoutModal,
        openBeforeAfterModal,
        closeBeforeAfterModal,
        openAppCoverCreatorModal,
        closeAppCoverCreatorModal,
        openStoryboardingModal,
        closeStoryboardingModal,
        hideStoryboardingModal,
        toggleStoryboardingModal,
        openLayerComposer,
        closeLayerComposer,
        hideLayerComposer,
        toggleLayerComposer,
        importSettingsAndNavigate,
        t,
        guestId,
        userIp,
        user,
        isLoggedIn,
        isIncognito,
    }), [
        currentView, settings, theme, imageGallery, historyIndex, viewHistory,
        isSearchOpen, isGalleryOpen, isInfoOpen, isExtraToolsOpen,
        isImageLayoutModalOpen, isBeforeAfterModalOpen, isAppCoverCreatorModalOpen,
        isStoryboardingModalMounted, isStoryboardingModalVisible,
        isLayerComposerMounted, isLayerComposerVisible, isLoginModalOpen,
        isOutOfCreditsModalOpen, // NEW DEP
        language, generationHistory, modelVersion, imageResolution,
        guestCredits, userCredits, v2UsageCount, v3UsageCount,
        refreshUsageCounts, checkCredits, refreshGallery,
        addGenerationToHistory, logGeneration, addImagesToGallery, removeImageFromGallery,
        replaceImageInGallery, handleThemeChange, handleLanguageChange,
        handleModelVersionChange, handleResolutionChange,
        navigateTo, handleStateChange, handleSelectApp, handleGoHome,
        handleGoBack, handleGoForward, handleResetApp, handleOpenSearch,
        handleCloseSearch, handleOpenGallery, handleCloseGallery,
        handleOpenInfo, handleCloseInfo, toggleExtraTools,
        openImageLayoutModal, closeImageLayoutModal, openBeforeAfterModal,
        closeBeforeAfterModal, openAppCoverCreatorModal, closeAppCoverCreatorModal,
        openStoryboardingModal, closeStoryboardingModal, hideStoryboardingModal,
        toggleStoryboardingModal, openLayerComposer, closeLayerComposer,
        hideLayerComposer, toggleLayerComposer, importSettingsAndNavigate,
        t, guestId, userIp, user, isLoggedIn, isIncognito
    ]);

    return (
        <AppControlContext.Provider value={value}>
            {children}
        </AppControlContext.Provider>
    );
};

export const useAppControls = (): AppControlContextType => {
    const context = useContext(AppControlContext);
    if (!context) {
        throw new Error('useAppControls must be used within an AppControlProvider');
    }
    return context;
};