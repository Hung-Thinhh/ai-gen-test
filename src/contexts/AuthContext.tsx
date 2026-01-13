import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { getUserRole } from '../services/storageService';
import { useSession, signOut } from "next-auth/react";
import toast from 'react-hot-toast';

// User type (simplified from Supabase User)
interface User {
    id: string;
    email: string | null;
    user_metadata?: {
        avatar_url?: string;
        full_name?: string;
    };
}

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
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // NextAuth Hook
    const { data: session, status } = useSession();

    // Helper functions for role cache
    const getRoleCacheKey = (userId: string) => `role_cache_${userId}`;

    const setCachedRole = (userId: string, role: string) => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(getRoleCacheKey(userId), JSON.stringify({
                role,
                timestamp: Date.now()
            }));
        } catch (e) { console.error(e); }
    };

    const getCachedRole = (userId: string): string | null => {
        if (typeof window === 'undefined') return null;
        try {
            const cached = localStorage.getItem(getRoleCacheKey(userId));
            if (!cached) return null;
            const { role } = JSON.parse(cached); // Simple TTL check skipped for brevity, reliant on fresh fetch
            return role;
        } catch (e) { return null; }
    };

    const clearCachedRole = (userId: string) => {
        if (typeof window === 'undefined') return;
        try { localStorage.removeItem(getRoleCacheKey(userId)); } catch (e) { }
    };

    // Primary Auth Effect
    useEffect(() => {
        console.log('🔄 [AuthContext] Status:', status);

        if (status === 'loading') return;

        if (status === 'unauthenticated') {
            setUser(null);
            setUserRole(null);
            setToken(null);
            setIsLoading(false);
            return;
        }

        if (status === 'authenticated' && session?.user) {
            const sessionUserId = (session.user as any).id || (session.user as any).user_id;
            console.log('✅ [AuthContext] Authenticated via NextAuth:', sessionUserId);

            // Construct User object from Session
            const nextAuthUser = {
                id: sessionUserId,
                email: session.user.email,
                user_metadata: {
                    avatar_url: session.user.image,
                    full_name: session.user.name
                },
                app_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString()
            } as User;

            setUser(nextAuthUser);
            setToken((session as any).accessToken || 'next-auth-session-token');

            // Optimistic Role Set
            const cached = getCachedRole(sessionUserId);
            if (cached) setUserRole(cached);

            // Fetch Fresh Data (Role & Credits)
            // Use API instead of direct DB
            fetch('/api/user/me')
                .then(res => res.json())
                .then(userData => {
                    if (userData && !userData.error) {
                        setUserRole(userData.role);
                        setCachedRole(sessionUserId, userData.role);
                        window.dispatchEvent(new CustomEvent('user-credits-updated', {
                            detail: { credits: userData.current_credits }
                        }));
                    }
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch initial user data:", err);
                    setIsLoading(false);
                });
        }
    }, [session, status]);

    // Handle manual refresh
    useEffect(() => {
        const handleRefresh = async () => {
            if (status !== 'authenticated') return;
            console.log('🔄 [Auth] Refreshing user data via API...');
            try {
                const res = await fetch('/api/user/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.role) setUserRole(data.role);
                    window.dispatchEvent(new CustomEvent('user-credits-updated', {
                        detail: { credits: data.current_credits }
                    }));
                }
            } catch (e) {
                console.error("Error refreshing user data:", e);
            }
        };
        window.addEventListener('refresh-user-data', handleRefresh);
        return () => window.removeEventListener('refresh-user-data', handleRefresh);
    }, [status]);

    const loginGoogle = async () => {
        try {
            const { signIn } = await import('next-auth/react');
            await signIn('google', { callbackUrl: '/', redirect: true });
        } catch (error: any) {
            toast.error(`Login failed: ${error.message}`);
        }
    };

    const logout = async () => {
        if (user) clearCachedRole(user.id);
        setUser(null);
        setUserRole(null);

        // Sign out NextAuth
        const { signOut: nextAuthSignOut } = await import('next-auth/react');
        await nextAuthSignOut({ redirect: false });

        window.dispatchEvent(new CustomEvent('user-logged-out'));
        window.location.href = '/';
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

