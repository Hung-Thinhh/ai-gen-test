import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const guestId = searchParams.get('guestId');

        if (!guestId) {
            return NextResponse.json(
                { error: 'Guest ID is required' },
                { status: 400 }
            );
        }

        const { sql } = await import('@/lib/postgres/client');

        // Get gallery images from generation_history
        const result = await sql`
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

        if (!result || result.length === 0) {
            return NextResponse.json([], {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                    'Pragma': 'no-cache'
                }
            });
        }

        // Filter output_images: only keep R2 URLs (remove base64)
        const filteredData = result
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

        console.log(`[API] GET /api/guest/gallery: Found ${filteredData.length} records with valid URLs`);

        return NextResponse.json(filteredData, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                'Pragma': 'no-cache'
            }
        });
    } catch (error: any) {
        console.error('[API] Error fetching guest gallery:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
