import { pool } from './db';

type UserData = {
    user_id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
    user_type: 'registered' | 'guest';
    current_credits: number;
    role: 'user' | 'admin';
};

export async function getUserByEmail(email: string) {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
            return result.rows[0];
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching user by email:', error);
        return null;
    }
}

export async function createUser(userData: UserData) {
    try {
        const client = await pool.connect();
        try {
            const query = `
                INSERT INTO users (user_id, email, display_name, avatar_url, user_type, current_credits, role)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
            const values = [
                userData.user_id,
                userData.email,
                userData.display_name,
                userData.avatar_url,
                userData.user_type,
                userData.current_credits,
                userData.role
            ];
            const result = await client.query(query, values);
            return result.rows[0];
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating user:', error);
        return null;
    }
}
