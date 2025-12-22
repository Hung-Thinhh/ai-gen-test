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

const AppControlContext = createContext<AppControlContextType | undefined>(undefined);

export const AppControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoggedIn, token } = useAuth();
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
    const [guestCredits, setGuestCredits] = useState<number>(10); // Default to 10
    const [userCredits, setUserCredits] = useState<number>(0); // New user credits
    const [userIp, setUserIp] = useState<string>('');

    // Initialize Guest ID and IP
    useEffect(() => {
        // 1. Get or Create Guest ID
        let storedGuestId = localStorage.getItem('guest_device_id');
        if (!storedGuestId) {
            storedGuestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem('guest_device_id', storedGuestId);
        }
        setGuestId(storedGuestId);

        // 2. Fetch IP (Fire and forget)
        fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => setUserIp(data.ip))
            .catch(err => console.warn('Failed to fetch IP', err));
    }, []);

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
                    const credits = await storageService.getUserCredits(user.id);
                    setUserCredits(credits);

                    const cloudGallery = await storageService.getUserCloudGallery(user.id);
                    setImageGallery(cloudGallery);
                    const history = await db.getAllHistoryEntries();
                    setGenerationHistory(history);
                } catch (err) {
                    console.error("Failed to load cloud gallery", err);
                    const gallery = await db.getAllGalleryImages();
                    setImageGallery(gallery);
                }
            } else {
                await db.migrateFromLocalStorageToIdb();
                const [localGallery, history] = await Promise.all([
                    db.getAllGalleryImages(),
                    db.getAllHistoryEntries()
                ]);

                // Try to load Cloudinary gallery for guest
                let mergedGallery = localGallery;
                if (guestId) {
                    try {
                        const { getGuestCredits } = await import('../services/storageService');
                        const credits = await getGuestCredits(guestId);
                        setGuestCredits(credits);

                        const guestCloudImages = await storageService.getGuestCloudGallery(guestId);
                        if (guestCloudImages.length > 0) {
                            // Merge with local, preferring cloud order but keeping unique local
                            mergedGallery = [...guestCloudImages];
                            localGallery.forEach(url => {
                                if (!mergedGallery.includes(url)) mergedGallery.push(url);
                            });
                        }
                    } catch (e) {
                        console.warn('Failed to load guest cloud gallery/credits', e);
                    }
                }

                setImageGallery(mergedGallery);
                setGenerationHistory(history);
            }
            setIsDbLoaded(true);
        }
        loadData();
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
        const { deductGuestCredit, deductUserCredit } = await import('../services/storageService');

        if (isLoggedIn && user) {
            // Pass token to deductUserCredit
            const newBalance = await deductUserCredit(user.id, amount, token || undefined);
            if (newBalance === -1) {
                toast.error(t('common_outOfCredits'));
                console.log("User credit deduction failed (balance -1)");
                return false;
            }
            setUserCredits(newBalance);
            console.log("User credit deduction success", newBalance);
            return true;
        }

        // Guest Flow
        if (!guestId) {
            console.warn("Guest ID not initialized.");
            toast.error("Vui lòng tải lại trang (Lỗi xác thực Guest).");
            return false;
        }

        try {
            console.log("Checking guest credits for", guestId);
            // Deduct X credits
            const newBalance = await deductGuestCredit(guestId, amount);
            console.log("Deduct result:", newBalance);

            if (newBalance === -1) {
                console.log("[Guest Check] Limit reached! Opening Login Modal.");
                setIsLoginModalOpen(true);
                return false;
            }

            console.log(`[Guest Check] Credits remaining: ${newBalance}`);
            setGuestCredits(newBalance);
            return true;


        } catch (e) {
            console.error("Guest check failed", e);
            toast.error("Lỗi khi kiểm tra tín dụng. Vui lòng thử lại.");
            return false;
        }
    }, [isLoggedIn, guestId, user, t, token]);



    const addGenerationToHistory = useCallback(async (entryData: Omit<GenerationHistoryEntry, 'id' | 'timestamp'>) => {
        const newEntry: GenerationHistoryEntry = {
            ...entryData,
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            timestamp: Date.now(),
        };
        await db.addHistoryEntry(newEntry);
        setGenerationHistory(prev => {
            const updatedHistory = [newEntry, ...prev];
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

    const addImagesToGallery = useCallback(async (newImages: string[]) => {
        const uniqueNewImages = newImages.filter(img => img && !imageGallery.includes(img));

        if (uniqueNewImages.length === 0) {
            return;
        }

        if (isLoggedIn && user) {
            // 1. Upload all new images to Cloudinary (Parallel)
            const uploadPromises = uniqueNewImages.map(async (img) => {
                if (img.startsWith('data:image')) {
                    // Note: uploadImageToCloud uses Cloudinary, doesn't need Supabase token?
                    // Actually storageService.uploadImageToCloud uses cloudinaryService.
                    // Let's verify if it needs token. `uploadToCloudinary` uses generic API usually.
                    // But `addMultipleImagesToCloudGallery` NEEDS token.
                    return await storageService.uploadImageToCloud(user.id, img);
                } else {
                    return img; // Already a URL
                }
            });

            try {
                const uploadedUrls = await Promise.all(uploadPromises);

                // 2. Save all URLs to Supabase DB (Batch)
                await storageService.addMultipleImagesToCloudGallery(user.id, uploadedUrls, token || undefined);

                toast.success('Đã lưu ảnh vào Cloud!');
                setImageGallery(prev => {
                    const newUnique = uploadedUrls.filter(u => !prev.includes(u));
                    return [...newUnique, ...prev];
                });
                return uploadedUrls;
            } catch (err) {
                toast.error('Lỗi khi lưu ảnh vào Cloud.');
                console.error(err);
                // Fallback to local
                await db.addMultipleGalleryImages(uniqueNewImages);
                setImageGallery(prev => [...uniqueNewImages, ...prev]);
                return uniqueNewImages;
            }
        } else {
            // Guest Flow: Upload to Cloudinary then save URL to IndexedDB
            const activeGuestId = guestId || `guest_${Date.now()}`; // Fallback if context not ready

            const uploadPromises = uniqueNewImages.map(async (img) => {
                if (img.startsWith('data:image')) {
                    try {
                        const url = await storageService.uploadGuestImage(activeGuestId, img);
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

            console.log("Gallery refreshed, count:", fetchedImages.length);
            console.log("Gallery Data:", fetchedImages); // Debug Log
            // Replace local state purely with DB data
            setImageGallery(fetchedImages);
        } catch (error) {
            console.error("Failed to refresh gallery:", error);
            toast.error("Không thể tải thư viện ảnh.");
        }
    }, [isLoggedIn, user, guestId, token]);

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
        // Ignore admin routes to prevents conflict with AdminLayout
        if (pathname?.startsWith('/admin')) return;
        // Ignore payment routes - they have their own navigation logic
        if (pathname?.startsWith('/payment')) return;

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
        } else {
            // System routes: /gallery, /history, etc.
            targetView = path.slice(1); // Remove leading '/'
        }

        // CRITICAL FIX: Skip if already on this view (prevent state reset on re-render)
        if (currentView.viewId === targetView) {
            return;
        }

        // System views
        const systemViews = ['overview', 'home', 'generators', 'gallery', 'prompt-library', 'storyboarding', 'profile', 'settings'];
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
        const systemViews = ['overview', 'home', 'generators', 'gallery', 'prompt-library', 'storyboarding', 'profile', 'settings'];

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
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
        addGenerationToHistory,
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
    }), [
        currentView, settings, theme, imageGallery, historyIndex, viewHistory,
        isSearchOpen, isGalleryOpen, isInfoOpen, isExtraToolsOpen,
        isImageLayoutModalOpen, isBeforeAfterModalOpen, isAppCoverCreatorModalOpen,
        isStoryboardingModalMounted, isStoryboardingModalVisible,
        isLayerComposerMounted, isLayerComposerVisible, isLoginModalOpen,
        language, generationHistory, modelVersion, imageResolution,
        guestCredits, userCredits, v2UsageCount, v3UsageCount,
        refreshUsageCounts, checkCredits, refreshGallery,
        addGenerationToHistory, addImagesToGallery, removeImageFromGallery,
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
        t, guestId, userIp, user, isLoggedIn
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