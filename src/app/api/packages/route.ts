import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        console.log('[API] Fetching packages...');
        const { data, error } = await supabaseAdmin
            .from('packages')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('[API] Error fetching packages:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: data });
    } catch (error) {
        console.error('[API] Server error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { packageId, updates } = body;

        console.log(`[API] Updating package ${packageId}...`);

        // Perform update via Service Role (Bypasses RLS)
        const { data, error } = await supabaseAdmin
            .from('packages')
            .update(updates)
            .eq('package_id', packageId)
            .select();

        if (error) {
            console.error('[API] Update error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('[API] Update exception:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { packageData } = body;

        console.log(`[API] Creating new package...`);

        // Perform insert via Service Role (Bypasses RLS)
        const { data, error } = await supabaseAdmin
            .from('packages')
            .insert([packageData])
            .select();

        if (error) {
            console.error('[API] Create error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('[API] Create exception:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const packageId = searchParams.get('id');

        if (!packageId) {
            return NextResponse.json({ success: false, error: 'Package ID required' }, { status: 400 });
        }

        console.log(`[API] Deleting package ${packageId}...`);

        // Perform delete via Service Role (Bypasses RLS)
        const { error } = await supabaseAdmin
            .from('packages')
            .delete()
            .eq('package_id', packageId);

        if (error) {
            console.error('[API] Delete error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Delete exception:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
