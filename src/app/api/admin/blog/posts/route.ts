import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Helper to check admin/editor role
async function checkBlogAccess(req: NextRequest): Promise<{ authorized: boolean; userId?: string; role?: string }> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return { authorized: false };
        }

        const result = await sql`
            SELECT user_id, role FROM users WHERE email = ${session.user.email} LIMIT 1
        `;

        const user = result[0];
        if (!user || !['admin', 'editor'].includes(user.role)) {
            return { authorized: false };
        }

        return { authorized: true, userId: user.user_id, role: user.role };
    } catch (e) {
        console.error('[Blog API] Auth check failed:', e);
        return { authorized: false };
    }
}

// Helper to generate slug
function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

/**
 * GET /api/admin/blog/posts - List all posts
 */
export async function GET(req: NextRequest) {
    const auth = await checkBlogAccess(req);
    if (!auth.authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const categoryId = searchParams.get('category_id');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        // Build dynamic query
        let query = sql`
            SELECT 
                p.*,
                c.name as category_name,
                u.display_name as author_name
            FROM blog_posts p
            LEFT JOIN blog_categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.author_id = u.user_id
            WHERE 1=1
        `;

        // Note: Dynamic WHERE conditions with Neon's sql template is tricky
        // For now, fetch all and filter in JS (not optimal for large datasets)
        const result = await sql`
            SELECT 
                p.*,
                c.name as category_name,
                u.display_name as author_name
            FROM blog_posts p
            LEFT JOIN blog_categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.author_id = u.user_id
            ORDER BY p.created_at DESC
        `;

        let posts = result;

        // Filter in JS
        if (status) {
            posts = posts.filter((p: any) => p.status === status);
        }
        if (categoryId) {
            posts = posts.filter((p: any) => p.category_id === parseInt(categoryId));
        }
        if (search) {
            const searchLower = search.toLowerCase();
            posts = posts.filter((p: any) =>
                p.title?.toLowerCase().includes(searchLower) ||
                p.excerpt?.toLowerCase().includes(searchLower)
            );
        }

        const total = posts.length;
        const paginatedPosts = posts.slice(offset, offset + limit);

        return NextResponse.json({
            success: true,
            data: paginatedPosts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('[Blog API] GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/admin/blog/posts - Create new post
 */
export async function POST(req: NextRequest) {
    const auth = await checkBlogAccess(req);
    if (!auth.authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { title, content, excerpt, featured_image, status, category_id, meta_title, meta_description, tags } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        // Generate slug
        let slug = generateSlug(title);

        // Check for duplicate slug
        const existing = await sql`SELECT id FROM blog_posts WHERE slug = ${slug}`;
        if (existing.length > 0) {
            slug = `${slug}-${Date.now()}`;
        }

        // Insert post
        const result = await sql`
            INSERT INTO blog_posts (
                title, slug, content, excerpt, featured_image, 
                status, author_id, category_id, meta_title, meta_description,
                published_at
            ) VALUES (
                ${title},
                ${slug},
                ${content || null},
                ${excerpt || null},
                ${featured_image || null},
                ${status || 'draft'},
                ${auth.userId},
                ${category_id || null},
                ${meta_title || null},
                ${meta_description || null},
                ${status === 'published' ? sql`NOW()` : null}
            )
            RETURNING *
        `;

        const newPost = result[0];

        // Add tags if provided
        if (tags && Array.isArray(tags) && tags.length > 0) {
            for (const tagId of tags) {
                await sql`
                    INSERT INTO blog_post_tags (post_id, tag_id) 
                    VALUES (${newPost.id}, ${tagId})
                    ON CONFLICT DO NOTHING
                `;
            }
        }

        return NextResponse.json({ success: true, data: newPost }, { status: 201 });

    } catch (error: any) {
        console.error('[Blog API] POST error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/blog/posts - Update post
 */
export async function PUT(req: NextRequest) {
    const auth = await checkBlogAccess(req);
    if (!auth.authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, title, content, excerpt, featured_image, status, category_id, meta_title, meta_description, tags } = body;

        if (!id) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        // Get current post
        const current = await sql`SELECT * FROM blog_posts WHERE id = ${id}`;
        if (current.length === 0) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        const oldPost = current[0];
        const wasPublished = oldPost.status === 'published';
        const willPublish = status === 'published';

        // Update post
        const result = await sql`
            UPDATE blog_posts SET
                title = ${title || oldPost.title},
                content = ${content !== undefined ? content : oldPost.content},
                excerpt = ${excerpt !== undefined ? excerpt : oldPost.excerpt},
                featured_image = ${featured_image !== undefined ? featured_image : oldPost.featured_image},
                status = ${status || oldPost.status},
                category_id = ${category_id !== undefined ? category_id : oldPost.category_id},
                meta_title = ${meta_title !== undefined ? meta_title : oldPost.meta_title},
                meta_description = ${meta_description !== undefined ? meta_description : oldPost.meta_description},
                updated_at = NOW(),
                published_at = ${!wasPublished && willPublish ? sql`NOW()` : oldPost.published_at}
            WHERE id = ${id}
            RETURNING *
        `;

        // Update tags if provided
        if (tags !== undefined && Array.isArray(tags)) {
            // Remove old tags
            await sql`DELETE FROM blog_post_tags WHERE post_id = ${id}`;

            // Add new tags
            for (const tagId of tags) {
                await sql`
                    INSERT INTO blog_post_tags (post_id, tag_id) 
                    VALUES (${id}, ${tagId})
                    ON CONFLICT DO NOTHING
                `;
            }
        }

        return NextResponse.json({ success: true, data: result[0] });

    } catch (error: any) {
        console.error('[Blog API] PUT error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/blog/posts?id=xxx - Delete post
 */
export async function DELETE(req: NextRequest) {
    const auth = await checkBlogAccess(req);
    if (!auth.authorized || auth.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        await sql`DELETE FROM blog_posts WHERE id = ${parseInt(id)}`;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Blog API] DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
