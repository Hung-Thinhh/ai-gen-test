"use client";

import React, { useEffect, useState } from 'react';
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
import toast from 'react-hot-toast';

// --- MOCK COMPONENTS FOR CHARTS (Modified to accept props) ---

const SparkLine = ({ data, color, height = 40 }: { data: number[], color: string, height?: number }) => {
    // Basic normalization for sparkline
    if (!data || data.length === 0) return <Box sx={{ height }} />;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const stepX = 100 / (data.length - 1 || 1);

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

// Simplified Area Chart for demo - in real app use Recharts
const AreaChartMock = ({ data = [], labels = [] }: { data: number[], labels: string[] }) => {
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

    return (
        <Box sx={{ width: '100%', height: 250, position: 'relative' }}>
            {/* Simple Placeholder Visualization */}
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '80%', justifyContent: 'space-between', padding: '0 10px' }}>
                {data.map((val, i) => {
                    const max = Math.max(...data, 1);
                    const h = (val / max) * 100;
                    const isHovered = hoveredIndex === i;

                    return (
                        <div
                            key={i}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            style={{
                                width: '10%',
                                height: `${h}%`,
                                backgroundColor: isHovered ? 'rgba(15, 108, 189, 0.4)' : 'rgba(15, 108, 189, 0.2)',
                                borderTop: '2px solid #0F6CBD',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease'
                            }}
                        >
                            {/* Tooltip */}
                            {isHovered && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    backgroundColor: '#1F2937',
                                    color: 'white',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    marginBottom: '8px',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                    zIndex: 10
                                }}>
                                    {val} ảnh
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-4px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: 0,
                                        height: 0,
                                        borderLeft: '4px solid transparent',
                                        borderRight: '4px solid transparent',
                                        borderTop: '4px solid #1F2937'
                                    }} />
                                </div>
                            )}

                            <div style={{ position: 'absolute', bottom: -25, left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: '#666' }}>
                                {labels[i]?.split('-').slice(1).join('/') || ''}
                            </div>
                        </div>
                    )
                })}
            </div>
        </Box>
    )
}

