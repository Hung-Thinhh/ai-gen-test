import { log } from 'console';
import { uploadToCloudinary } from './cloudinaryService';
import { cacheService, CACHE_KEYS, CACHE_TTL } from './cacheService';
import { getSession } from "next-auth/react";
// Helper to get user role
// Helper to get user role
// Helper to get user role
export const getUserRole = async (userId: string): Promise<string | null> => {
    try {
        const res = await fetch('/api/user/me');
        if (!res.ok) return null;
        const data = await res.json();
        return data.role;
    } catch (e) {
        console.error("Error fetching user role:", e);
        return null;
    }
};

const USERS_TABLE = "users";
const PROFILES_TABLE = "profiles";
const GUESTS_TABLE = "guest_sessions";

// Helper interface for guest history
interface GuestHistoryItem {
    url: string;
    timestamp: number;
}

// Helper to get access token safely (NextAuth -> Supabase -> LocalStorage)
// Helper to get access token safely (NextAuth only)
const getAccessToken = async () => {
    try {
        // 1. Try NextAuth Session first (and only)
        const session = await getSession();
        if (session && (session as any).accessToken) {
            return (session as any).accessToken;
        }

        // Just return undefined if no session
        return undefined;

    } catch (error) {
        console.error("[Storage] getAccessToken failed:", error);
        return undefined;
    }
};

// DEPRECATED: No longer used - app migrated to API routes
/*
const getFreshClient = (accessToken?: string) => {
    if (!accessToken) return supabase;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const { createClient } = require('@supabase/supabase-js');
    const options: any = { auth: { persistSession: false } };
    options.global = { headers: { Authorization: `Bearer ${accessToken}` } };
    return createClient(supabaseUrl, supabaseAnonKey, options);
}
*/

