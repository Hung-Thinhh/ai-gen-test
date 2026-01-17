import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/users - Get all users (admin only) or current user profile
 * GET /api/users?userId=xxx - Get specific user (admin only)
 * GET /api/users?all=true - Get all users (admin only)
 */
export async function GET(req: NextRequest) {
    try {
        // Get session from NextAuth
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userEmail = session.user.email;

        // Get current user data from Neon
        const currentUserData = await sql`
            SELECT * FROM users WHERE email = ${userEmail} LIMIT 1
        `;

        if (!currentUserData || currentUserData.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const currentUser = currentUserData[0];

        // Check if requesting all users (admin only)
        const { searchParams } = new URL(req.url);
        const getAllUsers = searchParams.get('all') === 'true';
        const requestedUserId = searchParams.get('userId');

        if (getAllUsers) {
            // Check if user is admin
            if (currentUser.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
            }

            // Get all users with their purchased package info
            const allUsers = await sql`
                SELECT 
                    u.*,
                    pt.package_id as purchased_package_id
                FROM users u
                LEFT JOIN LATERAL (
                    SELECT package_id 
                    FROM payment_transactions 
                    WHERE user_id::text = u.user_id::text
                    AND status = 'completed'
                    ORDER BY completed_at DESC 
                    LIMIT 1
                ) pt ON true
                ORDER BY u.created_at DESC
            `;

            return NextResponse.json({ users: allUsers });
        }

        if (requestedUserId && requestedUserId !== currentUser.user_id) {
            // Check if user is admin for accessing other user data
            if (currentUser.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            // Get specific user
            const userData = await sql`
                SELECT * FROM users 
                WHERE user_id = ${requestedUserId}
                LIMIT 1
            `;

            if (!userData || userData.length === 0) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            return NextResponse.json({ user: userData[0] });
        }

        // Return current user data
        return NextResponse.json({ user: currentUser });

    } catch (error: any) {
        console.error('[API] Error in GET /api/users:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

/**
 * POST /api/users - Create new user (self-registration)
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { email, full_name, user_id } = body;

        // Validate input
        if (!email || !user_id) {
            return NextResponse.json({ error: 'Email and user_id are required' }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await sql`
            SELECT * FROM users WHERE user_id = ${user_id} LIMIT 1
        `;

        if (existingUser && existingUser.length > 0) {
            // User exists, return existing data
            return NextResponse.json({ user: existingUser[0], created: false });
        }

        // Create new user with default credits
        const newUser = await sql`
            INSERT INTO users (
                user_id, 
                email, 
                display_name, 
                current_credits, 
                role,
                created_at
            )
            VALUES (
                ${user_id},
                ${email},
                ${full_name || email.split('@')[0]},
                10,
                'user',
                NOW()
            )
            RETURNING *
        `;

        return NextResponse.json({ user: newUser[0], created: true }, { status: 201 });

    } catch (error: any) {
        console.error('[API] Error in POST /api/users:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

/**
 * PATCH /api/users - Update user profile
 */
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current user
        const currentUserData = await sql`
            SELECT * FROM users WHERE email = ${session.user.email} LIMIT 1
        `;

        if (!currentUserData || currentUserData.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const currentUser = currentUserData[0];
        const body = await req.json();
        const { user_id, role, current_credits, plan } = body;

        console.log('[API] PATCH /api/users - Received body:', body);
        console.log('[API] Parsed values:', { user_id, role, current_credits, plan });
        console.log('[API] current_credits type:', typeof current_credits);
        console.log(`
                UPDATE users
                SET 
                    current_credits = COALESCE(${current_credits !== undefined ? current_credits : null}, current_credits),
                    updated_at = NOW()
                WHERE user_id = '${user_id}'
                RETURNING *
            `);

        // If updating another user, check admin permission
        if (user_id && user_id !== currentUser.user_id) {
            console.log('[API] Admin updating user:', { user_id, role, current_credits });

            if (currentUser.role !== 'admin') {
                console.log('[API] Permission denied - user is not admin');
                return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
            }

            // Admin updating another user
            const updateData = await sql`
                UPDATE users
                SET 
                    role = COALESCE(${role}, role),
                    current_credits = COALESCE(${current_credits !== undefined ? current_credits : null}, current_credits),
                    updated_at = NOW()
                WHERE user_id = ${user_id}
                RETURNING *
            `;

            console.log('[API] Update result:', updateData);

            if (!updateData || updateData.length === 0) {
                console.log('[API] User not found after update');
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            console.log('[API] Returning updated user:', updateData[0]);
            return NextResponse.json({ user: updateData[0] });
        }

        // User updating their own profile (limited fields)
        const { display_name, avatar_url } = body;

        const updatedUser = await sql`
            UPDATE users
            SET 
                display_name = COALESCE(${display_name}, display_name),
                avatar_url = COALESCE(${avatar_url}, avatar_url),
                updated_at = NOW()
            WHERE user_id = ${currentUser.user_id}
            RETURNING *
        `;

        return NextResponse.json({ user: updatedUser[0] });

    } catch (error: any) {
        console.error('[API] Error in PATCH /api/users:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
