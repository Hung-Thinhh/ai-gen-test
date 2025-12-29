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
        // SAFETY FALLBACK: Force loading to false after 2s (reduced from 5s for better UX)
        safetyTimerRef.current = setTimeout(() => {
            setIsLoading(prev => {
                if (prev) {
                    console.warn('⚠️ [Auth] Safety timer triggered: Forcing isLoading to false after 2s');
                    return false;
                }
                return prev;
            });
        }, 2000);  // ← Reduced from 5000ms to 2000ms

        // Get initial session and start role fetch in parallel
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('🏁 [Auth] getSession completed. User:', session?.user?.id || 'none');

            if (session?.user) {
                setUser(session.user);
                setToken(session.access_token);
                if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);

                // Check cache first
                const cachedRole = getCachedRole(session.user.id);
                if (cachedRole) {
                    console.log('⚡ [Auth] Using cached role from getSession:', cachedRole);
                    setUserRole(cachedRole);
                    setIsLoading(false);

                    // Background revalidation
                    supabase
                        .from('users')
                        .select('role')
                        .eq('user_id', session.user.id)
                        .single()
                        .then(({ data }) => {
                            if (data?.role && data.role !== cachedRole) {
                                console.log('👑 Role updated from background fetch:', data.role);
                                setUserRole(data.role);
                                setCachedRole(session.user.id, data.role);
                            }
                        });
                } else {
                    // No cache - optimistic render + parallel fetch
                    console.log('⚡ [Auth] Optimistic render from getSession');
                    setUserRole('user');
                    setIsLoading(false);

                    // Fetch real role in parallel (non-blocking)
                    supabase
                        .from('users')
                        .select('role')
                        .eq('user_id', session.user.id)
                        .single()
                        .then(({ data, error }) => {
                            if (data?.role) {
                                console.log('👑 Role fetched in parallel:', data.role);
                                setUserRole(data.role);
                                setCachedRole(session.user.id, data.role);
                            } else if (error) {
                                console.error('Error in parallel role fetch:', error);
                            }
                        });
                }
            } else {
                console.log('ℹ️ [Auth] getSession found no user (awaiting onAuthStateChange)');
            }
        }).catch(err => {
            console.warn('⚠️ [Auth] getSession failed:', err);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('🔐 Supabase auth event:', event);

                if (event === 'SIGNED_IN') {
                    console.log('✅ SIGNED_IN event received - OAuth login successful!');
                }

                if (session?.user) {
                    setUser(session.user);
                    console.log('👤 [AuthContext] Set User from AuthChange:', session.user.id);
                    setToken(session.access_token);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setUserRole(null);
                    setToken(null);
                }

                // Optimistic rendering for better performance
                let cacheHit = false;
                if (session?.user) {
                    const cachedRole = getCachedRole(session.user.id);

                    if (cachedRole) {
                        // Cache hit - instant unblock
                        setUserRole(cachedRole);
                        setIsLoading(false);
                        if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
                        cacheHit = true;
                        console.log('⚡ [Auth] Using cached role:', cachedRole);
                    } else {
                        // No cache - use optimistic rendering
                        // Assume 'user' role and unblock UI immediately
                        setUserRole('user');
                        setIsLoading(false);
                        if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
                        console.log('⚡ [Auth] Optimistic render with default "user" role');
                    }

                    // Background fetch to ensure freshness (always run)
                    const fetchRole = async () => {
                        console.log('🔍 [Auth] Fetching role from DB...');
                        try {
                            const { data, error } = await supabase
                                .from('users')
                                .select('role')
                                .eq('user_id', session.user.id)
                                .single();

                            if (data && data.role) {
                                const dbRole = data.role;
                                if (dbRole !== cachedRole) {
                                    console.log('👑 Role updated from DB:', dbRole);
                                    setUserRole(dbRole);
                                    setCachedRole(session.user.id, dbRole);
                                } else {
                                    console.log('👑 Role confirmed from DB:', dbRole);
                                }
                            } else if (error) {
                                console.error('Error fetching role:', error);
                            }
                        } catch (e) {
                            console.error('Exception fetching role:', e);
                        }
                    };

                    // Always fetch in background to revalidate
                    fetchRole();

                    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                        // Background user ensure
                        if (session?.user) {
                            // Ensure user exists in DB
                            // Ensure user exists in DB
                            ensureUserExists(session.user).catch((err: any) => console.error("Ensure user failed", err));
                        }
                    }
                } else {
                    // No user - Guest mode
                    // Unblock UI immediately for guests (no need to wait)
                    console.log("⚡ [Auth] Guest user - instant unblock");
                    setIsLoading(false);
                    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
                }
            });

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
            // Check for potential guest credits to transfer - DISABLED per new requirement
            let initialCredits = 10; // Fixed 10 credits for new users (No accumulation)

            // Create new user with 9-char ID
            const { error } = await supabase
                .from('users')
                .insert({
                    user_id: user.id,
                    user_type: 'registered',
                    email: user.email,
                    display_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    avatar_url: user.user_metadata?.avatar_url,
                    current_credits: initialCredits,
                    role: 'user',
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error('Failed to create user:', error);
            } else {
                console.log(`New user created with ${initialCredits} credits`);
                toast.success('Chào mừng! Bạn nhận được 10 credits miễn phí! 🎉');
            }
        }
    } catch (error) {
        console.error('Error ensuring user exists:', error);
    }
}
