/**
 * Cache Debug Utility
 * Add this component to your app to debug and manage cache
 */

'use client';

import React from 'react';
import { cacheService, CACHE_KEYS } from '../services/cacheService';
import { Button, Box, Typography, Paper } from '@mui/material';

export const CacheDebugPanel: React.FC = () => {
    const [stats, setStats] = React.useState({ total: 0, expired: 0, active: 0 });

    const updateStats = () => {
        const newStats = cacheService.getStats();
        setStats(newStats);
    };

    React.useEffect(() => {
        updateStats();
    }, []);

    const handleClearAll = () => {
        cacheService.clearAll();
        updateStats();
        console.log('[CacheDebug] Cleared all cache');
    };

    const handleClearExpired = () => {
        cacheService.clearExpired();
        updateStats();
        console.log('[CacheDebug] Cleared expired cache');
    };

    const handleClearBanners = () => {
        cacheService.remove(CACHE_KEYS.BANNERS);
        updateStats();
        console.log('[CacheDebug] Cleared banners cache');
    };

    const handleClearTools = () => {
        cacheService.remove(CACHE_KEYS.TOOLS);
        updateStats();
        console.log('[CacheDebug] Cleared tools cache');
    };

    return (
        <Paper
            sx={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                p: 2,
                zIndex: 9999,
                minWidth: 250,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white'
            }}
        >
            <Typography variant="h6" gutterBottom>
                Cache Debug
            </Typography>

            <Box sx={{ mb: 2 }}>
                <Typography variant="body2">Total: {stats.total}</Typography>
                <Typography variant="body2">Active: {stats.active}</Typography>
                <Typography variant="body2">Expired: {stats.expired}</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={handleClearBanners}
                    sx={{ color: 'white', borderColor: 'white' }}
                >
                    Clear Banners
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={handleClearTools}
                    sx={{ color: 'white', borderColor: 'white' }}
                >
                    Clear Tools
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={handleClearExpired}
                    sx={{ color: 'white', borderColor: 'white' }}
                >
                    Clear Expired
                </Button>
                <Button
                    variant="contained"
                    size="small"
                    color="error"
                    onClick={handleClearAll}
                >
                    Clear All Cache
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={updateStats}
                    sx={{ color: 'white', borderColor: 'white' }}
                >
                    Refresh Stats
                </Button>
            </Box>
        </Paper>
    );
};
