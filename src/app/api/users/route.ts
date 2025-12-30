import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/users - Get current user profile
 * GET /api/users?userId=xxx - Get specific user (admin only)
 */
export async function GET(req: NextRequest) {
    try {
        // Get auth token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Check if requesting specific user (admin only)
        const { searchParams } = new URL(req.url);
        const requestedUserId = searchParams.get('userId');

        if (requestedUserId && requestedUserId !== user.id) {
            // Check if user is admin
            const { data: userData } = await supabaseAdmin
                .from('users')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (userData?.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        const targetUserId = requestedUserId || user.id;

        // Get user data
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('user_id', targetUserId)
            .single();

        if (error) {
            console.error('[API] Error fetching user:', error);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user: data });

    } catch (error: any) {
        console.error('[API] Error in GET /api/users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/users - Create new user (self-registration)
 */
export async function POST(req: NextRequest) {
    try {
        // Get auth token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await req.json();
        const { email, full_name } = body;

        // Validate input
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('user_id')
            .eq('user_id', user.id)
            .maybeSingle();

        if (existingUser) {
            // User exists, return existing data
            const { data } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('user_id', user.id)
                .single();

            return NextResponse.json({ user: data, created: false });
        }

        // Create new user with default credits
        const { data: newUser, error: createError } = await supabaseAdmin
            .from('users')
            .insert({
                user_id: user.id,
                email: email,
                full_name: full_name || null,
                current_credits: 10, // Default credits for new users
                role: 'user'
            })
            .select()
            .single();

        if (createError) {
            console.error('[API] Error creating user:', createError);
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        return NextResponse.json({ user: newUser, created: true }, { status: 201 });

    } catch (error: any) {
        console.error('[API] Error in POST /api/users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PATCH /api/users - Update user profile
 */
export async function PATCH(req: NextRequest) {
    try {
        // Get auth token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await req.json();
        const { full_name, avatar_url } = body;

        // Update user
        const { data, error } = await supabaseAdmin
            .from('users')
            .update({
                full_name: full_name,
                avatar_url: avatar_url,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('[API] Error updating user:', error);
            return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
        }

        return NextResponse.json({ user: data });

    } catch (error: any) {
        console.error('[API] Error in PATCH /api/users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
