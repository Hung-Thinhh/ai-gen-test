import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Chip,
    IconButton,
    Button,
    Avatar,
    Stack,
    TextField,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    Pagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    FormControl,
    InputLabel,
    MenuItem,
    CircularProgress
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    FilterList as FilterListIcon,
    Edit as EditIcon,
    KeyboardArrowDown,
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import * as storageService from '../../services/storageService';
import toast from 'react-hot-toast';

// Helper for badges
const RoleBadge = ({ role }: { role: string }) => {
    let displayRole = role;
    let bgColor = '#F3F4F6';
    let textColor = '#374151';
    let borderColor = '#E5E7EB';

    if (role === 'Admin' || role.toLowerCase() === 'admin') {
        displayRole = 'admin';
        bgColor = '#DBEAFE';
        textColor = '#1D4ED8';
        borderColor = '#93C5FD';
    } else if (role === 'User' || role.toLowerCase() === 'user') {
        displayRole = 'user';
        bgColor = '#FEF3C7'; // Yellow highlight
        textColor = '#B45309';
        borderColor = '#FCD34D';
    } else if (role === 'Supervisor') {
        displayRole = 'Giám sát viên';
    }

    return (
        <Box sx={{
            display: 'inline-flex',
            bgcolor: bgColor,
            color: textColor,
            border: `1px solid ${borderColor}`,
            px: 1.5,
            py: 0.5,
            borderRadius: 20,
            fontSize: '0.75rem',
            fontWeight: 600
        }}>
            {displayRole}
        </Box>
    );
};

const PlanBadge = ({ plan }: { plan: string }) => {
    let color = '#6B7280';
    let bg = '#F3F4F6';
    let borderColor = '#E5E7EB';

    // If plan is a number (package_id), show in orange
    if (plan && plan !== 'Free') {
        color = '#EA580C'; // Orange
        bg = '#FFEDD5';
        borderColor = '#F97316';
    }

    return (
        <Chip
            label={plan && plan !== 'Free' && !isNaN(Number(plan)) ? `Gói ${plan}` : (plan || 'Free')}
            size="small"
            sx={{
                bgcolor: bg,
                color: color,
                fontWeight: 700,
                borderRadius: 1,
                fontSize: '0.75rem',
                border: `2px solid ${borderColor}`,
                px: 0.5
            }}
        />
    )
}

