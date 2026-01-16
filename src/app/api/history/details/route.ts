// Get detailed generation history with prompts for gallery/lightbox display
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const guestIdHeader = req.headers.get('X-Guest-ID');

        let userId: string | null = null;
        let guestId: string | null = null;

        // Check NextAuth session
        const session = await getServerSession(authOptions);
        if (session?.user?.email) {
            const { getUserByEmail } = await import('@/lib/postgres/queries');
            const userData = await getUserByEmail(session.user.email);
            if (userData) {
                userId = userData.user_id;
            }
        } else if (guestIdHeader) {
            guestId = guestIdHeader;
        }

        if (!userId && !guestId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { sql } = await import('@/lib/postgres/client');

        // Get generation history with prompts
        let history;
        if (userId) {
            history = await sql`
                SELECT 
                    history_id,
                    output_images,
                    input_prompt,
                    created_at,
                    tool_key
                FROM generation_history
                WHERE user_id = ${userId}
                ORDER BY created_at DESC
                LIMIT 500
            `;
        } else if (guestId) {
            history = await sql`
                SELECT 
                    history_id,
                    output_images,
                    input_prompt,
                    created_at,
                    tool_key
                FROM generation_history
                WHERE guest_id = ${guestId}
                ORDER BY created_at DESC
                LIMIT 500
            `;
        }

        // Transform to frontend format
        const imageList: string[] = [];
        const promptList: (string | null)[] = [];

        if (history) {
            for (const record of history) {
                const images = record.output_images || [];
                if (Array.isArray(images)) {
                    for (const imageUrl of images) {
                        imageList.push(imageUrl);
                        promptList.push(record.input_prompt || null);
                    }
                }
            }
        }

        return NextResponse.json({
            images: imageList,
            prompts: promptList,
            total: imageList.length
        });

    } catch (error: any) {
        console.error('[API] Error fetching history details:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
