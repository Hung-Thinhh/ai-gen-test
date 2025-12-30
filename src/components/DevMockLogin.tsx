'use client';

/**
 * DEV ONLY: Mock Login Component for Testing
 * Simulates a logged-in user without Google OAuth
 */

import { supabase } from '../lib/supabase/client';

export function DevMockLogin() {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return null;

    const mockLogin = async () => {
        try {
            // Create a mock session by signing in with a test account
            // This requires the test user to exist in Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email: 'test@dukyai.local',
                password: 'TestPassword123!'
            });

            if (error) {
                console.error('Mock login failed:', error);
                alert('Mock login failed. Run SQL script first!');
                return;
            }

            console.log('✅ Mock login successful!', data.user);
            window.location.reload();
        } catch (err) {
            console.error('Mock login error:', err);
        }
    };

    const mockLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            background: '#ff6b6b',
            padding: '10px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
            <div style={{ color: 'white', fontSize: '12px', marginBottom: '8px', fontWeight: 'bold' }}>
                🔧 DEV TOOLS
            </div>
            <button
                onClick={mockLogin}
                style={{
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    marginRight: '8px'
                }}
            >
                🔐 Mock Login
            </button>
            <button
                onClick={mockLogout}
                style={{
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                }}
            >
                🚪 Logout
            </button>
        </div>
    );
}
