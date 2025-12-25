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
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    CircularProgress,
    Stack,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    OutlinedInput,
    TablePagination
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { getAllPrompts, createPrompt, updatePrompt, deletePrompt, uploadAsset, getAllCategories } from '../../services/storageService';
import { toast } from 'react-hot-toast';

export default function PromptManagement() {
    const [prompts, setPrompts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openEdit, setOpenEdit] = useState(false);
    const [currentPrompt, setCurrentPrompt] = useState<any>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getAllPrompts();
            setPrompts(data || []);
            const cats = await getAllCategories();
            setCategories(cats || []);
        } catch (error) {
            console.error("Failed to fetch prompts", error);
            toast.error("Không thể tải danh sách prompt");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEdit = (prompt?: any) => {
        if (prompt) {
            setCurrentPrompt(prompt);
        } else {
            setCurrentPrompt({
                content: '',
                avt_url: '',
                category_ids: []
            });
        }
        setOpenEdit(true);
    };

    const handleCloseEdit = () => {
        setOpenEdit(false);
        setCurrentPrompt(null);
    };

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ảnh quá lớn (>5MB)");
            return;
        }

        setUploadingImage(true);
        try {
            const url = await uploadAsset(file);
            setCurrentPrompt((prev: any) => ({ ...prev, avt_url: url }));
            toast.success("Upload ảnh thành công!");
        } catch (error) {
            console.error(error);
            toast.error("Lỗi upload ảnh");
        } finally {
            setUploadingImage(false);
            e.target.value = '';
        }
    };

    const handleSave = async () => {
        if (!currentPrompt.content) {
            toast.error("Vui lòng nhập Nội dung");
            return;
        }

        try {
            // Sanitize payload
            const payload = {
                content: currentPrompt.content,
                avt_url: currentPrompt.avt_url,
                category_ids: currentPrompt.category_ids || []
            };

            let success = false;
            // Assuming CRUD functions return true/false like others in storageService
            if (currentPrompt.id) {
                success = await updatePrompt(currentPrompt.id, payload);
            } else {
                success = await createPrompt(payload);
            }

            if (success) {
                toast.success(currentPrompt.id ? "Đã cập nhật!" : "Đã tạo mới!");
                handleCloseEdit();
                fetchData();
            } else {
                toast.error("Có lỗi xảy ra khi lưu");
            }
        } catch (error) {
            console.error(error);
            toast.error("Lỗi hệ thống");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm(`Bạn có chắc muốn xóa prompt này?`)) {
            try {
                const success = await deletePrompt(id);
                if (success) {
                    toast.success("Đã xóa!");
                    fetchData();
                } else {
                    toast.error("Không thể xóa");
                }
            } catch (error) {
                console.error(error);
                toast.error("Lỗi hệ thống");
            }
        }
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">Quản lý Prompt</Typography>
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
                            <TableCell>Avatar</TableCell>
                            <TableCell>Thể loại</TableCell>
                            <TableCell>Nội dung</TableCell>
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
                        ) : prompts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    Chưa có dữ liệu
                                </TableCell>
                            </TableRow>
                        ) : (
                            prompts
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((prompt) => (
                                    <TableRow key={prompt.id} hover>
                                        <TableCell>
                                            {prompt.avt_url ? (
                                                <Box
                                                    component="img"
                                                    src={prompt.avt_url}
                                                    alt={prompt.name}
                                                    sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <Box sx={{ width: 40, height: 40, bgcolor: '#eee', borderRadius: 1 }} />
                                            )}
                                        </TableCell>
                                        {/* Name column removed */}
                                        <TableCell>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {prompt.category_ids && Array.isArray(prompt.category_ids) && prompt.category_ids.map((catId: string) => {
                                                    const cat = categories.find(c => c.id === catId);
                                                    return (
                                                        <Chip
                                                            key={catId}
                                                            label={cat ? cat.name : catId}
                                                            size="small"
                                                            sx={{ fontSize: '0.7rem', height: 20 }}
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 300 }}>
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {prompt.content}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <IconButton size="small" onClick={() => handleOpenEdit(prompt)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => handleDelete(prompt.id)}>
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
            <TablePagination
                rowsPerPageOptions={[10, 20, 50]}
                component="div"
                count={prompts.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Số dòng:"
            />

            <Dialog open={openEdit} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
                <DialogTitle>{currentPrompt?.id ? 'Chỉnh sửa Prompt' : 'Thêm Prompt mới'}</DialogTitle>
                <DialogContent dividers>
                    {currentPrompt && (
                        <Stack spacing={3} sx={{ pt: 1 }}>
                            {/* Name field removed */}

                            <FormControl fullWidth>
                                <InputLabel id="category-select-label">Thể loại</InputLabel>
                                <Select
                                    labelId="category-select-label"
                                    multiple
                                    value={currentPrompt.category_ids || []}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Ensure value is array
                                        const newIds = typeof value === 'string' ? value.split(',') : value;
                                        setCurrentPrompt({ ...currentPrompt, category_ids: newIds })
                                    }}
                                    input={<OutlinedInput label="Thể loại" />}
                                    renderValue={(selected: any) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value: string) => {
                                                const cat = categories.find(c => c.id === value);
                                                return (
                                                    <Chip
                                                        key={value}
                                                        label={cat ? cat.name : value}
                                                        size="small"
                                                        onDelete={() => {
                                                            const newIds = (currentPrompt.category_ids || []).filter((id: string) => id !== value);
                                                            setCurrentPrompt({ ...currentPrompt, category_ids: newIds });
                                                        }}
                                                        onMouseDown={(event) => {
                                                            event.stopPropagation();
                                                        }}
                                                    />
                                                )
                                            })}
                                        </Box>
                                    )}
                                >
                                    {categories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Box>
                                <Typography variant="caption" color="text.secondary">Avatar URL</Typography>
                                <Stack direction="row" spacing={2} alignItems="center" mt={1}>
                                    {currentPrompt.avt_url && (
                                        <Box
                                            component="img"
                                            src={currentPrompt.avt_url}
                                            sx={{ width: 60, height: 60, borderRadius: 1, objectFit: 'cover', border: '1px solid #eee' }}
                                        />
                                    )}
                                    <Button
                                        component="label"
                                        variant="outlined"
                                        size="small"
                                        startIcon={uploadingImage ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                                        disabled={uploadingImage}
                                    >
                                        Upload Ảnh
                                        <input type="file" hidden accept="image/*" onChange={handleUploadImage} />
                                    </Button>
                                </Stack>
                                <TextField
                                    size="small"
                                    fullWidth
                                    variant="standard"
                                    placeholder="Hoặc nhập URL..."
                                    value={currentPrompt.avt_url || ''}
                                    onChange={(e) => setCurrentPrompt({ ...currentPrompt, avt_url: e.target.value })}
                                    sx={{ mt: 1 }}
                                />
                            </Box>

                            <TextField
                                label="Nội dung Prompt"
                                fullWidth
                                multiline
                                rows={4}
                                value={currentPrompt.content}
                                onChange={(e) => setCurrentPrompt({ ...currentPrompt, content: e.target.value })}
                            />
                        </Stack>
                    )}
                </DialogContent>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={handleCloseEdit} color="inherit">Hủy</Button>
                    <Button onClick={handleSave} variant="contained" disabled={uploadingImage}>
                        {currentPrompt?.id ? 'Cập nhật' : 'Tạo mới'}
                    </Button>
                </Box>
            </Dialog>
        </Box>
    );
}
