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


