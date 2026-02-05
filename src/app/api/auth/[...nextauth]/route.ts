
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getUserByEmail, createUser } from "@/lib/postgres/queries";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { headers } from "next/headers";

// Keep Supabase client ONLY for password authentication
// (Neon doesn't have built-in auth, so we still use Supabase Auth for credentials login)
const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get the base URL from environment or request headers
const getBaseUrl = () => {
    // Use VERCEL_URL if available (Vercel deployment)
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    // Use NEXTAUTH_URL if set
    if (process.env.NEXTAUTH_URL) {
        return process.env.NEXTAUTH_URL;
    }
    // Default to production domain
    return "https://dukyai.com";
};

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const supabase = supabaseAuth;

                const { data, error } = await supabase.auth.signInWithPassword({
                    email: credentials.email,
                    password: credentials.password,
                });

                if (error || !data.user) {
                    console.error("NextAuth Login Error:", error);
                    return null;
                }

                // Return user object with access_token to be persisted in JWT
                return {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata?.full_name || data.user.email,
                    accessToken: data.session?.access_token,
                };
            }
        })
    ],
    pages: {
        signIn: '/admin/login',
    },
    callbacks: {
        async redirect({ url, baseUrl }) {
            // Use our custom base URL detection
            const siteUrl = getBaseUrl();

            // If url is relative, prepend siteUrl
            if (url.startsWith('/')) return `${siteUrl}${url}`;
            // If url is on the same site, allow it
            if (url.startsWith(siteUrl)) return url;
            // Default to home page
            return siteUrl;
        },
        async signIn({ user, account, profile }) {
            // Only auto-create for OAuth providers (Google)
            if (account?.provider === 'google' && user.email) {
                try {
                    console.log('=== [NextAuth signIn] Starting ===');
                    console.log('[NextAuth] Provider:', account.provider);
                    console.log('[NextAuth] User email:', user.email);
                    console.log('[NextAuth] User ID from Google:', user.id);
                    console.log('[NextAuth] User name:', user.name);

                    // Check if user already exists using Neon
                    console.log('[NextAuth] Checking if user exists in DB...');
                    const existingUser = await getUserByEmail(user.email);

                    if (!existingUser) {
                        console.log('[NextAuth] ❌ User does NOT exist. Creating new user...');

                        // Create new user with credits from system_config
                        // Generate UUID for user_id (Google ID is numeric, DB expects UUID)
                        const uuid = crypto.randomUUID();
                        console.log('[NextAuth] Generating UUID for new user:', uuid);

                        const newUser = await createUser({
                            user_id: uuid,
                            email: user.email!,
                            display_name: user.name || user.email?.split('@')[0],
                            avatar_url: user.image || undefined,
                            user_type: 'registered',
                            role: 'user'
                        });

                        if (!newUser) {
                            console.error('[NextAuth] ❌ CRITICAL: createUser returned null/undefined');
                        } else {
                            console.log('[NextAuth] ✅ User created successfully');
                            console.log('[NextAuth] New user data:', newUser);
                        }
                    } else {
                        console.log('[NextAuth] ✅ User already exists:', existingUser.email);
                        console.log('[NextAuth] Existing user_id:', existingUser.user_id);
                    }
                    console.log('=== [NextAuth signIn] Complete ===');
                } catch (error) {
                    console.error('=== [NextAuth signIn] ERROR ===');
                    console.error('[NextAuth] Error in signIn callback:', error);
                    console.error('[NextAuth] Error stack:', (error as Error).stack);
                    // Don't block login on error
                }
            } else {
                console.log('[NextAuth] Skipping user creation - not Google or no email');
            }
            return true; // Allow sign in
        },
        async jwt({ token, user, account, trigger }) {
            // Store email from initial sign in
            if (user && user.email) {
                token.email = user.email;
                token.accessToken = (user as any).accessToken;
            }

            // Fetch user data from DB by email when:
            // 1. Initial sign-in (user exists)
            // 2. Explicit update trigger (e.g., after credit change)
            // 3. No cached UUID exists
            const shouldFetch = user || trigger === 'update' || !token.id;

            if (token.email && shouldFetch) {
                try {
                    const userData = await getUserByEmail(token.email as string);

                    if (userData) {
                        token.userData = userData;
                        token.id = userData.user_id; // Always use UUID from DB
                        console.log('[NextAuth JWT] ✅ Loaded user data:', {
                            email: userData.email,
                            user_id: userData.user_id,
                            role: userData.role,
                            credits: userData.current_credits
                        });
                    } else {
                        console.warn('[NextAuth JWT] ⚠️ User not found in DB for email:', token.email);
                    }
                } catch (error) {
                    console.error('[NextAuth JWT] Error fetching user data:', error);
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).accessToken = token.accessToken;

                // Add full user data to session
                if (token.userData) {
                    (session.user as any).userData = token.userData;
                    (session.user as any).role = (token.userData as any).role;
                    (session.user as any).credits = (token.userData as any).current_credits;
                    (session.user as any).displayName = (token.userData as any).display_name;
                }
            }
            return session;
        }
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
