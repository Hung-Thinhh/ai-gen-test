"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    CssBaseline,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    InputBase,
    Badge,
    Paper,
    Button,
    ThemeProvider,
    createTheme,
    CircularProgress
} from '@mui/material';
import {
    Brush as BrushIcon,
    Category as CategoryIcon,
    Menu as MenuIcon,
    Home as HomeIcon,
    People as PeopleIcon,
    Settings as SettingsIcon,
    Build as BuildIcon,
    Logout as LogoutIcon,
    Search as SearchIcon,
    Notifications as NotificationsIcon,
    HelpOutline as HelpIcon,
    Info as InfoIcon,
    KeyboardArrowDown,
    CreditCard as BillingIcon,
    BarChart as AnalyticsIcon,
    Description as DescriptionIcon,
    Image as ImageIcon
} from '@mui/icons-material';

// ... (code omitted)


import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Be_Vietnam_Pro } from 'next/font/google';
import toast from 'react-hot-toast';

// Define Font
const beVietnamPro = Be_Vietnam_Pro({
    weight: ['300', '400', '500', '600', '700'],
    subsets: ['vietnamese', 'latin'],
    display: 'swap',
});

// --- CUSTOM THEME (Light Mode - Reference Design) ---
const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#0F6CBD', // Brand Blue
            light: '#EBF5FF',
        },
        secondary: {
            main: '#FF6600', // Accent Orange
        },
        background: {
            default: '#F8F9FA',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1F2937',
            secondary: '#6B7280',
        },
    },
    typography: {
        fontFamily: beVietnamPro.style.fontFamily,
        h4: { fontWeight: 700 },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 600 },
        body2: { fontSize: '0.875rem' },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 8,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.1)',
                },
                elevation1: {
                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
                }
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    margin: '4px 12px',
                    '&.Mui-selected': {
                        backgroundColor: '#EBF5FF',
                        color: '#0F6CBD',
                        '&:hover': {
                            backgroundColor: '#E1EFFE',
                        },
                        '& .MuiListItemIcon-root': {
                            color: '#0F6CBD',
                        },
                    },
                },
            },
        },
    },
});

