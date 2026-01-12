"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    IconButton,
    CircularProgress,
    Alert,
    Divider
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Save as SaveIcon,
    Publish as PublishIcon,
    Delete as DeleteIcon,
    Image as ImageIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

interface Category {
    id: number;
    name: string;
}

interface Tag {
    id: number;
    name: string;
}

// Dynamic import for React Quill (avoid SSR issues)
const ReactQuill = dynamic(() => import('react-quill-new'), {
    ssr: false,
    loading: () => <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd', borderRadius: 1 }}><CircularProgress size={24} /></Box>
});

export default function BlogEditorPage() {
    const router = useRouter();
    const params = useParams();
    const postId = params?.id as string;
    const isNew = postId === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);

    // Form data
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [featuredImage, setFeaturedImage] = useState('');
    const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [metaTitle, setMetaTitle] = useState('');
    const [metaDescription, setMetaDescription] = useState('');

    // Reference data
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);

    // Fetch categories and tags
    useEffect(() => {
        const fetchReferenceData = async () => {
            try {
                const [catRes, tagRes] = await Promise.all([
                    fetch('/api/admin/blog/categories'),
                    fetch('/api/admin/blog/tags')
                ]);
                const [catData, tagData] = await Promise.all([catRes.json(), tagRes.json()]);

                if (catData.success) setCategories(catData.data);
                if (tagData.success) setTags(tagData.data);
            } catch (error) {
                console.error('Failed to fetch reference data:', error);
            }
        };

        fetchReferenceData();
    }, []);

    // Fetch existing post if editing
    useEffect(() => {
        const fetchPost = async () => {
            if (isNew) return;

            try {
                const res = await fetch(`/api/admin/blog/posts`);
                const data = await res.json();

                if (data.success) {
                    const post = data.data.find((p: any) => p.id === parseInt(postId));
                    if (post) {
                        setTitle(post.title || '');
                        setContent(post.content || '');
                        setExcerpt(post.excerpt || '');
                        setFeaturedImage(post.featured_image || '');
                        setStatus(post.status || 'draft');
                        setCategoryId(post.category_id || '');
                        setMetaTitle(post.meta_title || '');
                        setMetaDescription(post.meta_description || '');
                    } else {
                        toast.error('Không tìm thấy bài viết');
                        router.push('/admin/blog');
                    }
                }
            } catch (error) {
                console.error('Failed to fetch post:', error);
                toast.error('Lỗi khi tải bài viết');
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [postId, isNew, router]);

    const handleSave = async (publishNow = false) => {
        if (!title.trim()) {
            toast.error('Vui lòng nhập tiêu đề');
            return;
        }

        setSaving(true);

        try {
            const method = isNew ? 'POST' : 'PUT';
            const body = {
                ...(isNew ? {} : { id: parseInt(postId) }),
                title: title.trim(),
                content,
                excerpt: excerpt || content.substring(0, 200),
                featured_image: featuredImage || null,
                status: publishNow ? 'published' : status,
                category_id: categoryId || null,
                tags: selectedTags,
                meta_title: metaTitle || title,
                meta_description: metaDescription || excerpt || content.substring(0, 160)
            };

            const res = await fetch('/api/admin/blog/posts', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (data.success) {
                toast.success(isNew ? 'Đã tạo bài viết' : 'Đã cập nhật bài viết');
                if (isNew) {
                    router.push(`/admin/blog/${data.data.id}`);
                }
            } else {
                toast.error(data.error || 'Không thể lưu bài viết');
            }
        } catch (error) {
            console.error('Failed to save:', error);
            toast.error('Lỗi khi lưu bài viết');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Bạn có chắc muốn xóa bài viết này? Hành động này không thể hoàn tác.')) return;

        try {
            const res = await fetch(`/api/admin/blog/posts?id=${postId}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                toast.success('Đã xóa bài viết');
                router.push('/admin/blog');
            } else {
                toast.error(data.error || 'Không thể xóa bài viết');
            }
        } catch (error) {
            toast.error('Lỗi khi xóa bài viết');
        }
    };

    const handleTagToggle = (tagId: number) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => router.push('/admin/blog')}>
                        <BackIcon />
                    </IconButton>
                    <Typography variant="h5" fontWeight={700}>
                        {isNew ? 'Viết bài mới' : 'Chỉnh sửa bài viết'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {!isNew && (
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={handleDelete}
                        >
                            Xóa
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        startIcon={<SaveIcon />}
                        onClick={() => handleSave(false)}
                        disabled={saving}
                    >
                        Lưu nháp
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<PublishIcon />}
                        onClick={() => handleSave(true)}
                        disabled={saving}
                    >
                        {saving ? 'Đang lưu...' : 'Xuất bản'}
                    </Button>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
                {/* Main Content */}
                <Box sx={{ flex: 2 }}>
                    <Paper sx={{ p: 3 }}>
                        <TextField
                            fullWidth
                            label="Tiêu đề"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            margin="normal"
                            variant="outlined"
                            InputProps={{ sx: { fontSize: '1.25rem', fontWeight: 600 } }}
                        />

                        <TextField
                            fullWidth
                            label="Mô tả ngắn (Excerpt)"
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            margin="normal"
                            multiline
                            rows={2}
                            helperText="Hiển thị trong danh sách bài viết"
                        />

                        <Divider sx={{ my: 3 }} />

                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Nội dung bài viết
                        </Typography>
                        <Box sx={{
                            '.ql-container': { minHeight: 350, fontSize: '1rem' },
                            '.ql-editor': { minHeight: 350 },
                            '.ql-toolbar': { borderRadius: '8px 8px 0 0', bgcolor: '#f5f5f5' },
                            '.ql-container.ql-snow': { borderRadius: '0 0 8px 8px' }
                        }}>
                            <ReactQuill
                                theme="snow"
                                value={content}
                                onChange={setContent}
                                placeholder="Nhập nội dung bài viết tại đây..."
                                modules={{
                                    toolbar: [
                                        [{ 'header': [1, 2, 3, false] }],
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'color': [] }, { 'background': [] }],
                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                        [{ 'align': [] }],
                                        ['link', 'image', 'video'],
                                        ['blockquote', 'code-block'],
                                        ['clean']
                                    ]
                                }}
                            />
                        </Box>
                    </Paper>
                </Box>

                {/* Sidebar */}
                <Box sx={{ flex: 1, minWidth: 300 }}>
                    {/* Status & Category */}
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Thông tin bài viết
                        </Typography>

                        <FormControl fullWidth margin="normal" size="small">
                            <InputLabel>Trạng thái</InputLabel>
                            <Select
                                value={status}
                                label="Trạng thái"
                                onChange={(e) => setStatus(e.target.value as any)}
                            >
                                <MenuItem value="draft">Bản nháp</MenuItem>
                                <MenuItem value="published">Đã xuất bản</MenuItem>
                                <MenuItem value="archived">Lưu trữ</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth margin="normal" size="small">
                            <InputLabel>Danh mục</InputLabel>
                            <Select
                                value={categoryId}
                                label="Danh mục"
                                onChange={(e) => setCategoryId(e.target.value as number)}
                            >
                                <MenuItem value="">Không chọn</MenuItem>
                                {categories.map((cat) => (
                                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Paper>

                    {/* Tags */}
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Tags
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {tags.map((tag) => (
                                <Chip
                                    key={tag.id}
                                    label={tag.name}
                                    onClick={() => handleTagToggle(tag.id)}
                                    variant={selectedTags.includes(tag.id) ? 'filled' : 'outlined'}
                                    color={selectedTags.includes(tag.id) ? 'primary' : 'default'}
                                    size="small"
                                />
                            ))}
                        </Box>
                    </Paper>

                    {/* Featured Image */}
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Ảnh đại diện
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="URL ảnh đại diện"
                            value={featuredImage}
                            onChange={(e) => setFeaturedImage(e.target.value)}
                        />
                        {featuredImage && (
                            <Box sx={{ mt: 1 }}>
                                <img
                                    src={featuredImage}
                                    alt="Preview"
                                    style={{ width: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'cover' }}
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                            </Box>
                        )}
                    </Paper>

                    {/* SEO */}
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            SEO
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            label="Meta Title"
                            value={metaTitle}
                            onChange={(e) => setMetaTitle(e.target.value)}
                            margin="dense"
                            helperText={`${metaTitle.length}/60 ký tự`}
                        />
                        <TextField
                            fullWidth
                            size="small"
                            label="Meta Description"
                            value={metaDescription}
                            onChange={(e) => setMetaDescription(e.target.value)}
                            margin="dense"
                            multiline
                            rows={2}
                            helperText={`${metaDescription.length}/160 ký tự`}
                        />
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}