// Helper for timeouts
// Helper for timeouts
const promiseWithTimeout = <T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> => {
    return Promise.race([
        Promise.resolve(promise),
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout: ${label} took longer than ${ms}ms`)), ms))
    ]);
};


// DEPRECATED: No longer used - app migrated to API routes
/*
// Helper to execute operations with JWT retry logic
const executeWithRetry = async <T>(
    operationName: string,
    operation: (client: any) => Promise<{ data: T | null; error: any }>,
    token?: string
): Promise<{ data: T | null; error: any }> => {
    let activeToken = token;

    // If no token provided, try to get current session immediately (for cases where manual passing failed)
    if (!activeToken) {
        try {
            // Add timeout to getSession to prevent hang
            const { data: sessionData } = await promiseWithTimeout(
                supabase.auth.getSession(),
                2000,
                'getSession_Initial'
            );
            activeToken = sessionData.session?.access_token;
        } catch (e) { } 
    }

    let client = getFreshClient(activeToken);

    try {
        // Attempt 1
        const result = await operation(client);

        if (result.error && (result.error.code === 'PGRST303' || result.error.message?.includes('JWT'))) {
            console.warn(`[Storage] JWT expired in ${operationName}, refreshing token...`);

            // Force Session Refresh
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError || !refreshData.session) {
                console.error(`[Storage] Token refresh failed for ${operationName}:`, refreshError);
                // Fallback: Try getSession in case refreshSession is just picky, or user needs generic session
                const { data: sessionData } = await supabase.auth.getSession();
                activeToken = sessionData.session?.access_token;
            } else {
                activeToken = refreshData.session.access_token;
            }

            if (activeToken) {
                // Create new client with new token
                client = getFreshClient(activeToken);
                return await operation(client);
            }
        }

        return result;
    } catch (e) {
        console.error(`[Storage] Unexpected error in ${operationName}:`, e);
        return { data: null, error: e };
    }
};
*/

/**
 * Uploads a Base64 image to Cloudinary (Replaces Firebase Storage) and returns the download URL.
 * @param userId The ID of the user.
 * @param base64Data The Base64 string of the image.
 * @param folder The folder path.
 */
export const uploadImageToCloud = async (userId: string, base64Data: string, folder: string = "gallery", skipOptimization: boolean = false): Promise<string> => {
    try {
        // Use Cloudinary Service
        const storagePath = `users/${userId}/${folder}`;
        const downloadUrl = await uploadToCloudinary(base64Data, storagePath, { skipOptimization });
        return downloadUrl;
    } catch (error) {
        console.error("Error uploading image to cloud (Cloudinary):", error);
        throw error;
    }
};

/**
 * Adds an image URL to the user's Supabase gallery (profiles table).
 */
export const addImageToCloudGallery = async (userId: string, imageUrl: string) => {
    return addMultipleImagesToCloudGallery(userId, [imageUrl]);
};

/**
 * Uploads a generic asset (File) to Cloudinary and returns URL.
 */
export const uploadAsset = async (file: File): Promise<string> => {
    try {
        return await uploadToCloudinary(file, 'studio-assets');
    } catch (error) {
        console.error("Error uploading asset:", error);
        throw error;
    }
};

/**
 * Adds multiple image URLs to the user's Supabase gallery.
 * Handles Read-Modify-Write to prevent race conditions within the batch.
 */
export const addMultipleImagesToCloudGallery = async (userId: string, imageUrls: string[], token?: string) => {
    try {
        if (!imageUrls.length) return;
        await fetch('/api/user/gallery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: imageUrls })
        });
    } catch (error) {
        console.error("Error adding images to cloud gallery:", error);
        throw error;
    }
};

/**
 * Fetches the user's gallery from Supabase.
 */
export const getUserCloudGallery = async (userId: string, useFreshClient: boolean = false, token?: string): Promise<string[]> => {
    try {
        const timestamp = Date.now();
        const res = await fetch(`/api/user/gallery?_t=${timestamp}`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.gallery || [];
    } catch (error) {
        console.error("Error fetching cloud gallery:", error);
        return [];
    }
};

/**
 * Removes an image from the cloud gallery (Supabase).
 */
export const removeImageFromCloudGallery = async (userId: string, imageUrl: string, token?: string) => {
    try {
        await fetch(`/api/user/gallery?url=${encodeURIComponent(imageUrl)}`, {
            method: 'DELETE'
        });
    } catch (error) {
        console.error("Error removing image from cloud gallery:", error);
        throw error;
    }
};

// --- GUEST HANDLING ---

/**
 * Uploads a guest generated image to Cloudinary.
 */
export const uploadGuestImage = async (guestId: string, base64Data: string, skipOptimization: boolean = false): Promise<string> => {
    try {
        // Use Cloudinary Service
        const storagePath = `guests/${guestId}`;
        const downloadUrl = await uploadToCloudinary(base64Data, storagePath, { skipOptimization });
        return downloadUrl;
    } catch (error) {
        console.error("Error uploading guest image (Cloudinary):", error);
        throw error;
    }
};

/**
 * Records guest activity in Supabase 'guest_sessions' table.
 */
/**
 * Records guest activity in Supabase 'guest_sessions' table.
 */
export const saveGuestSession = async (guestId: string, ip: string, imageUrl?: string) => {
    if (imageUrl) {
        return saveGuestSessionBatch(guestId, ip, [imageUrl]);
    } else {
        return saveGuestSessionBatch(guestId, ip, []);
    }
};

/**
 * Records multiple images to guest history in Supabase 'guest_sessions' table.
 */
export const saveGuestSessionBatch = async (guestId: string, ip: string, imageUrls: string[]) => {
    try {
        // 1. Get existing session to update history properly - Use Fresh Client
        // const client = getFreshClient(); // Explicitly use fresh client for read-modify-write
        // const { data } = await client
        //     .from(GUESTS_TABLE)
        //     .select('history')
        //     .eq('guest_id', guestId)
        //     .maybeSingle();

        let currentHistory: any[] = [];
        // if (data && Array.isArray(data.history)) {
        //     currentHistory = data.history;
        // }

        if (imageUrls.length > 0) {
            const newEntries = imageUrls.map(url => ({
                url: url,
                timestamp: Date.now()
            }));
            currentHistory = [...currentHistory, ...newEntries];
        }

        const updateData = {
            guest_id: guestId,
            last_seen: new Date().toISOString(),
            ip: ip,
            device_type: 'web',
            user_type: 'guest',
            history: currentHistory
        };

        // UPSERT using FRESH CLIENT
        // [MODIFIED] Client-side guest session saving disabled request from user.
        // History is ostensibly not saved to DB from client anymore to avoid RLS/connection issues.
        /*
        const { error } = await client
            .from(GUESTS_TABLE)
            .upsert(updateData, { onConflict: 'guest_id' });

        if (error) throw error;
        console.log(`[Storage] Guest session updated for ${guestId}, history count: ${currentHistory.length}`);
        */
        console.log(`[Storage] Skipped saving guest session (Client-side disabled)`);

    } catch (error) {
        console.error("Error saving guest session:", error);
    }
};

// --- GUEST CREDITS ---

/**
 * Gets the current credits for a registered user (READ-ONLY).
 */
/**
 * Gets the current credits for a user.
 * @throws Error if unable to fetch credits
 */
export const getUserCredits = async (userId: string, token?: string): Promise<number> => {
    try {
        // [MODIFIED] Use Server API instead of direct Supabase (NextAuth Only)
        // Note: 'userId' arg is actually redundant if we trust the session, 
        // but kept for signature compatibility. API uses session user.

        const res = await fetch('/api/user/me');
        if (!res.ok) {
            console.warn(`[getUserCredits] API request failed: ${res.status}`);
            return 0;
        }

        const data = await res.json();
        console.log(`[getUserCredits] User credits from API: ${data.current_credits}`);
        return data.current_credits ?? 0;

    } catch (error: any) {
        console.error("[getUserCredits] Exception:", error);
        return 0;
    }
};

/**
 * Gets the current credits for a guest.
 * @throws Error if unable to fetch credits
 */
export const getGuestCredits = async (guestId: string): Promise<number> => {
    try {
        console.log(`[getGuestCredits] Fetching specific guest credits via API for: ${guestId}`);

        // Use Server API instead of direct Supabase
        const res = await fetch(`/api/credits/guest?guestId=${guestId}`);

        if (!res.ok) {
            console.warn(`[getGuestCredits] API request failed: ${res.status}`);
            return 0;
        }

        const data = await res.json();
        const credits = data.credits ?? 0;
        console.log(`[getGuestCredits] Guest ${guestId}: ${credits} credits (API)`);
        return credits;

    } catch (error: any) {
        console.error("Error in getGuestCredits:", error);
        return 0;
    }
};

/**
 * Deducts credits from a guest session.
 * Returns new balance or -1 if failed.
 */
export const deductGuestCredit = async (guestId: string, amount: number = 1): Promise<number> => {
    try {
        // Optimistic check
        const current = await getGuestCredits(guestId);
        if (current < amount) {
            return -1; // Not enough credits
        }

        // We use a simple update here. For strict concurrency, use an RPC or careful conditions.
        // [MODIFIED] Client-side credit deduction disabled. Server handles deduction now.
        /*
        const { data, error } = await supabase
            .from(GUESTS_TABLE)
            .upsert({ guest_id: guestId, credits: current - amount }, { onConflict: 'guest_id' })
            .select('credits')
            .single();

        if (error) {
            console.error("Guest credit deduction FAILED (DB Error):", JSON.stringify(error));
            return -1;
        }

        return data?.credits ?? (current - amount);
        */
        console.log("[Storage] Client-side guest deduction skipped (Server handling).");
        return current - amount; // Simul success
    } catch (error) {
        console.error("Error in deductGuestCredit:", error);
        return -1;
    }
};



/**
 * Deducts credits from a registered user's capability.
 * Returns the new balance or -1 if deduction failed (e.g. insufficient funds).
 */
export const deductUserCredit = async (userId: string, amount: number = 1, token?: string): Promise<number> => {
    console.warn("[Storage] deductUserCredit (Client-Side) is deprecated and disabled. Use Server APIs.");
    return -1;
};


/**
 * Transfers guest credits to a user.
 * actually returns the credit amount to be used for the new user.
 */
export const transferGuestCreditsToUser = async (guestId: string): Promise<number | null> => {
    try {
        const response = await fetch(`/api/guest/credits?guestId=${encodeURIComponent(guestId)}`);
        if (!response.ok) return null;

        const data = await response.json();
        return data.credits;
    } catch (error) {
        return null;
    }
};

/**
 * Fetches the guest's gallery from Supabase.
 */
export const getGuestCloudGallery = async (guestId: string, useFreshClient: boolean = false): Promise<string[]> => {
    try {
        const timestamp = Date.now();
        const response = await fetch(`/api/guest/gallery?guestId=${encodeURIComponent(guestId)}&_t=${timestamp}`, {
            cache: 'no-store'
        });
        if (!response.ok) return [];

        const data = await response.json();
        return data.gallery || [];
    } catch (error) {
        console.error("Error fetching guest gallery:", error);
        return [];
    }
};

// --- ADMIN FUNCTIONS ---

/**
 * Fetches all users (for Admin dashboard).
 * WARNING: This requires Service Role or Admin RLS policy, or the user to be an admin.
 */
export const getAllUsers = async (token?: string) => {
    try {
        // Call Neon-based API instead of Supabase
        const response = await fetch('/api/users?all=true', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (!response.ok) {
            console.error('[StorageService] Failed to fetch all users:', response.statusText);
            return [];
        }

        const data = await response.json();
        return data.users || [];
    } catch (error) {
        console.error("Error fetching all users:", error);
        return [];
    }
};

/**
 * Updates a user's profile (Admin action).
 */
export const updateUser = async (userId: string, updates: any, token?: string) => {
    try {
        // Call Neon-based API instead of Supabase
        const response = await fetch('/api/users', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ user_id: userId, ...updates })
        });

        if (!response.ok) {
            console.error("Error updating user:", response.statusText);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error updating user:", error);
        return false;
    }
};

/**
 * Bans or Unbans a user (Admin action).
 */
export const toggleUserBan = async (userId: string, isBanned: boolean, token?: string) => {
    return updateUser(userId, { banned: isBanned }, token);
};

// Cache for tool IDs to reduce DB queries
const toolIdCache = new Map<string, number>();

const getToolId = async (appIdOrName: string): Promise<number | null> => {
    if (!appIdOrName) return null;
    if (toolIdCache.has(appIdOrName)) return toolIdCache.get(appIdOrName)!;

    try {
        const res = await fetch(`/api/tools/lookup?key=${appIdOrName}`);
        if (res.ok) {
            const data = await res.json();
            if (data.tool_id) {
                toolIdCache.set(appIdOrName, data.tool_id);
                return data.tool_id;
            }
        }
        return null;
    } catch (e) {
        console.error("Error resolving tool ID:", e);
        return null;
    }
};

/**
 * Creates a new tool in the database.
 */
// [Refactored to Server API]
export const createTool = async (tool: any, token?: string) => {
    try {
        const authToken = token || await getAccessToken();
        console.log(`[Storage] createTool via API`);

        const response = await fetch('/api/resources/tools', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(tool)
        });
        const result = await response.json();

        if (!result.success) {
            console.error("Error creating tool:", result.error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error creating tool:", error);
        return false;
    }
};

/**
 * Fetches all tools from the database via server API with caching.
 */
export const getAllTools = async () => {
    try {
        // Try to get from cache first
        const cached = cacheService.get<any[]>(CACHE_KEYS.TOOLS);
        if (cached) {
            console.log("[Storage] Returning cached tools:", cached.length, "items");
            return cached;
        }

        console.log("[Storage] Fetching all tools from API...");
        const response = await fetch('/api/resources/tools'); // Refactored to unified API

        if (!response.ok) {
            console.error("Error fetching tools from API:", response.status);
            return [];
        }

        const { data } = await response.json();
        const tools = data || [];

        // Custom sort: sort_order 1, 2, 3... first, then 0s (or nulls) at the end
        tools.sort((a: any, b: any) => {
            const orderA = a.sort_order ? parseInt(a.sort_order) : 0;
            const orderB = b.sort_order ? parseInt(b.sort_order) : 0;

            if (orderA === 0 && orderB !== 0) return 1;
            if (orderA !== 0 && orderB === 0) return -1;
            if (orderA === 0 && orderB === 0) return 0;
            return orderA - orderB;
        });

        // Cache the result
        cacheService.set(CACHE_KEYS.TOOLS, tools, CACHE_TTL.TOOLS);
        console.log("[Storage] getAllTools returned:", tools.length, "items");
        return tools;
    } catch (error) {
        console.error("Error fetching tools:", error);
        return [];
    }
};

/**
 * Updates a tool's details.
 */
// [Refactored to Server API]
export const updateTool = async (toolId: string | number, updates: any, token?: string) => {
    try {
        const authToken = token || await getAccessToken();
        console.log(`[Storage] updateTool via API for ID: ${toolId}`);

        const response = await fetch('/api/resources/tools', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ tool_id: toolId, ...updates })
        });
        const result = await response.json();

        if (!result.success) {
            console.error("Error updating tool:", result.error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error updating tool:", error);
        return false;
    }
};

/**
 * Logs a generation event to the 'generation_history' table.
 */
export const logGenerationHistory = async (userId: string | null, entry: any, token?: string, guestId?: string) => {
    try {
        if (!userId) {
            console.log("[Storage] Guest history logging disabled.");
            // [REMOVED] Legacy Supabase client usage. 
            // History logging should now be handled by the server API (/api/gemini/generate-image)
            // or via a dedicated API endpoint if needed from client.

            // const client = getFreshClient(token);
            return;
        }


        let resolvedToolId = entry.tool_id;

        // If tool_id is missing or 0, try to resolve from appId provided in entry (if any)
        // entry usually comes from MainApp.tsx logGeneration which has appId
        /*
        if (!resolvedToolId && entry.appId) {
            const foundId = await getToolId(entry.appId);
            if (foundId) resolvedToolId = foundId;
        }
        */

        // Calculate credits_used = base_credit_cost * generation_count
        // [MOVED TO SERVER API]
        const generationCount = entry.generation_count || 1;
        const finalCreditsUsed = entry.credits_used !== undefined ? entry.credits_used : 0;

        // Map frontend fields to DB columns
        const dbEntry: any = {
            user_id: userId, // Can be null now
            guest_id: guestId || null,
            output_images: entry.output_images || [],
            generation_count: generationCount,
            credits_used: finalCreditsUsed,
            api_model_used: entry.api_model_used || 'unknown',
            generation_time_ms: entry.generation_time_ms || 0,
            error_message: entry.error_message || null,
        };

        // Only include tool_id if it's valid (non-zero/null). 
        // If FK is not nullable, this insert might still fail if we omit it.
        // But usually nullable FKs are fine. If it's NOT nullable, we are in trouble if we can't find it.
        // Assuming we default to null if not found, and hope column is nullable.
        // If not nullable, we might default to 1? But explicit 0 failed.
        if (resolvedToolId) {
            dbEntry.tool_id = resolvedToolId;
        } else {
            // Try explicit NULL instead of 0
            dbEntry.tool_id = null;
        }

        // Use API to log history
        await fetch('/api/user/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbEntry)
        });

        // console.log(`[Storage] Generation log saved. Tool ID: ${resolvedToolId}, Credits used: ${finalCreditsUsed}`);
    } catch (error) {
        console.error("Error in logGenerationHistory:", error);
    }
};

// --- PACKAGE / PRICING HELPERS ---

/**
 * Fetches all pricing packages from the database.
 */
export const getAllPackages = async () => {
    console.log('[Storage] getAllPackages called (via API)');
    try {
        // Fetch from our own API to bypass RLS/Client issues
        const response = await fetch('/api/packages');
        const result = await response.json();

        if (!result.success) {
            console.error('[Storage] API error:', result.error);
            return [];
        }

        console.log('[Storage] getAllPackages success, count:', result.data?.length);
        return result.data || [];
    } catch (error) {
        console.error("[Storage] Error fetching packages:", error);
        return [];
    }
};

/**
 * Updates a pricing package's details.
 */
export const updatePackage = async (packageId: string | number, updates: any, token?: string) => {
    try {
        console.log(`[Storage] updatePackage called for ID: ${packageId}`, updates);

        // USE SERVER API (Bypass Client RLS)
        const response = await fetch('/api/packages', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packageId, updates })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'API Update failed');
        }

        return true;
    } catch (error) {
        console.error("[Storage] Error updating package:", error);
        return false;
    }
};

/**
 * Creates a new pricing package via Server API.
 */
export const createPackage = async (packageData: any, token?: string) => {
    try {
        console.log(`[Storage] createPackage called`, packageData);

        // USE SERVER API (Bypass Client RLS)
        const response = await fetch('/api/packages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packageData })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'API Create failed');
        }

        return true;
    } catch (error) {
        console.error("[Storage] Error creating package:", error);
        return false;
    }
};

/**
 * Deletes a package via Server API.
 */
export const deletePackage = async (packageId: number) => {
    try {
        console.log(`[Storage] deletePackage called for ID: ${packageId}`);

        // USE SERVER API (Bypass Client RLS)
        const response = await fetch(`/api/packages?id=${packageId}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'API Delete failed');
        }

        return true;
    } catch (error) {
        console.error("[Storage] Error deleting package:", error);
        return false;
    }
};



