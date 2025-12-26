import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
    try {
        const { data, error } = await supabaseAdmin
            .from('tools')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tools:', error);
            return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('Server error fetching tools:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
