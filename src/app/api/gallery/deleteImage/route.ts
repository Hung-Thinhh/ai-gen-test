import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { v2 as cloudinary } from 'cloudinary';
import { extractPublicIdFromUrl, isCloudinaryUrl } from '@/utils/cloudinaryUtils';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

        // 4. Delete from Cloudinary (if it's a Cloudinary URL)
        if (isCloudinaryUrl(imageUrl)) {
            const publicId = extractPublicIdFromUrl(imageUrl);

            if (publicId) {
                try {
                    const result = await cloudinary.uploader.destroy(publicId);
                    console.log('[deleteImage] Cloudinary delete result:', result);

                    if (result.result !== 'ok' && result.result !== 'not found') {
                        console.warn('[deleteImage] Cloudinary delete failed:', result);
                    }
                } catch (cloudinaryError) {
                    console.error('[deleteImage] Cloudinary delete error:', cloudinaryError);
                    // Continue with DB deletion even if Cloudinary fails
                }
            }
        }

        // 5. Delete from Neon database
        const { sql } = await import('@/lib/postgres/client');

        // Find and update generation_history records containing this image
        const histories = await sql`
            SELECT history_id, output_images
            FROM generation_history
            WHERE user_id = ${userId}
        `;

        let deletedCount = 0;
        let updatedCount = 0;

        for (const history of histories) {
            const outputImages = history.output_images;

            if (Array.isArray(outputImages) && outputImages.includes(imageUrl)) {
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
                    await sql`
                        UPDATE generation_history
                        SET output_images = ${updatedImages}
                        WHERE history_id = ${history.history_id}
                    `;
                    updatedCount++;
                }
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
