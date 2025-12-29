import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    try {
        // Get authorization header
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { isAdmin: false, role: null, error: 'No authorization token' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');

        // Create Supabase client with service role to bypass RLS
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Verify the JWT token and get user
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json(
                { isAdmin: false, role: null, error: 'Invalid token' },
                { status: 401 }
            );
        }

        // Get user role from database
        const { data: userData, error: dbError } = await supabase
            .from('users')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (dbError || !userData) {
            return NextResponse.json(
                { isAdmin: false, role: null, error: 'User not found in database' },
                { status: 404 }
            );
        }

        const isAdmin = userData.role === 'admin';

        return NextResponse.json({
            isAdmin,
            role: userData.role,
            userId: user.id
        });

    } catch (error: any) {
        console.error('[Admin Verify API] Error:', error);
        return NextResponse.json(
            { isAdmin: false, role: null, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
