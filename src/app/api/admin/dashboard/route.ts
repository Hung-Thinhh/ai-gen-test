import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Ensure Service Role Key is available
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
    console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!");
}

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey || '', // Will fail calls if empty, which is good for debugging
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function GET() {
    try {
        console.log('[API] Fetching dashboard stats...');

        // 1. Fetch User Stats
        const { count: totalUsers, error: userError } = await supabaseAdmin
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (userError) throw userError;

        // 2. Fetch Generation Stats (Credits, Images, Errors)
        // Note: For large datasets, this aggregation should be done via RPC or cached.
        // For now, we fetch a limited history or use count if possible.
        // To get sums, we might need a raw query or fetch all (careful with performance).
        // Let's limit to last 30 days for dashboard relevance.
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateStr = thirtyDaysAgo.toISOString();

        const { data: historyData, error: historyError } = await supabaseAdmin
            .from('generation_history')
            .select('credits_used, generation_count, error_message, api_model_used, created_at, user_id')
            .gte('created_at', dateStr);

        if (historyError) throw historyError;

        // Process History Data
        let creditsConsumed = 0;
        let totalImages = 0;
        let errorCount = 0;
        const dailyGenerations: Record<string, number> = {};
        const dailyCredits: Record<string, number> = {};
        const modelUsage: Record<string, number> = {};
        const activeUserIds = new Set<string>();

        historyData?.forEach(row => {
            creditsConsumed += (row.credits_used || 0);
            totalImages += (row.generation_count || 1);
            if (row.error_message) errorCount++;
            if (row.user_id) activeUserIds.add(row.user_id);

            // Chart Data
            const day = row.created_at.split('T')[0];
            dailyGenerations[day] = (dailyGenerations[day] || 0) + (row.generation_count || 1);
            dailyCredits[day] = (dailyCredits[day] || 0) + (row.credits_used || 0);

            // Model Data
            if (row.api_model_used) {
                modelUsage[row.api_model_used] = (modelUsage[row.api_model_used] || 0) + 1;
            }
        });

        const errorRate = historyData?.length ? (errorCount / historyData.length) * 100 : 0;

        // Format Chart Data
        const chartLabels = Object.keys(dailyGenerations).sort().slice(-7); // Last 7 days for sparklines/charts
        const chartData = chartLabels.map(day => dailyGenerations[day]);
        const creditData = chartLabels.map(day => dailyCredits[day]);

        const topModels = Object.entries(modelUsage)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // 3. Fetch Revenue Stats (Last 30 Days)
        const { data: revenueData, error: revenueError } = await supabaseAdmin
            .from('payment_transactions')
            .select('amount, completed_at, created_at')
            .eq('status', 'completed') // Only count successful transactions
            .gte('created_at', dateStr); // Use created_at or completed_at, image shows both. Safe to use created_at for range.

        if (revenueError) {
            console.error('[API] Revenue fetch error (ignoring):', revenueError);
            // Don't crash entire dashboard if revenue fails (optional table)
        }

        let totalRevenue = 0;
        const dailyRevenue: Record<string, number> = {};

        revenueData?.forEach(row => {
            const amount = Number(row.amount) || 0;
            totalRevenue += amount;

            // Chart Data
            if (row.completed_at) {
                const day = row.completed_at.split('T')[0];
                dailyRevenue[day] = (dailyRevenue[day] || 0) + amount;
            } else if (row.created_at) { // Fallback
                const day = row.created_at.split('T')[0];
                dailyRevenue[day] = (dailyRevenue[day] || 0) + amount;
            }
        });

        // 4. Fetch Newest Users (From public.users)
        const { data: recentPublicUsers, error: recentUsersError } = await supabaseAdmin
            .from('users')
            .select('user_id, email, display_name, role, current_credits, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentUsersError) {
            console.error('[API] Recent users fetch error:', recentUsersError);
        }

        const recentUsers = recentPublicUsers?.map(user => {
            // Calculate usage stats from historyData
            const userHistory = historyData?.filter(h => h.user_id === user.user_id) || [];
            const userGen = userHistory.reduce((sum, h) => sum + (h.generation_count || 1), 0);

            return {
                user_id: user.user_id,
                email: user.email,
                full_name: user.display_name || 'N/A', // Map display_name to full_name
                role: user.role || 'user',
                current_credits: user.current_credits || 0,
                created_at: user.created_at,
                total_gen: userGen,
                plan: user.role === 'admin' ? 'Admin' : 'Free'
            };
        }) || [];


        // 5. Fetch Recent Transactions
        const { data: recentTxData, error: txError } = await supabaseAdmin
            .from('payment_transactions')
            .select('id, amount, status, created_at, user_id')
            .order('created_at', { ascending: false })
            .limit(5);

        if (txError) {
            console.error('[API] Recent transactions fetch error:', txError);
        }

        // Enrich transactions with user info
        let recentTransactions: any[] = [];
        if (recentTxData && recentTxData.length > 0) {
            const txUserIds = [...new Set(recentTxData.map(tx => tx.user_id))];
            const { data: txUsers } = await supabaseAdmin
                .from('users')
                .select('user_id, email, display_name, avatar_url')
                .in('user_id', txUserIds);

            recentTransactions = recentTxData.map(tx => {
                const user = txUsers?.find(u => u.user_id === tx.user_id);
                return {
                    id: tx.id,
                    amount: tx.amount,
                    status: tx.status,
                    created_at: tx.created_at,
                    user: {
                        email: user?.email || 'Unknown',
                        full_name: user?.display_name || 'N/A',
                        avatar_url: user?.avatar_url
                    }
                };
            });
        }

        const revenueChartData = chartLabels.map(day => dailyRevenue[day] || 0);

        return NextResponse.json({
            success: true,
            stats: {
                totalUsers,
                creditsConsumed,
                totalImages,
                errorRate,
                totalRevenue,
                successRate: 100 - errorRate // Calculate success rate
            },
            charts: {
                labels: chartLabels,
                data: chartData,
                credits: creditData,
                revenue: revenueChartData,
                topModels
            },
            recentUsers,
            recentTransactions
        });

    } catch (error: any) {
        console.error('[API] Dashboard stats error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
