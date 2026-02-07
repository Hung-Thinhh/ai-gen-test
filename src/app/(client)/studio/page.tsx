"use client";

import React from 'react';
import AppLayout from "@/components/AppLayout";
import StudioList from '@/components/client/StudioList';
import { Box } from '@mui/material';

export default function StudioPage() {
    return (
        <AppLayout>
            <Box sx={{ minHeight: '100vh' }}>
                <StudioList />
            </Box>
        </AppLayout>
    );
}
