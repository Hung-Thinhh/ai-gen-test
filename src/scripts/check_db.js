require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const README_URL = 'postgresql://postgres:yj5x6moshhlx1vcw@77.42.94.105:3100/postgres';
const connectionString = process.env.POSTGRES_URL || README_URL;

const pool = new Pool({ connectionString });

async function checkUser(email) {
    const client = await pool.connect();
    try {
        console.log(`Checking user: ${email}`);

        // 1. Get User ID
        const userRes = await client.query(`SELECT user_id, current_credits FROM users WHERE email = $1`, [email]);
        if (userRes.rows.length === 0) {
            console.log('User not found.');
            return;
        }
        const user = userRes.rows[0];
        console.log('User Found:', user);

        // 2. Check Profile Gallery
        const profileRes = await client.query(`SELECT id, gallery, last_updated FROM profiles WHERE id = $1`, [user.user_id]);
        if (profileRes.rows.length === 0) {
            console.log('Profile not found for this user.');
        } else {
            const profile = profileRes.rows[0];
            console.log('Profile Found.');
            console.log('Last Updated:', profile.last_updated);
            console.log('Gallery Item Count:', profile.gallery ? profile.gallery.length : 0);
            if (profile.gallery && profile.gallery.length > 0) {
                console.log('Last 3 Items:', JSON.stringify(profile.gallery.slice(-3), null, 2));
            } else {
                console.log('Gallery is empty.');
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

// Replace with the user's email if known, or passing hardcoded for now just to test connection/schema
// I'll try to find a user from the DB first just to pick one.
async function listRecentUsers() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT email FROM users ORDER BY created_at DESC LIMIT 1');
        if (res.rows.length > 0) {
            await checkUser(res.rows[0].email);
        } else {
            console.log('No users found in DB.');
        }
    } finally {
        client.release();
        await pool.end();
    }
}

listRecentUsers();
