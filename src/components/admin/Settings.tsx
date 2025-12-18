"use client";

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    FormControlLabel,
    Switch,
    Alert,
    Stack,
    Divider
} from '@mui/material';
import { Save as SaveIcon, Warning as WarningIcon, Settings as SettingsIcon, Flag as FlagIcon, Delete as DeleteIcon } from '@mui/icons-material';

export default function Settings() {
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <Box maxWidth="lg" sx={{ width: '100%' }}>

            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                        Admin &gt; Cài đặt
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color: '#FF6600', textTransform: 'uppercase' }}>
                        Cài đặt hệ thống
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    size="medium"
                    onClick={handleSave}
                    color="primary"
                    startIcon={<SaveIcon />}
                    sx={{ borderRadius: 2, boxShadow: 'none' }}
                >
                    Lưu thay đổi
                </Button>
            </Stack>

            {saved && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>Đã lưu cài đặt thành công!</Alert>}

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    {/* General Settings */}
                    <Paper sx={{ p: 4, mb: 4, bgcolor: '#FFFFFF', borderRadius: 3, border: '1px solid #E5E7EB' }} elevation={0}>
                        <Stack direction="row" gap={2} alignItems="center" mb={3}>
                            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'primary.light', color: 'primary.main' }}>
                                <SettingsIcon />
                            </Box>
                            <Typography variant="h6" fontWeight={700}>Cấu hình chung</Typography>
                        </Stack>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Tên trang web"
                                    defaultValue="Duky AI"
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Email hỗ trợ"
                                    defaultValue="support@dukyai.com"
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Thông báo Banner"
                                    multiline
                                    rows={2}
                                    placeholder="Nhập thông báo hiển thị trên đầu trang..."
                                    variant="outlined"
                                    helperText="Hiển thị thông báo quan trọng cho tất cả người dùng"
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Feature Flags */}
                    <Paper sx={{ p: 4, mb: 4, bgcolor: '#FFFFFF', borderRadius: 3, border: '1px solid #E5E7EB' }} elevation={0}>
                        <Stack direction="row" gap={2} alignItems="center" mb={3}>
                            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#F3E8FF', color: '#6B21A8' }}>
                                <FlagIcon />
                            </Box>
                            <Typography variant="h6" fontWeight={700}>Quản lý Tính năng</Typography>
                        </Stack>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ p: 2, border: '1px solid #F3F4F6', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={600}>Cho phép Khách</Typography>
                                        <Typography variant="caption" color="text.secondary">Truy cập không cần login</Typography>
                                    </Box>
                                    <Switch defaultChecked color="success" size="small" />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ p: 2, border: '1px solid #F3F4F6', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={600}>Thư viện công khai</Typography>
                                        <Typography variant="caption" color="text.secondary">Hiển thị tab Gallery</Typography>
                                    </Box>
                                    <Switch defaultChecked color="success" size="small" />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ p: 2, border: '1px solid #F3F4F6', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={600}>Đăng ký thành viên</Typography>
                                        <Typography variant="caption" color="text.secondary">Cho phép user mới đăng ký</Typography>
                                    </Box>
                                    <Switch defaultChecked color="primary" size="small" />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ p: 2, border: '1px solid #FEF3C7', bgcolor: '#FFFBEB', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={600} color="warning.dark">Bảo trì hệ thống</Typography>
                                        <Typography variant="caption" color="warning.dark">Chỉ Admin mới truy cập được</Typography>
                                    </Box>
                                    <Switch color="warning" size="small" />
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    {/* Danger Zone */}
                    <Paper sx={{ p: 3, bgcolor: '#FEF2F2', borderRadius: 3, border: '1px solid #FECACA' }} elevation={0}>
                        <Stack direction="row" gap={1.5} alignItems="center" mb={2}>
                            <WarningIcon color="error" />
                            <Typography variant="h6" fontWeight={700} color="error.main">Vùng nguy hiểm</Typography>
                        </Stack>
                        <Typography variant="body2" color="error.dark" mb={3} sx={{ opacity: 0.9 }}>
                            Các hành động dưới đây sẽ ảnh hưởng trực tiếp đến dữ liệu và người dùng. Hãy cẩn thận.
                        </Typography>

                        <Button
                            variant="outlined"
                            color="error"
                            fullWidth
                            startIcon={<DeleteIcon />}
                            sx={{ mb: 2, bgcolor: '#FFFFFF', borderColor: '#FCA5A5', '&:hover': { bgcolor: '#FEE2E2' } }}
                        >
                            Xóa toàn bộ Cache
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            fullWidth
                            startIcon={<DeleteIcon />}
                            sx={{ bgcolor: '#FFFFFF', borderColor: '#FCA5A5', '&:hover': { bgcolor: '#FEE2E2' } }}
                        >
                            Reset User Sessions
                        </Button>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