const BarChartMock = ({ data = [] }: { data: { name: string, count: number }[] }) => {
    const max = Math.max(...data.map(d => d.count), 1);

    return (
        <Box sx={{ width: '100%', height: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 1, pt: 4 }}>
            {data.map((item, i) => (
                <Box key={i} sx={{ width: '18%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, height: '100%' }}>
                    <Box sx={{ width: '60%', bgcolor: '#EBF5FF', borderRadius: 1, height: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                        <Box sx={{
                            width: '100%',
                            height: `${(item.count / max) * 100}%`,
                            bgcolor: i === 0 ? '#FF6600' : '#0F6CBD',
                            borderRadius: 1,
                            transition: 'height 1s ease',
                            position: 'relative'
                        }}>
                            <Typography variant="caption" sx={{
                                position: 'absolute',
                                top: -22,
                                width: '100%',
                                textAlign: 'center',
                                fontWeight: 700,
                                color: i === 0 ? '#FF6600' : '#0F6CBD'
                            }}>
                                {item.count}
                            </Typography>
                        </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap sx={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                    </Typography>
                </Box>
            ))}
            {data.length === 0 && <Typography variant="caption">Chưa có dữ liệu</Typography>}
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
                label={plan || 'Free'}
                size="small"
                sx={{
                    height: 24,
                    fontWeight: 600,
                    bgcolor: plan === 'Admin' ? '#E1EFFE' : '#F3F4F6',
                    color: plan === 'Admin' ? '#1E429F' : '#374151',
                    borderRadius: 1
                }}
            />
        </TableCell>
        <TableCell>{totalGen}</TableCell>
        <TableCell>{credits}</TableCell>
        <TableCell>
            <Typography variant="body2" color="text.secondary">
                {lastActive ? new Date(lastActive).toLocaleDateString() : 'N/A'}
            </Typography>
        </TableCell>
    </TableRow>
);

const TransactionRow = ({ amount, status, date, user }: any) => (
    <TableRow hover>
        <TableCell sx={{ py: 2 }}>
            <Stack direction="row" alignItems="center" gap={1}>
                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }} src={user?.avatar_url}>
                    {user?.full_name?.charAt(0) || '?'}
                </Avatar>
                <Box>
                    <Typography variant="body2" fontWeight={500}>{user?.full_name || 'Unknown'}</Typography>
                    <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                </Box>
            </Stack>
        </TableCell>
        <TableCell>
            <Typography variant="body2" fontWeight={600} color="text.primary">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}
            </Typography>
        </TableCell>
        <TableCell>
            <Chip
                label={status === 'completed' ? 'Thành công' : status}
                size="small"
                sx={{
                    height: 24,
                    fontWeight: 600,
                    bgcolor: status === 'completed' ? '#DEF7EC' : '#FDE8E8',
                    color: status === 'completed' ? '#03543F' : '#9B1C1C',
                    borderRadius: 1
                }}
            />
        </TableCell>
        <TableCell>
            <Typography variant="body2" color="text.secondary">
                {new Date(date).toLocaleDateString('vi-VN')}
            </Typography>
        </TableCell>
    </TableRow>
);

export default function DashboardOverview() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await fetch('/api/admin/dashboard');
            const data = await res.json();
            if (data.success) {
                setStats(data);
            } else {
                toast.error('Không thể tải dữ liệu dashboard');
            }
        } catch (error) {
            console.error('FETCH ERROR', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;
    }

    if (!stats) return null;

    const { stats: metrics, charts, recentUsers, recentTransactions } = stats;

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
                <Button variant="outlined" onClick={fetchDashboardData} size="small">
                    Làm mới
                </Button>
            </Stack>

            {/* Stats Row */}
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} mb={4}>
                <Box sx={{ flex: { lg: '1 1 20%' } }}>
                    <StatCard
                        title="Người dùng"
                        value={metrics.totalUsers}
                        badgeLabel="Total"
                        badgeColor="success"
                        chartColor="#31C48D" // Green
                        data={[metrics.totalUsers]}
                    />
                </Box>
                <Box sx={{ flex: { lg: '1 1 20%' } }}>
                    <StatCard
                        title="Doanh thu"
                        value={metrics.totalRevenue ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(metrics.totalRevenue) : '0 ₫'}
                        badgeLabel="30 days"
                        badgeColor={metrics.totalRevenue > 0 ? "success" : "warning"}
                        chartColor="#F05252" // Red
                        data={charts.revenue || []}
                    />
                </Box>
                <Box sx={{ flex: { lg: '1 1 20%' } }}>
                    <StatCard
                        title="Tổng ảnh tạo"
                        value={metrics.totalImages}
                        badgeLabel="30 days"
                        badgeColor="success"
                        chartColor="#9CA3AF" // Grey
                        data={charts.data || []}
                    />
                </Box>
                <Box sx={{ flex: { lg: '1 1 20%' } }}>
                    <StatCard
                        title="Credit đã dùng"
                        value={metrics.creditsConsumed ? metrics.creditsConsumed.toLocaleString() : '0'}
                        badgeLabel="30 days"
                        badgeColor="info"
                        chartColor="#7E3AF2" // Purple
                        data={charts.credits || []}
                    />
                </Box>
                <Box sx={{ flex: { lg: '1 1 20%' } }}>
                    <StatCard
                        title="Tỷ lệ thành công"
                        value={`${metrics.successRate ? metrics.successRate.toFixed(1) : '100'}%`}
                        badgeLabel="Generated"
                        badgeColor="success"
                        chartColor="#1A56DB" // Blue
                        data={[metrics.successRate || 100, 100, 100]}
                    />
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
                                    <Typography variant="h4" fontWeight={700}>{metrics.totalImages}</Typography>
                                </Stack>
                                <Typography variant="caption" color="text.secondary">Số lượng ảnh tạo mỗi ngày (7 ngày gần nhất)</Typography>
                            </Box>
                        </Stack>
                        <AreaChartMock data={charts.data} labels={charts.labels} />
                    </Paper>
                </Box>
                <Box sx={{ flex: { md: '5' } }}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Box mb={2}>
                            <Typography variant="h6" fontWeight={700}>Top Mô hình AI</Typography>
                            <Typography variant="caption" color="text.secondary">Model được sử dụng nhiều nhất</Typography>
                        </Box>
                        <BarChartMock data={charts.topModels} />
                    </Paper>
                </Box>
            </Stack>

            {/* Details Tables Grid */}
            <Stack direction={{ xs: 'column', xl: 'row' }} spacing={3}>
                {/* Recent Users Table */}
                <Box sx={{ flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" color="text.primary" fontWeight={700}>Người dùng mới nhất</Typography>
                    </Stack>
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 2 }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Người dùng</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Gói cước</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Tổng ảnh (30d)</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Credits</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Tham gia</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {recentUsers?.length > 0 ? (
                                    recentUsers.map((u: any) => (
                                        <DetailRow
                                            key={u.user_id}
                                            user={u.email || u.full_name || 'No Name'}
                                            plan={u.plan}
                                            totalGen={u.total_gen}
                                            credits={u.current_credits}
                                            lastActive={u.created_at}
                                        />
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">Chưa có dữ liệu</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                {/* Recent Transactions Table */}
                <Box sx={{ flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" color="text.primary" fontWeight={700}>Giao dịch gần đây</Typography>
                    </Stack>
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 2 }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Người dùng</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Số tiền</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Trạng thái</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Ngày</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {recentTransactions?.length > 0 ? (
                                    recentTransactions.map((tx: any) => (
                                        <TransactionRow
                                            key={tx.id}
                                            amount={tx.amount}
                                            status={tx.status}
                                            date={tx.created_at}
                                            user={tx.user}
                                        />
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">Chưa có giao dịch</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Stack>
        </Box>
    );
}
