import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon/client';

export async function GET() {
    try {
        console.log('[API] Fetching packages from Neon...');
        const data = await sql`
            SELECT * FROM packages 
            ORDER BY sort_order ASC
        `;

        return NextResponse.json({ success: true, data: data });
    } catch (error: any) {
        console.error('[API] Server error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { packageId, updates } = body;

        console.log(`[API] Updating package ${packageId} in Neon...`, updates);

        if (!packageId) {
            return NextResponse.json({ success: false, error: 'packageId is required' }, { status: 400 });
        }

        // Update with explicit field mapping for safety
        const result = await sql`
            UPDATE packages SET
                display_name = COALESCE(${updates.display_name ? JSON.stringify(updates.display_name) : null}::jsonb, display_name),
                description = COALESCE(${updates.description ? JSON.stringify(updates.description) : null}::jsonb, description),
                price_vnd = COALESCE(${updates.price_vnd ?? null}, price_vnd),
                original_price_vnd = COALESCE(${updates.original_price_vnd ?? null}, original_price_vnd),
                credits_included = COALESCE(${updates.credits_included ?? null}, credits_included),
                discount_percent = COALESCE(${updates.discount_percent ?? null}, discount_percent),
                is_popular = COALESCE(${updates.is_popular ?? null}, is_popular),
                is_active = COALESCE(${updates.is_active ?? null}, is_active),
                sort_order = COALESCE(${updates.sort_order ?? null}, sort_order),
                category = COALESCE(${updates.category ?? null}, category),
                package_type = COALESCE(${updates.package_type ?? null}, package_type),
                features = COALESCE(${updates.features ? JSON.stringify(updates.features) : null}::jsonb, features)
            WHERE package_id = ${packageId}
            RETURNING *
        `;

        if (!result || result.length === 0) {
            return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: result[0] });

    } catch (error: any) {
        console.error('[API] Update exception:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const pkg = body;

        console.log('[API] Creating new package in Neon...', pkg);

        const result = await sql`
            INSERT INTO packages (
                package_key,
                display_name,
                description,
                price_vnd,
                original_price_vnd,
                credits_included,
                discount_percent,
                is_popular,
                is_active,
                sort_order,
                category,
                package_type,
                features
            ) VALUES (
                ${pkg.package_key || `PKG_${Date.now()}`},
                ${JSON.stringify(pkg.display_name || {})}::jsonb,
                ${JSON.stringify(pkg.description || {})}::jsonb,
                ${pkg.price_vnd || 0},
                ${pkg.original_price_vnd || 0},
                ${pkg.credits_included || 0},
                ${pkg.discount_percent || 0},
                ${pkg.is_popular || false},
                ${pkg.is_active !== false},
                ${pkg.sort_order || 0},
                ${pkg.category || 'month'},
                ${pkg.package_type || 'subscription'},
                ${JSON.stringify(pkg.features || [])}::jsonb
            )
            RETURNING *
        `;

        return NextResponse.json({ success: true, data: result[0] }, { status: 201 });

    } catch (error: any) {
        console.error('[API] Create exception:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const packageId = searchParams.get('packageId');

        if (!packageId) {
            return NextResponse.json({ success: false, error: 'packageId is required' }, { status: 400 });
        }

        console.log(`[API] Deleting package ${packageId} from Neon...`);

        await sql`
            DELETE FROM packages WHERE package_id = ${packageId}
        `;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[API] Delete exception:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
