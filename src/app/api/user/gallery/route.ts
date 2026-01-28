import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { sql } from '@/lib/postgres/client';
import { getUserByEmail } from '@/lib/postgres/queries';

// Helper to get UUID from session
async function getUUIDFromSession(session: any): Promise<string | null> {
    console.log('[Gallery] getUUIDFromSession called');
    console.log('[Gallery] session.user.email:', session?.user?.email);

    if (!session?.user?.email) {
        console.log('[Gallery] No email in session, returning null');
        return null;
    }

    console.log('[Gallery] Fetching user from DB by email:', session.user.email);
    const userData = await getUserByEmail(session.user.email);
    console.log('[Gallery] getUserByEmail result:', userData);

    if (userData) {
        console.log('[Gallery] ✅ Found UUID:', userData.user_id);
        return userData.user_id;
    } else {
        console.log('[Gallery] ⚠️ User not found in DB');
        return null;
    }
}

export async function GET(req: NextRequest) {
    try {
        console.log('[Gallery GET] Starting...');
        const session = await getServerSession(authOptions);
        console.log('[Gallery GET] Session:', session ? 'exists' : 'null');

        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = await getUUIDFromSession(session);
        console.log('[Gallery GET] userId after getUUIDFromSession:', userId);

        if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Get gallery images from generation_history with prompts
        const data = await sql`
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

        // Filter output_images: only keep R2 URLs (remove base64)
        const filteredData = data
            .map((record: any) => {
                if (!record.output_images || !Array.isArray(record.output_images)) {
                    return record;
                }

                // Filter output_images array
                const filteredImages = record.output_images.filter((img: string) => {
                    if (!img || typeof img !== 'string') return false;
                    if (img.startsWith('data:')) return false;  // Skip base64
                    if (!img.startsWith('https://')) return false;  // Only HTTPS
                    return true;
                });

                return {
                    ...record,
                    output_images: filteredImages
                };
            })
            .filter((record: any) => record.output_images && record.output_images.length > 0);  // Only keep records with valid images

        console.log(`[Gallery GET] Found ${filteredData.length} records with valid URLs`);

        return NextResponse.json(filteredData, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                'Pragma': 'no-cache'
            }
        });
    } catch (e: any) {
        console.error('[API] GET /api/user/gallery error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = await getUUIDFromSession(session);
        if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const body = await req.json();
        const { urls, images, prompt, tool_key } = body;

        // Support both old format (urls) and new format (images + prompt)
        const imagesToSave = images || urls || [];

        if (!imagesToSave || !Array.isArray(imagesToSave) || imagesToSave.length === 0) {
            return NextResponse.json({ error: 'Invalid images/urls' }, { status: 400 });
        }

        // Insert into generation_history
        const result = await sql`
            INSERT INTO generation_history (
                user_id, output_images, input_prompt, tool_key, tool_id, created_at
            ) VALUES (
                ${userId},
                ${JSON.stringify(imagesToSave)}::jsonb,
                ${prompt || null},
                ${tool_key || null},
                ${body.tool_id || 0},
                NOW()
            )
            RETURNING history_id, output_images, input_prompt, created_at, tool_key
        `;

        if (result.length > 0) {
            return NextResponse.json({
                success: true,
                history: result[0],
                count: imagesToSave.length
            }, { status: 201 });
        }

        return NextResponse.json({ error: 'Failed to insert history' }, { status: 500 });
    } catch (e: any) {
        console.error('[API] POST /api/user/gallery error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = await getUUIDFromSession(session);
        if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Support both query param and body formats
        let identifier = req.nextUrl.searchParams.get('history_id') || req.nextUrl.searchParams.get('url');

        if (!identifier) {
            const body = await req.json();
            identifier = body.history_id || body.url;
        }

        if (!identifier) return NextResponse.json({ error: 'Missing history_id or url' }, { status: 400 });

        // Check if identifier is a URL
        const isUrl = identifier.startsWith('http');

        if (isUrl) {
            const imageUrl = identifier;
            // Find records containing this image
            // Note: We search using JSONB @> operator or LIKE for legacy/text fallback
            const histories = await sql`
                SELECT history_id, output_images
                FROM generation_history 
                WHERE user_id = ${userId} 
                AND (output_images @> ${JSON.stringify([imageUrl])}::jsonb OR output_images::text LIKE ${'%' + imageUrl + '%'})
            `;

            let deletedCount = 0;
            let updatedCount = 0;

            for (const history of histories) {
                const outputImages = history.output_images;
                if (Array.isArray(outputImages) && outputImages.includes(imageUrl)) {
                    // Remove image
                    const updatedImages = outputImages.filter((url: string) => url !== imageUrl);

                    if (updatedImages.length === 0) {
                        // Delete empty record
                        await sql`DELETE FROM generation_history WHERE history_id = ${history.history_id}`;
                        deletedCount++;
                    } else {
                        // Update record
                        await sql`
                            UPDATE generation_history 
                            SET output_images = ${JSON.stringify(updatedImages)}::jsonb 
                            WHERE history_id = ${history.history_id}
                        `;
                        updatedCount++;
                    }
                }
            }
            return NextResponse.json({
                success: true,
                deleted: deletedCount,
                updated: updatedCount
            });

        } else {
            // Assume UUID history_id
            const result = await sql`
                DELETE FROM generation_history 
                WHERE user_id = ${userId} AND history_id = ${identifier}::uuid
            `;
            return NextResponse.json({
                success: true,
                deleted: result.length || 0
            });
        }

    } catch (e: any) {
        console.error('[API] DELETE /api/user/gallery error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
