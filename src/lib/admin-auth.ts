import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Helper function to verify admin authentication
 * Returns null if authenticated, otherwise returns error response
 */
export async function verifyAdminAuth(req?: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized - Please login' },
                { status: 401 }
            );
        }

        const userRole = (session.user as any).role;
        if (userRole !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            );
        }

        return null; // Authentication successful
    } catch (error) {
        console.error('[AdminAuth] Error verifying admin:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Verify SePay webhook signature
 * SePay sends signature in header "X-Secure-Token" or uses HMAC verification
 */
export function verifySePayWebhook(rawBody: string, signature: string | null): boolean {
    const SEPAY_WEBHOOK_SECRET = process.env.SEPAY_WEBHOOK_SECRET;

    if (!SEPAY_WEBHOOK_SECRET) {
        console.error('[SePay Webhook] SEPAY_WEBHOOK_SECRET not configured');
        return false;
    }

    if (!signature) {
        console.error('[SePay Webhook] Missing signature header');
        return false;
    }

    // SePay webhook verification logic
    // According to SePay docs, they may send signature in X-Secure-Token header
    // or use a different verification mechanism

    // Simple token comparison for X-Secure-Token
    if (signature === SEPAY_WEBHOOK_SECRET) {
        return true;
    }

    // If using HMAC-SHA256 signature
    try {
        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', SEPAY_WEBHOOK_SECRET)
            .update(rawBody)
            .digest('hex');

        // Compare signatures (constant-time comparison to prevent timing attacks)
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch (error) {
        console.error('[SePay Webhook] Signature verification error:', error);
        return false;
    }
}
