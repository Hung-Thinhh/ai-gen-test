import { sql } from './client';

// System config queries
export async function getSystemConfig(key: string) {
    const result = await sql`
        SELECT config_value FROM system_configs WHERE config_key = ${key} LIMIT 1
    `;
    return result[0]?.config_value || null;
}

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
    console.log('[createUser] Starting user creation for:', userData.email);
    console.log('[createUser] Received data:', JSON.stringify(userData, null, 2));

    // Fetch free_tier_credits from system_config if not provided
    let creditsToAssign = userData.current_credits;
    if (creditsToAssign === undefined) {
        console.log('[createUser] Credits not provided, fetching from system_config...');
        const freeTierCredits = await getSystemConfig('free_tier_credits');
        console.log('[createUser] system_config.free_tier_credits =', freeTierCredits);
        creditsToAssign = freeTierCredits ? parseInt(freeTierCredits, 10) : 10;
        console.log('[createUser] Credits to assign:', creditsToAssign);
    }

    try {
        console.log('[createUser] Executing INSERT query...');
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
                ${creditsToAssign},
                ${userData.role || 'user'},
                ${userData.user_type || 'registered'},
                NOW()
            )
            RETURNING *
        `;
        console.log('[createUser] ✅ User created successfully:', result[0]);
        return result[0];
    } catch (error) {
        console.error('[createUser] ❌ Error creating user:', error);
        throw error;
    }
}


