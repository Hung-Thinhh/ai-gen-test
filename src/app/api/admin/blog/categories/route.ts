import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Helper to check admin role (categories are admin-only)
async function checkAdminAccess(req: NextRequest): Promise<boolean> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return false;

        const result = await sql`
            SELECT role FROM users WHERE email = ${session.user.email} LIMIT 1
        `;

        return result[0]?.role === 'admin';
    } catch (e) {
        return false;
    }
}

// Helper to generate slug
function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

/**
 * GET /api/admin/blog/categories - List all categories
 */
export async function GET(req: NextRequest) {
    try {
        const result = await sql`
            SELECT c.*, 
                   COUNT(p.id)::int as post_count
            FROM blog_categories c
            LEFT JOIN blog_posts p ON c.id = p.category_id
            GROUP BY c.id
            ORDER BY c.name ASC
        `;

        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        console.error('[Categories API] GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/admin/blog/categories - Create category
 */
export async function POST(req: NextRequest) {
    if (!await checkAdminAccess(req)) {
        return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const slug = generateSlug(name);

        const result = await sql`
            INSERT INTO blog_categories (name, slug, description)
            VALUES (${name}, ${slug}, ${description || null})
            RETURNING *
        `;

        return NextResponse.json({ success: true, data: result[0] }, { status: 201 });

    } catch (error: any) {
        if (error.message?.includes('duplicate')) {
            return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
        }
        console.error('[Categories API] POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/blog/categories - Update category
 */
export async function PUT(req: NextRequest) {
    if (!await checkAdminAccess(req)) {
        return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, name, description } = body;

        if (!id) {
            return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
        }

        const slug = name ? generateSlug(name) : undefined;

        const result = await sql`
            UPDATE blog_categories SET
                name = COALESCE(${name}, name),
                slug = COALESCE(${slug}, slug),
                description = COALESCE(${description}, description)
            WHERE id = ${id}
            RETURNING *
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: result[0] });

    } catch (error: any) {
        console.error('[Categories API] PUT error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/blog/categories?id=xxx - Delete category
 */
export async function DELETE(req: NextRequest) {
    if (!await checkAdminAccess(req)) {
        return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
        }

        await sql`DELETE FROM blog_categories WHERE id = ${parseInt(id)}`;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Categories API] DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
