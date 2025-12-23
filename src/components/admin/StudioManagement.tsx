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
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    DeleteOutline as DeleteOutlineIcon,
    Image as ImageIcon,
    CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { getAllStudios, createStudio, updateStudio, deleteStudio, getAllCategories, uploadAsset } from '../../services/storageService';
import { toast } from 'react-hot-toast';

// Define prompt interface
interface PromptItem {
    name: string;
    prompt: string;
    image_url: string;
    gender?: string; // 'male', 'female', 'couple'
}

export default function StudioManagement() {
    const [studios, setStudios] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openEdit, setOpenEdit] = useState(false);
    const [currentStudio, setCurrentStudio] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Upload state
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, target: 'studio' | 'prompt') => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        // Validate size/type if needed
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ảnh quá lớn (>5MB)");
            return;
        }

        setUploadingImage(true);
        try {
            const url = await uploadAsset(file);
            console.log("Uploaded URL:", url);

            if (target === 'studio') {
                setCurrentStudio((prev: any) => ({ ...prev, preview_image_url: url }));
            } else {
                setNewPrompt((prev: any) => ({ ...prev, image_url: url }));
            }
            toast.success("Upload ảnh thành công!");
        } catch (error) {
            console.error(error);
            toast.error("Lỗi upload ảnh");
        } finally {
            setUploadingImage(false);
            // Reset input value to allow re-uploading same file if needed (optional)
            e.target.value = '';
        }
    };

    // Prompts state for the dialog
    const [prompts, setPrompts] = useState<PromptItem[]>([]);
    const [newPrompt, setNewPrompt] = useState<PromptItem>({ name: '', prompt: '', image_url: '', gender: '' });

    // Inline editing state
    const [editingPromptIndex, setEditingPromptIndex] = useState<number>(-1);
    const [editingPromptData, setEditingPromptData] = useState<PromptItem | null>(null);

    // Initial load
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [studiosData, catsData] = await Promise.all([
                getAllStudios(),
                getAllCategories()
            ]);
            setStudios(studiosData);
            setCategories(catsData);
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEdit = (studio?: any) => {
        if (studio) {
            console.log("Opening studio:", studio);
            setCurrentStudio(studio);
            // Parse prompts if string, otherwise use directly
            let studioPrompts = [];
            if (typeof studio.prompts === 'string') {
                try { studioPrompts = JSON.parse(studio.prompts); } catch (e) { studioPrompts = []; }
            } else if (Array.isArray(studio.prompts)) {
                studioPrompts = studio.prompts;
            }
            console.log("Parsed prompts:", studioPrompts);
            setPrompts(studioPrompts);
        } else {
            setCurrentStudio({
                name: '',
                slug: '',
                description: '',
                category: '',
                preview_image_url: '',
                sort_order: 0,
                is_active: true
            });
            setPrompts([]);
        }
        setNewPrompt({ name: '', prompt: '', image_url: '' });
        setOpenEdit(true);
    };

    const handleCloseEdit = () => {
        setOpenEdit(false);
        setCurrentStudio(null);
    };

    const handleAddPrompt = () => {
        if (!newPrompt.name || !newPrompt.prompt) {
            toast.error("Vui lòng nhập Tên và Nội dung Prompt");
            return;
        }
        setPrompts([...prompts, newPrompt]);
        setNewPrompt({ name: '', prompt: '', image_url: '' });
    };

    const handleRemovePrompt = (index: number) => {
        const newPrompts = [...prompts];
        newPrompts.splice(index, 1);
        setPrompts(newPrompts);
    };

    // Inline Edit Handlers
    const handleStartEdit = (index: number, prompt: PromptItem) => {
        setEditingPromptIndex(index);
        setEditingPromptData({ ...prompt }); // Clone deep enough for shallow props
    };

    const handleCancelEdit = () => {
        setEditingPromptIndex(-1);
        setEditingPromptData(null);
    };

    const handleConfirmEdit = () => {
        if (!editingPromptData || !editingPromptData.name || !editingPromptData.prompt) {
            toast.error("Vui lòng nhập Tên và Nội dung Prompt");
            return;
        }
        const updatedPrompts = [...prompts];
        updatedPrompts[editingPromptIndex] = editingPromptData;
        setPrompts(updatedPrompts);
        handleCancelEdit();
        toast.success("Đã cập nhật prompt (Chưa lưu vào Studio)");
    };

    const handleUploadEditImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ảnh quá lớn (>5MB)");
            return;
        }
        setUploadingImage(true);
        try {
            const url = await uploadAsset(file);
            setEditingPromptData(prev => prev ? ({ ...prev, image_url: url }) : null);
            toast.success("Upload ảnh thành công!");
        } catch (error) {
            console.error(error);
            toast.error("Lỗi upload ảnh");
        } finally {
            setUploadingImage(false);
            e.target.value = '';
        }
    };

    const handleSaveStudio = async () => {
        if (!currentStudio.name || !currentStudio.slug) {
            toast.error("Vui lòng nhập Tên và Slug");
            return;
        }

        // Warning if new prompt text is entered but not added
        if (newPrompt.name || newPrompt.prompt) {
            const confirm = window.confirm("Bạn đã nhập thông tin Prompt ở dưới nhưng CHƯA bấm 'Thêm Prompt này'.\nPrompt đó sẽ KHÔNG được lưu.\n\nBạn có muốn tiếp tục lưu Studio mà không có prompt đó?");
            if (!confirm) return;
        }

        setIsUploading(true);
        try {
            const payload = {
                name: currentStudio.name,
                slug: currentStudio.slug,
                description: currentStudio.description,
                category: currentStudio.category || null,
                preview_image_url: currentStudio.preview_image_url,
                sort_order: parseInt(currentStudio.sort_order) || 0,
                is_active: currentStudio.is_active,
                prompts: prompts // Save dynamic prompts array
            };

            console.log("Saving payload:", payload);

            let success = false;
            // ... existing save logic ...
            if (currentStudio.id) {
                success = await updateStudio(currentStudio.id, payload);
            } else {
                success = await createStudio(payload);
            }

            if (success) {
                toast.success(currentStudio.id ? "Đã cập nhật!" : "Đã tạo mới!");
                handleCloseEdit();
                fetchData();
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
                <Typography variant="h5" fontWeight="bold">Quản lý Studio</Typography>
                <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    onClick={() => handleOpenEdit()}
                >
                    Thêm mới
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                        <TableRow>
                            <TableCell>Tên Studio</TableCell>
                            <TableCell>Danh mục</TableCell>
                            <TableCell>Số Prompt</TableCell>
                            <TableCell>Sort Order</TableCell>
                            <TableCell>Trạng thái</TableCell>
                            <TableCell align="right">Hành động</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    <CircularProgress size={24} />
                                </TableCell>
                            </TableRow>
                        ) : studios.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    Chưa có dữ liệu
                                </TableCell>
                            </TableRow>
                        ) : (
                            studios.map((studio) => {
                                const promptCount = Array.isArray(studio.prompts) ? studio.prompts.length : 0;
                                const catName = studio.categories?.name || '---';
                                return (
                                    <TableRow key={studio.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{studio.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{studio.slug}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={catName} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={promptCount} size="small" color="secondary" variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            {studio.sort_order === 0 ? (
                                                <Typography variant="caption" color="text.secondary">0 (Cuối)</Typography>
                                            ) : (
                                                <Chip label={studio.sort_order} size="small" color="primary" variant="filled" />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={studio.is_active ? 'Active' : 'Hidden'}
                                                color={studio.is_active ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={() => handleOpenEdit(studio)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Edit Dialog */}
            <Dialog open={openEdit} onClose={handleCloseEdit} maxWidth="md" fullWidth>
                <DialogTitle>{currentStudio?.id ? 'Chỉnh sửa Studio' : 'Thêm Studio mới'}</DialogTitle>
                <DialogContent dividers>
                    {currentStudio && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <TextField
                                    label="Tên Studio"
                                    fullWidth
                                    value={currentStudio.name}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        if (!currentStudio.id) {
                                            setCurrentStudio({
                                                ...currentStudio,
                                                name: name,
                                                slug: generateSlug(name)
                                            });
                                        } else {
                                            setCurrentStudio({ ...currentStudio, name });
                                        }
                                    }}
                                />
                                <TextField
                                    label="Mã định danh (Slug)"
                                    fullWidth
                                    value={currentStudio.slug}
                                    onChange={(e) => setCurrentStudio({ ...currentStudio, slug: e.target.value })}
                                />
                            </Box>

                            <FormControl fullWidth>
                                <InputLabel>Danh mục</InputLabel>
                                <Select
                                    value={currentStudio.category || ''}
                                    label="Danh mục"
                                    onChange={(e) => setCurrentStudio({ ...currentStudio, category: e.target.value })}
                                >
                                    <MenuItem value=""><em>Không chọn</em></MenuItem>
                                    {categories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                label="Mô tả ngắn"
                                fullWidth
                                multiline
                                rows={2}
                                value={currentStudio.description || ''}
                                onChange={(e) => setCurrentStudio({ ...currentStudio, description: e.target.value })}
                            />

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Ảnh đại diện</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                        {currentStudio.preview_image_url && (
                                            <Box
                                                component="img"
                                                src={currentStudio.preview_image_url}
                                                alt="Preview"
                                                sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1, border: '1px solid #eee' }}
                                            />
                                        )}
                                        <Button
                                            component="label"
                                            variant="outlined"
                                            size="small"
                                            startIcon={uploadingImage ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                                            disabled={uploadingImage}
                                        >
                                            {currentStudio.preview_image_url ? 'Đổi ảnh' : 'Upload ảnh'}
                                            <input type="file" hidden accept="image/*" onChange={(e) => handleUploadImage(e, 'studio')} />
                                        </Button>
                                    </Box>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        variant="standard"
                                        placeholder="Hoặc nhập URL..."
                                        value={currentStudio.preview_image_url || ''}
                                        onChange={(e) => setCurrentStudio({ ...currentStudio, preview_image_url: e.target.value })}
                                        sx={{ mt: 1 }}
                                    />
                                </Box>

                                <TextField
                                    label="Thứ tự (Sort Order)"
                                    type="number"
                                    fullWidth
                                    value={currentStudio.sort_order}
                                    onChange={(e) => setCurrentStudio({ ...currentStudio, sort_order: e.target.value as any })}
                                    helperText="1, 2, 3... đầu. 0 cuối."
                                />
                            </Box>

                            <Divider sx={{ my: 1 }} />

                            {/* DYNAMIC PROMPTS SECTION */}
                            <Typography variant="subtitle1" fontWeight="bold">Danh sách Prompt ({prompts.length})</Typography>

                            {/* List of existing prompts */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {prompts.map((p, index) => {
                                    const isEditing = editingPromptIndex === index;

                                    if (isEditing && editingPromptData) {
                                        return (
                                            <Paper key={index} variant="outlined" sx={{ p: 2, bgcolor: '#FFF', borderColor: 'primary.main', borderStyle: 'dashed' }}>
                                                <Typography variant="caption" color="primary" fontWeight="bold">CHỈNH SỬA PROMPT #{index + 1}</Typography>
                                                <Stack spacing={2} sx={{ mt: 1 }}>
                                                    <TextField
                                                        label="Tên Prompt"
                                                        size="small"
                                                        fullWidth
                                                        value={editingPromptData.name}
                                                        onChange={(e) => setEditingPromptData({ ...editingPromptData, name: e.target.value })}
                                                    />
                                                    <TextField
                                                        label="Nội dung Prompt"
                                                        size="small"
                                                        fullWidth
                                                        multiline
                                                        rows={3}
                                                        value={editingPromptData.prompt}
                                                        onChange={(e) => setEditingPromptData({ ...editingPromptData, prompt: e.target.value })}
                                                    />
                                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                                        <FormControl size="small" fullWidth>
                                                            <InputLabel>Giới tính áp dụng</InputLabel>
                                                            <Select
                                                                value={editingPromptData.gender || ''}
                                                                label="Giới tính áp dụng"
                                                                onChange={(e) => setEditingPromptData({ ...editingPromptData, gender: e.target.value })}
                                                            >
                                                                <MenuItem value=""><em>Không chọn (Dùng chung)</em></MenuItem>
                                                                <MenuItem value="female">Nữ (Female)</MenuItem>
                                                                <MenuItem value="male">Nam (Male)</MenuItem>
                                                                <MenuItem value="couple">Cặp đôi (Couple)</MenuItem>
                                                            </Select>
                                                        </FormControl>

                                                        {/* Edit Image Upload */}
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            {editingPromptData.image_url && (
                                                                <Box component="img" src={editingPromptData.image_url} alt="Preview" sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }} />
                                                            )}
                                                            <Button
                                                                component="label"
                                                                variant="outlined"
                                                                size="small"
                                                                startIcon={<CloudUploadIcon />}
                                                                disabled={uploadingImage}
                                                            >
                                                                Upload
                                                                <input type="file" hidden accept="image/*" onChange={handleUploadEditImage} />
                                                            </Button>
                                                        </Box>
                                                    </Box>

                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        <Button size="small" onClick={handleCancelEdit} disabled={uploadingImage}>Hủy</Button>
                                                        <Button size="small" variant="contained" onClick={handleConfirmEdit} disabled={uploadingImage}>Xác nhận sửa</Button>
                                                    </Stack>
                                                </Stack>
                                            </Paper>
                                        );
                                    }

                                    // View Mode
                                    return (
                                        <Card key={index} variant="outlined" sx={{ bgcolor: '#F9FAFB' }}>
                                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                                    <Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography variant="subtitle2" fontWeight="bold">{p.name}</Typography>
                                                            {p.gender && (
                                                                <Chip
                                                                    label={p.gender === 'male' ? 'Nam' : p.gender === 'female' ? 'Nữ' : 'Cặp đôi'}
                                                                    size="small"
                                                                    color="info"
                                                                    variant="outlined"
                                                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                                                />
                                                            )}
                                                        </Box>
                                                        <Typography variant="body2" color="text.secondary" sx={{
                                                            display: '-webkit-box',
                                                            overflow: 'hidden',
                                                            WebkitBoxOrient: 'vertical',
                                                            WebkitLineClamp: 2
                                                        }}>
                                                            {p.prompt}
                                                        </Typography>
                                                        {p.image_url && (
                                                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <ImageIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                                <Typography variant="caption" color="text.secondary">Có ảnh mẫu</Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                    <Stack direction="row">
                                                        <IconButton size="small" color="primary" onClick={() => handleStartEdit(index, p)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" color="error" onClick={() => handleRemovePrompt(index)}>
                                                            <DeleteOutlineIcon fontSize="small" />
                                                        </IconButton>
                                                    </Stack>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </Box>

                            {/* Add New Prompt Inputs */}
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F0F9FF', borderColor: '#BAE6FD' }}>
                                <Typography variant="subtitle2" color="primary" gutterBottom>Thêm Prompt Mới</Typography>
                                <Stack spacing={2}>
                                    <TextField
                                        label="Tên Prompt (Ví dụ: Style Ghibli)"
                                        size="small"
                                        fullWidth
                                        value={newPrompt.name}
                                        onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                                    />
                                    <TextField
                                        label="Nội dung Prompt (Tiếng Anh tốt hơn)"
                                        size="small"
                                        fullWidth
                                        multiline
                                        rows={2}
                                        value={newPrompt.prompt}
                                        onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })}
                                    />

                                    <FormControl size="small" fullWidth>
                                        <InputLabel>Giới tính (Tùy chọn)</InputLabel>
                                        <Select
                                            value={newPrompt.gender || ''}
                                            label="Giới tính (Tùy chọn)"
                                            onChange={(e) => setNewPrompt({ ...newPrompt, gender: e.target.value })}
                                        >
                                            <MenuItem value=""><em>Không chọn</em></MenuItem>
                                            <MenuItem value="male">Nam</MenuItem>
                                            <MenuItem value="female">Nữ</MenuItem>
                                            <MenuItem value="couple">Cặp đôi</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {/* Prompt Image Upload */}
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Ảnh mẫu prompt</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                            {newPrompt.image_url && (
                                                <Box
                                                    component="img"
                                                    src={newPrompt.image_url}
                                                    alt="Prompt Preview"
                                                    sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1 }}
                                                />
                                            )}
                                            <Button
                                                component="label"
                                                variant="outlined"
                                                size="small"
                                                startIcon={uploadingImage ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                                                disabled={uploadingImage}
                                            >
                                                Upload
                                                <input type="file" hidden accept="image/*" onChange={(e) => handleUploadImage(e, 'prompt')} />
                                            </Button>
                                            <TextField
                                                placeholder="URL..."
                                                size="small"
                                                variant="standard"
                                                fullWidth
                                                value={newPrompt.image_url}
                                                onChange={(e) => setNewPrompt({ ...newPrompt, image_url: e.target.value })}
                                            />
                                        </Box>
                                    </Box>

                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={handleAddPrompt}
                                        disabled={!newPrompt.name || !newPrompt.prompt || uploadingImage}
                                        startIcon={<AddIcon />}
                                    >
                                        Thêm Prompt này
                                    </Button>
                                </Stack>
                            </Paper>

                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEdit} color="inherit">Hủy</Button>
                    <Button onClick={handleSaveStudio} variant="contained" disabled={isUploading}>
                        {isUploading ? 'Đang lưu...' : 'Lưu Studio'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
