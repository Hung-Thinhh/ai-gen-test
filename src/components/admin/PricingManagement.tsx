"use client";

import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    TextField,
    InputAdornment,
    Stack,
    Chip
} from '@mui/material';
import { Check as CheckIcon, Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';

const PlanCard = ({ title, price, credits, features, recommended = false }: any) => (
    <Card sx={{
        height: '100%',
        position: 'relative',
        bgcolor: '#FFFFFF',
        borderRadius: 3,
        border: recommended ? '2px solid #FF6600' : '1px solid #E5E7EB',
        boxShadow: recommended ? '0px 10px 20px rgba(255, 102, 0, 0.1)' : '0px 1px 3px rgba(0, 0, 0, 0.05)',
        transform: recommended ? 'scale(1.02)' : 'none',
        transition: 'transform 0.2s',
        '&:hover': { transform: recommended ? 'scale(1.03)' : 'translateY(-4px)' }
    }} elevation={0}>
        {recommended && (
            <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0,
                bgcolor: '#FF6600', color: 'white', textAlign: 'center', py: 0.75,
                fontWeight: 700, fontSize: '0.75rem', letterSpacing: 1
            }}>
                PHỔ BIẾN NHẤT
            </Box>
        )}
        <CardContent sx={{ pt: recommended ? 6 : 4, px: 3, pb: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" fontWeight={800} color={recommended ? 'secondary.main' : 'text.primary'}>{title}</Typography>
                {/* <Chip label={recommended ? "Active" : "Enabled"} size="small" /> */}
            </Stack>

            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 3 }}>
                <Typography variant="h3" fontWeight={800} color="text.primary">{price}</Typography>
                <Typography color="text.secondary" fontWeight={500}>/tháng</Typography>
            </Box>

            <TextField
                label="Số lượng Credits"
                defaultValue={credits}
                size="small"
                fullWidth
                variant="outlined"
                sx={{ mb: 3, bgcolor: '#F9FAFB' }}
                InputProps={{
                    endAdornment: <InputAdornment position="end">credits</InputAdornment>,
                }}
            />

            <DividerLine />

            <List sx={{ mt: 2, mb: 3 }}>
                {features.map((feature: string, index: number) => (
                    <ListItem key={index} disableGutters sx={{ py: 0.75 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckIcon sx={{ color: '#0F6CBD', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText
                            primary={feature}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                        />
                    </ListItem>
                ))}
            </List>

            <Button
                variant={recommended ? "contained" : "outlined"}
                color={recommended ? "secondary" : "primary"}
                fullWidth
                size="large"
                sx={{
                    fontWeight: 700,
                    borderRadius: 2,
                    boxShadow: recommended ? '0 4px 6px -1px rgba(255, 102, 0, 0.2)' : 'none',
                    borderWidth: recommended ? 0 : '1px'
                }}
            >
                Lưu thay đổi
            </Button>
        </CardContent>
    </Card>
);

const DividerLine = () => <Box sx={{ height: '1px', bgcolor: '#E5E7EB', my: 2 }} />;

export default function PricingManagement() {
    return (
        <Box sx={{ width: '100%' }}>
            <Box mb={5}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                    Admin &gt; Gói cước
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color: '#FF6600', textTransform: 'uppercase' }}>
                    Quản lý Bảng giá
                </Typography>
            </Box>

            <Grid container spacing={4} alignItems="flex-start">
                <Grid item xs={12} md={4}>
                    <PlanCard
                        title="Miễn phí"
                        price="$0"
                        credits="5"
                        features={["Truy cập cơ bản", "Tốc độ tiêu chuẩn", "Có watermark", "Hỗ trợ cộng đồng"]}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <PlanCard
                        title="Chuyên nghiệp"
                        price="$19"
                        credits="500"
                        recommended={true}
                        features={["Truy cập đầy đủ", "Tạo ảnh siêu tốc", "Không watermark", "Hỗ trợ ưu tiên", "Thư viện riêng tư"]}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <PlanCard
                        title="Doanh nghiệp"
                        price="$99"
                        credits="5000"
                        features={["Truy cập API", "GPU Riêng", "Custom Models", "Hỗ trợ 24/7", "Tích hợp SSO"]}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}
