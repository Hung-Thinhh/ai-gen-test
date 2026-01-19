"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Grid,
    Card,
    CardMedia,
    CardContent,
    CircularProgress,
    Button
} from '@mui/material';
import { getAllPosterTools } from '../../services/storageService';
import { useRouter } from 'next/navigation';

interface PosterTool {
    id: string;
    name: string;
    slug: string;
    description: string;
    preview_image_url: string;
    sort_order: number;
}

export default function PosterList() {
    const router = useRouter();
    const [tools, setTools] = useState<PosterTool[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const toolsData = await getAllPosterTools();
                setTools(toolsData || []);
            } catch (error) {
                console.error("Failed to fetch poster tools", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleToolClick = (tool: PosterTool) => {
        router.push(`/poster/${tool.slug}`);
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4, minHeight: '80vh' }}>
            <Typography variant="h4" fontWeight="bold" align="center" gutterBottom sx={{ mb: 1, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Poster Creator Tools
            </Typography>
            <Typography variant="body1" align="center" sx={{ mb: 4, color: 'var(--text-secondary)' }}>
                Chọn công cụ tạo poster phù hợp với bạn
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: 'var(--accent-primary)' }} />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {tools.length === 0 ? (
                        <Box sx={{ width: '100%', textAlign: 'center', py: 8 }}>
                            <Typography color="text.secondary">Chưa có công cụ nào.</Typography>
                        </Box>
                    ) : (
                        tools.map((tool) => (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={tool.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
                                            borderColor: 'var(--accent-primary)',
                                        },
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        bgcolor: '#171717',
                                        border: '1px solid #333',
                                    }}
                                >
                                    <Box onClick={() => handleToolClick(tool)} sx={{ cursor: 'pointer', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Box sx={{ position: 'relative', width: '100%', pt: '100%' }}>
                                            <CardMedia
                                                component="img"
                                                image={tool.preview_image_url || '/placeholder-image.jpg'}
                                                alt={tool.name}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        </Box>
                                        <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#171717' }}>
                                            <Typography variant="h6" fontWeight="bold" gutterBottom component="div" sx={{ color: '#EAB308', fontSize: '1.1rem', lineHeight: 1.3 }}>
                                                {tool.name}
                                            </Typography>
                                            <Typography variant="body2" sx={{
                                                color: '#9CA3AF',
                                                mb: 2,
                                                display: '-webkit-box',
                                                overflow: 'hidden',
                                                WebkitBoxOrient: 'vertical',
                                                WebkitLineClamp: 3,
                                                fontSize: '0.875rem'
                                            }}>
                                                {tool.description || 'Tạo poster chuyên nghiệp với AI.'}
                                            </Typography>

                                            <Button
                                                variant="contained"
                                                fullWidth
                                                sx={{
                                                    mt: 'auto',
                                                    bgcolor: '#F59E0B',
                                                    background: 'linear-gradient(to right, #F59E0B, #EA580C)',
                                                    color: 'black',
                                                    fontWeight: 'bold',
                                                    textTransform: 'none',
                                                    borderRadius: '9999px',
                                                    '&:hover': {
                                                        background: 'linear-gradient(to right, #D97706, #C2410C)',
                                                    }
                                                }}
                                            >
                                                Bắt đầu
                                            </Button>
                                        </CardContent>
                                    </Box>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            )}
        </Container>
    );
}
