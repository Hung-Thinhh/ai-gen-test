"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getStudioBySlug } from '../../../../services/storageService';
import StudioGenerator, { Studio } from '../../../../components/client/StudioGenerator';
import AppLayout from '../../../../components/AppLayout';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function StudioDetailPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [studio, setStudio] = useState<Studio | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStudio = async () => {
            if (!slug) return;
            setLoading(true);
            try {
                const data = await getStudioBySlug(slug);
                console.log('dataaaaaaaaaaaaaaaaaaaaaaaaaaaa', slug, data);
                if (data) {
                    setStudio(data);
                } else {
                    setError('Không tìm thấy studio này.');
                }
            } catch (err) {
                console.error(err);
                setError('Đã xảy ra lỗi khi tải dữ liệu studio.');
            } finally {
                setLoading(false);
            }
        };

        fetchStudio();
    }, [slug]);

    if (loading) {
        return (
            <AppLayout>
                <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <CircularProgress sx={{ color: 'var(--accent-primary)' }} />
                </Box>
            </AppLayout>
        );
    }

    if (error || !studio) {
        return (
            <AppLayout>
                <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                    <Typography variant="h5" color="error">{error || 'Không tìm thấy studio.'}</Typography>
                </Box>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Box sx={{ minHeight: '100vh' }}>
                <StudioGenerator studio={studio} />
            </Box>
        </AppLayout>
    );
}