// --- CATEGORY MANAGEMENT ---

/**
 * Fetches all categories via server API with caching.
 */
export const getAllCategories = async () => {
    try {
        // Try to get from cache first
        const cached = cacheService.get<any[]>(CACHE_KEYS.CATEGORIES);
        if (cached) {
            console.log("[Storage] Returning cached categories:", cached.length, "items");
            return cached;
        }

        console.log("[Storage] Fetching categories from API...");
        const response = await fetch('/api/resources/categories');

        if (!response.ok) {
            console.error("Error fetching categories from API:", response.status);
            return [];
        }

        const result = await response.json();
        console.log('[getAllCategories] Full API response:', result);

        const { data, success } = result;
        let categories = data || [];

        // Ensure categories is an array
        if (!Array.isArray(categories)) {
            console.error('[getAllCategories] Response data is not an array:', typeof categories, categories);
            return [];
        }

        // Custom sort: sort_order 1, 2, 3... first, then 0s at the end
        categories.sort((a: any, b: any) => {
            const orderA = a.sort_order || 0;
            const orderB = b.sort_order || 0;

            if (orderA === 0 && orderB !== 0) return 1;
            if (orderA !== 0 && orderB === 0) return -1;
            if (orderA === 0 && orderB === 0) return 0;
            return orderA - orderB;
        });

        // Cache the result
        cacheService.set(CACHE_KEYS.CATEGORIES, categories, CACHE_TTL.CATEGORIES);
        console.log("[Storage] Cached", categories.length, "categories");
        return categories;
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
};

/**
 * Creates a new category.
 */
export const createCategory = async (category: any, token?: string) => {
    try {
        const authToken = token || await getAccessToken();
        const response = await fetch('/api/resources/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(category)
        });
        const result = await response.json();

        if (!result.success) {
            console.error("Error creating category:", result.error);
            return false;
        }

        // Invalidate categories cache
        cacheService.remove(CACHE_KEYS.CATEGORIES);
        return true;
    } catch (error) {
        console.error("Error creating category:", error);
        return false;
    }
};

