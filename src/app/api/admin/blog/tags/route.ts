import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Helper to check admin/editor role
async function checkBlogAccess(req: NextRequest): Promise<boolean> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return false;

        const result = await sql`
            SELECT role FROM users WHERE email = ${session.user.email} LIMIT 1
        `;

        return ['admin', 'editor'].includes(result[0]?.role);
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
 * GET /api/admin/blog/tags - List all tags
 */
export async function GET(req: NextRequest) {
    try {
        const result = await sql`
            SELECT t.*, 
                   COUNT(pt.post_id)::int as post_count
            FROM blog_tags t
            LEFT JOIN blog_post_tags pt ON t.id = pt.tag_id
            GROUP BY t.id
            ORDER BY t.name ASC
        `;

        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        console.error('[Tags API] GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/admin/blog/tags - Create tag
 */
export async function POST(req: NextRequest) {
    if (!await checkBlogAccess(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const slug = generateSlug(name);

        const result = await sql`
            INSERT INTO blog_tags (name, slug)
            VALUES (${name}, ${slug})
            RETURNING *
        `;

        return NextResponse.json({ success: true, data: result[0] }, { status: 201 });

    } catch (error: any) {
        if (error.message?.includes('duplicate')) {
            return NextResponse.json({ error: 'Tag already exists' }, { status: 409 });
        }
        console.error('[Tags API] POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/blog/tags?id=xxx - Delete tag
 */
export async function DELETE(req: NextRequest) {
    if (!await checkBlogAccess(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
        }

        await sql`DELETE FROM blog_tags WHERE id = ${parseInt(id)}`;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Tags API] DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