export default function UserManagement() {
    const { token } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openEdit, setOpenEdit] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [openBanConfirm, setOpenBanConfirm] = useState(false);
    const [userToBan, setUserToBan] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter states
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [packageFilter, setPackageFilter] = useState<string>('');
    const [packages, setPackages] = useState<any[]>([]);

    // Filter menu anchors
    const [roleAnchor, setRoleAnchor] = useState<null | HTMLElement>(null);
    const [packageAnchor, setPackageAnchor] = useState<null | HTMLElement>(null);

    // Fetch Users on Mount
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            const data = await storageService.getAllUsers(token || undefined);

            // Map Supabase fields to UI fields if necessary
            // Supabase 'profiles' table usually has: id, email (maybe), full_name, avatar_url, credits, ...
            const mappedUsers = data.map((u: any) => ({
                id: u.user_id,
                name: u.display_name || 'Unnamed User',
                email: u.email || 'No Email',
                role: u.role || 'User',
                plan: u.purchased_package_id || 'Free',
                credits: u.current_credits || 0,
                created: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A',
                avatar: u.avatar_url || `https://i.pravatar.cc/150?u=${u.user_id}`,
                banned: u.banned || false
            }));

            console.log('[UserManagement] Sample mapped user:', mappedUsers[0]);
            console.log('[UserManagement] Raw data sample:', data[0]);

            setUsers(mappedUsers);
            setLoading(false);
        };

        const fetchPackages = async () => {
            try {
                const res = await fetch('/api/admin/packages');
                if (res.ok) {
                    const data = await res.json();
                    setPackages(data.packages || []);
                }
            } catch (error) {
                console.error('Error fetching packages:', error);
            }
        };

        fetchUsers();
        fetchPackages();
    }, [token]);

    const handleEditClick = (user: any) => {
        setCurrentUser({ ...user }); // Clone to avoid direct mutation
        setOpenEdit(true);
    };

    const handleCloseEdit = () => {
        setOpenEdit(false);
        setCurrentUser(null);
    };

    const handleSaveUser = async () => {
        if (!currentUser) return;

        // API Call first
        const updates = {
            role: currentUser.role,
            current_credits: parseInt(currentUser.credits), // Ensure number
            // Add other editable fields here
        };

        const success = await storageService.updateUser(currentUser.id, updates, token || undefined);

        if (success) {
            toast.success('Cập nhật người dùng thành công');

            // Refresh users list from database to get latest data
            const freshUsers = await storageService.getAllUsers(token || undefined);
            const mappedUsers = freshUsers.map((u: any) => ({
                id: u.user_id,
                name: u.display_name || 'Unnamed User',
                email: u.email || 'No Email',
                role: u.role || 'User',
                plan: u.purchased_package_id || 'Free',
                credits: u.current_credits || 0,
                created: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A',
                avatar: u.avatar_url || `https://i.pravatar.cc/150?u=${u.user_id}`,
                banned: u.banned || false
            }));
            setUsers(mappedUsers);
        } else {
            toast.error('Lỗi khi cập nhật người dùng');
        }

        handleCloseEdit();
    };

    const handleChange = (field: string, value: any) => {
        setCurrentUser({ ...currentUser, [field]: value });
    };

    const handleBanClick = (user: any) => {
        setUserToBan(user);
        setOpenBanConfirm(true);
    };

    const handleConfirmBan = async () => {
        if (userToBan) {
            const newBanStatus = !userToBan.banned;

            // Optimistic Update
            setUsers(users.map(u =>
                u.id === userToBan.id ? { ...u, banned: newBanStatus } : u
            ));

            setOpenBanConfirm(false);
            setUserToBan(null);

            // API Call
            const success = await storageService.toggleUserBan(userToBan.id, newBanStatus, token || undefined);
            if (success) {
                toast.success(newBanStatus ? 'Đã cấm người dùng' : 'Đã bỏ cấm người dùng');
            } else {
                toast.error('Lỗi khi thay đổi trạng thái cấm');
            }
        }
    };

    // Filtering
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = !roleFilter || user.role.toLowerCase() === roleFilter.toLowerCase();
        const matchesPackage = !packageFilter || user.plan === packageFilter;
        return matchesSearch && matchesRole && matchesPackage;
    });

    return (
        <Box sx={{ width: '100%', bgcolor: '#FFFFFF', borderRadius: 2, p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

            {/* Header */}
            <Box mb={4}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <Typography variant="body2" color="primary" sx={{ cursor: 'pointer', fontWeight: 500 }}>Trang chủ</Typography>
                    <Typography variant="body2" color="text.secondary">/</Typography>
                    <Typography variant="body2" color="text.primary" fontWeight={500}>Người dùng</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" fontWeight={700} color="#111827">Danh sách người dùng</Typography>
                    <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" sx={{ color: '#374151', bgcolor: '#F3F4F6', border: 'none', fontWeight: 600, textTransform: 'none', '&:hover': { bgcolor: '#E5E7EB', border: 'none' } }}>Xuất file</Button>
                        <Button size="small" variant="outlined" sx={{ color: '#374151', bgcolor: '#F3F4F6', border: 'none', fontWeight: 600, textTransform: 'none', '&:hover': { bgcolor: '#E5E7EB', border: 'none' } }}>Nhập file</Button>
                    </Stack>
                </Stack>
                <Box sx={{ height: '1px', bgcolor: '#F3F4F6', mt: 3 }} />
            </Box>

            {/* Toolbar */}
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" mb={4} gap={2}>
                <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        sx={{ borderRadius: 2, height: 40, px: 3, textTransform: 'none', fontWeight: 600 }}
                    >
                        Thêm người dùng
                    </Button>
                    <TextField
                        placeholder="Tìm kiếm..."
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#9CA3AF' }} />
                                </InputAdornment>
                            ),
                            sx: {
                                bgcolor: '#F3F4F6',
                                border: 'none',
                                borderRadius: 2,
                                width: 260,
                                height: 40,
                                '& fieldset': { border: 'none' }
                            }
                        }}
                    />
                </Stack>

                <Stack direction="row" spacing={3} alignItems="center">
                    {/* Package Filter */}
                    <Button
                        color="inherit"
                        endIcon={<KeyboardArrowDown />}
                        sx={{ textTransform: 'none', color: packageFilter ? '#0F6CBD' : '#4B5563', fontWeight: 500 }}
                        onClick={(e) => setPackageAnchor(e.currentTarget)}
                    >
                        Gói{packageFilter ? `: ${packageFilter}` : ''}
                    </Button>
                    <Select
                        value={packageFilter}
                        onChange={(e) => { setPackageFilter(e.target.value); setPackageAnchor(null); }}
                        displayEmpty
                        open={Boolean(packageAnchor)}
                        onClose={() => setPackageAnchor(null)}
                        sx={{ position: 'absolute', visibility: 'hidden', width: 0 }}
                        MenuProps={{ anchorEl: packageAnchor, open: Boolean(packageAnchor), onClose: () => setPackageAnchor(null) }}
                    >
                        <MenuItem value="">Tất cả gói</MenuItem>
                        {packages.map((pkg: any) => (
                            <MenuItem key={pkg.package_id || pkg.name} value={pkg.name}>{pkg.name}</MenuItem>
                        ))}
                    </Select>

                    {/* Role Filter */}
                    <Button
                        color="inherit"
                        endIcon={<KeyboardArrowDown />}
                        sx={{ textTransform: 'none', color: roleFilter ? '#0F6CBD' : '#4B5563', fontWeight: 500 }}
                        onClick={(e) => setRoleAnchor(e.currentTarget)}
                    >
                        Vai trò{roleFilter ? `: ${roleFilter === 'user' ? 'User' : 'Admin'}` : ''}
                    </Button>
                    <Select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setRoleAnchor(null); }}
                        displayEmpty
                        open={Boolean(roleAnchor)}
                        onClose={() => setRoleAnchor(null)}
                        sx={{ position: 'absolute', visibility: 'hidden', width: 0 }}
                        MenuProps={{ anchorEl: roleAnchor, open: Boolean(roleAnchor), onClose: () => setRoleAnchor(null) }}
                    >
                        <MenuItem value="">Tất cả</MenuItem>
                        <MenuItem value="user">User</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                    </Select>

                    <Button
                        color="inherit"
                        startIcon={<FilterListIcon />}
                        sx={{ textTransform: 'none', color: '#4B5563', fontWeight: 600 }}
                        onClick={() => { setRoleFilter(''); setPackageFilter(''); }}
                    >
                        Xóa bộ lọc
                    </Button>
                </Stack>
            </Stack>

            {/* Table */}
            <TableContainer sx={{ boxShadow: 'none' }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox"><Checkbox /></TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Avatar</TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Tên</TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Email</TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Gói</TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Tín dụng</TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Vai trò</TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Ngày tạo</TableCell>
                            <TableCell sx={{ border: 'none' }}>Hành động</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">Không tìm thấy người dùng nào.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((row) => (
                                <TableRow
                                    key={row.id}
                                    sx={{
                                        '&:last-child td, &:last-child th': { border: 0 },
                                        '&:hover': { bgcolor: '#F9FAFB' }
                                    }}
                                >
                                    <TableCell padding="checkbox" sx={{ borderBottom: '1px solid #F3F4F6' }}><Checkbox /></TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                        <Avatar src={row.avatar} sx={{ width: 40, height: 40 }} variant="rounded" />
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                        <Typography variant="body2" fontWeight={600} color="#111827">{row.name}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                        <Typography variant="body2" color="primary.main">{row.email}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                        <PlanBadge plan={row.plan} />
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                        <Typography variant="body2" fontWeight={600} color="#374151">{row.credits?.toLocaleString()}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                        <RoleBadge role={row.role} />
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                        <Typography variant="body2" color="#6B7280">{row.created}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                        <Stack direction="row" spacing={1}>
                                            <IconButton size="small" onClick={() => handleEditClick(row)} color="primary">
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleBanClick(row)}
                                                color={row.banned ? "success" : "error"}
                                                title={row.banned ? "Bỏ cấm người dùng" : "Cấm người dùng"}
                                            >
                                                {row.banned ? <CheckCircleIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mt={3} px={2}>
                <Typography variant="body2" color="text.secondary">
                    Hiển thị {filteredUsers.length} kết quả
                </Typography>
                <Pagination
                    count={Math.ceil(filteredUsers.length / 10)}
                    color="secondary"
                    shape="rounded"
                    sx={{
                        '& .MuiPaginationItem-root': { color: '#333 !important', fontWeight: 500 },
                        '& .Mui-selected': { color: '#FFFFFF !important', fontWeight: 700 }
                    }}
                />
            </Stack>

            {/* Edit User Modal */}
            <Dialog open={openEdit} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Chỉnh sửa người dùng</DialogTitle>
                <DialogContent>
                    {currentUser && (
                        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Tên"
                                fullWidth
                                value={currentUser.name}
                                disabled
                                InputProps={{ readOnly: true }}
                            />
                            <TextField
                                label="Email"
                                fullWidth
                                value={currentUser.email}
                                disabled
                                InputProps={{ readOnly: true }}
                            />
                            <TextField
                                label="Tín dụng"
                                type="number"
                                fullWidth
                                value={currentUser.credits}
                                onChange={(e) => handleChange('credits', e.target.value)}
                            />
                            <FormControl fullWidth>
                                <InputLabel>Vai trò</InputLabel>
                                <Select
                                    value={currentUser.role}
                                    label="Vai trò"
                                    onChange={(e) => handleChange('role', e.target.value)}
                                >
                                    <MenuItem value="Admin">Quản trị viên (Admin)</MenuItem>
                                    <MenuItem value="User">Người dùng (User)</MenuItem>
                                    <MenuItem value="Editor">Biên tập viên (Editor)</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCloseEdit} color="inherit">Hủy</Button>
                    <Button onClick={handleSaveUser} variant="contained" color="primary">Lưu thay đổi</Button>
                </DialogActions>
            </Dialog>

            {/* Ban Confirmation Modal */}
            <Dialog open={openBanConfirm} onClose={() => setOpenBanConfirm(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#DC2626' }}>
                    <WarningIcon color="error" />
                    {userToBan?.banned ? 'Xác nhận Bỏ cấm' : 'Xác nhận Cấm'}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Bạn có chắc chắn muốn {userToBan?.banned ? 'bỏ cấm' : 'cấm'} <strong>{userToBan?.name}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenBanConfirm(false)} color="inherit">Hủy</Button>
                    <Button
                        onClick={handleConfirmBan}
                        variant="contained"
                        color={userToBan?.banned ? "success" : "error"}
                        autoFocus
                    >
                        {userToBan?.banned ? 'Bỏ cấm' : 'Cấm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
