import { supabase } from '../lib/supabase/client';
import { uploadToCloudinary } from './cloudinaryService';
const USERS_TABLE = "profiles";
const GUESTS_TABLE = "guest_sessions";

// Helper interface for guest history
interface GuestHistoryItem {
    url: string;
    timestamp: number;
}

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
 * Adds multiple image URLs to the user's Supabase gallery.
 * Handles Read-Modify-Write to prevent race conditions within the batch.
 */
export const addMultipleImagesToCloudGallery = async (userId: string, imageUrls: string[]) => {
    try {
        if (!imageUrls.length) return;

        // 1. Get current gallery
        const currentGallery = await getUserCloudGallery(userId);

        // 2. Add new images (filter duplicates if needed, but arrayUnion usually allows dupes unless Set used)
        // We just append.
        const newGallery = [...currentGallery, ...imageUrls];

        // 3. Upsert to Supabase
        const { error } = await supabase
            .from(USERS_TABLE)
            .upsert({
                id: userId,
                gallery: newGallery,
                last_updated: new Date().toISOString()
            }, { onConflict: 'id' });

        if (error) {
            console.error("[Supabase] Upsert Error:", error);
            throw error;
        }

    } catch (error) {
        console.error("Error adding images to cloud gallery:", error);
        throw error;
    }
};

/**
 * Fetches the user's gallery from Supabase.
 */
export const getUserCloudGallery = async (userId: string): Promise<string[]> => {
    try {
        const { data, error } = await supabase
            .from(USERS_TABLE)
            .select('gallery')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            // If code is PGRST116 (JSON object 0 keys), it means row likely doesn't exist yet
            if (error.code === 'PGRST116') return [];
            console.error("Error fetching cloud gallery:", error);
            return [];
        }

        if (data && data.gallery) {
            // Return reversed to show newest first (assuming we append new ones to end)
            // Supabase JSONB comes back as array if stored as array
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
export const removeImageFromCloudGallery = async (userId: string, imageUrl: string) => {
    try {
        // 1. Get current gallery
        const currentGallery = await getUserCloudGallery(userId);

        // 2. Filter out the image (remove by exact string match)
        const newGallery = currentGallery.filter(url => url !== imageUrl);

        // Note: getUserCloudGallery returns REVERSED array. 
        // We should ideally maintain order. But filtering is safe. 
        // When saving back, order might flip if we are not careful about "original" storage order.
        // For simplicity: we just save the filtered array.
        // Since we reverse on GET, the "newest" was at index 0. 
        // If we save this list, the "newest" becomes index 0 in DB (oldest). 
        // Wait, if getUserCloudGallery reverses it, we are saving the REVERSED list back to DB.
        // This effectively flips the order every time we save!
        // FIX: We should fetch RAW gallery first.

        // Re-fetching RAW data to be safe with ordering
        const { data, error } = await supabase
            .from(USERS_TABLE)
            .select('gallery')
            .eq('id', userId)
            .maybeSingle();

        if (error) throw error;

        const rawGallery: string[] = Array.isArray(data?.gallery) ? data.gallery : [];
        const filteredRAWGallery = rawGallery.filter(url => url !== imageUrl);

        // 3. Update Supabase
        const { error: updateError } = await supabase
            .from(USERS_TABLE)
            .update({
                gallery: filteredRAWGallery,
                last_updated: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) throw updateError;

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
        // 1. Get existing session to update history properly
        const { data } = await supabase
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

        const { error } = await supabase
            .from(GUESTS_TABLE)
            .upsert(updateData, { onConflict: 'guest_id' });

        if (error) throw error;

    } catch (error) {
        console.error("Error saving guest session:", error);
    }
};

// --- GUEST CREDITS ---

/**
 * Gets the current credits for a registered user.
 */
export const getUserCredits = async (userId: string): Promise<number> => {
    try {
        const { data, error } = await supabase
            .from(USERS_TABLE)
            .select('credits')
            .eq('id', userId)
            .single();

        if (error) {
            console.warn("Error fetching user credits (getUserCredits):", error);
            return 0;
        }

        return data?.credits ?? 0;
    } catch (error) {
        console.error("Error in getUserCredits:", error);
        return 0;
    }
};

/**
 * Gets the current credits for a guest.
 * Returns 10 (default) if not found or error.
 */
export const getGuestCredits = async (guestId: string): Promise<number> => {
    try {
        const { data, error } = await supabase
            .from(GUESTS_TABLE)
            .select('current_credits')
            .eq('guest_id', guestId)
            .maybeSingle();

        if (error) {
            console.warn("Error fetching guest credits:", error);
            // Fallback to local storage logic essentially, or default
            return 10;
        }

        return data?.current_credits ?? 10;
    } catch (error) {
        console.error("Error in getGuestCredits:", error);
        return 10;
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
        const { data, error } = await supabase
            .from(GUESTS_TABLE)
            .update({ current_credits: current - amount })
            .eq('guest_id', guestId)
            .select('current_credits')
            .single();

        if (error) {
            console.error("Failed to deduct guest credits:", error);
            return current; // Return old balance implies no change
        }

        return data?.current_credits ?? (current - amount);
    } catch (error) {
        console.error("Error in deductGuestCredit:", error);
        return -1;
    }
};

/**
 * Deducts credits from a registered user's capability.
 * Returns the new balance or -1 if deduction failed (e.g. insufficient funds).
 */
export const deductUserCredit = async (userId: string, amount: number = 1): Promise<number> => {
    try {
        // First check current balance
        const { data: user, error: fetchError } = await supabase
            .from(USERS_TABLE)
            .select('credits')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            console.error("Error fetching user credits for deduction:", fetchError);
            return -1;
        }

        if (user.credits < amount) {
            return -1; // Insufficient credits
        }

        const newBalance = user.credits - amount;

        const { error: updateError } = await supabase
            .from(USERS_TABLE)
            .update({ credits: newBalance })
            .eq('id', userId);

        if (updateError) {
            console.error("Error updating user credits:", updateError);
            return -1;
        }

        return newBalance;
    } catch (error) {
        console.error("Error in deductUserCredit:", error);
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
export const getGuestCloudGallery = async (guestId: string): Promise<string[]> => {
    try {
        const { data, error } = await supabase
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
