import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres/client';
import { verifyAdminAuth } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
    try {
        // Verify admin authentication
        const authError = await verifyAdminAuth(req);
        if (authError) return authError;

        // Cache headers - dashboard data cached for 60 seconds
        const cacheHeaders = {
            'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
        };

        // 1. Fetch User Stats
        const userCountResult = await sql`
            SELECT COUNT(*) as count FROM users
        `;
        const totalUsers = Number(userCountResult[0]?.count || 0);

        // 2. Fetch Generation Stats (Last 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateStr = thirtyDaysAgo.toISOString();

        const historyData = await sql`
            SELECT 
                credits_used, 
                generation_count, 
                error_message, 
                api_model_used, 
                created_at, 
                user_id
            FROM generation_history
            WHERE created_at >= ${dateStr}
        `;

        // Process History Data
        let creditsConsumed = 0;
        let totalImages = 0;
        let errorCount = 0;
        const dailyGenerations: Record<string, number> = {};
        const dailyCredits: Record<string, number> = {};
        const modelUsage: Record<string, number> = {};
        const activeUserIds = new Set<string>();

        historyData?.forEach((row: any) => {
            creditsConsumed += (row.credits_used || 0);
            totalImages += (row.generation_count || 1);
            if (row.error_message) errorCount++;
            if (row.user_id) activeUserIds.add(row.user_id);

            // Chart Data
            const day = (row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at)).split('T')[0];
            dailyGenerations[day] = (dailyGenerations[day] || 0) + (row.generation_count || 1);
            dailyCredits[day] = (dailyCredits[day] || 0) + (row.credits_used || 0);

            // Model Data
            if (row.api_model_used) {
                modelUsage[row.api_model_used] = (modelUsage[row.api_model_used] || 0) + 1;
            }
        });

        const errorRate = historyData?.length ? (errorCount / historyData.length) * 100 : 0;

        // Generate last 7 days array (always 7 days)
        const last7Days: string[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }

        // Format Chart Data with 0 for days without data
        const chartLabels = last7Days;
        const chartData = chartLabels.map(day => dailyGenerations[day] || 0);
        const creditData = chartLabels.map(day => dailyCredits[day] || 0);

        const topModels = Object.entries(modelUsage)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // 3. Fetch Revenue Stats (Last 30 Days)
        const revenueData = await sql`
            SELECT 
                amount, 
                completed_at, 
                created_at
            FROM payment_transactions
            WHERE status = 'completed'
            AND created_at >= ${dateStr}
        `;

        let totalRevenue = 0;
        const dailyRevenue: Record<string, number> = {};

        revenueData?.forEach((row: any) => {
            const amount = Number(row.amount) || 0;
            totalRevenue += amount;

            // Chart Data
            if (row.completed_at) {
                const day = (row.completed_at instanceof Date ? row.completed_at.toISOString() : String(row.completed_at)).split('T')[0];
                dailyRevenue[day] = (dailyRevenue[day] || 0) + amount;
            } else if (row.created_at) {
                const day = (row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at)).split('T')[0];
                dailyRevenue[day] = (dailyRevenue[day] || 0) + amount;
            }
        });

        // 4. Fetch Newest Users with generation stats in single query
        const recentUsersRaw = await sql`
            SELECT
                u.user_id,
                u.email,
                u.display_name,
                u.role,
                u.current_credits,
                u.created_at,
                COALESCE(SUM(h.generation_count), 0) as total_gen
            FROM users u
            LEFT JOIN generation_history h ON u.user_id = h.user_id AND h.created_at >= ${dateStr}
            GROUP BY u.user_id, u.email, u.display_name, u.role, u.current_credits, u.created_at
            ORDER BY u.created_at DESC
            LIMIT 5
        `;

        const recentUsers = recentUsersRaw?.map((user: any) => ({
            user_id: user.user_id,
            email: user.email,
            full_name: user.display_name || 'N/A',
            role: user.role || 'user',
            current_credits: user.current_credits || 0,
            created_at: user.created_at,
            total_gen: parseInt(user.total_gen) || 0,
            plan: user.role === 'admin' ? 'Admin' : 'Free'
        })) || [];

        // 5. Fetch Recent Transactions with user info (single query with JOIN)
        const recentTransactions = await sql`
            SELECT
                t.id,
                t.amount,
                t.status,
                t.created_at,
                u.email,
                u.display_name,
                u.avatar_url
            FROM payment_transactions t
            LEFT JOIN users u ON t.user_id = u.user_id
            ORDER BY t.created_at DESC
            LIMIT 5
        `;

        const formattedTransactions = recentTransactions?.map((tx: any) => ({
            id: tx.id,
            amount: tx.amount,
            status: tx.status,
            created_at: tx.created_at,
            user: {
                email: tx.email || 'Unknown',
                full_name: tx.display_name || 'N/A',
                avatar_url: tx.avatar_url
            }
        })) || [];

        const revenueChartData = chartLabels.map(day => dailyRevenue[day] || 0);

        return NextResponse.json({
            success: true,
            stats: {
                totalUsers,
                creditsConsumed,
                totalImages,
                errorRate,
                totalRevenue,
                successRate: 100 - errorRate
            },
            charts: {
                labels: chartLabels,
                data: chartData,
                credits: creditData,
                revenue: revenueChartData,
                topModels
            },
            recentUsers,
            recentTransactions: formattedTransactions
        }, { headers: cacheHeaders });

    } catch (error: any) {
        console.error('[API] Dashboard stats error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal Server Error'
        }, { status: 500 });
    }
}
