/**
 * Simple concurrent users simulation using Node.js
 * Test multiple users accessing the app simultaneously
 */

const BASE_URL = 'http://localhost:3000';
const NUM_USERS = 10; // Number of concurrent users
const ACTIONS_PER_USER = 5; // Actions each user performs

// Simulate a single user session
async function simulateUser(userId) {
    console.log(`👤 User ${userId} started`);
    const actions = [
        { name: 'Homepage', url: '/' },
        { name: 'Tools', url: '/tool' },
        { name: 'Gallery', url: '/gallery' },
        { name: 'Prompt Library', url: '/prompt-library' },
        { name: 'Guest Credits', url: `/api/guest/credits?guestId=guest_${userId}` }
    ];

    const results = [];

    for (let i = 0; i < ACTIONS_PER_USER; i++) {
        const action = actions[i % actions.length];
        const startTime = Date.now();

        try {
            const response = await fetch(`${BASE_URL}${action.url}`);
            const duration = Date.now() - startTime;

            results.push({
                user: userId,
                action: action.name,
                status: response.status,
                duration: `${duration}ms`,
                success: response.ok
            });

            console.log(`  ✓ User ${userId}: ${action.name} (${duration}ms)`);

            // Random delay between actions (500ms - 2s)
            await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));

        } catch (error) {
            console.error(`  ✗ User ${userId}: ${action.name} failed -`, error.message);
            results.push({
                user: userId,
                action: action.name,
                error: error.message,
                success: false
            });
        }
    }

    console.log(`👤 User ${userId} completed`);
    return results;
}

// Main test runner
async function runLoadTest() {
    console.log(`\n🚀 Starting load test with ${NUM_USERS} concurrent users...\n`);
    const startTime = Date.now();

    // Launch all users concurrently
    const userPromises = Array.from({ length: NUM_USERS }, (_, i) =>
        simulateUser(i + 1)
    );

    // Wait for all users to complete
    const allResults = await Promise.all(userPromises);
    const totalDuration = Date.now() - startTime;

    // Aggregate results
    const flatResults = allResults.flat();
    const successful = flatResults.filter(r => r.success).length;
    const failed = flatResults.filter(r => !r.success).length;
    const avgDuration = flatResults
        .filter(r => r.duration)
        .reduce((sum, r) => sum + parseInt(r.duration), 0) / successful;

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Users:       ${NUM_USERS}`);
    console.log(`Total Requests:    ${flatResults.length}`);
    console.log(`Successful:        ${successful} (${(successful / flatResults.length * 100).toFixed(1)}%)`);
    console.log(`Failed:            ${failed}`);
    console.log(`Avg Response Time: ${avgDuration.toFixed(0)}ms`);
    console.log(`Total Duration:    ${(totalDuration / 1000).toFixed(1)}s`);
    console.log('='.repeat(60) + '\n');

    // Detailed results
    console.log('\n📝 Detailed Results:');
    const groupedByAction = {};
    flatResults.forEach(r => {
        if (!groupedByAction[r.action]) {
            groupedByAction[r.action] = [];
        }
        groupedByAction[r.action].push(r);
    });

    Object.entries(groupedByAction).forEach(([action, results]) => {
        const successCount = results.filter(r => r.success).length;
        const avgTime = results
            .filter(r => r.duration)
            .reduce((sum, r) => sum + parseInt(r.duration), 0) / successCount;

        console.log(`  ${action}:`);
        console.log(`    Success: ${successCount}/${results.length}`);
        console.log(`    Avg Time: ${avgTime.toFixed(0)}ms`);
    });
}

// Run the test
runLoadTest().catch(console.error);
