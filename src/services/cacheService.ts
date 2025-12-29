/**
 * Cache Service - Manages localStorage caching with TTL (Time To Live)
 * Helps reduce API calls by caching frequently accessed data
 */

interface CacheItem<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

class CacheService {
    private prefix = 'duky_cache_';

    /**
     * Set data in cache with TTL
     * @param key - Cache key
     * @param data - Data to cache
     * @param ttlMinutes - Time to live in minutes (default: 30 minutes)
     */
    set<T>(key: string, data: T, ttlMinutes: number = 30): void {
        try {
            const cacheItem: CacheItem<T> = {
                data,
                timestamp: Date.now(),
                ttl: ttlMinutes * 60 * 1000 // Convert to milliseconds
            };
            localStorage.setItem(this.prefix + key, JSON.stringify(cacheItem));
            console.log(`[Cache] Saved "${key}" with TTL: ${ttlMinutes} minutes`);
        } catch (error) {
            console.error(`[Cache] Error saving "${key}":`, error);
            // If localStorage is full, clear old cache
            this.clearExpired();
        }
    }

    /**
     * Get data from cache if not expired
     * @param key - Cache key
     * @returns Cached data or null if expired/not found
     */
    get<T>(key: string): T | null {
        try {
            const cached = localStorage.getItem(this.prefix + key);
            if (!cached) {
                console.log(`[Cache] Miss: "${key}" not found`);
                return null;
            }

            const cacheItem: CacheItem<T> = JSON.parse(cached);
            const now = Date.now();
            const age = now - cacheItem.timestamp;

            // Check if cache is expired
            if (age > cacheItem.ttl) {
                console.log(`[Cache] Expired: "${key}" (age: ${Math.round(age / 1000)}s, ttl: ${Math.round(cacheItem.ttl / 1000)}s)`);
                this.remove(key);
                return null;
            }

            console.log(`[Cache] Hit: "${key}" (age: ${Math.round(age / 1000)}s)`);
            return cacheItem.data;
        } catch (error) {
            console.error(`[Cache] Error reading "${key}":`, error);
            this.remove(key);
            return null;
        }
    }

    /**
     * Remove specific cache item
     * @param key - Cache key
     */
    remove(key: string): void {
        localStorage.removeItem(this.prefix + key);
        console.log(`[Cache] Removed: "${key}"`);
    }

    /**
     * Clear all expired cache items
     */
    clearExpired(): void {
        const keys = Object.keys(localStorage);
        let cleared = 0;

        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                try {
                    const cached = localStorage.getItem(key);
                    if (cached) {
                        const cacheItem: CacheItem<any> = JSON.parse(cached);
                        const now = Date.now();
                        const age = now - cacheItem.timestamp;

                        if (age > cacheItem.ttl) {
                            localStorage.removeItem(key);
                            cleared++;
                        }
                    }
                } catch (error) {
                    // Remove corrupted cache
                    localStorage.removeItem(key);
                    cleared++;
                }
            }
        });

        if (cleared > 0) {
            console.log(`[Cache] Cleared ${cleared} expired items`);
        }
    }

    /**
     * Clear all cache items (force refresh)
     */
    clearAll(): void {
        const keys = Object.keys(localStorage);
        let cleared = 0;

        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
                cleared++;
            }
        });

        console.log(`[Cache] Cleared all cache (${cleared} items)`);
    }

    /**
     * Get cache statistics
     */
    getStats(): { total: number; expired: number; active: number } {
        const keys = Object.keys(localStorage);
        let total = 0;
        let expired = 0;
        let active = 0;

        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                total++;
                try {
                    const cached = localStorage.getItem(key);
                    if (cached) {
                        const cacheItem: CacheItem<any> = JSON.parse(cached);
                        const now = Date.now();
                        const age = now - cacheItem.timestamp;

                        if (age > cacheItem.ttl) {
                            expired++;
                        } else {
                            active++;
                        }
                    }
                } catch (error) {
                    expired++;
                }
            }
        });

        return { total, expired, active };
    }
}

// Export singleton instance
export const cacheService = new CacheService();

// Cache keys constants
export const CACHE_KEYS = {
    BANNERS: 'banners',
    TOOLS: 'tools',
    CATEGORIES: 'categories',
    PROMPTS: 'prompts',
    PACKAGES: 'packages'
};

// Default TTL values (in minutes)
export const CACHE_TTL = {
    BANNERS: 60,      // 1 hour - banners don't change often
    TOOLS: 30,        // 30 minutes - tools might be updated
    CATEGORIES: 60,   // 1 hour
    PROMPTS: 15,      // 15 minutes - prompts might be added frequently
    PACKAGES: 120     // 2 hours - pricing rarely changes
};
