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
    Divider,
    Alert
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    DeleteOutline as DeleteOutlineIcon,
    Image as ImageIcon,
    CloudUpload as CloudUploadIcon,
    Save as SaveIcon
} from '@mui/icons-material';
import { getAllCategories, uploadAsset } from '../../services/storageService';
import { toast } from 'react-hot-toast';

// Updated interfaces
interface PromptTemplate {
    id?: number;
    tool_custom_id: number;
    category: string;
    name: string;
    name_vi: string;
    prompt_text: string;
    preview_image_url: string;
    metadata: any;
}

interface ToolType {
    id: number;
    code: string;
    name: string;
    name_vi: string;
}

interface ToolCustom {
    id: number;
    tool_type_id: number;
    category_id: number | null;
    name: string;
    slug: string;
    description: string;
    preview_image_url: string;
    domain_prompts: string;
    ui_config: any;
    status: string;
    sort_order: number;
    tags: string[];
    tool_type_name: string;
    tool_type_name_vi: string;
    category_name: string;
    category_name_vi: string;
}

export default function ToolCustomManagement() {
    const [toolTypes, setToolTypes] = useState<ToolType[]>([]);
    const [selectedToolType, setSelectedToolType] = useState<number | null>(null);
    const [toolCustoms, setToolCustoms] = useState<ToolCustom[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [currentToolCustom, setCurrentToolCustom] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Prompts state (fetched separately)
    const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
    const [loadingPrompts, setLoadingPrompts] = useState(false);

    // Prompt Editing State
    const [newPrompt, setNewPrompt] = useState<Partial<PromptTemplate>>({
        name: '', name_vi: '', prompt_text: '', preview_image_url: '', category: 'style_preset'
    });
    const [editingPromptId, setEditingPromptId] = useState<number | null>(null);
    const [editingPromptData, setEditingPromptData] = useState<Partial<PromptTemplate> | null>(null);

    // Load tool types on mount
    useEffect(() => {
        fetchToolTypes();
        fetchCategories();
    }, []);

    // Load tool customs when tool type changes
    useEffect(() => {
        if (selectedToolType) {
            fetchToolCustoms();
        } else {
            setToolCustoms([]);
        }
    }, [selectedToolType]);

    // Load prompts when editing a tool custom
    useEffect(() => {
        if (currentToolCustom?.id) {
            fetchPrompts(currentToolCustom.id);
        } else {
            setPrompts([]);
        }
    }, [currentToolCustom?.id]);

    const fetchToolTypes = async () => {
        try {
            const response = await fetch('/api/admin/tool-types');
            const data = await response.json();
            if (data.success) {
                setToolTypes(data.data);
            }
        } catch (error) {
            console.error('Error fetching tool types:', error);
            toast.error('Không thể tải danh sách tool types');
        }
    };

    const fetchCategories = async () => {
        try {
            const catsData = await getAllCategories();
            setCategories(catsData);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchToolCustoms = async () => {
        if (!selectedToolType) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/admin/tool-custom?tool_type_id=${selectedToolType}`);
            const data = await response.json();
            if (data.success) {
                setToolCustoms(data.data);
            }
        } catch (error) {
            console.error('Error fetching tool customs:', error);
            toast.error('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const fetchPrompts = async (toolCustomId: number) => {
        setLoadingPrompts(true);
        try {
            const response = await fetch(`/api/admin/prompts?tool_custom_id=${toolCustomId}`);
            const data = await response.json();
            if (data.success) {
                setPrompts(data.data);
            }
        } catch (error) {
            console.error('Error fetching prompts:', error);
            toast.error('Không thể tải danh sách prompts');
        } finally {
            setLoadingPrompts(false);
        }
    };

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, target: 'tool' | 'prompt') => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ảnh quá lớn (>5MB)");
            return;
        }

        setUploadingImage(true);
        try {
            const url = await uploadAsset(file);
            if (target === 'tool') {
                setCurrentToolCustom((prev: any) => ({ ...prev, preview_image_url: url }));
            } else {
                if (editingPromptId) {
                    setEditingPromptData(prev => prev ? ({ ...prev, preview_image_url: url }) : null);
                } else {
                    setNewPrompt((prev: any) => ({ ...prev, preview_image_url: url }));
                }
            }
            toast.success("Upload ảnh thành công!");
        } catch (error) {
            console.error(error);
            toast.error("Lỗi upload ảnh");
        } finally {
            setUploadingImage(false);
            e.target.value = '';
        }
    };

    const handleOpenEdit = (toolCustom?: ToolCustom) => {
        if (toolCustom) {
            setCurrentToolCustom(toolCustom);
        } else {
            if (!selectedToolType) {
                toast.error('Vui lòng chọn Tool Type trước');
                return;
            }
            setCurrentToolCustom({
                tool_type_id: selectedToolType,
                name: '',
                slug: '',
                description: '',
                category_id: null,
                preview_image_url: '',
                domain_prompts: '',
                sort_order: 0,
                status: 'active',
                tags: []
            });
            setPrompts([]);
        }
        setNewPrompt({ name: '', name_vi: '', prompt_text: '', preview_image_url: '', category: 'style_preset' });
        setOpenEdit(true);
    };

    const handleCloseEdit = () => {
        setOpenEdit(false);
        setCurrentToolCustom(null);
        setPrompts([]);
        setEditingPromptId(null);
        setEditingPromptData(null);
    };

    // Prompt Operations Using API
    const handleAddPrompt = async () => {
        if (!currentToolCustom?.id) {
            toast.error("Vui lòng Lưu Tool Custom trước khi thêm Prompt!");
            return;
        }
        if (!newPrompt.name || !newPrompt.prompt_text) {
            toast.error("Vui lòng nhập Tên và Nội dung Prompt");
            return;
        }

        try {
            const response = await fetch('/api/admin/prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tool_custom_id: currentToolCustom.id,
                    ...newPrompt
                })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Đã thêm prompt!');
                setNewPrompt({ name: '', name_vi: '', prompt_text: '', preview_image_url: '', category: 'style_preset' });
                fetchPrompts(currentToolCustom.id);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error('Lỗi khi thêm prompt');
        }
    };

    const handleDeletePrompt = async (id: number) => {
        if (!window.confirm("Bạn có chắc muốn xóa prompt này?")) return;
        try {
            const response = await fetch(`/api/admin/prompts/${id}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success('Đã xóa prompt');
                if (currentToolCustom?.id) fetchPrompts(currentToolCustom.id);
            } else {
                toast.error('Lỗi khi xóa prompt');
            }
        } catch (error) {
            toast.error('Lỗi hệ thống');
        }
    };

    const handleStartEditPrompt = (prompt: PromptTemplate) => {
        setEditingPromptId(prompt.id!);
        setEditingPromptData({ ...prompt });
    };

    const handleCancelEditPrompt = () => {
        setEditingPromptId(null);
        setEditingPromptData(null);
    };

    const handleSavePromptEdit = async () => {
        if (!editingPromptData || !editingPromptId) return;
        try {
            const response = await fetch(`/api/admin/prompts/${editingPromptId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingPromptData)
            });
            if (response.ok) {
                toast.success('Đã cập nhật prompt');
                handleCancelEditPrompt();
                if (currentToolCustom?.id) fetchPrompts(currentToolCustom.id);
            } else {
                toast.error('Lỗi update prompt');
            }
        } catch (error) {
            toast.error('Lỗi hệ thống');
        }
    };

    const handleSaveToolCustom = async () => {
        if (!currentToolCustom.name || !currentToolCustom.slug) {
            toast.error("Vui lòng nhập Tên và Slug");
            return;
        }

        setIsUploading(true);
        try {
            const payload = { ...currentToolCustom };
            // prompts are handled separately now, so no prompts field in payload

            let response;
            if (currentToolCustom.id) {
                response = await fetch(`/api/admin/tool-custom/${currentToolCustom.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                response = await fetch('/api/admin/tool-custom', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const data = await response.json();
            if (data.success) {
                toast.success(currentToolCustom.id ? "Đã cập nhật!" : "Đã tạo mới!");
                if (!currentToolCustom.id) {
                    // If created new, set current to allow adding prompts immediately
                    setCurrentToolCustom(data.data);
                } else {
                    handleCloseEdit();
                }
                fetchToolCustoms();
            } else {
                toast.error(data.error || "Có lỗi xảy ra");
            }
        } catch (error) {
            console.error(error);
            toast.error("Lỗi hệ thống");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteToolCustom = async (id: number) => {
        if (!window.confirm('Bạn có chắc muốn xóa tool custom này?')) return;
        try {
            const response = await fetch(`/api/admin/tool-custom/${id}`, { method: 'DELETE' });
            if (response.ok) {
                toast.success('Đã xóa!');
                fetchToolCustoms();
            } else {
                toast.error('Có lỗi xảy ra');
            }
        } catch (error) {
            console.error(error);
            toast.error('Lỗi hệ thống');
        }
    };

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
            {/* Tool Type Selector */}
            <Box sx={{ mb: 3, p: 3, bgcolor: '#F9FAFB', borderRadius: 2, border: '1px solid #E5E7EB' }}>
                <FormControl fullWidth>
                    <InputLabel>Chọn Tool Type</InputLabel>
                    <Select
                        value={selectedToolType || ''}
                        label="Chọn Tool Type"
                        onChange={(e) => setSelectedToolType(e.target.value as number)}
                    >
                        <MenuItem value=""><em>-- Chọn Tool Type --</em></MenuItem>
                        {toolTypes.map((tt) => (
                            <MenuItem key={tt.id} value={tt.id}>
                                {tt.name_vi || tt.name} ({tt.code})
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {!selectedToolType ? (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#F9FAFB' }}>
                    <Typography color="text.secondary">
                        Vui lòng chọn Tool Type để xem danh sách
                    </Typography>
                </Paper>
            ) : (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" fontWeight="bold">
                            Quản lý Tool Custom - {toolTypes.find(t => t.id === selectedToolType)?.name_vi}
                        </Typography>
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
                                    <TableCell>Tên Tool Custom</TableCell>
                                    <TableCell>Danh mục</TableCell>
                                    <TableCell>Domain Prompts</TableCell>
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
                                ) : toolCustoms.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                            Chưa có dữ liệu
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    toolCustoms.map((tc) => {
                                        const catName = tc.category_name_vi || tc.category_name || '---';
                                        return (
                                            <TableRow key={tc.id} hover>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}>{tc.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{tc.slug}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={catName} size="small" variant="outlined" />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {tc.domain_prompts ? 'Có nội dung' : '---'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {tc.sort_order === 0 ? (
                                                        <Typography variant="caption" color="text.secondary">0 (Cuối)</Typography>
                                                    ) : (
                                                        <Chip label={tc.sort_order} size="small" color="primary" variant="filled" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={tc.status === 'active' ? 'Active' : 'Hidden'}
                                                        color={tc.status === 'active' ? 'success' : 'default'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton size="small" onClick={() => handleOpenEdit(tc)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => handleDeleteToolCustom(tc.id)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}

            {/* Edit Dialog */}
            <Dialog open={openEdit} onClose={handleCloseEdit} maxWidth="lg" fullWidth>
                <DialogTitle>{currentToolCustom?.id ? 'Chỉnh sửa Tool Custom' : 'Thêm Tool Custom mới'}</DialogTitle>
                <DialogContent dividers>
                    {currentToolCustom && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                            {/* 1. Basic Info */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        <TextField
                                            label="Tên Tool Custom"
                                            fullWidth
                                            size="small"
                                            value={currentToolCustom.name}
                                            onChange={(e) => {
                                                const name = e.target.value;
                                                if (!currentToolCustom.id) {
                                                    setCurrentToolCustom({ ...currentToolCustom, name: name, slug: generateSlug(name) });
                                                } else {
                                                    setCurrentToolCustom({ ...currentToolCustom, name });
                                                }
                                            }}
                                        />
                                        <TextField
                                            label="Slug"
                                            fullWidth
                                            size="small"
                                            value={currentToolCustom.slug}
                                            onChange={(e) => setCurrentToolCustom({ ...currentToolCustom, slug: e.target.value })}
                                        />
                                    </Box>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Danh mục</InputLabel>
                                        <Select
                                            value={currentToolCustom.category_id || ''}
                                            label="Danh mục"
                                            onChange={(e) => setCurrentToolCustom({ ...currentToolCustom, category_id: e.target.value })}
                                        >
                                            <MenuItem value=""><em>Không chọn</em></MenuItem>
                                            {categories.map((cat) => (
                                                <MenuItem key={cat.id} value={cat.id}>{cat.name_vi || cat.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        <TextField
                                            label="Sort Order"
                                            type="number"
                                            size="small"
                                            value={currentToolCustom.sort_order}
                                            onChange={(e) => setCurrentToolCustom({ ...currentToolCustom, sort_order: e.target.value as any })}
                                        />
                                        <FormControl size="small">
                                            <InputLabel>Trạng thái</InputLabel>
                                            <Select
                                                value={currentToolCustom.status || 'active'}
                                                label="Trạng thái"
                                                onChange={(e) => setCurrentToolCustom({ ...currentToolCustom, status: e.target.value })}
                                            >
                                                <MenuItem value="active">Active</MenuItem>
                                                <MenuItem value="inactive">Inactive</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </Box>

                                {/* Preview Image */}
                                <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.secondary" mb={1}>Ảnh đại diện</Typography>
                                    {currentToolCustom.preview_image_url ? (
                                        <Box component="img" src={currentToolCustom.preview_image_url} sx={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 1, mb: 1 }} />
                                    ) : (
                                        <Box sx={{ width: '100%', height: 100, bgcolor: '#e0e0e0', borderRadius: 1, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ImageIcon sx={{ color: '#9e9e9e' }} />
                                        </Box>
                                    )}
                                    <Button
                                        component="label"
                                        variant="outlined"
                                        size="small"
                                        startIcon={uploadingImage ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                                        fullWidth
                                        disabled={uploadingImage}
                                    >
                                        Upload
                                        <input type="file" hidden accept="image/*" onChange={(e) => handleUploadImage(e, 'tool')} />
                                    </Button>
                                </Box>
                            </Box>

                            {/* 2. Primary Domain Prompt */}
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', borderColor: '#e0e0e0' }}>
                                <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                                    Prompt Chính (Domain Context)
                                </Typography>
                                <Typography variant="caption" color="text.secondary" paragraph>
                                    Định nghĩa bối cảnh chung, phong cách cốt lõi (ví dụ: Quy tắc ánh sáng, vật liệu, màu sắc chung cho Studio này).
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    placeholder="Nhập prompt context..."
                                    value={currentToolCustom.domain_prompts || ''}
                                    onChange={(e) => setCurrentToolCustom({ ...currentToolCustom, domain_prompts: e.target.value })}
                                    sx={{ bgcolor: 'white' }}
                                />
                            </Paper>

                            <Divider />

                            {/* 3. Prompt Templates Management */}
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">Danh sách phong cách ({prompts.length})</Typography>
                                    {!currentToolCustom.id && (
                                        <Alert severity="warning" sx={{ py: 0 }}>Vui lòng lưu Tool Custom trước khi thêm Prompt</Alert>
                                    )}
                                </Box>

                                {currentToolCustom.id ? (
                                    <>
                                        {/* Prompt List */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 400, overflowY: 'auto', mb: 3 }}>
                                            {loadingPrompts ? <CircularProgress /> : prompts.map((p) => {
                                                const isEditing = editingPromptId === p.id;

                                                if (isEditing && editingPromptData) {
                                                    return (
                                                        <Paper key={p.id} variant="outlined" sx={{ p: 2, bgcolor: '#FFF', borderColor: 'primary.main', borderStyle: 'dashed' }}>
                                                            <Stack spacing={2}>
                                                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                                                    <TextField label="Tên (EN)" size="small" value={editingPromptData.name} onChange={(e) => setEditingPromptData({ ...editingPromptData, name: e.target.value })} />
                                                                    <TextField label="Tên (VI)" size="small" value={editingPromptData.name_vi} onChange={(e) => setEditingPromptData({ ...editingPromptData, name_vi: e.target.value })} />
                                                                </Box>
                                                                <TextField label="Prompt Text" size="small" multiline rows={3} value={editingPromptData.prompt_text} onChange={(e) => setEditingPromptData({ ...editingPromptData, prompt_text: e.target.value })} />
                                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                                    <Button size="small" onClick={handleCancelEditPrompt}>Hủy</Button>
                                                                    <Button size="small" variant="contained" onClick={handleSavePromptEdit}>Lưu</Button>
                                                                </Box>
                                                            </Stack>
                                                        </Paper>
                                                    );
                                                }

                                                return (
                                                    <Card key={p.id} variant="outlined" sx={{ bgcolor: '#F9FAFB' }}>
                                                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                                                <Box>
                                                                    <Typography variant="subtitle2" fontWeight="bold">{p.name} / {p.name_vi}</Typography>
                                                                    {/* <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 500 }}>{p.prompt_text}</Typography> */}
                                                                </Box>
                                                                <Stack direction="row">
                                                                    <IconButton size="small" onClick={() => handleStartEditPrompt(p)}><EditIcon fontSize="small" /></IconButton>
                                                                    <IconButton size="small" color="error" onClick={() => handleDeletePrompt(p.id!)}><DeleteIcon fontSize="small" /></IconButton>
                                                                </Stack>
                                                            </Stack>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </Box>

                                        {/* Add New Prompt Form */}
                                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F0F9FF', borderColor: '#BAE6FD' }}>
                                            <Typography variant="subtitle2" color="primary" gutterBottom>Thêm Prompt Mới</Typography>
                                            <Stack spacing={2}>
                                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                                    <TextField label="Tên (EN)" size="small" value={newPrompt.name} onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })} />
                                                    <TextField label="Tên (VI)" size="small" value={newPrompt.name_vi} onChange={(e) => setNewPrompt({ ...newPrompt, name_vi: e.target.value })} />
                                                </Box>
                                                <TextField label="Prompt Text" size="small" multiline rows={2} value={newPrompt.prompt_text} onChange={(e) => setNewPrompt({ ...newPrompt, prompt_text: e.target.value })} />
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={handleAddPrompt}
                                                    disabled={!newPrompt.name || !newPrompt.prompt_text}
                                                    startIcon={<AddIcon />}
                                                >
                                                    Thêm Prompt này
                                                </Button>
                                            </Stack>
                                        </Paper>
                                    </>
                                ) : (
                                    <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary', bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                        Lưu Tool Custom để bắt đầu thêm prompts
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEdit} color="inherit">Đóng</Button>
                    <Button onClick={handleSaveToolCustom} variant="contained" color="success" startIcon={<SaveIcon />} disabled={isUploading}>
                        Lưu Tool Custom
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