const drawerWidth = 260;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const { user, role, isLoading: authLoading, logout } = useAuth();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Redirect logic - ADMIN PROTECTION
    useEffect(() => {
        if (!authLoading) {
            // Check if user is logged in
            if (!user) {
                console.log('[AdminLayout] No user, redirecting to home');
                toast.error('Vui lòng đăng nhập để truy cập trang quản trị');
                router.push('/');
                return;
            }

            // Check if user has admin or editor role
            if (role !== 'admin' && role !== 'editor') {
                console.log('[AdminLayout] User is not admin/editor, redirecting to home');
                toast.error('Bạn không có quyền truy cập trang này');
                router.push('/');
                return;
            }

            // Editor role restrictions
            if (role === 'editor') {
                const allowedPaths = ['/admin/tools', '/admin/prompts', '/admin/categories', '/admin/studios'];
                const isAllowed = allowedPaths.some(path => pathname?.startsWith(path));
                if (!isAllowed) {
                    console.log('[AdminLayout] Editor accessing restricted page, redirecting to tools');
                    router.push('/admin/tools');
                }
            }
        }
    }, [authLoading, role, user, router, pathname]);

    const toggleDrawer = () => {
        setOpen(!open);
    };

    const handleNavigation = (path: string) => {
        router.push(path);
    };

    // Mapping Title
    const getPageTitle = (path: string | null) => {
        if (!path) return 'Tổng quan';
        if (path === '/admin') return 'Tổng quan';
        if (path.includes('analytics')) return 'Thống kê';
        if (path.includes('users')) return 'Người dùng';
        if (path.includes('tools')) return 'Công cụ';
        if (path.includes('pricing')) return 'Gói cước';
        if (path.includes('settings')) return 'Cài đặt';
        if (path.includes('prompts')) return 'Prompts';
        if (path.includes('categories')) return 'Danh mục';
        if (path.includes('studios')) return 'Studio';
        if (path.includes('system-configs')) return 'Cấu hình Hệ thống';
        if (path.includes('banners')) return 'Banner Trang Chủ';
        return 'Tổng quan';
    };


    // Loading state
    if (!isClient || authLoading) {
        return (
            <Box
                suppressHydrationWarning
                sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#F8F9FA' }}
            >
                <CircularProgress color="primary" />
            </Box>
        );
    }

    // Block rendering if not admin/editor (will redirect via useEffect)
    if (!user || (role !== 'admin' && role !== 'editor')) {
        return (
            <Box
                suppressHydrationWarning
                sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#F8F9FA' }}
            >
                <CircularProgress color="primary" />
            </Box>
        );
    }

    const allMenuItems = [
        { text: 'Tổng quan', icon: <HomeIcon />, path: '/admin', roles: ['admin'] },
        { text: 'Thống kê', icon: <AnalyticsIcon />, path: '/admin/analytics', roles: ['admin'] },
        { text: 'Người dùng', icon: <PeopleIcon />, path: '/admin/users', roles: ['admin'] },
        { text: 'Công cụ', icon: <BuildIcon />, path: '/admin/tools', roles: ['admin', 'editor'] },
        { text: 'Thể loại', icon: <CategoryIcon />, path: '/admin/categories', roles: ['admin', 'editor'] },
        { text: 'Studio', icon: <BrushIcon />, path: '/admin/studios', roles: ['admin', 'editor'] },
        { text: 'Prompts', icon: <DescriptionIcon />, path: '/admin/prompts', roles: ['admin', 'editor'] },
        { text: 'Banner', icon: <ImageIcon />, path: '/admin/banners', roles: ['admin'] },
        { text: 'Cấu hình HT', icon: <SettingsIcon />, path: '/admin/system-configs', roles: ['admin'] },
        { text: 'Gói cước', icon: <BillingIcon />, path: '/admin/pricing', roles: ['admin'] },
    ];

    const menuItems = allMenuItems.filter(item => item.roles.includes(role || ''));

    const bottomItems = [
        { text: 'Cài đặt', icon: <SettingsIcon />, path: '/admin/settings' },
        { text: 'Giới thiệu', icon: <InfoIcon />, path: '/admin/about' },
        { text: 'Phản hồi', icon: <HelpIcon />, path: '/admin/feedback' },
    ];

    return (
        <ThemeProvider theme={lightTheme}>
            <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
                <CssBaseline />

                {/* --- SIDEBAR --- */}
                <Drawer
                    variant="permanent"
                    open={open}
                    sx={{
                        width: open ? drawerWidth : 72,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            position: 'relative',
                            whiteSpace: 'nowrap',
                            width: open ? drawerWidth : 72,
                            transition: theme => theme.transitions.create('width', {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.enteringScreen,
                            }),
                            boxSizing: 'border-box',
                            borderRight: '1px solid #E5E7EB', // Light border
                            bgcolor: '#FFFFFF',
                            overflowX: 'hidden',
                        },
                    }}
                >
                    {/* Logo Area */}
                    <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, borderRadius: 1 }} variant="rounded">
                            A
                        </Avatar>
                        {open && (
                            <Box>
                                <Typography variant="subtitle1" sx={{ lineHeight: 1.2 }}>Admin Panel</Typography>
                                <Typography variant="caption" color="text.secondary">Duky AI</Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Main Menu */}
                    <List component="nav" sx={{ px: 1 }}>
                        <Typography variant="caption" sx={{ ml: 2, mb: 1, display: open ? 'block' : 'none', fontWeight: 600, color: 'text.secondary', opacity: 0.8 }}>
                            QUẢN LÝ
                        </Typography>
                        {menuItems.map((item) => (
                            <ListItemButton
                                key={item.text}
                                selected={pathname === item.path}
                                onClick={() => handleNavigation(item.path)}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: pathname === item.path ? 'primary.main' : 'text.secondary' }}>
                                    {item.icon}
                                </ListItemIcon>
                                {open && <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />}
                            </ListItemButton>
                        ))}
                    </List>

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Bottom Menu */}
                    <List component="nav" sx={{ px: 1 }}>
                        {bottomItems.map((item) => (
                            <ListItemButton key={item.text} onClick={() => handleNavigation(item.path)}>
                                <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                                    {item.icon}
                                </ListItemIcon>
                                {open && <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />}
                            </ListItemButton>
                        ))}
                    </List>

                    {/* System Status Card */}
                    {open && (
                        <Box sx={{ p: 2 }}>
                            <Paper sx={{ p: 2, bgcolor: '#F3F4F6', borderRadius: 2, border: 'none' }} elevation={0}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                                    <Box sx={{ width: 8, height: 8, bgcolor: 'success.main', borderRadius: '50%' }} />
                                    <Typography variant="body2" fontWeight={600}>Hệ thống ổn định</Typography>
                                </Box>
                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1.5 }}>
                                    Tất cả dịch vụ đang chạy tốt.
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    fullWidth
                                    size="small"
                                    onClick={() => router.push('/')}
                                    sx={{ color: 'white' }}
                                >
                                    Về trang người dùng
                                </Button>
                            </Paper>
                        </Box>
                    )}

                    {/* User Profile */}
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }} onClick={logout}>
                        <Avatar src={user?.user_metadata?.avatar_url} alt={user?.email || 'Admin'} sx={{ width: 36, height: 36 }} />
                        {open && (
                            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                <Typography variant="body2" fontWeight={600} noWrap>{user?.email?.split('@')[0]}</Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>{user?.email}</Typography>
                            </Box>
                        )}
                        {open && <IconButton size="small"><LogoutIcon fontSize="small" /></IconButton>}
                    </Box>
                </Drawer>

                {/* --- MAIN CONTENT --- */}
                <Box
                    component="main"
                    sx={{
                        backgroundColor: 'background.default',
                        flexGrow: 1,
                        height: '100vh',
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {/* Top Bar */}
                    <AppBar
                        position="sticky"
                        color="transparent"
                        elevation={0}
                        sx={{
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(8px)'
                        }}
                    >
                        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
                            {/* Breadcrumbs / Title */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <IconButton onClick={toggleDrawer} sx={{ mr: 1, display: { sm: 'none' } }}>
                                    <MenuIcon />
                                </IconButton>
                                <Typography variant="body2" color="text.secondary">Admin</Typography>
                                <Typography variant="body2" color="text.secondary">›</Typography>
                                <Typography variant="subtitle1" color="text.primary">
                                    {getPageTitle(pathname)}
                                </Typography>
                            </Box>

                            {/* Right Actions */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {/* Search Bar */}
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: '2px 4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: 240,
                                        bgcolor: '#FFFFFF',
                                        border: '1px solid #E5E7EB',
                                        height: 36,
                                        borderRadius: 2
                                    }}
                                >
                                    <SearchIcon sx={{ p: 0.5, color: 'text.secondary' }} />
                                    <InputBase
                                        sx={{ ml: 1, flex: 1, fontSize: '0.875rem' }}
                                        placeholder="Tìm kiếm..."
                                    />
                                </Paper>

                                <IconButton size="small">
                                    <Badge badgeContent={4} color="error" variant="dot">
                                        <NotificationsIcon fontSize="small" color="action" />
                                    </Badge>
                                </IconButton>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    color="inherit"
                                    endIcon={<KeyboardArrowDown />}
                                    sx={{ borderColor: '#E5E7EB', bgcolor: '#FFFFFF' }}
                                >
                                    Tiếng Việt
                                </Button>
                            </Box>
                        </Toolbar>
                    </AppBar>

                    {/* Page Content */}
                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                        {children}
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    );
}
