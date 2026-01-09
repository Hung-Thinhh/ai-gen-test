import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/neon/client';
import { getUserByEmail } from '@/lib/neon/queries';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// Whitelist of allowed tables to prevent arbitrary access
const ALLOWED_TABLES = [
    'hero_banners',
    'tools',
    'prompts',
    'studio',
    'categories',
    'system_configs'
];

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ table: string }> }
) {
    const { table } = await context.params;

    // 1. Validate Table Name
    if (!ALLOWED_TABLES.includes(table)) {
        return NextResponse.json({ success: false, error: 'Invalid resource table' }, { status: 400 });
    }

    try {
        console.log(`[API] Fetching resource from Neon: ${table}`);

        // Execute Neon SQL query
        // Table name is safe because it's validated against ALLOWED_TABLES whitelist
        // Use sql.query() for dynamic queries as per Neon documentation
        let query;
        if (['hero_banners', 'packages', 'tools', 'studio'].includes(table)) {
            query = `SELECT * FROM ${table} ORDER BY sort_order ASC`;
        } else {
            query = `SELECT * FROM ${table} ORDER BY created_at DESC`;
        }

        const data = await sql.query(query);

        console.log(`[API] Neon returned:`, Array.isArray(data) ? `${data.length} rows` : typeof data, data);

        return NextResponse.json({ success: true, data: Array.isArray(data) ? data : [] });
    } catch (error: any) {
        console.error('[API] Server error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

async function verifyAdmin(request: NextRequest) {
    // Try NextAuth Session
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
        console.log(`[API] Verifying NextAuth User: ${session.user.email}`);
        const userType = await getUserByEmail(session.user.email);

        if (userType && (userType.role === 'admin' || userType.role === 'editor')) {
            return {
                id: userType.user_id,
                email: userType.email,
                role: userType.role
            };
        }
        console.log(`[API] NextAuth User unauthorized or not found`);
    }

    return null;
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ table: string }> }
) {
    const { table } = await context.params;
    if (!ALLOWED_TABLES.includes(table)) return NextResponse.json({ success: false, error: 'Invalid resource table' }, { status: 400 });

    const user = await verifyAdmin(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();

        // Build INSERT query
        const columns = Object.keys(body);
        const values = Object.values(body);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const insertQuery = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        const result = await sql([insertQuery, ...values] as any);

        return NextResponse.json({ success: true, data: Array.isArray(result) ? result[0] : result });
    } catch (error: any) {
        console.error('[API POST] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ table: string }> }
) {
    const { table } = await context.params;
    if (!ALLOWED_TABLES.includes(table)) return NextResponse.json({ success: false, error: 'Invalid resource table' }, { status: 400 });

    const user = await verifyAdmin(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { id, config_key, tool_id, ...updates } = body;

        // Handle different ID columns
        let matchColumn = 'id';
        let matchValue = id;

        if (table === 'tools') {
            matchColumn = 'tool_id';
            matchValue = tool_id;
        } else if (table === 'system_configs') {
            matchColumn = 'config_key';
            matchValue = config_key;
        }

        if (!matchValue) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

        // Build UPDATE query
        const entries = Object.entries(updates);
        const setClause = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
        const values = [...entries.map(([, value]) => value), matchValue];

        const updateQuery = `UPDATE ${table} SET ${setClause} WHERE ${matchColumn} = $${values.length}`;
        await sql([updateQuery, ...values] as any);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API PUT] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ table: string }> }
) {
    const { table } = await context.params;
    if (!ALLOWED_TABLES.includes(table)) return NextResponse.json({ success: false, error: 'Invalid resource table' }, { status: 400 });

    const user = await verifyAdmin(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

        let matchColumn = 'id';
        if (table === 'tools') matchColumn = 'tool_id';
        if (table === 'system_configs') matchColumn = 'config_key';

        const deleteQuery = `DELETE FROM ${table} WHERE ${matchColumn} = $1`;
        await sql([deleteQuery, id] as any);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API DELETE] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
