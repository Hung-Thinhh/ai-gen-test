
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

    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerTarget = React.useRef<HTMLDivElement>(null);

    // Reset visible count when category changes
    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
        const grid = document.querySelector('.prompt-library-container');
        if (grid) grid.scrollTop = 0;
    }, [activeCategory]);

    // Derived state for visible prompts
    const visiblePrompts = useMemo(() => {
        return filteredPrompts.slice(0, visibleCount);
    }, [filteredPrompts, visibleCount]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && visibleCount < filteredPrompts.length) {
                    setIsLoadingMore(true);
                    setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredPrompts.length));

                    // Keep loading indicator for 1.5s to let images load
                    setTimeout(() => {
                        setIsLoadingMore(false);
                    }, 1500);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [observerTarget, visibleCount, filteredPrompts.length]);

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
    };

    const handleUsePrompt = (prompt: Prompt) => {
        // Store prompt in sessionStorage
        sessionStorage.setItem('selectedPrompt', prompt.text);

        // Close the library
        onClose();

        // Navigate using router with hash
        router.push('/tool/free-generation');
    };

    return (
        <div className="w-full h-full flex flex-col themed-bg max-w-[1300px] mx-auto">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-white/10">
                <div className="flex justify-center items-center pt-10">
                    <h2 className="text-4xl font-bold  text-orange-600 text-center ">{t('promptLibrary_title')}</h2>
                </div>
                <p className="themed-text-secondary text-center pt-2 mb-4">{t('promptLibrary_subtitle')}</p>

                {/* Categories */}
                <div className="flex gap-2 mb-6 px-4 pt-10 pb-4 custom-scrollbar-orange transition-all">
                    <button
                        onClick={() => handleCategoryChange('all')}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeCategory === 'all'
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
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeCategory === cat.id
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                : 'themed-bg-elevated themed-text hover:bg-white/10'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}

                    {/* Scroll Indicator Icon */}
                    <div className="flex-shrink-0 flex items-center justify-center px-2 text-orange-500/50 animate-pulse">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </div>
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
                                {visiblePrompts.map((prompt, index) => (
                                    <motion.div
                                        key={prompt.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="themed-card rounded-lg overflow-hidden group cursor-pointer"
                                    >
                                        {/* Image */}
                                        <div className="relative aspect-[9/16] overflow-hidden bg-gray-800">
                                            {/* Skeleton Loader */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 animate-pulse" />

                                            <img
                                                src={prompt.imageUrl}
                                                alt={prompt.text}
                                                loading="lazy"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 relative z-10"
                                                onLoad={(e) => {
                                                    // Hide skeleton when image loads
                                                    const skeleton = e.currentTarget.previousElementSibling as HTMLElement;
                                                    if (skeleton) skeleton.style.display = 'none';
                                                }}
                                            />

                                            {/* Copy Button - Top Right */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopyPrompt(prompt);
                                                }}
                                                className="absolute cursor-pointer top-2 right-2 z-20 p-2 bg-black/60 hover:bg-orange-500/90 backdrop-blur-sm rounded-lg transition-all duration-200 group/copy"
                                                title="Copy prompt"
                                            >
                                                {copiedId === prompt.id ? (
                                                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                )}
                                            </button>

                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                                    <p className="text-white text-xs line-clamp-3">{prompt.text}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons - Vertical Stack */}
                                        <div className="flex flex-col gap-1.5 p-2">
                                            {/* Use Now Button - Primary Action */}
                                            <button
                                                onClick={() => handleUsePrompt(prompt)}
                                                className="w-full cursor-pointer py-3 flex items-center justify-center gap-2 transition-all duration-200 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                <span className="text-sm font-semibold">Dùng ngay</span>
                                            </button>


                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Intersection Observer Target */}
                        {(visibleCount < filteredPrompts.length || isLoadingMore) && (
                            <div ref={observerTarget} className="h-32 flex flex-col items-center justify-center mt-8 mb-8">
                                <div className="flex flex-col items-center gap-3 p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-white/70 text-sm">Đang tải thêm...</p>
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {filteredPrompts.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 themed-text-tertiary">
                                <p className="text-lg">{t('promptLibrary_empty')}</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

