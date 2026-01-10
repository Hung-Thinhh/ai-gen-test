import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon/client';

export async function GET() {
    try {
        console.log('[API] Fetching dashboard stats from Neon...');

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
        const chartLabels = Object.keys(dailyGenerations).sort().slice(-7); // Last 7 days
        const chartData = chartLabels.map(day => dailyGenerations[day]);
        const creditData = chartLabels.map(day => dailyCredits[day]);

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
                const day = row.completed_at.split('T')[0];
                dailyRevenue[day] = (dailyRevenue[day] || 0) + amount;
            } else if (row.created_at) {
                const day = row.created_at.split('T')[0];
                dailyRevenue[day] = (dailyRevenue[day] || 0) + amount;
            }
        });

        // 4. Fetch Newest Users (From users table)
        const recentPublicUsers = await sql`
            SELECT 
                user_id, 
                email, 
                display_name, 
                role, 
                current_credits, 
                created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 5
        `;

        const recentUsers = recentPublicUsers?.map((user: any) => {
            // Calculate usage stats from historyData
            const userHistory = historyData?.filter((h: any) => h.user_id === user.user_id) || [];
            const userGen = userHistory.reduce((sum: number, h: any) => sum + (h.generation_count || 1), 0);

            return {
                user_id: user.user_id,
                email: user.email,
                full_name: user.display_name || 'N/A',
                role: user.role || 'user',
                current_credits: user.current_credits || 0,
                created_at: user.created_at,
                total_gen: userGen,
                plan: user.role === 'admin' ? 'Admin' : 'Free'
            };
        }) || [];

        // 5. Fetch Recent Transactions
        const recentTxData = await sql`
            SELECT 
                id, 
                amount, 
                status, 
                created_at, 
                user_id
            FROM payment_transactions
            ORDER BY created_at DESC
            LIMIT 5
        `;

        // Enrich transactions with user info
        let recentTransactions: any[] = [];
        if (recentTxData && recentTxData.length > 0) {
            const txUserIds = [...new Set(recentTxData.map((tx: any) => tx.user_id))];

            const txUsers = await sql`
                SELECT 
                    user_id, 
                    email, 
                    display_name, 
                    avatar_url
                FROM users
                WHERE user_id = ANY(${txUserIds})
            `;

            recentTransactions = recentTxData.map((tx: any) => {
                const user = txUsers?.find((u: any) => u.user_id === tx.user_id);
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
            recentTransactions
        });

    } catch (error: any) {
        console.error('[API] Dashboard stats error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
