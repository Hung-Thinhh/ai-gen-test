"use client";

import React from 'react';
import PosterList from '@/components/client/PosterList';
import { Box } from '@mui/material';

export default function PosterPage() {
    return (
        <Box sx={{ minHeight: '100vh' }}>
            <PosterList />
        </Box>
    );
}
