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
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Refresh as RefreshIcon,
    Image as ImageIcon
} from '@mui/icons-material';
import { getAllBanners, createBanner, updateBanner, deleteBanner, uploadImageToCloud } from '../../services/storageService';
import { toast } from 'react-hot-toast';

export default function BannerManagement() {
    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openEdit, setOpenEdit] = useState(false);
    const [currentBanner, setCurrentBanner] = useState<any>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const data = await getAllBanners();
            setBanners(data);
        } catch (error) {
            console.error("Failed to fetch banners", error);
            toast.error("Không thể tải danh sách banner");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEdit = (banner?: any) => {
        if (banner) {
            setCurrentBanner(banner);
        } else {
            setCurrentBanner({
                title: { vi: '', en: '' },
                description: { vi: '', en: '' },
                image_url: '',
                button_text: { vi: 'Khám phá', en: 'Explore' },
                button_link: '/',
                sort_order: 0,
                is_active: true
            });
        }
        setOpenEdit(true);
    };

    const handleCloseEdit = () => {
        setOpenEdit(false);
        setCurrentBanner(null);
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate image dimensions
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            const base64 = e.target?.result as string;

            img.onload = () => {
                const width = img.width;
                const height = img.height;
                const aspectRatio = width / height;

                // Target: 1160x400 = aspect ratio 2.9
                // Allow range: 2.5 to 3.3 (flexible for landscape banners)
                const minAspectRatio = 2.5;
                const maxAspectRatio = 3.3;

                // if (aspectRatio < minAspectRatio || aspectRatio > maxAspectRatio) {
                //     toast.error(`Kích thước ảnh không phù hợp!\nYêu cầu: 1160x400 hoặc tương tự (dạng ngang)\nẢnh của bạn: ${width}x${height}`);
                //     event.target.value = ''; // Reset input
                //     return;
                // }

                // Check minimum dimensions
                if (width < 800 || height < 200) {
                    toast.error(`Ảnh quá nhỏ!\nTối thiểu: 800x200\nẢnh của bạn: ${width}x${height}`);
                    event.target.value = '';
                    return;
                }

                // Validation passed
                setCurrentBanner({
                    ...currentBanner,
                    image_url: base64,
                    _imageFile: file
                });
                toast.success(`✓ Kích thước hợp lệ: ${width}x${height}`);
            };

            img.onerror = () => {
                toast.error("Lỗi đọc ảnh");
            };

            img.src = base64;
        };

        reader.onerror = () => {
            toast.error("Lỗi đọc file");
        };

        reader.readAsDataURL(file);
    };

    const handleSaveBanner = async () => {
        if (!currentBanner.title.vi || !currentBanner.image_url) {
            toast.error("Vui lòng nhập Tiêu đề (VI) và chọn ảnh");
            return;
        }

        setUploading(true);
        try {
            let finalImageUrl = currentBanner.image_url;

            // If there's a new image file, upload to Cloudinary
            if (currentBanner._imageFile) {
                toast.loading("Đang upload ảnh...", { id: 'upload' });

                // Upload original file directly (no WebP conversion for banners)
                const formData = new FormData();
                formData.append('upload_preset', 'AI-image');
                formData.append('file', currentBanner._imageFile);

                const response = await fetch('https://api.cloudinary.com/v1_1/dmxmzannb/image/upload', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                if (!response.ok || data.error) {
                    throw new Error(data.error?.message || 'Failed to upload to Cloudinary');
                }

                finalImageUrl = data.secure_url;
                toast.success("Đã upload ảnh!", { id: 'upload' });
            }

            const payload = {
                title: currentBanner.title,
                description: currentBanner.description,
                image_url: finalImageUrl,
                button_text: currentBanner.button_text,
                button_link: currentBanner.button_link || '/',
                sort_order: parseInt(currentBanner.sort_order) || 0,
                is_active: currentBanner.is_active
            };

            let success = false;
            const isEditing = currentBanner.id;

            if (isEditing) {
                success = await updateBanner(currentBanner.id, payload);
            } else {
                success = await createBanner(payload);
            }

            if (success) {
                toast.success(isEditing ? "Đã cập nhật!" : "Đã tạo mới!");
                handleCloseEdit();
                fetchBanners();
            } else {
                toast.error("Có lỗi xảy ra khi lưu");
            }
        } catch (error) {
            console.error(error);
            toast.error("Lỗi hệ thống");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteBanner = async (bannerId: number, title: string) => {
        if (window.confirm(`Bạn có chắc muốn xóa banner "${title}"?`)) {
            try {
                const success = await deleteBanner(bannerId);
                if (success) {
                    toast.success("Đã xóa!");
                    fetchBanners();
                } else {
                    toast.error("Không thể xóa");
                }
            } catch (error) {
                console.error(error);
                toast.error("Lỗi hệ thống");
            }
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">Quản lý Banner Trang Chủ</Typography>
                <Stack direction="row" spacing={2}>
                    <Button startIcon={<RefreshIcon />} variant="outlined" onClick={fetchBanners}>
                        Làm mới
                    </Button>
                    <Button startIcon={<AddIcon />} variant="contained" onClick={() => handleOpenEdit()}>
                        Thêm Banner
                    </Button>
                </Stack>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                        <TableRow>
                            <TableCell width={80}>Preview</TableCell>
                            <TableCell>Tiêu đề</TableCell>
                            <TableCell>Button Link</TableCell>
                            <TableCell width={100}>Sort Order</TableCell>
                            <TableCell width={100}>Trạng thái</TableCell>
                            <TableCell align="right" width={120}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    <CircularProgress size={24} />
                                </TableCell>
                            </TableRow>
                        ) : banners.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    Chưa có banner nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            banners.map((banner) => (
                                <TableRow key={banner.id} hover>
                                    <TableCell>
                                        <Box
                                            component="img"
                                            src={banner.image_url}
                                            alt={banner.title.vi}
                                            sx={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 1 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight="bold">{banner.title.vi}</Typography>
                                        <Typography variant="caption" color="text.secondary">{banner.title.en}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                            {banner.button_link}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={banner.sort_order} size="small" />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={banner.is_active ? 'Active' : 'Inactive'}
                                            size="small"
                                            color={banner.is_active ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <IconButton size="small" onClick={() => handleOpenEdit(banner)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDeleteBanner(banner.id, banner.title.vi)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Edit/Create Dialog */}
            <Dialog open={openEdit} onClose={handleCloseEdit} maxWidth="md" fullWidth>
                <DialogTitle>{currentBanner?.id ? 'Chỉnh sửa Banner' : 'Thêm Banner mới'}</DialogTitle>
                <DialogContent dividers>
                    {currentBanner && (
                        <Stack spacing={3} sx={{ pt: 1 }}>
                            {/* Image Upload */}
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>Banner Image</Typography>
                                {currentBanner.image_url && (
                                    <Box
                                        component="img"
                                        src={currentBanner.image_url}
                                        alt="Preview"
                                        sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 2, mb: 2 }}
                                    />
                                )}
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<ImageIcon />}
                                    fullWidth
                                >
                                    Chọn ảnh
                                    <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                                </Button>
                            </Box>

                            {/* Bilingual Title */}
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Tiêu đề (Tiếng Việt)"
                                    fullWidth
                                    value={currentBanner.title.vi}
                                    onChange={(e) => setCurrentBanner({
                                        ...currentBanner,
                                        title: { ...currentBanner.title, vi: e.target.value }
                                    })}
                                />
                                <TextField
                                    label="Title (English)"
                                    fullWidth
                                    value={currentBanner.title.en}
                                    onChange={(e) => setCurrentBanner({
                                        ...currentBanner,
                                        title: { ...currentBanner.title, en: e.target.value }
                                    })}
                                />
                            </Stack>

                            {/* Bilingual Description */}
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Mô tả (Tiếng Việt)"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={currentBanner.description.vi}
                                    onChange={(e) => setCurrentBanner({
                                        ...currentBanner,
                                        description: { ...currentBanner.description, vi: e.target.value }
                                    })}
                                />
                                <TextField
                                    label="Description (English)"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={currentBanner.description.en}
                                    onChange={(e) => setCurrentBanner({
                                        ...currentBanner,
                                        description: { ...currentBanner.description, en: e.target.value }
                                    })}
                                />
                            </Stack>

                            {/* Bilingual Button Text */}
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Button Text (Tiếng Việt)"
                                    fullWidth
                                    value={currentBanner.button_text.vi}
                                    onChange={(e) => setCurrentBanner({
                                        ...currentBanner,
                                        button_text: { ...currentBanner.button_text, vi: e.target.value }
                                    })}
                                />
                                <TextField
                                    label="Button Text (English)"
                                    fullWidth
                                    value={currentBanner.button_text.en}
                                    onChange={(e) => setCurrentBanner({
                                        ...currentBanner,
                                        button_text: { ...currentBanner.button_text, en: e.target.value }
                                    })}
                                />
                            </Stack>

                            {/* Button Link & Sort Order */}
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Button Link"
                                    fullWidth
                                    value={currentBanner.button_link}
                                    onChange={(e) => setCurrentBanner({ ...currentBanner, button_link: e.target.value })}
                                    placeholder="/tool"
                                    sx={{ flex: 2 }}
                                />
                                <TextField
                                    label="Sort Order"
                                    type="number"
                                    value={currentBanner.sort_order}
                                    onChange={(e) => setCurrentBanner({ ...currentBanner, sort_order: e.target.value })}
                                    sx={{ flex: 1 }}
                                />
                            </Stack>

                            {/* Active Toggle */}
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={currentBanner.is_active}
                                        onChange={(e) => setCurrentBanner({ ...currentBanner, is_active: e.target.checked })}
                                    />
                                }
                                label="Hiển thị banner này"
                            />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEdit} color="inherit" disabled={uploading}>Hủy</Button>
                    <Button onClick={handleSaveBanner} variant="contained" disabled={uploading}>
                        {uploading ? 'Đang lưu...' : (currentBanner?.id ? 'Cập nhật' : 'Tạo mới')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
