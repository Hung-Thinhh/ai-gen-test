import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
    try {
        const { data, error } = await supabaseAdmin
            .from('categories')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching categories:', error);
            return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('Server error fetching categories:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
