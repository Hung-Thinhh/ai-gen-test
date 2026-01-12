"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    CircularProgress,
    Tabs,
    Tab,
    Tooltip,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

interface BlogPost {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    status: 'draft' | 'published' | 'archived';
    category_id: number;
    category_name: string;
    author_name: string;
    view_count: number;
    created_at: string;
    published_at: string | null;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string;
    post_count: number;
}

interface Tag {
    id: number;
    name: string;
    slug: string;
    post_count: number;
}

export default function BlogManagement() {
    const [activeTab, setActiveTab] = useState(0);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Dialog states
    const [categoryDialog, setCategoryDialog] = useState(false);
    const [tagDialog, setTagDialog] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDesc, setNewCategoryDesc] = useState('');
    const [newTagName, setNewTagName] = useState('');

    // Fetch data
    const fetchPosts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (search) params.append('search', search);

            const res = await fetch(`/api/admin/blog/posts?${params}`);
            const data = await res.json();
            if (data.success) {
                setPosts(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error);
            toast.error('Không thể tải danh sách bài viết');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/admin/blog/categories');
            const data = await res.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchTags = async () => {
        try {
            const res = await fetch('/api/admin/blog/tags');
            const data = await res.json();
            if (data.success) {
                setTags(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch tags:', error);
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchCategories();
        fetchTags();
    }, [statusFilter]);

    // Handlers
    const handleDeletePost = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;

        try {
            const res = await fetch(`/api/admin/blog/posts?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast.success('Đã xóa bài viết');
                fetchPosts();
            } else {
                toast.error(data.error || 'Không thể xóa bài viết');
            }
        } catch (error) {
            toast.error('Lỗi khi xóa bài viết');
        }
    };

    const handleSaveCategory = async () => {
        if (!newCategoryName.trim()) {
            toast.error('Vui lòng nhập tên danh mục');
            return;
        }

        try {
            const method = editingCategory ? 'PUT' : 'POST';
            const body = editingCategory
                ? { id: editingCategory.id, name: newCategoryName, description: newCategoryDesc }
                : { name: newCategoryName, description: newCategoryDesc };

            const res = await fetch('/api/admin/blog/categories', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (data.success) {
                toast.success(editingCategory ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục');
                setCategoryDialog(false);
                setNewCategoryName('');
                setNewCategoryDesc('');
                setEditingCategory(null);
                fetchCategories();
            } else {
                toast.error(data.error || 'Không thể lưu danh mục');
            }
        } catch (error) {
            toast.error('Lỗi khi lưu danh mục');
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('Xóa danh mục sẽ bỏ liên kết với tất cả bài viết. Tiếp tục?')) return;

        try {
            const res = await fetch(`/api/admin/blog/categories?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast.success('Đã xóa danh mục');
                fetchCategories();
            } else {
                toast.error(data.error || 'Không thể xóa danh mục');
            }
        } catch (error) {
            toast.error('Lỗi khi xóa danh mục');
        }
    };

    const handleSaveTag = async () => {
        if (!newTagName.trim()) {
            toast.error('Vui lòng nhập tên tag');
            return;
        }

        try {
            const res = await fetch('/api/admin/blog/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTagName })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Đã tạo tag');
                setTagDialog(false);
                setNewTagName('');
                fetchTags();
            } else {
                toast.error(data.error || 'Không thể tạo tag');
            }
        } catch (error) {
            toast.error('Lỗi khi tạo tag');
        }
    };

    const handleDeleteTag = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xóa tag này?')) return;

        try {
            const res = await fetch(`/api/admin/blog/tags?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast.success('Đã xóa tag');
                fetchTags();
            } else {
                toast.error(data.error || 'Không thể xóa tag');
            }
        } catch (error) {
            toast.error('Lỗi khi xóa tag');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'success';
            case 'draft': return 'warning';
            case 'archived': return 'default';
            default: return 'default';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'published': return 'Đã xuất bản';
            case 'draft': return 'Bản nháp';
            case 'archived': return 'Đã lưu trữ';
            default: return status;
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>
                    Quản lý Blog
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    href="/admin/blog/new"
                    sx={{ bgcolor: 'primary.main' }}
                >
                    Viết bài mới
                </Button>
            </Box>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                    <Tab label={`Bài viết (${posts.length})`} />
                    <Tab label={`Danh mục (${categories.length})`} />
                    <Tab label={`Tags (${tags.length})`} />
                </Tabs>
            </Paper>

            {/* Tab 0: Posts */}
            {activeTab === 0 && (
                <Paper sx={{ p: 2 }}>
                    {/* Filters */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <TextField
                            size="small"
                            placeholder="Tìm kiếm..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchPosts()}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                            }}
                            sx={{ minWidth: 250 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Trạng thái</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Trạng thái"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="">Tất cả</MenuItem>
                                <MenuItem value="published">Đã xuất bản</MenuItem>
                                <MenuItem value="draft">Bản nháp</MenuItem>
                                <MenuItem value="archived">Đã lưu trữ</MenuItem>
                            </Select>
                        </FormControl>
                        <IconButton onClick={fetchPosts}>
                            <RefreshIcon />
                        </IconButton>
                    </Box>

                    {/* Table */}
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : posts.length === 0 ? (
                        <Alert severity="info">Chưa có bài viết nào. Hãy tạo bài viết đầu tiên!</Alert>
                    ) : (
                        <>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Tiêu đề</TableCell>
                                            <TableCell>Danh mục</TableCell>
                                            <TableCell>Trạng thái</TableCell>
                                            <TableCell>Lượt xem</TableCell>
                                            <TableCell>Ngày tạo</TableCell>
                                            <TableCell align="right">Thao tác</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {posts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((post) => (
                                            <TableRow key={post.id} hover>
                                                <TableCell>
                                                    <Typography fontWeight={600} noWrap sx={{ maxWidth: 300 }}>
                                                        {post.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        /{post.slug}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{post.category_name || '-'}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={getStatusLabel(post.status)}
                                                        color={getStatusColor(post.status) as any}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>{post.view_count}</TableCell>
                                                <TableCell>
                                                    {new Date(post.created_at).toLocaleDateString('vi-VN')}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="Xem trước">
                                                        <IconButton
                                                            size="small"
                                                            href={`/blog/${post.slug}`}
                                                            target="_blank"
                                                        >
                                                            <ViewIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Sửa">
                                                        <IconButton
                                                            size="small"
                                                            href={`/admin/blog/${post.id}`}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Xóa">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeletePost(post.id)}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                component="div"
                                count={posts.length}
                                page={page}
                                onPageChange={(_, p) => setPage(p)}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={(e) => {
                                    setRowsPerPage(parseInt(e.target.value, 10));
                                    setPage(0);
                                }}
                                labelRowsPerPage="Số dòng"
                            />
                        </>
                    )}
                </Paper>
            )}

            {/* Tab 1: Categories */}
            {activeTab === 1 && (
                <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                setEditingCategory(null);
                                setNewCategoryName('');
                                setNewCategoryDesc('');
                                setCategoryDialog(true);
                            }}
                        >
                            Thêm danh mục
                        </Button>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Tên</TableCell>
                                    <TableCell>Slug</TableCell>
                                    <TableCell>Mô tả</TableCell>
                                    <TableCell>Số bài viết</TableCell>
                                    <TableCell align="right">Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {categories.map((cat) => (
                                    <TableRow key={cat.id} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{cat.name}</TableCell>
                                        <TableCell>{cat.slug}</TableCell>
                                        <TableCell>{cat.description || '-'}</TableCell>
                                        <TableCell>{cat.post_count}</TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setEditingCategory(cat);
                                                    setNewCategoryName(cat.name);
                                                    setNewCategoryDesc(cat.description || '');
                                                    setCategoryDialog(true);
                                                }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteCategory(cat.id)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Tab 2: Tags */}
            {activeTab === 2 && (
                <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                setNewTagName('');
                                setTagDialog(true);
                            }}
                        >
                            Thêm tag
                        </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {tags.map((tag) => (
                            <Chip
                                key={tag.id}
                                label={`${tag.name} (${tag.post_count})`}
                                onDelete={() => handleDeleteTag(tag.id)}
                                variant="outlined"
                            />
                        ))}
                        {tags.length === 0 && (
                            <Typography color="text.secondary">Chưa có tag nào</Typography>
                        )}
                    </Box>
                </Paper>
            )}

            {/* Category Dialog */}
            <Dialog open={categoryDialog} onClose={() => setCategoryDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục'}</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Tên danh mục"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Mô tả"
                        value={newCategoryDesc}
                        onChange={(e) => setNewCategoryDesc(e.target.value)}
                        margin="normal"
                        multiline
                        rows={2}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCategoryDialog(false)}>Hủy</Button>
                    <Button variant="contained" onClick={handleSaveCategory}>
                        {editingCategory ? 'Cập nhật' : 'Tạo'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Tag Dialog */}
            <Dialog open={tagDialog} onClose={() => setTagDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Thêm tag</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Tên tag"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTagDialog(false)}>Hủy</Button>
                    <Button variant="contained" onClick={handleSaveTag}>Tạo</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
