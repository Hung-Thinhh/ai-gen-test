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
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { getAllSystemConfigs, createSystemConfig, updateSystemConfig, deleteSystemConfig } from '../../services/storageService';
import { toast } from 'react-hot-toast';

export default function SystemConfigManagement() {
    const [configs, setConfigs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openEdit, setOpenEdit] = useState(false);
    const [currentConfig, setCurrentConfig] = useState<any>(null);

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const data = await getAllSystemConfigs();
            setConfigs(data);
        } catch (error) {
            console.error("Failed to fetch system configs", error);
            toast.error("Không thể tải danh sách cấu hình");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEdit = (config?: any) => {
        if (config) {
            setCurrentConfig(config);
        } else {
            setCurrentConfig({
                config_key: '',
                config_value: '',
                value_type: 'string',
                description: '',
                is_public: false
            });
        }
        setOpenEdit(true);
    };

    const handleCloseEdit = () => {
        setOpenEdit(false);
        setCurrentConfig(null);
    };

    const validateConfigValue = (value: string, type: string): boolean => {
        if (type === 'integer') {
            return !isNaN(Number(value)) && Number.isInteger(Number(value));
        }
        if (type === 'boolean') {
            return value.toLowerCase() === 'true' || value.toLowerCase() === 'false';
        }
        return true; // string type accepts anything
    };

    const handleSaveConfig = async () => {
        if (!currentConfig.config_key || !currentConfig.config_value) {
            toast.error("Vui lòng nhập Key và Value");
            return;
        }

        // Validate value based on type
        if (!validateConfigValue(currentConfig.config_value, currentConfig.value_type)) {
            if (currentConfig.value_type === 'integer') {
                toast.error("Value phải là số nguyên");
            } else if (currentConfig.value_type === 'boolean') {
                toast.error("Value phải là 'true' hoặc 'false'");
            }
            return;
        }

        try {
            const payload = {
                config_key: currentConfig.config_key,
                config_value: currentConfig.config_value,
                value_type: currentConfig.value_type,
                description: currentConfig.description || '',
                is_public: currentConfig.is_public
            };

            let success = false;
            const isEditing = configs.some(c => c.config_key === currentConfig.config_key);

            if (isEditing) {
                // Update existing (exclude config_key from updates)
                const updates = {
                    config_value: payload.config_value,
                    value_type: payload.value_type,
                    description: payload.description,
                    is_public: payload.is_public
                };
                success = await updateSystemConfig(currentConfig.config_key, updates);
            } else {
                success = await createSystemConfig(payload);
            }

            if (success) {
                toast.success(isEditing ? "Đã cập nhật!" : "Đã tạo mới!");
                handleCloseEdit();
                fetchConfigs();
            } else {
                toast.error("Có lỗi xảy ra khi lưu");
            }
        } catch (error) {
            console.error(error);
            toast.error("Lỗi hệ thống");
        }
    };

    const handleDeleteConfig = async (configKey: string) => {
        if (window.confirm(`Bạn có chắc muốn xóa config "${configKey}"?`)) {
            try {
                const success = await deleteSystemConfig(configKey);
                if (success) {
                    toast.success("Đã xóa!");
                    fetchConfigs();
                } else {
                    toast.error("Không thể xóa");
                }
            } catch (error) {
                console.error(error);
                toast.error("Lỗi hệ thống");
            }
        }
    };

    const getTypeBadgeColor = (type: string) => {
        switch (type) {
            case 'integer': return 'primary';
            case 'boolean': return 'success';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">Quản lý Cấu hình Hệ thống</Typography>
                <Stack direction="row" spacing={2}>
                    <Button
                        startIcon={<RefreshIcon />}
                        variant="outlined"
                        onClick={fetchConfigs}
                    >
                        Làm mới
                    </Button>
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
                            <TableCell>Key</TableCell>
                            <TableCell>Value</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Visibility</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    <CircularProgress size={24} />
                                </TableCell>
                            </TableRow>
                        ) : configs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    Chưa có dữ liệu
                                </TableCell>
                            </TableRow>
                        ) : (
                            configs.map((config) => (
                                <TableRow key={config.config_key} hover>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight="bold">{config.config_key}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{config.config_value}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={config.value_type.toUpperCase()}
                                            size="small"
                                            color={getTypeBadgeColor(config.value_type) as any}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                                            {config.description || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={config.is_public ? 'Public' : 'Private'}
                                            size="small"
                                            color={config.is_public ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <IconButton size="small" onClick={() => handleOpenEdit(config)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDeleteConfig(config.config_key)}>
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
            <Dialog open={openEdit} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {currentConfig?.config_key && configs.some(c => c.config_key === currentConfig.config_key)
                        ? 'Chỉnh sửa Cấu hình'
                        : 'Thêm Cấu hình mới'}
                </DialogTitle>
                <DialogContent dividers>
                    {currentConfig && (
                        <Stack spacing={3} sx={{ pt: 1 }}>
                            <TextField
                                label="Config Key"
                                fullWidth
                                value={currentConfig.config_key}
                                onChange={(e) => setCurrentConfig({ ...currentConfig, config_key: e.target.value })}
                                disabled={configs.some(c => c.config_key === currentConfig.config_key)}
                                helperText={configs.some(c => c.config_key === currentConfig.config_key) ? "Key không thể thay đổi" : ""}
                            />

                            <FormControl fullWidth>
                                <InputLabel>Value Type</InputLabel>
                                <Select
                                    value={currentConfig.value_type}
                                    label="Value Type"
                                    onChange={(e) => setCurrentConfig({ ...currentConfig, value_type: e.target.value })}
                                >
                                    <MenuItem value="string">String</MenuItem>
                                    <MenuItem value="integer">Integer</MenuItem>
                                    <MenuItem value="boolean">Boolean</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                label="Config Value"
                                fullWidth
                                value={currentConfig.config_value}
                                onChange={(e) => setCurrentConfig({ ...currentConfig, config_value: e.target.value })}
                                helperText={
                                    currentConfig.value_type === 'integer' ? "Nhập số nguyên" :
                                        currentConfig.value_type === 'boolean' ? "Nhập 'true' hoặc 'false'" :
                                            "Nhập giá trị"
                                }
                            />

                            <TextField
                                label="Mô tả (tùy chọn)"
                                fullWidth
                                multiline
                                rows={2}
                                value={currentConfig.description}
                                onChange={(e) => setCurrentConfig({ ...currentConfig, description: e.target.value })}
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={currentConfig.is_public}
                                        onChange={(e) => setCurrentConfig({ ...currentConfig, is_public: e.target.checked })}
                                    />
                                }
                                label="Public (Hiển thị công khai)"
                            />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEdit} color="inherit">Hủy</Button>
                    <Button onClick={handleSaveConfig} variant="contained">
                        {currentConfig?.config_key && configs.some(c => c.config_key === currentConfig.config_key)
                            ? 'Cập nhật'
                            : 'Tạo mới'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
