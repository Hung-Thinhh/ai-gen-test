"use client";

import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Stack,
    Chip,
    Button
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

// Reuse Mock Charts
const AreaChartMock = () => {
    return (
        <Box sx={{ width: '100%', height: 300, position: 'relative' }}>
            <svg viewBox="0 0 500 150" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <defs>
                    <linearGradient id="gradientBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0F6CBD" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#0F6CBD" stopOpacity={0.0} />
                    </linearGradient>
                </defs>
                <line x1="0" y1="30" x2="500" y2="30" stroke="#f0f0f0" strokeWidth="1" strokeDasharray="5,5" />
                <line x1="0" y1="70" x2="500" y2="70" stroke="#f0f0f0" strokeWidth="1" strokeDasharray="5,5" />
                <line x1="0" y1="110" x2="500" y2="110" stroke="#f0f0f0" strokeWidth="1" strokeDasharray="5,5" />

                <path
                    d="M0,120 C50,110 100,130 150,90 C200,50 250,80 300,60 C350,40 400,20 450,40 L500,30 L500,150 L0,150 Z"
                    fill="url(#gradientBlue)"
                />
                <path
                    d="M0,120 C50,110 100,130 150,90 C200,50 250,80 300,60 C350,40 400,20 450,40 L500,30"
                    fill="none"
                    stroke="#0F6CBD"
                    strokeWidth="3"
                />
            </svg>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, color: 'text.secondary', fontSize: '0.75rem' }}>
                <span>01 Th4</span>
                <span>05 Th4</span>
                <span>10 Th4</span>
                <span>15 Th4</span>
                <span>20 Th4</span>
                <span>25 Th4</span>
            </Box>
        </Box>
    )
}

const BarChartMock = () => {
    const data = [80, 65, 45, 30, 20, 34, 56, 78, 90, 23, 45, 67];
    return (
        <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1, pt: 4 }}>
            {data.map((val, i) => (
                <Box key={i} sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, height: '100%' }}>
                    <Box sx={{ width: '60%', bgcolor: '#EBF5FF', borderRadius: 1, height: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                        <Box sx={{
                            width: '100%',
                            height: `${val}%`,
                            bgcolor: '#0F6CBD',
                            borderRadius: 1
                        }} />
                    </Box>
                </Box>
            ))}
        </Box>
    )
}

export default function Analytics() {
    return (
        <Box sx={{ width: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                        Admin &gt; Thống kê
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color: '#FF6600', textTransform: 'uppercase' }}>
                        Thống kê chi tiết
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    sx={{ borderRadius: 2 }}
                >
                    Xuất báo cáo
                </Button>
            </Stack>

            <Stack spacing={3}>
                <Paper sx={{ p: 4, bgcolor: '#FFFFFF', borderRadius: 3, border: '1px solid #E5E7EB' }} elevation={0}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
                        <Box>
                            <Typography variant="h6" fontWeight={700}>Lưu lượng truy cập</Typography>
                            <Typography variant="caption" color="text.secondary">Dữ liệu theo thời gian thực</Typography>
                        </Box>
                        <Chip label="Live" color="error" size="small" />
                    </Stack>
                    <AreaChartMock />
                </Paper>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                    <Paper sx={{ p: 4, bgcolor: '#FFFFFF', borderRadius: 3, border: '1px solid #E5E7EB', flex: 1 }} elevation={0}>
                        <Typography variant="h6" fontWeight={700} mb={3}>Tăng trưởng User</Typography>
                        <BarChartMock />
                    </Paper>
                    <Paper sx={{ p: 4, bgcolor: '#FFFFFF', borderRadius: 3, border: '1px solid #E5E7EB', flex: 1 }} elevation={0}>
                        <Typography variant="h6" fontWeight={700} mb={3}>Doanh thu (Tháng)</Typography>
                        <BarChartMock />
                    </Paper>
                </Stack>
            </Stack>
        </Box>
    );
}
