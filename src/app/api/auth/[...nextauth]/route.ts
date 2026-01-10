
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getUserByEmail, createUser } from "@/lib/neon/queries";
import { createClient } from "@supabase/supabase-js";

// Keep Supabase client ONLY for password authentication
// (Neon doesn't have built-in auth, so we still use Supabase Auth for credentials login)
const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
        async signIn({ user, account, profile }) {
            // Only auto-create for OAuth providers (Google)
            if (account?.provider === 'google' && user.email) {
                try {
                    console.log('[NextAuth] Checking if user exists:', user.email);

                    // Check if user already exists using Neon
                    const existingUser = await getUserByEmail(user.email);

                    if (!existingUser) {
                        console.log('[NextAuth] Creating new user:', user.email);

                        // Create new user with default credits
                        const newUser = await createUser({
                            user_id: user.id,
                            email: user.email!,
                            display_name: user.name || user.email?.split('@')[0],
                            avatar_url: user.image || undefined,
                            user_type: 'registered',
                            current_credits: 10,
                            role: 'user'
                        });

                        if (!newUser) {
                            console.error('[NextAuth] Failed to create user (result is null)');
                        } else {
                            console.log('[NextAuth] ✅ User created successfully');
                        }
                    } else {
                        console.log('[NextAuth] User already exists');
                    }
                } catch (error) {
                    console.error('[NextAuth] Error in signIn callback:', error);
                    // Don't block login on error
                }
            }
            return true; // Allow sign in
        },
        async jwt({ token, user, account, trigger }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.accessToken = (user as any).accessToken;
            }

            // Only fetch user data on:
            // 1. Initial sign-in (user exists)
            // 2. Explicit update trigger
            // 3. No cached data exists
            // This prevents excessive DB queries on tab refocus
            const shouldFetch = user || trigger === 'update' || !token.userData;

            if (token.email && shouldFetch) {
                try {
                    const userData = await getUserByEmail(token.email as string);

                    if (userData) {
                        token.userData = userData;
                        token.id = userData.user_id;
                        console.log('[NextAuth] ✅ User data refreshed from Neon:', {
                            email: userData.email,
                            role: userData.role,
                            credits: userData.current_credits
                        });
                    }
                } catch (error) {
                    console.error('[NextAuth] Error fetching user data:', error);
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
    secret: process.env.NEXTAUTH_SECRET || "super-secret-secret", // Ensure this env var is set or fallback
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
