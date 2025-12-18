import React, { useState } from 'react';
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
    MenuItem
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

// Mock Data with Plan and Credits
const INITIAL_USERS = [
    { id: 1, name: 'Yaga Masamichi', email: 'yaga.masamichi@gmail.com', role: 'Admin', plan: 'Enterprise', credits: 5000, phone: '+1202-555-0180', created: '14 January, 2022', avatar: 'https://i.pravatar.cc/150?u=1', banned: false },
    { id: 2, name: 'Manami Suda', email: 'manami.suda@gmail.com', role: 'User', plan: 'Free', credits: 15, phone: '+44 20 7946 2233', created: '07 February, 2023', avatar: 'https://i.pravatar.cc/150?u=2', banned: false },
    { id: 3, name: 'Okkotsu Yuta', email: 'okkotsu.yuta@gmail.com', role: 'User', plan: 'Pro', credits: 450, phone: '+81 80-6543-8899', created: '21 June, 2023', avatar: 'https://i.pravatar.cc/150?u=3', banned: true },
    { id: 4, name: 'Kugisaki Nobara', email: 'kugisaki.nobara@gmail.com', role: 'Supervisor', plan: 'Pro', credits: 890, phone: '+61 2 9374 4000', created: '03 November, 2023', avatar: 'https://i.pravatar.cc/150?u=4', banned: false },
    { id: 5, name: 'Nanami Kento', email: 'nanami.kento@gmail.com', role: 'Admin', plan: 'Enterprise', credits: 9000, phone: '+1303-555-0134', created: '30 August, 2021', avatar: 'https://i.pravatar.cc/150?u=5', banned: false },
    { id: 6, name: 'Fushiguro Megumi', email: 'fushiguro.megumi@gmail.com', role: 'User', plan: 'Free', credits: 0, phone: '+49 30 901820', created: '19 May, 2022', avatar: 'https://i.pravatar.cc/150?u=6', banned: false },
    { id: 7, name: 'Nitta Akari', email: 'nitta.akari@gmail.com', role: 'Supervisor', plan: 'Pro', credits: 120, phone: '+33 1 4020 5000', created: '12 March, 2023', avatar: 'https://i.pravatar.cc/150?u=7', banned: false },
    { id: 8, name: 'Inumaki Toge', email: 'inumaki.toge@gmail.com', role: 'User', plan: 'Free', credits: 10, phone: '+82 10-7788-5566', created: '28 July, 2023', avatar: 'https://i.pravatar.cc/150?u=8', banned: false },
];

const RoleBadge = ({ role }: { role: string }) => {
    let displayRole = role;
    if (role === 'Admin') displayRole = 'Quản trị viên';
    if (role === 'User') displayRole = 'Người dùng';
    if (role === 'Supervisor') displayRole = 'Giám sát viên';

    return (
        <Box sx={{
            display: 'inline-flex',
            bgcolor: '#F3F4F6',
            color: '#374151',
            border: '1px solid #E5E7EB',
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

    if (plan === 'Pro') {
        color = '#FF6600';
        bg = '#FFEDD5';
    } else if (plan === 'Enterprise') {
        color = '#0F6CBD';
        bg = '#E0F2FE';
    }

    return (
        <Chip
            label={plan}
            size="small"
            sx={{
                bgcolor: bg,
                color: color,
                fontWeight: 700,
                borderRadius: 1,
                fontSize: '0.75rem'
            }}
        />
    )
}

export default function UserManagement() {
    const [users, setUsers] = useState(INITIAL_USERS);
    const [openEdit, setOpenEdit] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [openBanConfirm, setOpenBanConfirm] = useState(false);
    const [userToBan, setUserToBan] = useState<any>(null);

    const handleEditClick = (user: any) => {
        setCurrentUser(user);
        setOpenEdit(true);
    };

    const handleCloseEdit = () => {
        setOpenEdit(false);
        setCurrentUser(null);
    };

    const handleSaveUser = () => {
        if (!currentUser) return;
        setUsers(users.map(u => u.id === currentUser.id ? currentUser : u));
        handleCloseEdit();
    };

    const handleChange = (field: string, value: any) => {
        setCurrentUser({ ...currentUser, [field]: value });
    };

    const handleBanClick = (user: any) => {
        setUserToBan(user);
        setOpenBanConfirm(true);
    };

    const handleConfirmBan = () => {
        if (userToBan) {
            setUsers(users.map(u =>
                u.id === userToBan.id ? { ...u, banned: !u.banned } : u
            ));
        }
        setOpenBanConfirm(false);
        setUserToBan(null);
    };

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
                    <Button color="inherit" endIcon={<KeyboardArrowDown />} sx={{ textTransform: 'none', color: '#4B5563', fontWeight: 500 }}>Gói</Button>
                    <Button color="inherit" endIcon={<KeyboardArrowDown />} sx={{ textTransform: 'none', color: '#4B5563', fontWeight: 500 }}>Vai trò</Button>
                    <Button color="inherit" startIcon={<FilterListIcon />} sx={{ textTransform: 'none', color: '#4B5563', fontWeight: 600 }}>Bộ lọc khác</Button>
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
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Điện thoại</TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Ngày tạo</TableCell>
                            <TableCell sx={{ border: 'none' }}>Hành động</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((row) => (
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
                                    <Typography variant="body2" color="#6B7280">{row.phone}</Typography>
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
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mt={3} px={2}>
                <Typography variant="body2" color="text.secondary">
                    Hiển thị 1-8 trên 16 mục
                </Typography>
                <Pagination
                    count={2}
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
                            <Stack direction="row" spacing={2}>
                                <FormControl fullWidth disabled>
                                    <InputLabel>Gói</InputLabel>
                                    <Select
                                        value={currentUser.plan}
                                        label="Gói"
                                    >
                                        <MenuItem value="Free">Free</MenuItem>
                                        <MenuItem value="Pro">Pro</MenuItem>
                                        <MenuItem value="Enterprise">Enterprise</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Tín dụng"
                                    type="number"
                                    fullWidth
                                    value={currentUser.credits}
                                    disabled
                                    InputProps={{ readOnly: true }}
                                />
                            </Stack>
                            <FormControl fullWidth>
                                <InputLabel>Vai trò</InputLabel>
                                <Select
                                    value={currentUser.role}
                                    label="Vai trò"
                                    onChange={(e) => handleChange('role', e.target.value)}
                                >
                                    <MenuItem value="Admin">Quản trị viên (Admin)</MenuItem>
                                    <MenuItem value="User">Người dùng (User)</MenuItem>
                                    <MenuItem value="Supervisor">Giám sát viên (Supervisor)</MenuItem>
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
