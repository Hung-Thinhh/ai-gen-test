"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Stack,
    Button,
    Avatar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Switch,
    IconButton,
    InputAdornment,
    TextField,
    Pagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Checkbox,
    CircularProgress
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Settings as SettingsIcon,
    Visibility as VisibilityIcon,
    BugReport as BugReportIcon,
    FilterList as FilterListIcon,
    KeyboardArrowDown,
    CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { handleFileUpload } from '../uiFileUtilities';
import { uploadImageToCloud, getAllTools, updateTool, createTool } from '../../services/storageService';

export default function ToolManagement() {
    const [tools, setTools] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [openEdit, setOpenEdit] = useState(false);
    const [currentTool, setCurrentTool] = useState<any>(null);
    const [editAvatarFile, setEditAvatarFile] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10);

    // Fetch tools on mount
    useEffect(() => {
        fetchTools();
    }, []);

    const fetchTools = async () => {
        setLoading(true);
        try {
            const data = await getAllTools();
            console.log("Raw tools data from DB:", data);

            // Helper to safely extract string from potentially localized object
            const getLocString = (val: any) => {
                if (typeof val === 'string') return val;
                if (val && typeof val === 'object') {
                    return val.vi || val.en || Object.values(val)[0] || '';
                }
                return '';
            };

            const mappedTools = data.map((t: any) => {
                // Map numeric usage to text labels for UI compatibility
                const usageNum = Number(t.usage) || 0;
                let usageLabel = 'Low';
                if (usageNum >= 1000) usageLabel = 'Very High';
                else if (usageNum >= 500) usageLabel = 'High';
                else if (usageNum >= 100) usageLabel = 'Medium';

                return {
                    id: t.tool_id || t.id,
                    name: getLocString(t.name),
                    description: getLocString(t.description),
                    status: t.status || 'active',
                    usage: usageLabel,
                    is_active: t.is_active !== false, // Default to true if undefined
                    version: t.version || '1.0',
                    avatar: t.preview_image_url || t.avatar || '',
                    tool_key: t.tool_key, // Keep original key for reference
                    sort_order: t.sort_order || 0
                };
            });
            setTools(mappedTools);
        } catch (error) {
            console.error("Failed to fetch tools", error);
            toast.error("Không thể tải danh sách công cụ");
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: string, currentMaintenanceState: boolean) => {
        const newMaintenanceState = !currentMaintenanceState;
        const newStatusLabel = newMaintenanceState ? 'maintenance' : 'active';

        // Optimistic update
        setTools(tools.map(t =>
            t.id === id ? { ...t, is_active: newMaintenanceState, status: newStatusLabel } : t
        ));

        // DB Update
        try {
            const success = await updateTool(id, {
                is_active: newMaintenanceState,
                status: newStatusLabel
            });

            if (success) {
                toast.success('Đã cập nhật trạng thái công cụ');
            } else {
                // Revert if failed
                fetchTools();
                toast.error('Cập nhật thất bại');
            }
        } catch (error) {
            fetchTools();
            toast.error('Lỗi kết nối');
        }
    };

    const handleEditClick = (tool: any) => {
        setCurrentTool({ ...tool });
        setEditAvatarFile(null);
        setOpenEdit(true);
    };

    const handleCreateClick = () => {
        setCurrentTool({
            name: '',
            description: '',
            version: '1.0',
            sort_order: 0,
            tool_key: '',
            is_active: true
        });
        setEditAvatarFile(null);
        setOpenEdit(true);
    };

    const handleCloseEdit = () => {
        setOpenEdit(false);
        setCurrentTool(null);
        setEditAvatarFile(null);
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileUpload(e, (base64: string) => {
            setEditAvatarFile(base64);
            // Show preview immediately
            setCurrentTool((prev: any) => ({ ...prev, avatar: base64 }));
        });
    };

    const handleSaveTool = async () => {
        if (!currentTool) return;

        setIsUploading(true);
        let finalAvatarUrl = currentTool.avatar;

        try {
            // Upload new avatar if selected
            if (editAvatarFile) {
                finalAvatarUrl = await uploadImageToCloud('admin-tools', editAvatarFile, 'tool-icons');
            }

            const updates = {
                name: currentTool.name,      // Send both to be safe or check schema
                description: currentTool.description,
                preview_image_url: finalAvatarUrl,
                sort_order: parseInt(currentTool.sort_order) || 0,
                version: currentTool.version,
                tool_key: currentTool.tool_key // Important for creation
            };

            let success = false;
            if (currentTool.id) {
                success = await updateTool(currentTool.id, updates);
            } else {
                success = await createTool(updates);
            }

            if (success) {
                toast.success(currentTool.id ? 'Đã cập nhật thông tin công cụ' : 'Đã tạo công cụ mới');
                // Reload tools to get fresh list
                fetchTools();
                handleCloseEdit();
            } else {
                toast.error('Lỗi khi lưu vào cơ sở dữ liệu');
            }
        } catch (error) {
            console.error("Save failed", error);
            toast.error('Lỗi hệ thống');
        } finally {
            setIsUploading(false);
        }
    };

    const filteredTools = tools.filter(tool =>
        (tool.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (tool.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    // Reset page when search changes
    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const paginatedTools = filteredTools.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    return (
        <Box sx={{ width: '100%', bgcolor: '#FFFFFF', borderRadius: 2, p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

            {/* Header */}
            <Box mb={4}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <Typography variant="body2" color="primary" sx={{ cursor: 'pointer', fontWeight: 500 }}>Admin</Typography>
                    <Typography variant="body2" color="text.secondary">/</Typography>
                    <Typography variant="body2" color="text.primary" fontWeight={500}>Công cụ AI</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" fontWeight={700} color="#111827">Quản lý Công cụ</Typography>
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
                        onClick={handleCreateClick}
                        sx={{ borderRadius: 2, height: 40, px: 3, textTransform: 'none', fontWeight: 600 }}
                    >
                        Thêm công cụ
                    </Button>
                    <TextField
                        placeholder="Tìm kiếm công cụ..."
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
                    <Button color="inherit" endIcon={<KeyboardArrowDown />} sx={{ textTransform: 'none', color: '#4B5563', fontWeight: 500 }}>Trạng thái</Button>
                    <Button color="inherit" endIcon={<KeyboardArrowDown />} sx={{ textTransform: 'none', color: '#4B5563', fontWeight: 500 }}>Mức độ sử dụng</Button>
                    <Button color="inherit" startIcon={<FilterListIcon />} sx={{ textTransform: 'none', color: '#4B5563', fontWeight: 600 }}>Bộ lọc khác</Button>
                </Stack>
            </Stack>

            {/* Table */}
            <TableContainer sx={{ boxShadow: 'none' }}>
                <Table sx={{ minWidth: 800 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox"><Checkbox /></TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Công cụ</TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem', width: '25%' }}>Mô tả</TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Phiên bản</TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Trạng thái</TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Mức sử dụng</TableCell>
                            <TableCell sx={{ color: '#6B7280', fontWeight: 600, border: 'none', fontSize: '0.875rem' }}>Kích hoạt</TableCell>
                            <TableCell sx={{ border: 'none' }}>Hành động</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedTools.map((tool) => (
                            <TableRow
                                key={tool.id}
                                sx={{
                                    '&:last-child td, &:last-child th': { border: 0 },
                                    '&:hover': { bgcolor: '#F9FAFB' }
                                }}
                            >
                                <TableCell padding="checkbox" sx={{ borderBottom: '1px solid #F3F4F6' }}><Checkbox /></TableCell>
                                <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar
                                            src={tool.avatar}
                                            variant="rounded"
                                            sx={{
                                                bgcolor: tool.is_active ? 'warning.light' : 'primary.light',
                                                color: tool.is_active ? 'warning.main' : 'primary.main',
                                                width: 40, height: 40
                                            }}
                                        >
                                            {!tool.avatar && (tool.name.charAt(0))}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600} color="#111827">{tool.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">ID: {tool.id}</Typography>
                                        </Box>
                                    </Stack>
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                    <Typography variant="body2" color="#4B5563" sx={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {tool.description}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                    <Typography variant="body2" color="#374151" fontWeight={500}>v{tool.version}</Typography>
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                    <Chip
                                        label={tool.status === 'active' ? 'Hoạt động' : tool.status === 'is_active' ? 'Bảo trì' : 'Beta'}
                                        size="small"
                                        sx={{
                                            fontWeight: 600,
                                            bgcolor: tool.status === 'active' ? '#DEF7EC' : tool.status === 'is_active' ? '#FDF6B2' : '#E1EFFE',
                                            color: tool.status === 'active' ? '#03543F' : tool.status === 'is_active' ? '#723B13' : '#1E429F',
                                            borderRadius: 1
                                        }}
                                    />
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                    <Typography variant="body2" fontWeight={600} color={
                                        tool.usage === 'Very High' ? '#DC2626' : tool.usage === 'High' ? '#EA580C' : '#374151'
                                    }>
                                        {tool.usage === 'Very High' ? 'Rất cao' : tool.usage === 'High' ? 'Cao' : tool.usage === 'Medium' ? 'Trung bình' : 'Thấp'}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                    <Switch
                                        checked={!tool.is_active}
                                        onChange={() => toggleStatus(tool.id, tool.is_active)}
                                        color="success"
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 2 }}>
                                    <Stack direction="row" spacing={1}>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            disableElevation
                                            onClick={() => handleEditClick(tool)}
                                            sx={{ minWidth: 32, px: 1, bgcolor: '#EFF6FF', color: '#1D4ED8', '&:hover': { bgcolor: '#DBEAFE' } }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </Button>
                                        <IconButton size="small" sx={{ color: '#6B7280' }} title="Logs">
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" sx={{ color: '#EF4444' }} title="Báo lỗi">
                                            <BugReportIcon fontSize="small" />
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
                    Hiển thị {paginatedTools.length} trên tổng số {filteredTools.length} kết quả
                </Typography>
                <Pagination
                    count={Math.ceil(filteredTools.length / rowsPerPage)}
                    page={page}
                    onChange={(e, value) => setPage(value)}
                    color="secondary"
                    shape="rounded"
                    sx={{
                        '& .MuiPaginationItem-root': { color: '#333 !important', fontWeight: 500 },
                        '& .Mui-selected': { color: '#FFFFFF !important', fontWeight: 700 }
                    }}
                />
            </Stack>

            {/* Edit Dialog */}
            <Dialog open={openEdit} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Chỉnh sửa công cụ</DialogTitle>
                <DialogContent>
                    {currentTool && (
                        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box display="flex" flexDirection="column" alignItems="center" mb={2} gap={2}>
                                <Avatar
                                    src={currentTool.avatar}
                                    variant="rounded"
                                    sx={{ width: 80, height: 80, bgcolor: 'primary.light', color: 'primary.main', fontSize: '2rem' }}
                                >
                                    {!currentTool.avatar && currentTool.name.charAt(0)}
                                </Avatar>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<CloudUploadIcon />}
                                    size="small"
                                >
                                    Tải ảnh lên
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                    />
                                </Button>
                            </Box>

                            <TextField
                                label="Tên công cụ"
                                fullWidth
                                value={currentTool.name}
                                onChange={(e) => setCurrentTool({ ...currentTool, name: e.target.value })}
                            />

                            <TextField
                                label="Mô tả ngắn"
                                fullWidth
                                multiline
                                rows={3}
                                value={currentTool.description}
                                onChange={(e) => setCurrentTool({ ...currentTool, description: e.target.value })}
                            />

                            <TextField
                                label="Thứ tự hiển thị (Sort Order)"
                                fullWidth
                                type="number"
                                value={currentTool.sort_order}
                                onChange={(e) => setCurrentTool({ ...currentTool, sort_order: e.target.value })}
                                helperText="Nhập 1, 2, 3... để đưa lên đầu (1 là cao nhất). Nhập 0 để xếp xuống cuối cùng."
                            />

                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Phiên bản"
                                    fullWidth
                                    value={currentTool.version}
                                    onChange={(e) => setCurrentTool({ ...currentTool, version: e.target.value })}
                                />
                                <TextField
                                    label="ID (Read-only)"
                                    fullWidth
                                    value={currentTool.id}
                                    disabled
                                    InputProps={{ readOnly: true }}
                                />
                            </Stack>

                            <TextField
                                label="Tool Key (Mã định danh)"
                                fullWidth
                                value={currentTool.tool_key || ''}
                                onChange={(e) => setCurrentTool({ ...currentTool, tool_key: e.target.value })}
                                disabled={!!currentTool.id} // Only editable on creation
                                helperText="Mã duy nhất dùng để gọi API (vd: text-to-image)"
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCloseEdit} color="inherit" disabled={isUploading}>Hủy</Button>
                    <Button
                        onClick={handleSaveTool}
                        variant="contained"
                        color="primary"
                        disabled={isUploading}
                        startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {isUploading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
