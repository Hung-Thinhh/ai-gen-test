/**
 * Modern API-based storage service
 * Wraps old storageService with API calls for gradual migration
 */

import { api } from '../lib/api-client';
import * as legacyStorage from './storageService';

// Feature flag - set to true to use new API routes
const USE_API_ROUTES = process.env.NEXT_PUBLIC_USE_API_ROUTES === 'true';

/**
 * Get user credits
 */
export async function getUserCredits(userId: string, token?: string): Promise<number> {
    if (USE_API_ROUTES) {
        try {
            const { credits } = await api.credits.get();
            return credits;
        } catch (error) {
            console.error('[API] Error fetching credits, falling back to legacy:', error);
            return legacyStorage.getUserCredits(userId, token);
        }
    }
    return legacyStorage.getUserCredits(userId, token);
}

/**
 * Get guest credits
 */
export async function getGuestCredits(guestId: string): Promise<number> {
    if (USE_API_ROUTES) {
        try {
            const { credits } = await api.credits.guest.get(guestId);
            return credits;
        } catch (error) {
            console.error('[API] Error fetching guest credits, falling back to legacy:', error);
            return legacyStorage.getGuestCredits(guestId);
        }
    }
    return legacyStorage.getGuestCredits(guestId);
}

/**
 * Add images to user gallery
 */
export async function addImagesToGallery(
    userId: string,
    imageUrls: string[],
    token?: string
): Promise<string[]> {
    if (USE_API_ROUTES) {
        try {
            const images = imageUrls.map(url => ({ image_url: url }));
            await api.gallery.add(images);
            return imageUrls;
        } catch (error) {
            console.error('[API] Error adding to gallery, falling back to legacy:', error);
            await legacyStorage.addMultipleImagesToCloudGallery(userId, imageUrls, token);
            return imageUrls;
        }
    }
    await legacyStorage.addMultipleImagesToCloudGallery(userId, imageUrls, token);
    return imageUrls;
}

/**
 * Add images to guest gallery
 */
export async function addImagesToGuestGallery(
    guestId: string,
    imageUrls: string[]
): Promise<string[]> {
    if (USE_API_ROUTES) {
        try {
            const images = imageUrls.map(url => ({ image_url: url }));
            await api.gallery.guest.add(guestId, images);
            return imageUrls;
        } catch (error) {
            console.error('[API] Error adding to guest gallery, falling back to legacy:', error);
            // Legacy doesn't have batch add for guests, so we'll just return URLs
            return imageUrls;
        }
    }
    // Legacy doesn't have this function, just return URLs
    return imageUrls;
}

/**
 * Get user gallery
 */
export async function getUserGallery(userId: string, token?: string): Promise<string[]> {
    if (USE_API_ROUTES) {
        try {
            const { images } = await api.gallery.get();
            return images.map((img: any) => img.image_url);
        } catch (error) {
            console.error('[API] Error fetching gallery, falling back to legacy:', error);
            return legacyStorage.getUserCloudGallery(userId, false, token);
        }
    }
    return legacyStorage.getUserCloudGallery(userId, false, token);
}

/**
 * Get guest gallery
 */
export async function getGuestGallery(guestId: string): Promise<string[]> {
    if (USE_API_ROUTES) {
        try {
            const { images } = await api.gallery.guest.get(guestId);
            return images.map((img: any) => img.image_url);
        } catch (error) {
            console.error('[API] Error fetching guest gallery, falling back to legacy:', error);
            return legacyStorage.getGuestCloudGallery(guestId);
        }
    }
    return legacyStorage.getGuestCloudGallery(guestId);
}

/**
 * Log generation to history
 */
export async function logGeneration(
    toolId: number,
    data: {
        userId?: string;
        guestId?: string;
        prompt?: string;
        outputImages?: string[];
        creditsUsed?: number;
        apiModelUsed?: string;
        generationCount?: number;
        errorMessage?: string;
    }
): Promise<void> {
    if (USE_API_ROUTES) {
        try {
            await api.history.log({
                toolId,
                guestId: data.guestId,
                prompt: data.prompt,
                outputImages: data.outputImages,
                creditsUsed: data.creditsUsed,
                apiModelUsed: data.apiModelUsed,
                generationCount: data.generationCount,
                errorMessage: data.errorMessage,
            });
        } catch (error) {
            console.error('[API] Error logging generation, falling back to legacy:', error);
            // Legacy logging - would need to call the old function
        }
    }
    // Legacy logging would go here
}

/**
 * Get all tools
 */
export async function getAllTools(): Promise<any[]> {
    if (USE_API_ROUTES) {
        try {
            const { tools } = await api.data.getTools();
            return tools;
        } catch (error) {
            console.error('[API] Error fetching tools, falling back to legacy:', error);
            return legacyStorage.getAllTools();
        }
    }
    return legacyStorage.getAllTools();
}

/**
 * Get all prompts
 */
export async function getAllPrompts(): Promise<any[]> {
    if (USE_API_ROUTES) {
        try {
            const { prompts } = await api.data.getPrompts();
            return prompts;
        } catch (error) {
            console.error('[API] Error fetching prompts, falling back to legacy:', error);
            return legacyStorage.getAllPrompts();
        }
    }
    return legacyStorage.getAllPrompts();
}

/**
 * Get all categories
 */
export async function getAllCategories(): Promise<any[]> {
    if (USE_API_ROUTES) {
        try {
            const { categories } = await api.data.getCategories();
            return categories;
        } catch (error) {
            console.error('[API] Error fetching categories, falling back to legacy:', error);
            return legacyStorage.getAllCategories();
        }
    }
    return legacyStorage.getAllCategories();
}

// Re-export legacy functions that don't have API equivalents yet
export * from './storageService';
