/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ModelVersion = 'v2' | 'v3';

// Read from environment variables with fallback defaults
const V2_LIMIT = parseInt(process.env.NEXT_PUBLIC_GEMINI_V2_LIMIT || '50', 10);
const V3_LIMIT = parseInt(process.env.NEXT_PUBLIC_GEMINI_V3_LIMIT || '50', 10);

const USAGE_LIMITS: Record<ModelVersion, number> = {
    v2: V2_LIMIT,
    v3: V3_LIMIT,
};

const STORAGE_KEYS: Record<ModelVersion, string> = {
    v2: 'gemini_v2_usage_count',
    v3: 'gemini_v3_usage_count',
};

/**
 * Get current usage count for a model version from localStorage
 */
export const getUsageCount = (version: ModelVersion): number => {
    if (typeof window === 'undefined') return 0;
    const stored = localStorage.getItem(STORAGE_KEYS[version]);
    return stored ? parseInt(stored, 10) : 0;
};

/**
 * Increment usage count for a model version after successful API call
 */
export function incrementUsage(version: ModelVersion): void {
    const current = getUsageCount(version);
    localStorage.setItem(STORAGE_KEYS[version], (current + 1).toString());
}

/**
 * Get remaining uses for a model version
 */
export function getRemainingUses(version: ModelVersion): number {
    const used = getUsageCount(version);
    const limit = USAGE_LIMITS[version];
    return Math.max(0, limit - used);
}

/**
 * Check if user can still use a model version
 */
export function canUseModel(version: ModelVersion): boolean {
    return getRemainingUses(version) > 0;
}

/**
 * Get usage limit for a model version
 */
export function getUsageLimit(version: ModelVersion): number {
    return USAGE_LIMITS[version];
}

/**
 * Reset usage count for a model version (admin function)
 */
export function resetUsage(version: ModelVersion): void {
    localStorage.removeItem(STORAGE_KEYS[version]);
}

/**
 * Reset all usage counts (admin function)
 */
export function resetAllUsage(): void {
    resetUsage('v2');
    resetUsage('v3');
}
