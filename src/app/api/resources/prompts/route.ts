
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// Initialize Supabase Admin Client (Service Role)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Helper to verify Admin access.
 * We use the user's access token to check if they are authenticated and are an admin.
 * For simplicity, we might just check if they are authenticated and trust the App's UI for now,
 * OR we can verify strict admin role equality if your app has an 'is_admin' or role claim.
 */
async function verifyAdmin(request: NextRequest) {
    // 1. Try Authorization Header (Supabase Token)
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (user && !error) return user;
    }

    // 2. Try NextAuth Session
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
        const { data: userType, error } = await supabaseAdmin
            .from('users')
            .select('user_id, role, email')
            .eq('email', session.user.email)
            .single();

        if (userType && (userType.role === 'admin' || userType.role === 'editor')) {
            return {
                id: userType.user_id,
                email: userType.email,
                role: userType.role
            };
        }
    }

    return null;
}

export async function GET(request: NextRequest) {
    try {
        console.log('[API] Fetching prompts (Server-Side)');
        const { data, error } = await supabaseAdmin
            .from('prompts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[API] Error fetching prompts:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


export async function POST(request: NextRequest) {
    const user = await verifyAdmin(request);
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Inject user_id if not present (Service Role bypasses auth.uid())
        const payload = {
            ...body,
            user_id: user.id
        };

        const { data, error } = await supabaseAdmin
            .from('prompts')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('[API] Error creating prompt:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const user = await verifyAdmin(request);
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

        const { error } = await supabaseAdmin
            .from('prompts')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const user = await verifyAdmin(request);
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

        const { error } = await supabaseAdmin
            .from('prompts')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
