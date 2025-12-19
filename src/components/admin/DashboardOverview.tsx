"use client";

import React from 'react';
import {
    Paper,
    Typography,
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    Chip,
    Avatar,
    IconButton,
    CircularProgress
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    ArrowForward,
    Image as ImageIcon
} from '@mui/icons-material';

// --- MOCK COMPONENTS FOR CHARTS ---

const SparkLine = ({ data, color, height = 40 }: { data: number[], color: string, height?: number }) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const stepX = 100 / (data.length - 1);

    const points = data.map((d, i) => {
        const x = i * stepX;
        const normalizedY = (d - min) / (range || 1);
        const y = 100 - (normalizedY * 100);
        return `${x},${y}`;
    }).join(' ');

    return (
        <Box sx={{ width: '100%', height: height, overflow: 'hidden' }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    points={points}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </Box>
    );
};

const AreaChartMock = () => {
    return (
        <Box sx={{ width: '100%', height: 250, position: 'relative' }}>
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
    // Model usage data
    const data = [80, 65, 45, 30, 20];
    const labels = ['Flux.1', 'SDXL', 'MJ v6', 'Dall-E', 'SD 1.5'];

    return (
        <Box sx={{ width: '100%', height: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 1, pt: 4 }}>
            {data.map((val, i) => (
                <Box key={i} sx={{ width: '15%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, height: '100%' }}>
                    <Box sx={{ width: '60%', bgcolor: '#EBF5FF', borderRadius: 1, height: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                        <Box sx={{
                            width: '100%',
                            height: `${val}%`,
                            bgcolor: i === 0 ? '#FF6600' : '#0F6CBD', // Highlight top model brand color
                            borderRadius: 1,
                            transition: 'height 1s ease'
                        }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>
                        {labels[i]}
                    </Typography>
                </Box>
            ))}
        </Box>
    )
}


// --- SUB COMPONENTS ---

const StatCard = ({ title, value, badgeLabel, badgeColor, data, chartColor }: any) => (
    <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                    {title}
                </Typography>
                {badgeLabel && (
                    <Chip
                        label={badgeLabel}
                        size="small"
                        sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            bgcolor: badgeColor === 'success' ? '#DEF7EC' : '#FDE8E8',
                            color: badgeColor === 'success' ? '#03543F' : '#9B1C1C'
                        }}
                    />
                )}
            </Stack>
            <Typography variant="h4" fontWeight={700} color="text.primary">
                {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                Trong 30 ngày qua
            </Typography>
        </Box>
        <SparkLine data={data} color={chartColor} />
    </Paper>
);

const DetailRow = ({ user, plan, totalGen, credits, lastActive }: any) => (
    <TableRow hover>
        <TableCell sx={{ py: 2 }}>
            <Stack direction="row" alignItems="center" gap={1}>
                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>{user.charAt(0)}</Avatar>
                <Typography variant="body2" fontWeight={500}>{user}</Typography>
            </Stack>
        </TableCell>
        <TableCell>
            <Chip
                label={plan}
                size="small"
                sx={{
                    height: 24,
                    fontWeight: 600,
                    bgcolor: plan === 'Pro' ? '#E1EFFE' : '#F3F4F6',
                    color: plan === 'Pro' ? '#1E429F' : '#374151',
                    borderRadius: 1
                }}
            />
        </TableCell>
        <TableCell>{totalGen}</TableCell>
        <TableCell>{credits}</TableCell>
        <TableCell>
            <Typography variant="body2" color="text.secondary">{lastActive}</Typography>
        </TableCell>
    </TableRow>
)

export default function DashboardOverview() {
    return (
        <Box>
            {/* Top Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                        Admin &gt; Tổng quan
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color: '#FF6600' }}>
                        Dashboard
                    </Typography>
                </Box>
            </Stack>

            {/* Stats Row */}
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} mb={4}>
                <Box sx={{ flex: { lg: '1 1 25%' } }}>
                    <StatCard
                        title="Người dùng mới"
                        value="1,245"
                        badgeLabel="+25%"
                        badgeColor="success"
                        chartColor="#31C48D" // Green
                        data={[20, 40, 30, 50, 40, 60, 50, 70, 60, 80]}
                    />
                </Box>
                <Box sx={{ flex: { lg: '1 1 25%' } }}>
                    <StatCard
                        title="Credit tiêu thụ"
                        value="325k"
                        badgeLabel="-12%"
                        badgeColor="error"
                        chartColor="#F05252" // Red
                        data={[80, 70, 60, 50, 40, 30, 20, 10, 20]}
                    />
                </Box>
                <Box sx={{ flex: { lg: '1 1 25%' } }}>
                    <StatCard
                        title="Tổng ảnh tạo"
                        value="48.2k"
                        badgeLabel="+5%"
                        badgeColor="success"
                        chartColor="#9CA3AF" // Grey
                        data={[20, 25, 22, 30, 35, 32, 28, 30, 40]}
                    />
                </Box>
                <Box sx={{ flex: { lg: '1 1 25%' } }}>
                    <Paper sx={{ p: 3, height: '100%', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Stack direction="row" justifyContent="space-between" mb={2}>
                            <Box>
                                <Typography variant="h6" fontWeight={700}>Báo cáo lỗi</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Tỉ lệ fail generation thấp
                                </Typography>
                            </Box>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                <CircularProgress variant="determinate" value={100} sx={{ color: '#E5E7EB' }} size={50} thickness={4} />
                                <CircularProgress variant="determinate" value={2.5} color="success" sx={{ position: 'absolute', left: 0 }} size={50} thickness={4} />
                                <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography variant="caption" component="div" color="text.secondary" fontWeight={700}>2.5%</Typography>
                                </Box>
                            </Box>
                        </Stack>
                        <Button
                            variant="outlined"
                            size="small"
                            color="inherit"
                            sx={{ borderRadius: 2, borderColor: '#E5E7EB' }}
                        >
                            Xem log lỗi
                        </Button>
                    </Paper>
                </Box>
            </Stack>

            {/* Charts Row */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} mb={6}>
                <Box sx={{ flex: { md: '7' } }}>
                    <Paper sx={{ p: 5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
                            <Box>
                                <Typography variant="h6" fontWeight={700}>Lượt tạo ảnh</Typography>
                                <Stack direction="row" alignItems="center" gap={1} mt={0.5}>
                                    <Typography variant="h4" fontWeight={700}>13,277</Typography>
                                    <Chip label="+35%" size="small" sx={{ bgcolor: '#DEF7EC', color: '#03543F', fontWeight: 700, height: 24, borderRadius: 1 }} />
                                </Stack>
                                <Typography variant="caption" color="text.secondary">Số lượng ảnh tạo mỗi ngày (30 ngày gần nhất)</Typography>
                            </Box>
                        </Stack>
                        <AreaChartMock />
                    </Paper>
                </Box>
                <Box sx={{ flex: { md: '5' } }}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Box mb={2}>
                            <Typography variant="h6" fontWeight={700}>Top Mô hình AI</Typography>
                            <Typography variant="caption" color="text.secondary">Model được sử dụng nhiều nhất</Typography>
                        </Box>
                        <BarChartMock />
                    </Paper>
                </Box>
            </Stack>

            {/* Details Table */}
            <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" color="text.primary" fontWeight={700}>Người dùng tiêu biểu</Typography>
                    <Button size="small">Xem tất cả</Button>
                </Stack>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 2 }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Người dùng</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Gói cước</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Tổng ảnh tạo</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Credits dư</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Hoạt động cuối</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <DetailRow user="nguyenvan_a@gmail.com" plan="Pro" totalGen="12,423" credits="500" lastActive="2 phút trước" />
                            <DetailRow user="design.studio@agency.vn" plan="Enterprise" totalGen="8,653" credits="Unlimited" lastActive="15 phút trước" />
                            <DetailRow user="khachvanglai_99" plan="Free" totalGen="45" credits="5" lastActive="1 giờ trước" />
                            <DetailRow user="content_creator_x" plan="Pro" totalGen="2,543" credits="120" lastActive="3 giờ trước" />
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
}
