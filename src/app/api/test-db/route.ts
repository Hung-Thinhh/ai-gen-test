import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        console.log('[Test] Checking payment_transactions table...');

        // Try to query the table
        const { data, error } = await supabaseAdmin
            .from('payment_transactions')
            .select('*')
            .limit(1);

        if (error) {
            console.error('[Test] Table query error:', error);
            return NextResponse.json({
                success: false,
                error: error.message,
                hint: 'Bảng payment_transactions có thể chưa được tạo. Hãy chạy migration trong Supabase SQL Editor!'
            });
        }

        console.log('[Test] Table exists! Found records:', data?.length || 0);

        return NextResponse.json({
            success: true,
            message: 'Bảng payment_transactions đã tồn tại!',
            records: data?.length || 0
        });

    } catch (error) {
        console.error('[Test] Unexpected error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
