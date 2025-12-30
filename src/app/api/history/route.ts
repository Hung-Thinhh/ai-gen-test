import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/history - Get generation history
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

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Get history
        const { data, error } = await supabaseAdmin
            .from('generation_history')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('[API] Error fetching history:', error);
            return NextResponse.json({ history: [] });
        }

        return NextResponse.json({ history: data || [] });

    } catch (error: any) {
        console.error('[API] Error in GET /api/history:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/history - Log generation
 */
export async function POST(req: NextRequest) {
    try {
        // Get auth token (optional for guest)
        const authHeader = req.headers.get('Authorization');
        let userId: string | null = null;

        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            userId = user?.id || null;
        }

        const body = await req.json();
        const {
            guestId,
            toolId,
            prompt,
            outputImages,
            creditsUsed,
            apiModelUsed,
            generationCount,
            errorMessage
        } = body;

        // Validate required fields
        if (!toolId) {
            return NextResponse.json({ error: 'Tool ID required' }, { status: 400 });
        }

        if (!userId && !guestId) {
            return NextResponse.json({ error: 'User ID or Guest ID required' }, { status: 400 });
        }

        // Create log entry
        const logEntry: any = {
            tool_id: toolId,
            prompt: prompt || null,
            output_images: outputImages || [],
            credits_used: creditsUsed || 0,
            api_model_used: apiModelUsed || null,
            generation_count: generationCount || 1,
            error_message: errorMessage || null
        };

        if (userId) {
            logEntry.user_id = userId;
        } else {
            logEntry.guest_id = guestId;
        }

        // Insert log
        const { data, error } = await supabaseAdmin
            .from('generation_history')
            .insert(logEntry)
            .select()
            .single();

        if (error) {
            console.error('[API] Error logging generation:', error);
            return NextResponse.json({ error: 'Failed to log generation' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            log: data
        }, { status: 201 });

    } catch (error: any) {
        console.error('[API] Error in POST /api/history:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