/**
 * Updates a category.
 */
export const updateCategory = async (categoryId: string, updates: any, token?: string) => {
    try {
        const authToken = token || await getAccessToken();
        const response = await fetch('/api/resources/categories', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ id: categoryId, ...updates })
        });
        const result = await response.json();

        if (!result.success) {
            console.error("Error updating category:", result.error);
            return false;
        }

        // Invalidate categories cache
        cacheService.remove(CACHE_KEYS.CATEGORIES);
        return true;
    } catch (error) {
        console.error("Error updating category:", error);
        return false;
    }
};

/**
 * Deletes a category.
 */
export const deleteCategory = async (categoryId: string, token?: string) => {
    try {
        const authToken = token || await getAccessToken();
        const response = await fetch(`/api/resources/categories?id=${categoryId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const result = await response.json();

        if (!result.success) {
            console.error("Error deleting category:", result.error);
            return false;
        }

        // Invalidate categories cache
        cacheService.remove(CACHE_KEYS.CATEGORIES);
        return true;
    } catch (error) {
        console.error("Error deleting category:", error);
        return false;
    }
};

// --- SYSTEM CONFIG MANAGEMENT ---

/**
 * Fetches all system configs.
 */
export const getAllSystemConfigs = async () => {
    try {
        console.log("[Storage] Fetching system configs from API...");
        const response = await fetch('/api/resources/system_configs');
        const result = await response.json();

        if (!result.success) {
            console.error("Error fetching system configs:", result.error);
            return [];
        }

        return result.data || [];
    } catch (error) {
        console.error("Error fetching system configs:", error);
        return [];
    }
};

/**
 * Creates a new system config.
 */
export const createSystemConfig = async (config: {
    config_key: string;
    config_value: string;
    value_type: 'string' | 'integer' | 'boolean';
    description?: string;
    is_public: boolean;
}, token?: string) => {
    try {
        const authToken = token || await getAccessToken();
        const response = await fetch('/api/resources/system_configs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(config)
        });
        const result = await response.json();

        if (!result.success) {
            console.error("Error creating system config:", result.error);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error creating system config:", error);
        return false;
    }
};

/**
 * Updates a system config.
 */
export const updateSystemConfig = async (configKey: string, updates: Partial<{
    config_value: string;
    value_type: 'string' | 'integer' | 'boolean';
    description: string;
    is_public: boolean;
}>, token?: string) => {
    try {
        const authToken = token || await getAccessToken();
        const response = await fetch('/api/resources/system_configs', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ config_key: configKey, ...updates })
        });
        const result = await response.json();

        if (!result.success) {
            console.error("Error updating system config:", result.error);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error updating system config:", error);
        return false;
    }
};

/**
 * Deletes a system config.
 */
export const deleteSystemConfig = async (configKey: string, token?: string) => {
    try {
        const authToken = token || await getAccessToken();
        const response = await fetch(`/api/resources/system_configs?id=${configKey}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const result = await response.json();

        if (!result.success) {
            console.error("Error deleting system config:", result.error);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error deleting system config:", error);
        return false;
    }
};

// --- HERO BANNER MANAGEMENT ---

/**
 * Fetches all hero banners, sorted by sort_order with caching.
 */
export const getAllBanners = async () => {
    try {
        // Try to get from cache first
        const cached = cacheService.get<any[]>(CACHE_KEYS.BANNERS);
        if (cached) {
            console.log("[Storage] Returning cached banners:", cached.length, "items");
            return cached;
        }

        console.log("[Storage] Fetching banners from API...");
        const response = await fetch('/api/resources/hero_banners');
        const result = await response.json();

        if (!result.success) {
            console.error("Error fetching banners:", result.error);
            return [];
        }

        const banners = result.data || [];

        // Cache the result
        cacheService.set(CACHE_KEYS.BANNERS, banners, CACHE_TTL.BANNERS);
        console.log("[Storage] Cached", banners.length, "banners");
        return banners;
    } catch (error) {
        console.error("Error fetching banners:", error);
        return [];
    }
};

/**
 * Creates a new hero banner.
 */
export const createBanner = async (banner: {
    title: { vi: string; en: string };
    description?: { vi: string; en: string };
    image_url: string;
    button_text?: { vi: string; en: string };
    button_link?: string;
    sort_order?: number;
    is_active?: boolean;
}, token?: string) => {
    try {
        const authToken = token || await getAccessToken();
        const response = await fetch('/api/resources/hero_banners', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(banner)
        });
        const result = await response.json();

        if (!result.success) {
            console.error("Error creating banner:", result.error);
            return false;
        }

        // Invalidate cache after creating
        cacheService.remove(CACHE_KEYS.BANNERS);
        return true;
    } catch (error) {
        console.error("Error creating banner:", error);
        return false;
    }
};

/**
 * Updates a hero banner.
 */
export const updateBanner = async (bannerId: number, updates: Partial<{
    title: { vi: string; en: string };
    description: { vi: string; en: string };
    image_url: string;
    button_text: { vi: string; en: string };
    button_link: string;
    sort_order: number;
    is_active: boolean;
}>, token?: string) => {
    try {
        const authToken = token || await getAccessToken();
        const response = await fetch('/api/resources/hero_banners', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ id: bannerId, ...updates })
        });
        const result = await response.json();

        if (!result.success) {
            console.error("Error updating banner:", result.error);
            return false;
        }

        // Invalidate cache after updating
        cacheService.remove(CACHE_KEYS.BANNERS);
        return true;
    } catch (error) {
        console.error("Error updating banner:", error);
        return false;
    }
};

