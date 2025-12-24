import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    loginGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    isLoggedIn: boolean;
    currentUser: string | null;
    role: string | null;
    token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Helper functions for role cache
    const getRoleCacheKey = (userId: string) => `role_cache_${userId}`;

    const getCachedRole = (userId: string): string | null => {
        if (typeof window === 'undefined') return null;
        try {
            const cached = localStorage.getItem(getRoleCacheKey(userId));
            if (!cached) return null;

            const { role, timestamp } = JSON.parse(cached);
            const TTL = 10 * 60 * 1000; // 10 minutes

            if (Date.now() - timestamp < TTL) {
                console.log('✅ Using cached role:', role);
                return role;
            }
            console.log('⏰ Cache expired, will fetch fresh');
            return null;
        } catch (e) {
            console.error('Error reading role cache:', e);
            return null;
        }
    };

    const setCachedRole = (userId: string, role: string) => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(getRoleCacheKey(userId), JSON.stringify({
                role,
                timestamp: Date.now()
            }));
            console.log('💾 Cached role:', role);
        } catch (e) {
            console.error('Error caching role:', e);
        }
    };

    const clearCachedRole = (userId: string) => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.removeItem(getRoleCacheKey(userId));
            console.log('🗑️ Cleared role cache');
        } catch (e) {
            console.error('Error clearing role cache:', e);
        }
    };

    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // DEBUG RENDER
    console.log('🔄 [AuthContext] Render. User:', user?.id || 'null', 'Loading:', isLoading);

    // Use ref to track timer to clear it from anywhere
    const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // SAFETY FALLBACK: Force loading to false after 5s
        safetyTimerRef.current = setTimeout(() => {
            setIsLoading(prev => {
                if (prev) {
                    console.warn('⚠️ [Auth] Safety timer triggered: Forcing isLoading to false after 5s');
                    return false;
                }
                return prev;
            });
        }, 5000);

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('🏁 [Auth] getSession completed. User:', session?.user?.id || 'none');
            // Only update if we have a session, OR if we don't have a user yet.
            // This prevents getSession (which might fail/return null on error) from overwriting
            // a valid user set by onAuthStateChange logic running in parallel.
            if (session?.user) {
                setUser(session.user);
                setToken(session.access_token);
                if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
            } else {
                // Only set null if we really intend to (and maybe check if onAuthStateChange handled it)
                // But for safety, let's rely on onAuthStateChange for the definitive state
                console.log('ℹ️ [Auth] getSession found no user (awaiting onAuthStateChange)');
            }

            // Check cache role...
            if (session?.user) {
                const cachedRole = getCachedRole(session.user.id);
                if (cachedRole) {
                    setUserRole(cachedRole);
                    setIsLoading(false);
                }
            }
        }).catch(err => {
            console.warn('⚠️ [Auth] getSession failed:', err);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('🔐 Supabase auth event:', event);

                // Clear safety timer immediately on any auth event
                if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);

                if (event === 'SIGNED_IN') {
                    console.log('✅ SIGNED_IN event received - OAuth login successful!');
                }

                if (session?.user) {
                    setUser(session.user);
                    console.log('� [AuthContext] Set User from AuthChange:', session.user.id);
                    setToken(session.access_token);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setUserRole(null);
                    setToken(null);
                }

                if (session?.user) {
                    try {
                        const { data, error } = await supabase
                            .from('users')
                            .select('role')
                            .eq('user_id', session.user.id)
                            .single();

                        if (data && data.role) {
                            console.log('👑 Fetched role from DB:', data.role);
                            setUserRole(data.role);
                            setCachedRole(session.user.id, data.role);
                        } else if (error) {
                            console.error('Error fetching role:', error);
                        }
                    } catch (e) {
                        console.error('Exception fetching role:', e);
                    }
                }

                if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                    // Background user ensure
                    if (session?.user) {
                        ensureUserExists(session.user).catch(err => console.error("Ensure user failed", err));
                    }
                }

                // Always update loading state
                setIsLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
            if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
        };
    }, []);

    // Handle OAuth redirect cleanup
    useEffect(() => {
        // Clean up URL after OAuth callback
        // Supabase automatically stores the token, we just need to clean the URL
        if (typeof window !== 'undefined' && window.location.hash) {
            // Check if hash contains auth-related parameters
            if (window.location.hash.includes('access_token') ||
                window.location.hash.includes('refresh_token')) {
                console.log('🔗 OAuth hash detected in URL');
                console.log('⏳ Waiting for Supabase to process tokens before cleanup...');

                // Small delay to ensure Supabase processes the hash first
                setTimeout(() => {
                    console.log('🔗 Cleaning up OAuth callback URL...');
                    // Use history API to remove hash without page reload
                    window.history.replaceState(
                        null,
                        '',
                        window.location.pathname + window.location.search
                    );
                }, 100); // 100ms delay to ensure Supabase reads hash first
            }
        }
    }, []);

    const loginGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`,
                }
            });

            if (error) throw error;
        } catch (error: any) {
            console.error("Login failed:", error);
            toast.error(`Đăng nhập thất bại: ${error.message}`);
        }
    };

    const logout = async () => {
        try {
            // Clear cache before logging out
            if (user) {
                clearCachedRole(user.id);
            }

            // Immediately clear user state for instant UI update
            setUser(null);
            setUserRole(null);

            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            toast.success('Đã đăng xuất.');
        } catch (error: any) {
            console.error("Logout failed:", error);
            toast.error('Đăng xuất thất bại.');
        }
    };

    const value = {
        user,
        role: userRole,
        isLoading,
        loginGoogle,
        logout,
        isLoggedIn: !!user,
        currentUser: user?.user_metadata?.full_name || user?.email || null,
        token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Helper function to ensure user exists in database
async function ensureUserExists(user: User) {
    try {
        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('user_id')
            .eq('user_id', user.id)
            .single();

        if (!existingUser) {
            // Check for potential guest credits to transfer
            let initialCredits = 20; // Default welcome bonus
            let guestIdToLink = null;

            if (typeof window !== 'undefined') {
                const storedGuestId = localStorage.getItem('guest_device_id');
                if (storedGuestId) {
                    guestIdToLink = storedGuestId;
                    // Attempt to fetch guest credits
                    // We need to import this dynamically or move the helper outside if circular dep risks exist,
                    // but they are in different files so it should be fine.
                    try {
                        // Assuming storageService is imported as `storageService` at top of file, 
                        // but currently it is NOT imported. I need to add import or update caller.
                        // Since I can't see imports here, I will rely on the `storageService` import being added or existing.
                        // Wait, I confirmed previous file view had `import { supabase } ...` but NO `storageService`.
                        // I MUST add the import first. I will do this in a separate edit or assume I can add it here if I replace enough lines.
                        // I'm replacing the bottom function, I can't easily add top-level import.
                        // I will assume I need to do a multi-replace or just inline the import? No, inline import is better for safety here.
                        const { transferGuestCreditsToUser } = await import('../services/storageService');
                        const guestCredits = await transferGuestCreditsToUser(storedGuestId);

                        if (guestCredits !== null) {
                            console.log(`🔄 Transferring ${guestCredits} credits from guest session...`);
                            initialCredits = guestCredits;
                        }
                    } catch (e) {
                        console.warn("Failed to transfer guest credits", e);
                    }
                }
            }

            // Create new user with 9-char ID
            const { error } = await supabase
                .from('users')
                .insert({
                    user_id: user.id,
                    user_type: 'registered',
                    email: user.email,
                    display_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    avatar_url: user.user_metadata?.avatar_url,
                    current_credits: initialCredits, // Initial or Transferred
                    role: 'user',
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error('Failed to create user:', error);
            } else {
                console.log(`New user created with ${initialCredits} credits`);
                if (initialCredits !== 20) {
                    toast.success(`Đã đồng bộ ${initialCredits} credits từ phiên khách!`);
                } else {
                    toast.success('Chào mừng! Bạn nhận được 20 credits miễn phí! 🎉');
                }
            }
        }
    } catch (error) {
        console.error('Error ensuring user exists:', error);
    }
}
