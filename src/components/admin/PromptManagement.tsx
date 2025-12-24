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
    Stack
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { getAllPrompts, createPrompt, updatePrompt, deletePrompt, uploadAsset } from '../../services/storageService';
import { toast } from 'react-hot-toast';

export default function PromptManagement() {
    const [prompts, setPrompts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openEdit, setOpenEdit] = useState(false);
    const [currentPrompt, setCurrentPrompt] = useState<any>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getAllPrompts();
            setPrompts(data || []);
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
                name: '',
                content: '',
                avt_url: ''
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
        if (!currentPrompt.name || !currentPrompt.content) {
            toast.error("Vui lòng nhập Tên và Nội dung");
            return;
        }

        try {
            let success = false;
            // Assuming CRUD functions return true/false like others in storageService
            if (currentPrompt.id) {
                success = await updatePrompt(currentPrompt.id, currentPrompt);
            } else {
                success = await createPrompt(currentPrompt);
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

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Bạn có chắc muốn xóa prompt "${name}"?`)) {
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
                            <TableCell>Tên Prompt</TableCell>
                            <TableCell>Nội dung</TableCell>
                            <TableCell align="right">Hành động</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                    <CircularProgress size={24} />
                                </TableCell>
                            </TableRow>
                        ) : prompts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    Chưa có dữ liệu
                                </TableCell>
                            </TableRow>
                        ) : (
                            prompts.map((prompt) => (
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
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight="bold">{prompt.name}</Typography>
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
                                            <IconButton size="small" color="error" onClick={() => handleDelete(prompt.id, prompt.name)}>
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

            <Dialog open={openEdit} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
                <DialogTitle>{currentPrompt?.id ? 'Chỉnh sửa Prompt' : 'Thêm Prompt mới'}</DialogTitle>
                <DialogContent dividers>
                    {currentPrompt && (
                        <Stack spacing={3} sx={{ pt: 1 }}>
                            <TextField
                                label="Tên Prompt"
                                fullWidth
                                value={currentPrompt.name}
                                onChange={(e) => setCurrentPrompt({ ...currentPrompt, name: e.target.value })}
                            />

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