/**
 * Deletes a hero banner.
 */
export const deleteBanner = async (bannerId: number, token?: string) => {
    try {
        const authToken = token || await getAccessToken();
        const response = await fetch(`/api/resources/hero_banners?id=${bannerId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const result = await response.json();

        if (!result.success) {
            console.error("Error deleting banner:", result.error);
            return false;
        }

        // Invalidate cache after deleting
        cacheService.remove(CACHE_KEYS.BANNERS);
        return true;
    } catch (error) {
        console.error("Error deleting banner:", error);
        return false;
    }
};

// --- STUDIO MANAGEMENT ---

/**
 * Fetches all studios.
 */
export const getAllStudios = async () => {
    try {
        console.log("[Storage] Fetching studios from API...");
        const response = await fetch('/api/resources/studio');
        const result = await response.json();

        if (!result.success) {
            console.error("Error fetching studios:", result.error);
            return [];
        }

        let studios = result.data || [];
        studios.sort((a: any, b: any) => {
            const orderA = a.sort_order || 0;
            const orderB = b.sort_order || 0;
            if (orderA === 0 && orderB !== 0) return 1;
            if (orderA !== 0 && orderB === 0) return -1;
            if (orderA === 0 && orderB === 0) return 0;
            return orderA - orderB;
        });

        return studios;
    } catch (error) {
        console.error("Error fetching studios:", error);
        return [];
    }
};

/**
 * Creates a new studio.
 */
export const createStudio = async (studio: any, token?: string) => {
    try {
        const authToken = token || await getAccessToken();
        const response = await fetch('/api/resources/studio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(studio)
        });
        const result = await response.json();

        if (!result.success) {
            console.error("Error creating studio:", result.error);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error creating studio:", error);
        return false;
    }
};

/**
 * Updates a studio.
 */
export const updateStudio = async (studioId: string, updates: any, token?: string) => {
    try {
        const authToken = token || await getAccessToken();
        const response = await fetch('/api/resources/studio', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ id: studioId, ...updates })
        });
        const result = await response.json();

        if (!result.success) {
            console.error("Error updating studio:", result.error);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error updating studio:", error);
        return false;
    }
};

/**
 * Deletes a studio.
 */
export const deleteStudio = async (studioId: string, token?: string) => {
    try {
        const authToken = token || await getAccessToken();
        const response = await fetch(`/api/resources/studio?id=${studioId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const result = await response.json();

        if (!result.success) {
            console.error("Error deleting studio:", result.error);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error deleting studio:", error);
        return false;
    }
};

export const getStudioBySlug = async (slug: string) => {
    try {
        // Reuse getAllStudios to leverage existing API logic and caching
        const studios = await getAllStudios();
        const found = studios.find((s: any) => s.slug === slug);
        return found || null;
    } catch (error) {
        console.error('Error fetching studio by slug (via API):', error);
        return null;
    }
};

// --- PROMPT MANAGEMENT ---

/**
 * Fetches all prompts via server API with caching.
 * Note: Cache key includes sortBy to cache different sort orders separately
 */
export const getAllPrompts = async (sortBy: 'created_at' | 'usage' = 'created_at') => {
    try {
        // Create cache key with sortBy parameter
        const cacheKey = `${CACHE_KEYS.PROMPTS}_${sortBy}`;

        // Try to get from cache first
        const cached = cacheService.get<any[]>(cacheKey);
        if (cached) {
            console.log(`[Storage] Returning cached prompts (sort: ${sortBy}):`, cached.length, "items");
            return cached;
        }

        console.log("[Storage] Fetching prompts from API. Sort:", sortBy);
        const response = await fetch('/api/resources/prompts');

        if (!response.ok) {
            console.error("[Storage] Error fetching prompts from API:", response.status);
            return [];
        }

        const { data } = await response.json();
        const prompts = data || [];

        // Client-side sort by requested field
        prompts.sort((a: any, b: any) => {
            const aVal = a[sortBy] || 0;
            const bVal = b[sortBy] || 0;
            return bVal > aVal ? 1 : -1; // Descending
        });

        // Cache the sorted result
        cacheService.set(cacheKey, prompts, CACHE_TTL.PROMPTS);
        console.log(`[Storage] Cached ${prompts.length} prompts (sort: ${sortBy})`);
        return prompts;
    } catch (error) {
        console.error("[Storage] Fatal error fetching prompts:", error);
        return [];
    }
};

/**
 * Creates a new prompt.
 */
export const createPrompt = async (prompt: any, token?: string) => {
    try {
        console.log("[Storage] createPrompt start");
        const authToken = token || await getAccessToken();
        console.log("[Storage] Token acquired:", !!authToken);
        console.log("[Storage] Creating prompt via Server API...");
        const response = await fetch('/api/resources/prompts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(prompt)
        });

        const result = await response.json();

        if (!result.success) {
            console.error("Error creating prompt:", result.error);
            return false;
        }

        // Invalidate all prompt caches (both sort orders)
        cacheService.remove(`${CACHE_KEYS.PROMPTS}_created_at`);
        cacheService.remove(`${CACHE_KEYS.PROMPTS}_usage`);
        return true;
    } catch (error) {
        console.error("Error creating prompt:", error);
        return false;
    }
};

/**
 * Updates a prompt.
 */
export const updatePrompt = async (promptId: string, updates: any, token?: string) => {
    try {
        console.log("[Storage] updatePrompt start");
        const authToken = token || await getAccessToken();
        console.log("[Storage] Token acquired for update:", !!authToken);
        console.log("[Storage] Updating prompt via Server API...");
        const response = await fetch('/api/resources/prompts', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ id: promptId, ...updates })
        });

        const result = await response.json();

        if (!result.success) {
            console.error("Error updating prompt:", result.error);
            return false;
        }

        // Invalidate all prompt caches
        cacheService.remove(`${CACHE_KEYS.PROMPTS}_created_at`);
        cacheService.remove(`${CACHE_KEYS.PROMPTS}_usage`);
        return true;
    } catch (error) {
        console.error("Error updating prompt:", error);
        return false;
    }
};

