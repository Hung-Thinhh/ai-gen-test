"use client";

import React from 'react';
import StudioList from '@/components/client/StudioList';
import { Box } from '@mui/material';

export default function StudioPage() {
    return (
        <Box sx={{ minHeight: '100vh' }}>
            <StudioList />
        </Box>
    );
}
