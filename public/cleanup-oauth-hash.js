// This script runs IMMEDIATELY when the page loads, before React hydrates
// It cleans up OAuth callback hash fragments to prevent them from showing in the URL

(function () {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;

    // Check if hash contains OAuth tokens
    const hash = window.location.hash;

    if (hash && (hash.includes('access_token') || hash.includes('refresh_token'))) {
        console.log('🔗 [Immediate Cleanup] Removing OAuth hash from URL...');

        // Remove the hash immediately using history API
        // This happens before React even loads
        window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search
        );

        console.log('✅ [Immediate Cleanup] OAuth hash removed');
    }
})();