/**
 * Deletes a prompt.
 */
export const deletePrompt = async (promptId: string, token?: string) => {
    try {
        const authToken = token || await getAccessToken();
        console.log("[Storage] Deleting prompt via Server API...");
        const response = await fetch(`/api/resources/prompts?id=${promptId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const result = await response.json();

        if (!result.success) {
            console.error("Error deleting prompt:", result.error);
            return false;
        }

        // Invalidate all prompt caches
        cacheService.remove(`${CACHE_KEYS.PROMPTS}_created_at`);
        cacheService.remove(`${CACHE_KEYS.PROMPTS}_usage`);
        return true;
    } catch (error) {
        console.error("Error deleting prompt:", error);
        return false;
    }
};

/**
 * Increments the usage count of a prompt.
 */
export const incrementPromptUsage = async (promptId: number) => {
    try {
        console.warn("[Storage] incrementPromptUsage disabled during migration");
        return true;
        /*
        // First get current usage
        const { data: currentData, error: fetchError } = await supabase
            .from('prompts')
            .select('usage')
            .eq('id', promptId)
            .single();

        if (fetchError) {
            console.error("Error fetching prompt usage:", fetchError);
            return false;
        }

        const currentUsage = currentData?.usage || 0;
        const newUsage = currentUsage + 1;

        // Update with new usage
        const { error: updateError } = await supabase
            .from('prompts')
            .update({ usage: newUsage })
            .eq('id', promptId);

        if (updateError) {
            console.error("Error incrementing prompt usage:", updateError);
            return false;
        }
        return true;
        */
    } catch (error) {
        console.error("Error deleting prompt:", error);
        return false;
    }
};


