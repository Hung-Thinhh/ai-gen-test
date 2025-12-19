import React, { createContext, useContext, useEffect, useState } from 'react';
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

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setUser(session?.user ?? null);
            setToken(session?.access_token ?? null);

            // Fetch role immediately for initial session
            if (session?.user) {
                // Try cache first
                const cachedRole = getCachedRole(session.user.id);
                if (cachedRole) {
                    setUserRole(cachedRole);
                    setIsLoading(false); // Can show UI immediately!

                    // Still fetch in background to update cache
                    console.log('🔄 Fetching fresh role in background...');
                    supabase
                        .from('users')
                        .select('role')
                        .eq('user_id', session.user.id)
                        .single()
                        .then(({ data }) => {
                            if (data?.role && data.role !== cachedRole) {
                                console.log('⚠️ Role changed on server, updating cache');
                                setUserRole(data.role);
                                setCachedRole(session.user.id, data.role);
                            }
                        });
                    return;
                }

                // No cache, fetch from DB
                console.log('🔍 [Initial Load] No cache, fetching role for user:', session.user.id);
                try {
                    const { data, error } = await supabase
                        .from('users')
                        .select('role')
                        .eq('user_id', session.user.id)
                        .single();

                    if (error) {
                        console.warn('⚠️ [Initial Load] Could not fetch role (RLS or missing user), defaulting to "user":', error);
                        setUserRole('user');
                        setCachedRole(session.user.id, 'user');
                    } else {
                        console.log('👤 [Initial Load] Role data from DB:', data);
                        const fetchedRole = data?.role || 'user';
                        console.log('✅ [Initial Load] Setting user role to:', fetchedRole);
                        setUserRole(fetchedRole);
                        setCachedRole(session.user.id, fetchedRole);
                    }
                } catch (err) {
                    console.warn('⚠️ [Initial Load] Exception fetching role, defaulting to "user":', err);
                    setUserRole('user');
                    setCachedRole(session.user.id, 'user');
                }
            }

            setIsLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('🔐 Supabase auth event:', event);

                // ✅ Log chi tiết khi SIGNED_IN để confirm OAuth thành công
                if (event === 'SIGNED_IN') {
                    console.log('✅ SIGNED_IN event received - OAuth login successful!');
                }

                if (session) {
                    console.log('📦 Session Info:', {
                        access_token: session.access_token.substring(0, 20) + '...',
                        refresh_token: session.refresh_token ? session.refresh_token.substring(0, 20) + '...' : 'none',
                        expires_at: new Date(session.expires_at! * 1000).toLocaleString(),
                        expires_in: session.expires_in,
                    });

                    console.log('👤 User Info:', {
                        id: session.user.id,
                        email: session.user.email,
                        user_metadata: session.user.user_metadata,
                        app_metadata: session.user.app_metadata,
                        created_at: session.user.created_at,
                    });
                }

                if (session?.user) {
                    // Fetch role
                    console.log('🔍 Fetching role for user:', session.user.id);
                    try {
                        const { data, error } = await supabase
                            .from('users')
                            .select('role')
                            .eq('user_id', session.user.id)
                            .single();

                        if (error) {
                            console.warn('⚠️ Could not fetch role (RLS or missing user), defaulting to "user":', error);
                            setUserRole('user');
                            setCachedRole(session.user.id, 'user');
                        } else {
                            console.log('👤 Role data from DB:', data);
                            const fetchedRole = data?.role || 'user';
                            console.log('✅ Setting user role to:', fetchedRole);
                            setUserRole(fetchedRole);
                            setCachedRole(session.user.id, fetchedRole); // Cache it
                        }
                    } catch (err) {
                        console.warn('⚠️ Exception fetching role, defaulting to "user":', err);
                        setUserRole('user');
                        setCachedRole(session.user.id, 'user');
                    }
                } else {
                    setUserRole(null);
                }

                setUser(session?.user ?? null);
                setToken(session?.access_token ?? null);

                // Create/update user in database when signed in
                if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
                    console.log('✅ User authenticated, ensuring database record...');
                    await ensureUserExists(session.user);
                }

                // Handle token refresh
                if (event === 'TOKEN_REFRESHED') {
                    console.log('🔄 Token refreshed successfully');
                }

                // Always update loading state after processing
                if (isLoading) {
                    setIsLoading(false);
                }
            }
        );

        return () => subscription.unsubscribe();
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
