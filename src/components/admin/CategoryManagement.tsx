"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    CircularProgress,
    Tooltip,
    InputAdornment
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../../services/storageService';
import { toast } from 'react-hot-toast';

export default function CategoryManagement() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openEdit, setOpenEdit] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Initial load
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await getAllCategories();
            setCategories(data);
        } catch (error) {
            console.error("Failed to fetch categories", error);
            toast.error("Không thể tải danh sách thể loại");
        } finally {
            setLoading(false);
        }
    };



    const handleOpenEdit = (category?: any) => {
        if (category) {
            setCurrentCategory(category);
        } else {
            setCurrentCategory({
                name: '',
                slug: '',
                description: '',
                sort_order: 0,
                is_active: true
            });
        }
        setOpenEdit(true);
    };

    const handleCloseEdit = () => {
        setOpenEdit(false);
        setCurrentCategory(null);
    };

    const handleSaveCategory = async () => {
        if (!currentCategory.name || !currentCategory.slug) {
            toast.error("Vui lòng nhập Tên và Slug (Mã định danh)");
            return;
        }

        setIsUploading(true);
        try {
            const payload = {
                name: currentCategory.name,
                slug: currentCategory.slug,
                description: currentCategory.description,
                sort_order: parseInt(currentCategory.sort_order) || 0,
                is_active: currentCategory.is_active
            };

            let success = false;
            if (currentCategory.id) {
                success = await updateCategory(currentCategory.id, payload);
            } else {
                success = await createCategory(payload);
            }

            if (success) {
                toast.success(currentCategory.id ? "Đã cập nhật!" : "Đã tạo mới!");
                handleCloseEdit();
                fetchCategories();
            } else {
                toast.error("Có lỗi xảy ra khi lưu");
            }
        } catch (error) {
            console.error(error);
            toast.error("Lỗi hệ thống");
        } finally {
            setIsUploading(false);
        }
    };

    // Auto-slug generator
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, "d")
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-");
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">Quản lý Thể loại</Typography>
                <Stack direction="row" spacing={2}>
                    <Button
                        startIcon={<AddIcon />}
                        variant="contained"
                        onClick={() => handleOpenEdit()}
                    >
                        Thêm mới
                    </Button>
                </Stack>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                        <TableRow>
                            <TableCell>Tên thể loại</TableCell>
                            <TableCell>Mã (Slug)</TableCell>
                            <TableCell>Sort Order</TableCell>
                            <TableCell>Trạng thái</TableCell>
                            <TableCell align="right">Hành động</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                    <CircularProgress size={24} />
                                </TableCell>
                            </TableRow>
                        ) : categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    Chưa có dữ liệu
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map((cat) => (
                                <TableRow key={cat.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>{cat.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{cat.description}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={cat.slug} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                                    </TableCell>
                                    <TableCell>
                                        {cat.sort_order === 0 ? (
                                            <Typography variant="caption" color="text.secondary">0 (Cuối)</Typography>
                                        ) : (
                                            <Chip label={cat.sort_order} size="small" color="primary" variant="filled" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={cat.is_active ? 'Active' : 'Hidden'}
                                            color={cat.is_active ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleOpenEdit(cat)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Edit Dialog */}
            <Dialog open={openEdit} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
                <DialogTitle>{currentCategory?.id ? 'Chỉnh sửa thể loại' : 'Thêm thể loại mới'}</DialogTitle>
                <DialogContent dividers>
                    {currentCategory && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <TextField
                                label="Tên thể loại"
                                fullWidth
                                value={currentCategory.name}
                                onChange={(e) => {
                                    const name = e.target.value;
                                    // Auto generate slug if creating new
                                    if (!currentCategory.id) {
                                        setCurrentCategory({
                                            ...currentCategory,
                                            name: name,
                                            slug: generateSlug(name)
                                        });
                                    } else {
                                        setCurrentCategory({ ...currentCategory, name });
                                    }
                                }}
                            />
                            <TextField
                                label="Mã định danh (Slug)"
                                fullWidth
                                value={currentCategory.slug}
                                onChange={(e) => setCurrentCategory({ ...currentCategory, slug: e.target.value })}
                                helperText="Dùng cho URL, viết liền không dấu, gạch nối (ví dụ: du-lich)"
                            />
                            <TextField
                                label="Mô tả"
                                fullWidth
                                multiline
                                rows={2}
                                value={currentCategory.description || ''}
                                onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                            />
                            <TextField
                                label="Thứ tự (Sort Order)"
                                type="number"
                                fullWidth
                                value={currentCategory.sort_order}
                                onChange={(e) => setCurrentCategory({ ...currentCategory, sort_order: e.target.value })}
                                helperText="1, 2, 3... ưu tiên hiển thị trước. 0 hiển thị cuối."
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEdit} color="inherit">Hủy</Button>
                    <Button onClick={handleSaveCategory} variant="contained" disabled={isUploading}>
                        {isUploading ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
