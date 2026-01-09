import { sql } from './client';

// User queries
export async function getUserByEmail(email: string) {
    const result = await sql`
        SELECT user_id, email, display_name, avatar_url, current_credits, role, user_type
        FROM users
        WHERE email = ${email}
        LIMIT 1
    `;
    return result[0] || null;
}

export async function createUser(userData: {
    user_id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
    current_credits?: number;
    role?: string;
    user_type?: string;
}) {
    const result = await sql`
        INSERT INTO users (
            user_id, email, display_name, avatar_url, 
            current_credits, role, user_type, created_at
        )
        VALUES (
            ${userData.user_id},
            ${userData.email},
            ${userData.display_name || userData.email?.split('@')[0]},
            ${userData.avatar_url || null},
            ${userData.current_credits || 10},
            ${userData.role || 'user'},
            ${userData.user_type || 'registered'},
            NOW()
        )
        RETURNING *
    `;
    return result[0];
}

// Generic CRUD operations
export async function getAllFromTable(tableName: string) {
    // Note: tableName should be validated/whitelisted before use
    const result = await sql.unsafe(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
    return result;
}

export async function getById(tableName: string, id: string | number, idColumn: string = 'id') {
    const result = await sql.unsafe(
        `SELECT * FROM ${tableName} WHERE ${idColumn} = $1 LIMIT 1`,
        [id]
    );
    return result[0] || null;
}

export async function insertRow(tableName: string, data: Record<string, any>) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const result = await sql.unsafe(
        `INSERT INTO ${tableName} (${columns.join(', ')}) 
         VALUES (${placeholders}) 
         RETURNING *`,
        values
    );
    return result[0];
}

export async function updateRow(
    tableName: string,
    id: string | number,
    data: Record<string, any>,
    idColumn: string = 'id'
) {
    const entries = Object.entries(data);
    const setClause = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
    const values = [...entries.map(([, value]) => value), id];

    const result = await sql.unsafe(
        `UPDATE ${tableName} 
         SET ${setClause} 
         WHERE ${idColumn} = $${values.length}
         RETURNING *`,
        values
    );
    return result[0];
}

export async function deleteRow(tableName: string, id: string | number, idColumn: string = 'id') {
    const result = await sql.unsafe(
        `DELETE FROM ${tableName} WHERE ${idColumn} = $1 RETURNING *`,
        [id]
    );
    return result[0];
}
