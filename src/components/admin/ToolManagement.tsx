"use client";

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Switch,
    FormControlLabel,
    Chip,
    Button,
    Stack,
    Divider,
    IconButton,
    Avatar
} from '@mui/material';
import {
    Build as BuildIcon,
    Settings as SettingsIcon,
    Visibility as VisibilityIcon,
    BugReport as BugReportIcon,
    Add as AddIcon
} from '@mui/icons-material';

const MOCK_TOOLS = [
    { id: 'baby-generator', name: 'Baby Generator', status: 'active', usage: 'High', maintenance: false, version: '2.1' },
    { id: 'portrait-pro', name: 'Portrait Pro', status: 'active', usage: 'Very High', maintenance: false, version: '1.5' },
    { id: 'product-mockup', name: 'Product Mockup', status: 'active', usage: 'Medium', maintenance: false, version: '1.0' },
    { id: 'bg-remover', name: 'Background Remover', status: 'maintenance', usage: 'Medium', maintenance: true, version: '3.0' },
    { id: 'old-restore', name: 'Old Photo Restore', status: 'active', usage: 'Low', maintenance: false, version: '1.2' },
    { id: 'sketch-to-img', name: 'Sketch to Image', status: 'beta', usage: 'Low', maintenance: false, version: '0.9' },
];

export default function ToolManagement() {
    const [tools, setTools] = useState(MOCK_TOOLS);

    const toggleStatus = (id: string) => {
        setTools(tools.map(t =>
            t.id === id ? { ...t, maintenance: !t.maintenance, status: !t.maintenance ? 'maintenance' : 'active' } : t
        ));
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                        Admin &gt; Công cụ AI
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color: '#FF6600', textTransform: 'uppercase' }}>
                        Quản lý Công cụ
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    sx={{ borderRadius: 2, boxShadow: 'none' }}
                >
                    Thêm công cụ
                </Button>
            </Stack>

            <Grid container spacing={3}>
                {tools.map((tool) => (
                    <Grid item xs={12} sm={6} md={4} key={tool.id}>
                        <Card sx={{
                            bgcolor: '#FFFFFF',
                            borderRadius: 3,
                            border: tool.maintenance ? '1px solid #FCD34D' : '1px solid #E5E7EB',
                            transition: 'all 0.2s',
                            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1)' }
                        }} elevation={0}>
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar variant="rounded" sx={{ bgcolor: tool.maintenance ? 'warning.light' : 'primary.light', color: tool.maintenance ? 'warning.main' : 'primary.main' }}>
                                        <BuildIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={700}>{tool.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">Phiên bản {tool.version}</Typography>
                                    </Box>
                                </Stack>
                                <IconButton size="small">
                                    <SettingsIcon fontSize="small" />
                                </IconButton>
                            </Box>

                            <Divider sx={{ borderColor: '#F3F4F6', opacity: 1 }} />

                            <CardContent>
                                <Stack spacing={2}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" color="text.secondary" fontWeight={500}>Trạng thái</Typography>
                                        <Chip
                                            label={tool.status === 'active' ? 'Hoạt động' : tool.status === 'maintenance' ? 'Bảo trì' : 'Beta'}
                                            size="small"
                                            sx={{
                                                fontWeight: 600,
                                                bgcolor: tool.status === 'active' ? '#DEF7EC' : tool.status === 'maintenance' ? '#FDF6B2' : '#E1EFFE',
                                                color: tool.status === 'active' ? '#03543F' : tool.status === 'maintenance' ? '#723B13' : '#1E429F'
                                            }}
                                        />
                                    </Stack>

                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" color="text.secondary" fontWeight={500}>Mức sử dụng</Typography>
                                        <Typography variant="body2" fontWeight={700} color="text.primary">
                                            {tool.usage === 'Very High' ? 'Rất cao' : tool.usage === 'High' ? 'Cao' : tool.usage === 'Medium' ? 'Trung bình' : 'Thấp'}
                                        </Typography>
                                    </Stack>

                                    <Box sx={{ mt: 1, p: 1.5, bgcolor: '#F9FAFB', borderRadius: 2, border: '1px solid #F3F4F6' }}>
                                        <FormControlLabel
                                            sx={{ m: 0, width: '100%', justifyContent: 'space-between', flexDirection: 'row-reverse' }}
                                            control={
                                                <Switch
                                                    checked={!tool.maintenance}
                                                    onChange={() => toggleStatus(tool.id)}
                                                    color="success"
                                                    size="small"
                                                />
                                            }
                                            label={<Typography variant="body2" fontWeight={500}>{tool.maintenance ? "Đang bảo trì" : "Đang hoạt động"}</Typography>}
                                        />
                                    </Box>

                                    <Stack direction="row" spacing={1} mt={1}>
                                        <Button fullWidth variant="outlined" size="small" startIcon={<VisibilityIcon />} sx={{ borderRadius: 1.5, borderColor: '#E5E7EB', color: 'text.secondary' }}>Logs</Button>
                                        <Button fullWidth variant="outlined" size="small" color="error" startIcon={<BugReportIcon />} sx={{ borderRadius: 1.5, borderColor: '#FDE8E8', bgcolor: '#FDE8E8' }}>Báo lỗi</Button>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
