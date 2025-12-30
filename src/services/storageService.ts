import { log } from 'console';
import { supabase } from '../lib/supabase/client';
import { uploadToCloudinary } from './cloudinaryService';
import { cacheService, CACHE_KEYS, CACHE_TTL } from './cacheService';
const USERS_TABLE = "users";
const PROFILES_TABLE = "profiles";
const GUESTS_TABLE = "guest_sessions";

// Helper interface for guest history
interface GuestHistoryItem {
    url: string;
    timestamp: number;
}

// Helper for timeouts
// Helper for timeouts
const promiseWithTimeout = <T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> => {
    return Promise.race([
        Promise.resolve(promise),
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout: ${label} took longer than ${ms}ms`)), ms))
    ]);
};


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
        } catch (e) { /* ignore */ }
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

/**
 * Uploads a Base64 image to Cloudinary (Replaces Firebase Storage) and returns the download URL.
 * @param userId The ID of the user.
 * @param base64Data The Base64 string of the image.
 * @param folder The folder path.
 */
export const uploadImageToCloud = async (userId: string, base64Data: string, folder: string = "gallery"): Promise<string> => {
    try {
        // Use Cloudinary Service
        const storagePath = `users/${userId}/${folder}`;
        const downloadUrl = await uploadToCloudinary(base64Data, storagePath);
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

        // 1. Get current gallery
        const currentGallery = await getUserCloudGallery(userId, true, token);

        // 2. Add new images
        const newGallery = [...currentGallery, ...imageUrls];
        console.log(`[Storage] Saving gallery for user ${userId}, count: ${newGallery.length}`);

        // 3. Upsert with Retry
        await executeWithRetry(
            'addMultipleImagesToCloudGallery',
            async (client) => client
                .from(PROFILES_TABLE)
                .upsert({
                    id: userId,
                    gallery: newGallery,
                    last_updated: new Date().toISOString()
                }, { onConflict: 'id' }),
            token
        );

        console.log("[Storage] Save success.");

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
        const fetchOp = async (client: any) => client
            .from(PROFILES_TABLE)
            .select('gallery')
            .eq('id', userId)
            .maybeSingle();

        let data, error;

        if (useFreshClient) {
            const result = await executeWithRetry('getUserCloudGallery', fetchOp, token);
            data = result.data;
            error = result.error;
        } else {
            const result = await fetchOp(supabase);
            data = result.data;
            error = result.error;
        }

        if (error) {
            if (error.code === 'PGRST116') return [];
            console.error("Error fetching cloud gallery:", error);
            return [];
        }

        if (data && data.gallery) {
            return Array.isArray(data.gallery) ? [...data.gallery].reverse() : [];
        }
        return [];

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
        // Fetch current gallery with retry
        const fetchResult = await executeWithRetry(
            'removeImageFromCloudGallery_Fetch',
            async (client) => client
                .from(PROFILES_TABLE)
                .select('gallery')
                .eq('id', userId)
                .maybeSingle(),
            token
        );

        if (fetchResult.error) throw fetchResult.error;
        const data = fetchResult.data as { gallery: string[] } | null; // Cast for TS

        const rawGallery: string[] = Array.isArray(data?.gallery) ? data.gallery : [];
        const filteredRAWGallery = rawGallery.filter(url => url !== imageUrl);

        // Update with retry
        const updateResult = await executeWithRetry(
            'removeImageFromCloudGallery_Update',
            async (client) => client
                .from(PROFILES_TABLE)
                .update({
                    gallery: filteredRAWGallery,
                    last_updated: new Date().toISOString()
                })
                .eq('id', userId),
            token
        );

        if (updateResult.error) throw updateResult.error;

    } catch (error) {
        console.error("Error removing image from cloud gallery:", error);
        throw error;
    }
};

// --- GUEST HANDLING ---

/**
 * Uploads a guest generated image to Cloudinary.
 */
export const uploadGuestImage = async (guestId: string, base64Data: string): Promise<string> => {
    try {
        // Use Cloudinary Service
        const storagePath = `guests/${guestId}`;
        const downloadUrl = await uploadToCloudinary(base64Data, storagePath);
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
        const client = getFreshClient(); // Explicitly use fresh client for read-modify-write
        const { data } = await client
            .from(GUESTS_TABLE)
            .select('history')
            .eq('guest_id', guestId)
            .maybeSingle();

        let currentHistory: any[] = [];
        if (data && Array.isArray(data.history)) {
            currentHistory = data.history;
        }

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
        const { error } = await client
            .from(GUESTS_TABLE)
            .upsert(updateData, { onConflict: 'guest_id' });

        if (error) throw error;
        console.log(`[Storage] Guest session updated for ${guestId}, history count: ${currentHistory.length}`);

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
        const client = token ? getFreshClient(token) : supabase;
        const { data, error } = await client
            .from(USERS_TABLE)
            .select('current_credits')
            .eq('user_id', userId)
            .maybeSingle(); // Use maybeSingle to handle new users

        if (error) {
            console.error("[getUserCredits] Error fetching user credits:", error);
            // Return 0 instead of throwing to prevent UI crashes
            return 0;
        }

        if (!data) {
            console.warn("[getUserCredits] No user data found for userId:", userId, "- User may be newly created");
            // Return 0 for new users instead of throwing error
            return 0;
        }

        const credits = data.current_credits ?? 0;
        console.log(`[getUserCredits] User ${userId}: ${credits} credits`);
        return credits;
    } catch (error: any) {
        console.error("[getUserCredits] Exception:", error);
        // Return 0 instead of throwing to prevent UI crashes
        return 0;
    }
};

/**
 * Gets the current credits for a guest.
 * @throws Error if unable to fetch credits
 */
export const getGuestCredits = async (guestId: string): Promise<number> => {
    try {
        const { data, error } = await supabase
            .from(GUESTS_TABLE)
            .select('credits')
            .eq('guest_id', guestId)
            .maybeSingle();

        if (error) {
            // Ignore missing column error (old schema)
            if (error.code === '42703') {
                console.warn('Guest credits column not found, returning default');
                return 3;
            }
            console.error("Error fetching guest credits:", error);
            throw new Error(`Failed to fetch guest credits: ${error.message}`);
        }

        // If no record found, guest hasn't been created yet
        if (!data) {
            console.log(`[getGuestCredits] No record for ${guestId}, returning default 3`);
            return 3; // Default for new guests
        }

        const credits = data.credits ?? 3;
        console.log(`[getGuestCredits] Guest ${guestId}: ${credits} credits`);
        return credits;
    } catch (error: any) {
        console.error("Error in getGuestCredits:", error);
        // Re-throw to let caller handle
        throw error;
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
        // Since it's guest data, strict ACID is less critical than UX speed, but let's try to be safe.
        // Use upsert to handle both existing and new guest sessions
        // This ensures the row exists (create if missing) and updates credits
        const { data, error } = await supabase
            .from(GUESTS_TABLE)
            .upsert({ guest_id: guestId, credits: current - amount }, { onConflict: 'guest_id' })
            .select('credits')
            .single();

        if (error) {
            console.error("Guest credit deduction FAILED (DB Error):", JSON.stringify(error));
            // Do NOT soft fail. Return -1 to block generation if we can't save.
            // This prevents "Infinite Credits" glitch on reload.
            return -1;
        }

        return data?.credits ?? (current - amount);
    } catch (error) {
        console.error("Error in deductGuestCredit:", error);
        return -1;
    }
};

/**
 * Deducts credits from a registered user's capability.
 * Returns the new balance or -1 if deduction failed (e.g. insufficient funds).
 */
// ... (helper to get access token)
const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
};

/**
 * Deducts credits from a registered user's capability.
 * Returns the new balance or -1 if deduction failed (e.g. insufficient funds).
 */
const getFreshClient = (accessToken?: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    // Dynamic import to avoid circular dependencies if any
    const { createClient } = require('@supabase/supabase-js');

    const options: any = {
        auth: {
            persistSession: false // stateless request
        }
    };

    if (accessToken) {
        options.global = {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        };
    }

    return createClient(supabaseUrl, supabaseAnonKey, options);
}

/**
 * Deducts credits from a registered user's capability.
 * Returns the new balance or -1 if deduction failed (e.g. insufficient funds).
 */
export const deductUserCredit = async (userId: string, amount: number = 1, token?: string): Promise<number> => {
    try {
        console.log(`[Storage] deductUserCredit called for ${userId}`);

        let client = supabase;
        let shouldUseFreshClient = false;

        // If token is explicitly provided (likely due to previous failures or just good practice), 
        // we could jump effectively to fresh client? 
        // BUT strict logic says logic: try global first. 
        // ACTUALLY, if we are passed a token, it might be safer to use fresh client immediately if global is unreliable.
        // But let's keep existing fallback logic to not change behavior too much, 
        // EXCEPT if fallback is triggered, use the passed token.

        // Try with global client first, wrapped in timeout
        try {
            // 1. Fetch user credits with timeout
            const fetchPromise = client
                .from(USERS_TABLE)
                .select('current_credits')
                .eq('user_id', userId)
                .single();

            const { data: user, error: fetchError } = await promiseWithTimeout<any>(
                fetchPromise,
                3000, // Short timeout for first attempt
                'fetchUserCredits_Global'
            );

            if (!fetchError && user) {
                if (user.current_credits < amount) {
                    console.log(`[Storage] Insufficient credits: ${user.current_credits} < ${amount}`);
                    return -1;
                }

                const newBalance = user.current_credits - amount;
                const updatePromise = client
                    .from(USERS_TABLE)
                    .update({ current_credits: newBalance })
                    .eq('user_id', userId);

                const { error: updateError } = await promiseWithTimeout<any>(
                    updatePromise,
                    5000,
                    'updateUserCredits_Global'
                );

                if (!updateError) {
                    console.log("[Storage] Deduct success (Global), new balance:", newBalance);
                    return newBalance;
                }
            } else if (fetchError) {
                console.warn("Global client fetch error:", fetchError);
                shouldUseFreshClient = true;
            }

        } catch (e) {
            console.warn("Global client timed out or failed, switching to fresh client fallback...", e);
            shouldUseFreshClient = true;
        }

        // Use executeWithRetry for robust JWT handling
        const result = await executeWithRetry('deductUserCredit', async (client) => {
            // 1. Fetch
            const { data: user, error: fetchError } = await client
                .from(USERS_TABLE)
                .select('current_credits')
                .eq('user_id', userId)
                .single();

            if (fetchError) {
                return { data: null, error: fetchError };
            }

            if (!user || user.current_credits < amount) {
                // Not an error per se, but logic failure
                return { data: -1, error: null }; // Custom signal
            }

            const newBalance = user.current_credits - amount;

            // 2. Update
            const { error: updateError } = await client
                .from(USERS_TABLE)
                .update({ current_credits: newBalance })
                .eq('user_id', userId);

            if (updateError) return { data: null, error: updateError };

            return { data: newBalance, error: null };

        }, token);

        if (result.error) {
            console.error("Error in deductUserCredit (Retry Wrapper):", result.error);
            return -1;
        }

        const balance = result.data as number;
        if (balance !== -1) {
            console.log("[Storage] Deduct success (Retry Wrapper), new balance:", balance);
        }
        return balance;

    } catch (error) {
        console.error("Error in deductUserCredit (Fatal):", error);
        return -1;
    }
};


/**
 * Transfers guest credits to a user.
 * actually returns the credit amount to be used for the new user.
 */
export const transferGuestCreditsToUser = async (guestId: string): Promise<number | null> => {
    try {
        const { data, error } = await supabase
            .from(GUESTS_TABLE)
            .select('current_credits')
            .eq('guest_id', guestId)
            .maybeSingle();

        if (error || !data) return null;

        return data.current_credits;
    } catch (error) {
        return null;
    }
};

/**
 * Fetches the guest's gallery from Supabase.
 */
export const getGuestCloudGallery = async (guestId: string, useFreshClient: boolean = false): Promise<string[]> => {
    try {
        const client = useFreshClient ? getFreshClient() : supabase;

        const { data, error } = await client
            .from(GUESTS_TABLE)
            .select('history')
            .eq('guest_id', guestId)
            .maybeSingle();

        if (error) return [];

        if (data && Array.isArray(data.history)) {
            // Extract URLs and reverse
            return data.history.map((item: any) => item.url).reverse();
        }
        return [];
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
        const client = getFreshClient(token);

        // Fetch from 'profiles' table.
        const { data, error } = await client
            .from(USERS_TABLE)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching all users:", error);
            return [];
        }
        return data || [];
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
        const client = getFreshClient(token);
        const { error } = await client
            .from(USERS_TABLE)
            .update(updates)
            .eq('user_id', userId);

        if (error) throw error;
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

    // Special fallback key
    const FALLBACK_KEY = '___FALLBACK_TOOL_ID___';
    if (toolIdCache.has(FALLBACK_KEY) && !appIdOrName) return toolIdCache.get(FALLBACK_KEY)!;

    try {
        // 1. Try matching by tool_key (formerly slug)
        // Note: DB column is tool_key, PK is tool_id
        let { data } = await supabase
            .from('tools')
            .select('tool_id')
            .eq('tool_key', appIdOrName)
            .maybeSingle();

        if (data) {
            toolIdCache.set(appIdOrName, data.tool_id);
            return data.tool_id;
        }

        // 2. Check if it's already a numeric ID
        const asNum = parseInt(appIdOrName);
        if (!isNaN(asNum)) {
            const { data: dataId } = await supabase
                .from('tools')
                .select('tool_id')
                .eq('tool_id', asNum)
                .maybeSingle();
            if (dataId) {
                toolIdCache.set(appIdOrName, dataId.tool_id);
                return dataId.tool_id;
            }
        }

        console.warn(`[Storage] Could not resolve tool_id for '${appIdOrName}'. Trying fallback...`);

        // 3. FALLBACK: Get ANY valid tool ID (e.g. the first one) to ensure FK constraint passes
        // We prefer a tool named 'general' or 'unknown' but any is better than crashing
        if (toolIdCache.has(FALLBACK_KEY)) {
            const fallbackId = toolIdCache.get(FALLBACK_KEY)!;
            console.log(`[Storage] Using cached fallback tool_id: ${fallbackId} for '${appIdOrName}'`);
            return fallbackId;
        }

        // Try to find a tool that looks generic, or just the first one
        // Try to find a tool that looks generic, or just the first one
        const { data: fallbackData } = await supabase
            .from('tools')
            .select('tool_id')
            .limit(1)
            .maybeSingle();

        if (fallbackData) {
            console.log(`[Storage] Resolved fallback tool_id: ${fallbackData.tool_id}`);
            toolIdCache.set(FALLBACK_KEY, fallbackData.tool_id);
            // Also cache this appId to map to this fallback so we don't retry lookup
            toolIdCache.set(appIdOrName, fallbackData.tool_id);
            return fallbackData.tool_id;
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
export const createTool = async (tool: any) => {
    try {
        const { data, error } = await supabase
            .from('tools')
            .insert([tool])
            .select();

        if (error) {
            console.error("Error creating tool:", error);
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
        const response = await fetch('/api/data/tools');

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
export const updateTool = async (toolId: string | number, updates: any, token?: string) => {
    try {
        console.log(`[Storage] updateTool called for ID: ${toolId} (Type: ${typeof toolId})`, updates);

        // Define the operation
        const dbOperation = async (client: any) => {
            const { data, error } = await client
                .from('tools')
                .update(updates)
                .eq('tool_id', toolId)
                .select(); // Request returned data to check if row was touched

            if (!error && data && data.length === 0) {
                console.warn(`[Storage] Update succeeded but 0 rows modified. check RLS or ID: ${toolId}`);
                // We can treat this as a soft error or just log it. 
                // For debugging, let's treat it as a failure to alert the user.
                return { data: false, error: new Error(`Update executed but user or tool not found (RLS or bad ID). ID: ${toolId}`) };
            }

            return { data: !error, error };
        };

        // Wrap with timeout and retry
        const result = await executeWithRetry('updateTool', async (client) => {
            // Internal timeout just for the DB call part to catch network hangs
            const timeoutPromise = new Promise<{ data: any, error: any }>((_, reject) =>
                setTimeout(() => reject(new Error("DB Update Timed Out")), 10000)
            );

            return Promise.race([
                dbOperation(client),
                timeoutPromise
            ]);
        }, token);

        if (result.error) {
            console.error("[Storage] updateTool failed inside retry wrapper:", result.error);
            throw result.error;
        }

        console.log(`[Storage] updateTool success`);
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
        const client = getFreshClient(token);

        let resolvedToolId = entry.tool_id;

        // If tool_id is missing or 0, try to resolve from appId provided in entry (if any)
        // entry usually comes from MainApp.tsx logGeneration which has appId
        if (!resolvedToolId && entry.appId) {
            const foundId = await getToolId(entry.appId);
            if (foundId) resolvedToolId = foundId;
        }

        // Fetch base_credit_cost from tools table
        let baseCreditCost = 0;
        if (resolvedToolId) {
            try {
                const { data: toolData, error: toolError } = await client
                    .from('tools')
                    .select('base_credit_cost')
                    .eq('tool_id', resolvedToolId)
                    .single();

                if (!toolError && toolData) {
                    baseCreditCost = toolData.base_credit_cost || 0;
                    console.log(`[Storage] Tool ${resolvedToolId} base_credit_cost: ${baseCreditCost}`);
                } else {
                    console.warn(`[Storage] Could not fetch base_credit_cost for tool ${resolvedToolId}:`, toolError);
                }
            } catch (err) {
                console.warn(`[Storage] Exception fetching base_credit_cost:`, err);
            }
        }

        // Calculate credits_used = base_credit_cost * generation_count
        const generationCount = entry.generation_count || 1;
        const calculatedCreditsUsed = baseCreditCost * generationCount;

        // If entry already has credits_used (legacy), use it. Otherwise use calculated value
        const finalCreditsUsed = entry.credits_used !== undefined && entry.credits_used !== 0
            ? entry.credits_used
            : calculatedCreditsUsed;

        console.log(`[Storage] Credits calculation: ${baseCreditCost} (base) * ${generationCount} (count) = ${calculatedCreditsUsed} credits`);

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

        // Use executeWithRetry
        await executeWithRetry('logGenerationHistory', async (client) => {
            const { error } = await client
                .from('generation_history')
                .insert(dbEntry);
            return { data: null, error };
        }, token);

        console.log(`[Storage] Generation log saved. Tool ID: ${resolvedToolId}, Credits used: ${finalCreditsUsed}`);
    } catch (error) {
        console.error("Error in logGenerationHistory:", error);
    }
};

// --- PACKAGE / PRICING HELPERS ---

/**
 * Fetches all pricing packages from the database.
 */
export const getAllPackages = async () => {
    try {
        const { data, error } = await supabase
            .from('packages')
            .select('*')
            .order('price_vnd', { ascending: true }); // Order by price

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching packages:", error);
        return [];
    }
};

/**
 * Updates a pricing package's details.
 */
export const updatePackage = async (packageId: string | number, updates: any, token?: string) => {
    try {
        console.log(`[Storage] updatePackage called for ID: ${packageId}`, updates);

        const dbOperation = async (client: any) => {
            const { data, error } = await client
                .from('packages')
                .update(updates)
                .eq('package_id', packageId)
                .select();

            if (!error && data && data.length === 0) {
                return { data: false, error: new Error(`Update executed but package not found (RLS or bad ID). ID: ${packageId}`) };
            }

            return { data: !error, error };
        };

        const result = await executeWithRetry('updatePackage', async (client) => {
            const timeoutPromise = new Promise<{ data: any, error: any }>((_, reject) =>
                setTimeout(() => reject(new Error("DB Update Timed Out")), 10000)
            );

            return Promise.race([
                dbOperation(client),
                timeoutPromise
            ]);
        }, token);

        if (result.error) {
            throw result.error;
        }

        return true;
    } catch (error) {
        console.error("Error updating package:", error);
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
        const response = await fetch('/api/data/categories');

        if (!response.ok) {
            console.error("Error fetching categories from API:", response.status);
            return [];
        }

        const { data } = await response.json();
        let categories = data || [];

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
export const createCategory = async (category: any) => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .insert([category])
            .select();

        if (error) {
            console.error("Error creating category:", error);
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
export const updateCategory = async (categoryId: string, updates: any) => {
    try {
        const { error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', categoryId);

        if (error) {
            console.error("Error updating category:", error);
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
export const deleteCategory = async (categoryId: string) => {
    try {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', categoryId);

        if (error) {
            console.error("Error deleting category:", error);
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
        const { data, error } = await supabase
            .from('system_configs')
            .select('*')
            .order('config_key', { ascending: true });

        if (error) {
            console.error("Error fetching system configs:", error);
            return [];
        }

        return data || [];
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
}) => {
    try {
        const { data, error } = await supabase
            .from('system_configs')
            .insert([config])
            .select();

        if (error) {
            console.error("Error creating system config:", error);
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
}>) => {
    try {
        const { error } = await supabase
            .from('system_configs')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('config_key', configKey);

        if (error) {
            console.error("Error updating system config:", error);
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
export const deleteSystemConfig = async (configKey: string) => {
    try {
        const { error } = await supabase
            .from('system_configs')
            .delete()
            .eq('config_key', configKey);

        if (error) {
            console.error("Error deleting system config:", error);
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

        console.log("[Storage] Fetching banners from database...");
        const { data, error } = await supabase
            .from('hero_banners')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            console.error("Error fetching banners:", error);
            return [];
        }

        const banners = data || [];

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
}) => {
    try {
        const { data, error } = await supabase
            .from('hero_banners')
            .insert([banner])
            .select();

        if (error) {
            console.error("Error creating banner:", error);
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
}>) => {
    try {
        const { error } = await supabase
            .from('hero_banners')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', bannerId);

        if (error) {
            console.error("Error updating banner:", error);
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
export const deleteBanner = async (bannerId: number) => {
    try {
        const { error } = await supabase
            .from('hero_banners')
            .delete()
            .eq('id', bannerId);

        if (error) {
            console.error("Error deleting banner:", error);
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
        const { data, error } = await supabase
            .from('studio')
            .select('*')
            .order('sort_order', { ascending: true })
            .select('*, prompts, categories(name)'); // Fetch category name

        if (error) {
            console.error("Error fetching studios:", error);
            return [];
        }

        let studios = data || [];
        studios.sort((a, b) => {
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
export const createStudio = async (studio: any) => {
    try {
        const { data, error } = await supabase
            .from('studio')
            .insert([studio])
            .select();

        if (error) {
            console.error("Error creating studio:", error);
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
export const updateStudio = async (studioId: string, updates: any) => {
    try {
        const { error } = await supabase
            .from('studio')
            .update(updates)
            .eq('id', studioId);

        if (error) {
            console.error("Error updating studio:", error);
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
export const deleteStudio = async (studioId: string) => {
    try {
        const { error } = await supabase
            .from('studio')
            .delete()
            .eq('id', studioId);

        if (error) {
            console.error("Error deleting studio:", error);
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
        const { data, error } = await supabase
            .from('studio')
            .select(`
                *,
                categories:category (name)
            `)
            .eq('slug', slug)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching studio by slug:', error);
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
        const response = await fetch('/api/data/prompts');

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
export const createPrompt = async (prompt: any) => {
    try {
        const { data, error } = await supabase
            .from('prompts')
            .insert([prompt])
            .select();

        if (error) {
            console.error("Error creating prompt:", error);
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
export const updatePrompt = async (promptId: string, updates: any) => {
    try {
        const { error } = await supabase
            .from('prompts')
            .update(updates)
            .eq('id', promptId);

        if (error) {
            console.error("Error updating prompt:", error);
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
export const deletePrompt = async (promptId: string) => {
    try {
        const { error } = await supabase
            .from('prompts')
            .delete()
            .eq('id', promptId);

        if (error) {
            console.error("Error deleting prompt:", error);
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
            console.error("Error updating prompt usage:", updateError);
            return false;
        }

        // Invalidate usage-sorted cache (most likely to be affected)
        // Keep created_at cache as it won't change order
        cacheService.remove(`${CACHE_KEYS.PROMPTS}_usage`);
        return true;
    } catch (error) {
        console.error("Error incrementing prompt usage:", error);
        return false;
    }
};


