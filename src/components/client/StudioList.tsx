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
    CardActionArea,
    Chip,
    CircularProgress,
    Stack,
    Button
} from '@mui/material';
import { getAllStudios, getAllCategories } from '../../services/storageService';
import { useRouter } from 'next/navigation';

interface Studio {
    id: string;
    name: string;
    slug: string;
    description: string;
    preview_image_url: string;
    category: string; // This is the category ID or UUID
    categories?: { name: string };
    prompts: any; // JSONB
    sort_order: number;
}

interface Category {
    id: string;
    name: string;
    sort_order: number;
}

export default function StudioList() {
    const router = useRouter();
    const [studios, setStudios] = useState<Studio[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [studiosData, catsData] = await Promise.all([
                    getAllStudios(),
                    getAllCategories()
                ]);
                setStudios(studiosData || []);
                setCategories(catsData || []);
            } catch (error) {
                console.error("Failed to fetch studio data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Show all studios without gender filtering
    const filteredStudios = studios;

    // Group by Category
    const studiosByCategory: Record<string, Studio[]> = {};
    filteredStudios.forEach(studio => {
        // Use category name if available, or 'Other'
        const catName = studio.categories?.name || 'Khác';
        if (!studiosByCategory[catName]) {
            studiosByCategory[catName] = [];
        }
        studiosByCategory[catName].push(studio);
    });

    // Sort categories based on the original categories list order
    const sortedCategoryNames = categories
        .map(c => c.name)
        .filter(name => Object.keys(studiosByCategory).includes(name));

    // Add any categories that might have been missed (e.g. if we used IDs differently) or 'Khác'
    Object.keys(studiosByCategory).forEach(key => {
        if (!sortedCategoryNames.includes(key)) {
            sortedCategoryNames.push(key);
        }
    });

    const handleStudioClick = (studio: Studio) => {
        // Navigate to detail page or open modal
        // For now, let's assume we navigate to a detail page
        router.push(`/studio/${studio.slug}`);
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4, minHeight: '80vh' }}>
            <Typography variant="h4" fontWeight="bold" align="center" gutterBottom sx={{ mb: 1, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Studio Chụp Ảnh
            </Typography>
            <Typography variant="body1" align="center" sx={{ mb: 4, color: 'var(--text-secondary)' }}>
                Chọn phong cách bạn yêu thích và bắt đầu sáng tạo
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: 'var(--accent-primary)' }} />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {filteredStudios.length === 0 ? (
                        <Box sx={{ width: '100%', textAlign: 'center', py: 8 }}>
                            <Typography color="text.secondary">Chưa có studio nào cho mục này.</Typography>
                        </Box>
                    ) : (
                        filteredStudios.map((studio) => (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={studio.id}>
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
                                        bgcolor: '#171717', // Darker background for card
                                        border: '1px solid #333',
                                    }}
                                >
                                    <Box onClick={() => handleStudioClick(studio)} sx={{ cursor: 'pointer', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Box sx={{ position: 'relative', width: '100%', pt: '100%' /* 1:1 aspect ratio */ }}>
                                            <CardMedia
                                                component="img"
                                                image={studio.preview_image_url || '/placeholder-image.jpg'}
                                                alt={studio.name}
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
                                                {studio.name}
                                            </Typography>
                                            <Typography variant="body2" sx={{
                                                color: '#9CA3AF', // Gray-400
                                                mb: 2,
                                                display: '-webkit-box',
                                                overflow: 'hidden',
                                                WebkitBoxOrient: 'vertical',
                                                WebkitLineClamp: 3,
                                                fontSize: '0.875rem'
                                            }}>
                                                {studio.description || 'Sáng tạo ảnh nghệ thuật với AI.'}
                                            </Typography>

                                            <Button
                                                variant="contained"
                                                fullWidth
                                                sx={{
                                                    mt: 'auto',
                                                    bgcolor: '#F59E0B', // Amber-500 base
                                                    background: 'linear-gradient(to right, #F59E0B, #EA580C)', // Orange gradient
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
