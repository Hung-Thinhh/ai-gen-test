import { supabase } from './client';

/**
 * Setup authentication state listener to handle token refresh and auth events
 * @returns Subscription object that can be used to unsubscribe
 */
export function setupAuthListener() {
    console.log('[Auth] Setting up auth state listener');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
            console.log('[Auth] Event:', event, 'Has session:', !!session);

            switch (event) {
                case 'SIGNED_IN':
                    console.log('[Auth] User signed in successfully');
                    break;

                case 'SIGNED_OUT':
                    console.log('[Auth] User signed out');
                    // Clear any cached data if needed
                    break;

                case 'TOKEN_REFRESHED':
                    console.log('[Auth] ✅ Token refreshed successfully');
                    break;

                case 'USER_UPDATED':
                    console.log('[Auth] User profile updated');
                    break;

                case 'PASSWORD_RECOVERY':
                    console.log('[Auth] Password recovery initiated');
                    break;

                default:
                    console.log('[Auth] Unhandled event:', event);
            }
        }
    );

    return subscription;
}

/**
 * Check if user is authenticated
 * @returns Promise<boolean>
 */
export async function isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
}

/**
 * Sign out the current user
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('[Auth] Sign out error:', error);
        throw error;
    }
    console.log('[Auth] User signed out successfully');
}
