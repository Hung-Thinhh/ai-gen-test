import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate user using NextAuth
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Get userId from database
        const { getUserByEmail } = await import('@/lib/postgres/queries');
        const userData = await getUserByEmail(session.user.email);

        if (!userData) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        const userId = userData.user_id;

        // 3. Parse request body
        const body = await request.json();
        const { imageUrl } = body;

        if (!imageUrl) {
            return NextResponse.json(
                { success: false, message: 'Image URL is required' },
                { status: 400 }
            );
        }

        // 4. Delete from Cloudinary (REMOVED - Migrated to R2)
        // If we needed to delete from R2, we would do it here using S3/R2 client
        // For now, we just remove the reference from the database// 5. Delete from Neon database
        const { sql } = await import('@/lib/postgres/client');

        // Find records containing this image URL
        // Use jsonb function to check if array contains the URL
        const histories = await sql`
            SELECT history_id, output_images
            FROM generation_history
            WHERE user_id = ${userId}
            AND output_images::jsonb ? ${imageUrl}
        `;

        console.log(`[deleteImage] Found ${histories.length} records containing image`);

        let deletedCount = 0;
        let updatedCount = 0;

        for (const history of histories) {
            const outputImages = history.output_images;

            // Remove the image URL from the array
            const updatedImages = outputImages.filter((url: string) => url !== imageUrl);

            if (updatedImages.length === 0) {
                // If no images left, delete the entire record
                await sql`
                    DELETE FROM generation_history
                    WHERE history_id = ${history.history_id}
                `;
                deletedCount++;
            } else {
                // Update the record with remaining images
                // Convert array to JSON for PostgreSQL
                await sql`
                    UPDATE generation_history
                    SET output_images = ${JSON.stringify(updatedImages)}::jsonb
                    WHERE history_id = ${history.history_id}
                `;
                updatedCount++;
            }
        }

        console.log(`[deleteImage] Deleted ${deletedCount} records, updated ${updatedCount} records`);

        return NextResponse.json({
            success: true,
            message: 'Image deleted successfully',
            stats: { deleted: deletedCount, updated: updatedCount }
        });

    } catch (error: any) {
        console.error('[deleteImage] Unexpected error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
