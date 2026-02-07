"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPosterToolBySlug } from '../../../../services/storageService';
import MilkTeaPosterGenerator from '../../../../components/MilkTeaPosterWrapper2';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function PosterToolDetailPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [tool, setTool] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTool = async () => {
            if (!slug) return;
            setLoading(true);
            try {
                const data = await getPosterToolBySlug(slug);
                console.log('Fetched poster tool:', slug, data);
                if (data) {
                    setTool(data);
                } else {
                    setError('Không tìm thấy công cụ này.');
                }
            } catch (err) {
                console.error(err);
                setError('Đã xảy ra lỗi khi tải dữ liệu.');
            } finally {
                setLoading(false);
            }
        };

        fetchTool();
    }, [slug]);

    if (loading) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CircularProgress sx={{ color: 'var(--accent-primary)' }} />
            </Box>
        );
    }

    if (error || !tool) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <Typography variant="h5" color="error">{error || 'Không tìm thấy công cụ.'}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh' }}>
            <MilkTeaPosterGenerator studio={tool} />
        </Box>
    );
}
