
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppControls } from './uiUtils';
import { DocumentTextIcon, DownloadIcon } from './icons';
import { getAllPrompts, getAllCategories } from '../services/storageService';

interface Prompt {
    id: string;
    category_ids: string[]; // Changed from single category string
    text: string;
    imageUrl: string;
    tags?: string[];
}

interface PromptLibraryProps {
    onClose: () => void;
}

const ITEMS_PER_PAGE = 20;

export const PromptLibrary: React.FC<PromptLibraryProps> = ({ onClose }) => {
    const { t, language } = useAppControls();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState('all');

    // Initialize page from URL or default to 1
    const initialPage = searchParams ? Number(searchParams.get('page')) : 1;
    const [currentPage, setCurrentPage] = useState(initialPage > 0 ? initialPage : 1);

    // Update URL when page changes
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        const params = new URLSearchParams(searchParams as any);
        params.set('page', newPage.toString());
        router.push(`${pathname}?${params.toString()}`);

        // Scroll to top of grid
        const grid = document.querySelector('.prompt-library-container');
        if (grid) grid.scrollTop = 0;
    };
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrompts = async () => {
            setLoading(true);
            try {
                const [dbPrompts, dbCategories] = await Promise.all([
                    getAllPrompts(),
                    getAllCategories()
                ]);

                if (Array.isArray(dbCategories)) {
                    setCategories(dbCategories);
                }

                if (Array.isArray(dbPrompts)) {
                    const mappedPrompts = dbPrompts.map((p: any) => ({
                        id: p.id,
                        category_ids: p.category_ids || [], // Map category_ids
                        text: p.content,
                        imageUrl: p.avt_url || 'https://via.placeholder.com/300x400',
                        tags: []
                    }));
                    setPrompts(mappedPrompts);
                }
            } catch (error) {
                console.error("Failed to load prompts", error);
            } finally {
                setLoading(false);
            }
        }
        fetchPrompts();
    }, []);

    // Filter prompts by category
    const filteredPrompts = useMemo(() => {
        if (activeCategory === 'all') return prompts;
        return prompts.filter(p => p.category_ids && p.category_ids.includes(activeCategory));
    }, [activeCategory, prompts]);

    // Pagination
    const totalPages = Math.ceil(filteredPrompts.length / ITEMS_PER_PAGE);
    const paginatedPrompts = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredPrompts.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredPrompts, currentPage]);

    const handleCopyPrompt = async (prompt: Prompt) => {
        try {
            await navigator.clipboard.writeText(prompt.text);
            setCopiedId(prompt.id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleCategoryChange = (categoryId: string) => {
        setActiveCategory(categoryId);
        handlePageChange(1); // Reset to first page
    };

    return (
        <div className="w-full h-full flex flex-col themed-bg">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-white/10">
                <div className="flex justify-center items-center pt-10">
                    <h2 className="text-4xl font-bold  text-orange-600 text-center ">{t('promptLibrary_title')}</h2>

                </div>
                <p className="themed-text-secondary text-center pt-2 mb-4">{t('promptLibrary_subtitle')}</p>

                {/* Categories */}
                <div className="flex justify-center gap-2 mb-6 flex-wrap px-4 pt-10">
                    <button
                        onClick={() => handleCategoryChange('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === 'all'
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                            : 'themed-bg-elevated themed-text hover:bg-white/10'
                            }`}
                    >
                        {t('Tất cả')}
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat.id
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                : 'themed-bg-elevated themed-text hover:bg-white/10'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Prompt Grid */}
            <div className="flex-1 overflow-y-auto p-6 prompt-library-container">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 prompt-library-grid">
                            <AnimatePresence mode="wait">
                                {paginatedPrompts.map((prompt, index) => (
                                    <motion.div
                                        key={prompt.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="themed-card rounded-lg overflow-hidden group cursor-pointer"
                                    >
                                        {/* Image */}
                                        <div className="relative aspect-[9/16] overflow-hidden bg-gray-800">
                                            <img
                                                src={prompt.imageUrl}
                                                alt={prompt.text}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                                    <p className="text-white text-xs line-clamp-3">{prompt.text}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Copy Button */}
                                        <button
                                            onClick={() => handleCopyPrompt(prompt)}
                                            className="w-full py-2.5 flex items-center justify-center gap-2 transition-colors"
                                            style={{
                                                backgroundColor: copiedId === prompt.id ? 'var(--accent-primary)' : 'rgba(249, 115, 22, 0.1)',
                                                color: copiedId === prompt.id ? '#000' : 'var(--accent-primary)'
                                            }}
                                        >
                                            {copiedId === prompt.id ? (
                                                <>
                                                    <DownloadIcon className="w-4 h-4" />
                                                    <span className="text-sm font-medium">{t('promptLibrary_copied')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <DocumentTextIcon className="w-4 h-4" />
                                                    <span className="text-sm font-medium">{t('promptLibrary_copy')}</span>
                                                </>
                                            )}
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Empty State */}
                        {filteredPrompts.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 themed-text-tertiary">
                                <p className="text-lg">{t('promptLibrary_empty')}</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex-shrink-0 p-6 border-t border-white/10">
                    <div className="flex justify-center items-center gap-2">
                        <button
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="btn btn-secondary btn-sm"
                        >
                            {language === 'vi' ? 'Trước' : 'Previous'}
                        </button>

                        <div className="flex gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all font-medium text-sm ${currentPage === page
                                        ? 'text-white shadow-lg'
                                        : 'themed-text-secondary hover:themed-text hover:bg-white/5'
                                        }`}
                                    style={currentPage === page ? {
                                        backgroundColor: '#ff6b35',
                                    } : {}}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="btn btn-secondary btn-sm"
                        >
                            {language === 'vi' ? 'Sau' : 'Next'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

