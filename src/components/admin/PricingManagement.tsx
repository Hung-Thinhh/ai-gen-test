"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Stack,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    TextField,
    InputAdornment,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { getAllPackages, updatePackage, createPackage, deletePackage } from '../../services/storageService';

export default function PricingManagement() {
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [openEdit, setOpenEdit] = useState(false);
    const [currentPkg, setCurrentPkg] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const data = await getAllPackages();
            setPackages(data);
        } catch (error) {
            console.error("Failed to fetch packages", error);
            toast.error("Không thể tải danh sách gói cước");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (pkg: any) => {
        if (!confirm(`Bạn có chắc muốn xóa gói "${pkg.display_name?.vi || pkg.display_name}" không?`)) return;

        setIsDeleting(true);
        try {
            const success = await deletePackage(pkg.package_id);
            if (success) {
                toast.success('Đã xóa gói cước');
                fetchPackages();
            } else {
                toast.error('Không thể xóa gói cước');
            }
        } catch (error) {
            console.error("Delete failed", error);
            toast.error('Lỗi khi xóa gói cước');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditClick = (pkg: any) => {
        // Convert display_name and description to strings for editing
        const displayName = typeof pkg.display_name === 'string' ? pkg.display_name : (pkg.display_name?.vi || '');
        const description = typeof pkg.description === 'string' ? pkg.description : (pkg.description?.vi || '');

        setCurrentPkg({
            ...pkg,
            display_name: displayName,
            description: description,
            features_text: Array.isArray(pkg.features) ? pkg.features.join('\n') : ''
        });
        setOpenEdit(true);
    };

    const handleCloseEdit = () => {
        setOpenEdit(false);
        setCurrentPkg(null);
    };

    const handleCreateClick = () => {
        setCurrentPkg({
            is_new: true, // Flag to identify new package
            display_name: '',
            description: '',
            price_vnd: 0,
            original_price_vnd: 0,
            credits_included: 0,
            discount_percent: 0,
            is_popular: false,
            is_active: true,
            sort_order: 0,
            category: 'month',
            features_text: ''
        });
        setOpenEdit(true);
    };

    // ...

    const handleSavePackage = async () => {
        if (!currentPkg) return;
        setIsSaving(true);

        try {
            const featuresArray = currentPkg.features_text
                ? currentPkg.features_text.split('\n').map((f: string) => f.trim()).filter((f: string) => f)
                : [];

            const packageData = {
                display_name: { vi: currentPkg.display_name, en: currentPkg.display_name },
                description: { vi: currentPkg.description, en: currentPkg.description },
                price_vnd: Number(currentPkg.price_vnd),
                // Only include original_price if > 0
                original_price_vnd: Number(currentPkg.original_price_vnd) || 0,
                credits_included: Number(currentPkg.credits_included),
                discount_percent: Number(currentPkg.discount_percent) || 0,
                is_popular: !!currentPkg.is_popular,
                is_active: currentPkg.is_active !== false,
                sort_order: Number(currentPkg.sort_order) || 0,
                category: currentPkg.category || 'month',
                package_type: currentPkg.category === 'credit' ? 'credit' : 'subscription',
                features: featuresArray,
                // generate a random key for new package if needed, or let DB handle it? 
                // DB usually needs package_key. Let's start with a random one or timestamp
                package_key: currentPkg.package_key || `PKG_${Date.now()}`
            };

            let success;
            if (currentPkg.is_new) {
                success = await createPackage(packageData);
            } else {
                success = await updatePackage(currentPkg.package_id, packageData);
            }

            if (success) {
                toast.success(currentPkg.is_new ? 'Đã tạo gói mới' : 'Đã cập nhật gói cước');
                fetchPackages();
                handleCloseEdit();
            } else {
                toast.error('Lỗi khi lưu thay đổi');
            }
        } catch (error) {
            console.error("Save failed", error);
            toast.error('Lỗi hệ thống');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredPackages = packages.filter(pkg => {
        const displayName = typeof pkg.display_name === 'string'
            ? pkg.display_name
            : (pkg.display_name?.vi || pkg.display_name?.en || '');
        return displayName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <Box sx={{ width: '100%', bgcolor: '#FFFFFF', borderRadius: 2, p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            {/* Header */}
            <Box mb={4}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <Typography variant="body2" color="primary" sx={{ cursor: 'pointer', fontWeight: 500 }}>Admin</Typography>
                    <Typography variant="body2" color="text.secondary">/</Typography>
                    <Typography variant="body2" color="text.primary" fontWeight={500}>Gói cước</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" fontWeight={700} color="#111827">Quản lý Gói cước</Typography>
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
                        onClick={handleCreateClick}
                    >
                        Thêm gói mới
                    </Button>
                    <Button
                        variant="outlined"
                        color="warning"
                        sx={{ borderRadius: 2, height: 40, px: 2, textTransform: 'none' }}
                        onClick={async () => {
                            const { data: { user } } = await import('../../lib/supabase/client').then(m => m.supabase.auth.getUser());
                            if (!user) { toast.error('Chưa đăng nhập!'); return; }

                            const { data, error } = await import('../../lib/supabase/client').then(m => m.supabase
                                .from('users')
                                .select('role')
                                .eq('user_id', user.id) // Supabase auto-handles uuid->text usually, but let's see result
                                .single());

                            if (error) toast.error(`Lỗi DB: ${error.message}`);
                            else toast.success(`DB Role: ${data?.role} (ID: ${user.id.slice(0, 5)}...)`);
                        }}
                    >
                        Check Role
                    </Button>
                    <TextField
                        placeholder="Tìm kiếm gói..."
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
                </Stack >
            </Stack >

            {/* Table */}
            <TableContainer sx={{ boxShadow: 'none' }}>
                <Table sx={{ minWidth: 800 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>ID</TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Tên hiển thị</TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Giá (VNĐ)</TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Giá gốc</TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Credits</TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Giảm giá (%)</TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Loại gói</TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Trạng thái</TableCell>
                            <TableCell sx={{ border: 'none' }}>Hành động</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : filteredPackages.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                                    <Typography color="text.secondary">Không tìm thấy gói cước nào</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPackages.map((pkg) => (
                                <TableRow
                                    key={pkg.package_id || pkg.id}
                                    sx={{
                                        '&:last-child td, &:last-child th': { border: 0 },
                                        '&:hover': { bgcolor: '#F9FAFB' }
                                    }}
                                >
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                            {pkg.package_key}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                        <Typography variant="body2" fontWeight={600} color="#111827">
                                            {typeof pkg.display_name === 'string' ? pkg.display_name : (pkg.display_name?.vi || pkg.display_name?.en || 'N/A')}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {typeof pkg.description === 'string' ? pkg.description : (pkg.description?.vi || pkg.description?.en || '')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                        <Typography variant="body2" fontWeight={600} color="#059669">
                                            {pkg.price_vnd?.toLocaleString()} đ
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                        <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#9CA3AF' }}>
                                            {pkg.original_price_vnd ? pkg.original_price_vnd.toLocaleString() + ' đ' : '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                        <Chip
                                            label={`${pkg.credits_included} Credits`}
                                            size="small"
                                            sx={{ bgcolor: '#FFFBEB', color: '#D97706', fontWeight: 600 }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                        {pkg.discount_percent ? (
                                            <Chip label={`-${pkg.discount_percent}%`} size="small" color="error" sx={{ height: 20, fontSize: '0.7rem' }} />
                                        ) : (
                                            <Typography variant="caption" color="text.disabled">-</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                        <Chip
                                            label={pkg.category === 'year' ? 'Năm' : pkg.category === 'credit' ? 'Credit' : 'Tháng'}
                                            size="small"
                                            sx={{
                                                bgcolor: pkg.category === 'year' ? '#E0E7FF' : pkg.category === 'credit' ? '#FFFBEB' : '#DBEAFE',
                                                color: pkg.category === 'year' ? '#4338CA' : pkg.category === 'credit' ? '#D97706' : '#1E40AF',
                                                fontWeight: 600
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                        <Chip
                                            label={pkg.is_active ? 'Active' : 'Hidden'}
                                            size="small"
                                            sx={{
                                                fontWeight: 600,
                                                bgcolor: pkg.is_active ? '#DEF7EC' : '#F3F4F6',
                                                color: pkg.is_active ? '#03543F' : '#6B7280',
                                                borderRadius: 1
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                disableElevation
                                                onClick={() => handleEditClick(pkg)}
                                                sx={{ minWidth: 32, px: 1, bgcolor: '#EFF6FF', color: '#1D4ED8', '&:hover': { bgcolor: '#DBEAFE' } }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                disableElevation
                                                color="error"
                                                disabled={isDeleting}
                                                onClick={() => handleDelete(pkg)}
                                                sx={{ minWidth: 32, px: 1, bgcolor: '#FDE8E8', color: '#C81E1E', '&:hover': { bgcolor: '#FBD5D5' } }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </Button>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer >

            {/* Edit Dialog */}
            {
                openEdit && currentPkg && (
                    <Box sx={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        bgcolor: 'rgba(0,0,0,0.5)', zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2
                    }}>
                        <Paper sx={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', p: 4, borderRadius: 3 }}>
                            <Typography variant="h5" fontWeight={700} gutterBottom>
                                {currentPkg.is_new ? 'Thêm Gói Cước Mới' : 'Chỉnh sửa Gói Cước'}
                            </Typography>

                            <Stack spacing={3} mt={4}>
                                <TextField
                                    label="Tên hiển thị"
                                    fullWidth
                                    value={currentPkg.display_name}
                                    onChange={(e) => setCurrentPkg({ ...currentPkg, display_name: e.target.value })}
                                />


                                <FormControl fullWidth>
                                    <InputLabel>Loại gói (Billing Cycle)</InputLabel>
                                    <Select
                                        label="Loại gói (Billing Cycle)"
                                        value={currentPkg.category || 'month'}
                                        onChange={(e) => setCurrentPkg({ ...currentPkg, category: e.target.value })}
                                        MenuProps={{ style: { zIndex: 10000 } }}
                                    >
                                        <MenuItem value="month">Gói Tháng (Monthly)</MenuItem>
                                        <MenuItem value="year">Gói Năm (Yearly)</MenuItem>
                                        <MenuItem value="credit">Gói Credit (One-time)</MenuItem>
                                    </Select>
                                </FormControl>

                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="Giá bán (VNĐ)"
                                        type="number"
                                        fullWidth
                                        value={currentPkg.price_vnd}
                                        onChange={(e) => setCurrentPkg({ ...currentPkg, price_vnd: e.target.value })}
                                    />
                                    <TextField
                                        label="Giá gốc (VNĐ)"
                                        type="number"
                                        fullWidth
                                        value={currentPkg.original_price_vnd}
                                        onChange={(e) => setCurrentPkg({ ...currentPkg, original_price_vnd: e.target.value })}
                                    />
                                </Stack>

                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="Credits"
                                        type="number"
                                        fullWidth
                                        value={currentPkg.credits_included}
                                        onChange={(e) => setCurrentPkg({ ...currentPkg, credits_included: e.target.value })}
                                    />
                                    <TextField
                                        label="Giảm giá (%)"
                                        type="number"
                                        fullWidth
                                        value={currentPkg.discount_percent || 0}
                                        onChange={(e) => setCurrentPkg({ ...currentPkg, discount_percent: e.target.value })}
                                    />
                                </Stack>

                                <TextField
                                    label="Mô tả / Đối tượng sử dụng"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={currentPkg.description}
                                    onChange={(e) => setCurrentPkg({ ...currentPkg, description: e.target.value })}
                                />

                                <Stack direction="row" spacing={2} alignItems="center">
                                    <TextField
                                        label="Thứ tự hiển thị"
                                        type="number"
                                        sx={{ width: 150 }}
                                        value={currentPkg.sort_order || 0}
                                        onChange={(e) => setCurrentPkg({ ...currentPkg, sort_order: Number(e.target.value) })}
                                    />

                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ border: '1px solid #ccc', borderRadius: 1, px: 2, py: 1 }}>
                                        <input
                                            type="checkbox"
                                            id="popularCheck"
                                            checked={currentPkg.is_popular || false}
                                            onChange={(e) => setCurrentPkg({ ...currentPkg, is_popular: e.target.checked })}
                                            style={{ width: 20, height: 20, cursor: 'pointer' }}
                                        />
                                        <label htmlFor="popularCheck" style={{ cursor: 'pointer', fontWeight: 500 }}>
                                            Nổi bật (Popular)
                                        </label>
                                    </Stack>

                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ border: '1px solid #ccc', borderRadius: 1, px: 2, py: 1 }}>
                                        <input
                                            type="checkbox"
                                            id="activeCheck"
                                            checked={currentPkg.is_active !== false} // Default true if undefined
                                            onChange={(e) => setCurrentPkg({ ...currentPkg, is_active: e.target.checked })}
                                            style={{ width: 20, height: 20, cursor: 'pointer' }}
                                        />
                                        <label htmlFor="activeCheck" style={{ cursor: 'pointer', fontWeight: 500 }}>
                                            Kích hoạt (Active)
                                        </label>
                                    </Stack>
                                </Stack>

                                <TextField
                                    label="Tính năng (Mỗi dòng 1 tính năng)"
                                    multiline
                                    rows={5}
                                    fullWidth
                                    value={currentPkg.features_text}
                                    onChange={(e) => setCurrentPkg({ ...currentPkg, features_text: e.target.value })}
                                    placeholder="500 credits miễn phí&#10;Hỗ trợ cơ bản&#10;Tốc độ tiêu chuẩn"
                                />

                                <Stack direction="row" justifyContent="flex-end" spacing={2} mt={2}>
                                    <Button onClick={handleCloseEdit} color="inherit" disabled={isSaving}>Hủy</Button>
                                    <Button
                                        onClick={handleSavePackage}
                                        variant="contained"
                                        color="primary"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? <><CircularProgress size={16} sx={{ mr: 1 }} /> Đang lưu...</> : (currentPkg.is_new ? 'Tạo mới' : 'Lưu thay đổi')}
                                    </Button>
                                </Stack>
                            </Stack>
                        </Paper>
                    </Box>
                )
            }
        </Box >
    );
}
